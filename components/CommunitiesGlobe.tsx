'use client'

import { useState, useEffect, useRef, useMemo, Component, ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { feature } from 'topojson-client'
import * as THREE from 'three'
import { type Community } from '@/data/communities'
import { isBeginnerFriendly, getActivityLevelConfig, getActivityStatus, getNextEventDate } from '@/data/communities'

// Error Boundary to catch WebGPU errors
class GlobeErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; onError?: (error: Error) => void }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Globe error:', error, errorInfo)
    if (this.props.onError) {
      this.props.onError(error)
    }
  }

  render() {
    if (this.state.hasError) {
      const isWebGPUError = this.state.error?.message?.includes('WebGPU') || 
                           this.state.error?.message?.includes('GPUShaderStage')
      
      return (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center p-4">
            <div className="text-red-600 mb-2">Error loading globe</div>
            <div className="text-sm text-muted-foreground">
              {isWebGPUError 
                ? 'WebGPU is not supported on this device. Please use a browser with WebGL support.'
                : this.state.error?.message || 'Failed to render globe'}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Try refreshing the page or using a different browser.
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Force WebGL instead of WebGPU for mobile compatibility
// This must run before any Three.js or react-globe.gl imports
if (typeof window !== 'undefined') {
  // Patch navigator.gpu to return undefined, forcing WebGL fallback
  try {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      (window as any).navigator || {},
      'gpu'
    )
    
    if (!originalDescriptor || originalDescriptor.configurable) {
      Object.defineProperty((window as any).navigator, 'gpu', {
        get: () => undefined,
        configurable: true,
        enumerable: false,
      })
    }
  } catch (e) {
    // If we can't override navigator.gpu, that's okay
    // We'll handle it through error boundaries and fallbacks
  }
  
  // Polyfill GPUShaderStage to prevent errors when WebGPU code tries to access it
  if (!(window as any).GPUShaderStage) {
    (window as any).GPUShaderStage = {
      VERTEX: 1,
      FRAGMENT: 2,
      COMPUTE: 4,
    }
  }
  
  // Also ensure WebGPU requestAdapter returns null/undefined
  if ((window as any).navigator?.gpu) {
    const originalRequestAdapter = (window as any).navigator.gpu.requestAdapter
    if (originalRequestAdapter) {
      (window as any).navigator.gpu.requestAdapter = async () => {
        return null // Force fallback to WebGL
      }
    }
  }
}

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(
  () => {
    // Ensure WebGPU is disabled before importing
    if (typeof window !== 'undefined') {
      try {
        if ((window as any).navigator?.gpu) {
          Object.defineProperty((window as any).navigator, 'gpu', {
            get: () => undefined,
            configurable: true,
          })
        }
      } catch (e) {
        // Ignore
      }
    }
    return import('react-globe.gl')
  },
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-muted-foreground">Loading globe...</div>
      </div>
    ),
  }
)

interface CommunitiesGlobeProps {
  communities: Community[]
  selectedCommunity: Community | null
  onCommunitySelect: (community: Community) => void
  hoveredCommunityId?: string | null
  onCommunityHover?: (communityId: string | null) => void
  focusPoint?: { lat: number; lng: number; altitude?: number } | null
  onCameraChange?: (cameraPosition: { lat: number; lng: number; altitude: number }) => void
  onCountrySelect?: (country: string | null) => void
  selectedCountryFilter?: string | null // Community country name from filter
}

// Activity level colors for markers
const activityColors: Record<string, string> = {
  'very-active': '#10b981', // emerald
  'active': '#3b82f6', // blue
  'moderate': '#eab308', // yellow
  'new': '#71717a', // zinc
}

// Softer halo colors to create a glowing ring effect around pins
const haloColors: Record<string, string> = {
  'very-active': 'rgba(16, 185, 129, 0.45)',
  'active': 'rgba(59, 130, 246, 0.45)',
  'moderate': 'rgba(234, 179, 8, 0.42)',
  'new': 'rgba(113, 113, 122, 0.35)',
}

export default function CommunitiesGlobe({
  communities,
  selectedCommunity,
  onCommunitySelect,
  hoveredCommunityId,
  onCommunityHover,
  focusPoint,
  onCameraChange,
  onCountrySelect,
  selectedCountryFilter,
}: CommunitiesGlobeProps) {
  const globeEl = useRef<any>()
  const [globeReady, setGlobeReady] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [countriesData, setCountriesData] = useState<any[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const isProgrammaticCameraMoveRef = useRef(false)

  // Map community country name to TopoJSON country name
  const mapCommunityCountryToTopoJSON = (communityCountry: string): string | null => {
    if (!countriesData.length) return null
    
    // First try exact match
    const exactMatch = countriesData.find(
      (feature) => {
        const topoName = feature.properties?.NAME || feature.properties?.name
        return topoName === communityCountry
      }
    )
    if (exactMatch) {
      return exactMatch.properties?.NAME || exactMatch.properties?.name
    }
    
    // Try case-insensitive match
    const caseInsensitiveMatch = countriesData.find(
      (feature) => {
        const topoName = feature.properties?.NAME || feature.properties?.name
        return topoName?.toLowerCase() === communityCountry.toLowerCase()
      }
    )
    if (caseInsensitiveMatch) {
      return caseInsensitiveMatch.properties?.NAME || caseInsensitiveMatch.properties?.name
    }
    
    // Common mappings
    const reverseMappings: Record<string, string> = {
      'USA': 'United States of America',
      'UK': 'United Kingdom',
      'UAE': 'United Arab Emirates',
    }
    
    if (reverseMappings[communityCountry]) {
      const mapped = reverseMappings[communityCountry]
      const found = countriesData.find(
        (feature) => {
          const topoName = feature.properties?.NAME || feature.properties?.name
          return topoName === mapped
        }
      )
      if (found) {
        return found.properties?.NAME || found.properties?.name
      }
    }
    
    // Try partial match
    const partialMatch = countriesData.find(
      (feature) => {
        const topoName = (feature.properties?.NAME || feature.properties?.name || '').toLowerCase()
        const commName = communityCountry.toLowerCase()
        return topoName.includes(commName) || commName.includes(topoName)
      }
    )
    
    return partialMatch ? (partialMatch.properties?.NAME || partialMatch.properties?.name) : null
  }

  // Sync selected country from filter prop
  useEffect(() => {
    if (selectedCountryFilter === 'all' || !selectedCountryFilter) {
      setSelectedCountry(null)
    } else {
      const topoJSONName = mapCommunityCountryToTopoJSON(selectedCountryFilter)
      if (topoJSONName) {
        setSelectedCountry(topoJSONName)
      }
    }
  }, [selectedCountryFilter, countriesData])

  // Ensure WebGL is preferred on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Double-check WebGPU is disabled
      try {
        if ((window as any).navigator?.gpu) {
          Object.defineProperty((window as any).navigator, 'gpu', {
            get: () => undefined,
            configurable: true,
          })
        }
      } catch (e) {
        // Ignore
      }
    }
  }, [])

  // Load countries GeoJSON and convert from TopoJSON (like reference)
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then((res) => res.json())
      .then((topology) => {
        // Convert TopoJSON to GeoJSON
        const countries = feature(topology, topology.objects.countries)
        setCountriesData(countries.features || [])
        setGlobeReady(true)
      })
      .catch((err) => {
        console.error('Error loading countries data:', err)
        setGlobeReady(true)
      })
  }, [])

  // Create a uniform ocean texture (no lighting gradient) - matching reference structure
  const uniformOceanTexture = useMemo(() => {
    if (typeof window === 'undefined') return null
    
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Dark blue-gray ocean for dark mode theme
      ctx.fillStyle = '#1a1f3a' // Dark ocean color that contrasts with land
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    return canvas.toDataURL()
  }, [])

  // Color function for countries - distinct land color that contrasts with ocean
  const getPolygonColor = useMemo(() => {
    return (d: any) => {
      const countryName = d.properties?.NAME || d.properties?.name
      
      if (selectedCountry === countryName) {
        return '#c98a8a' // Pale reddish - selected country (less saturated version of primary red)
      }
      if (hoveredCountry === countryName) {
        return '#64748b' // Slate-500 - hovered country (lighter than default)
      }
      // Default land color - lighter than ocean to create clear separation
      return '#475569' // Slate-600 - default land color (nice slate blue-gray)
    }
  }, [selectedCountry, hoveredCountry])

  // Handle country click
  const handlePolygonClick = (polygon: any) => {
    const countryName = polygon.properties?.NAME || polygon.properties?.name
    if (countryName) {
      const newSelectedCountry = selectedCountry === countryName ? null : countryName
      setSelectedCountry(newSelectedCountry)
      
      // Trigger country filter callback
      if (onCountrySelect) {
        onCountrySelect(newSelectedCountry)
      }
    }
  }

  // Disable lighting on globe material for uniform appearance (from reference)
  const disableGlobeLighting = () => {
    if (!globeEl.current) return
    
    const globe = globeEl.current
    // Try different ways to access the scene
    let scene: THREE.Scene | null = null
    
    // Method 1: Direct scene access
    if (globe.scene && globe.scene instanceof THREE.Scene) {
      scene = globe.scene
    }
    // Method 2: Scene as function
    else if (typeof globe.scene === 'function') {
      scene = globe.scene()
    }
    // Method 3: Through renderer
    else if (globe.renderer && globe.renderer.scene) {
      scene = globe.renderer.scene
    }
    // Method 4: Access through __globe property (internal react-globe.gl structure)
    else if ((globe as any).__globe && (globe as any).__globe.scene) {
      scene = (globe as any).__globe.scene
    }
    
    if (scene) {
      scene.traverse((object: any) => {
        if (object.isMesh && object.material) {
          // Make material non-lighting (MeshBasicMaterial) so it doesn't respond to lighting
          // This creates uniform lighting across the entire globe
          if (Array.isArray(object.material)) {
            object.material = object.material.map((mat: any) => {
              if (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial || mat.isMeshLambertMaterial) {
                // Convert to MeshBasicMaterial for uniform lighting
                const basicMat = new THREE.MeshBasicMaterial()
                if (mat.map) basicMat.map = mat.map
                if (mat.color) basicMat.color.copy(mat.color)
                basicMat.transparent = mat.transparent !== undefined ? mat.transparent : false
                basicMat.opacity = mat.opacity !== undefined ? mat.opacity : 1
                return basicMat
              }
              return mat
            })
          } else {
            if (object.material.isMeshStandardMaterial || object.material.isMeshPhongMaterial || object.material.isMeshLambertMaterial) {
              // Convert to MeshBasicMaterial for uniform lighting
              const basicMat = new THREE.MeshBasicMaterial()
              if (object.material.map) basicMat.map = object.material.map
              if (object.material.color) basicMat.color.copy(object.material.color)
              basicMat.transparent = object.material.transparent !== undefined ? object.material.transparent : false
              basicMat.opacity = object.material.opacity !== undefined ? object.material.opacity : 1
              object.material = basicMat
            }
          }
        }
      })
    }
  }

  // Handle globe ready callback
  const handleGlobeReady = () => {
    // Small delay to ensure scene is fully initialized
    setTimeout(() => {
      disableGlobeLighting()
    }, 100)
  }

  // Also try to disable lighting after a delay in case onGlobeReady doesn't fire
  useEffect(() => {
    if (globeReady && globeEl.current) {
      const timeoutId = setTimeout(() => {
        disableGlobeLighting()
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [globeReady])

  // Prepare HTML-based pins that sit on top of the globe surface
  const markers = useMemo(() => {
    return communities.map((community) => {
      const isSelected = selectedCommunity?.id === community.id
      const isHovered = hoveredCommunityId === community.id
      const isBeginner = isBeginnerFriendly(community)

      // Core visual size in pixels (HTML element), not globe radius
      let size = 30
      if (isHovered) size = 36
      if (isSelected) size = 42

      const activityKey =
        community.activityLevel in activityColors ? community.activityLevel : 'moderate'

      return {
        id: community.id,
        lat: community.location.coordinates.lat,
        lng: community.location.coordinates.lng,
        size,
        community,
        isSelected,
        isHovered,
        isBeginner,
        activityKey,
      }
    })
  }, [communities, selectedCommunity, hoveredCommunityId])

  // Initialize globe
  useEffect(() => {
    if (globeEl.current && !globeReady) {
      // Set initial camera position
      globeEl.current.camera().position.z = 350
      globeEl.current.controls().enableZoom = true
      globeEl.current.controls().enableRotate = true
      globeEl.current.controls().autoRotate = false
    }
  }, [globeReady])

  // Update element hover states when hoveredCommunityId changes
  useEffect(() => {
    if (!globeReady || !globeEl.current) return

    const updateHoverStates = () => {
      const pins = document.querySelectorAll('.globe-pin')
      pins.forEach((pin) => {
        const pinElement = pin as HTMLElement
        const communityId = pinElement.getAttribute('data-community-id')
        if (communityId) {
          pinElement.dataset.hovered = hoveredCommunityId === communityId ? 'true' : 'false'
        }
      })
    }

    const timeoutId = setTimeout(updateHoverStates, 100)
    return () => clearTimeout(timeoutId)
  }, [hoveredCommunityId, globeReady])

  // Focus on selected community
  useEffect(() => {
    if (selectedCommunity && globeEl.current && globeReady) {
      const { lat, lng } = selectedCommunity.location.coordinates

      isProgrammaticCameraMoveRef.current = true
      globeEl.current.pointOfView(
        {
          lat,
          lng,
          altitude: 1.2,
        },
        800 // Slightly faster rotation for better responsiveness
      )
      setTimeout(() => {
        isProgrammaticCameraMoveRef.current = false
      }, 900)
    }
  }, [selectedCommunity, globeReady])

  // External focus point
  useEffect(() => {
    if (!focusPoint || !globeReady || !globeEl.current) return
    if (selectedCommunity) return

    isProgrammaticCameraMoveRef.current = true
    globeEl.current.pointOfView(
      {
        lat: focusPoint.lat,
        lng: focusPoint.lng,
        altitude: focusPoint.altitude ?? 1.6,
      },
      1000
    )
    setTimeout(() => {
      isProgrammaticCameraMoveRef.current = false
    }, 1100)
  }, [focusPoint, globeReady, selectedCommunity])

  // Listen to camera changes
  useEffect(() => {
    if (!globeReady || !globeEl.current || !onCameraChange) return

    const controls = globeEl.current.controls()
    if (!controls) return

    let animationFrameId: number | null = null
    let lastCameraPosition: { lat: number; lng: number; altitude: number } | null = null

    const checkCameraChange = () => {
      if (isProgrammaticCameraMoveRef.current) {
        animationFrameId = requestAnimationFrame(checkCameraChange)
        return
      }

      try {
        const currentPOV = globeEl.current.pointOfView()
        
        if (currentPOV) {
          const currentPos = {
            lat: currentPOV.lat,
            lng: currentPOV.lng,
            altitude: currentPOV.altitude || 1.2,
          }

          if (!lastCameraPosition || 
              Math.abs(currentPos.lat - lastCameraPosition.lat) > 0.5 ||
              Math.abs(currentPos.lng - lastCameraPosition.lng) > 0.5 ||
              Math.abs(currentPos.altitude - lastCameraPosition.altitude) > 0.1) {
            lastCameraPosition = currentPos
            onCameraChange(currentPos)
          }
        }
      } catch (error) {
        // Ignore errors
      }

      animationFrameId = requestAnimationFrame(checkCameraChange)
    }

    animationFrameId = requestAnimationFrame(checkCameraChange)

    const handleControlChange = () => {
      if (!isProgrammaticCameraMoveRef.current && onCameraChange) {
        setTimeout(() => {
          try {
            const currentPOV = globeEl.current.pointOfView()
            if (currentPOV) {
              onCameraChange({
                lat: currentPOV.lat,
                lng: currentPOV.lng,
                altitude: currentPOV.altitude || 1.2,
              })
            }
          } catch (error) {
            // Ignore errors
          }
        }, 100)
      }
    }

    controls.addEventListener('change', handleControlChange)

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
      controls.removeEventListener('change', handleControlChange)
    }
  }, [globeReady, onCameraChange])

  if (!globeReady) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-muted-foreground">Loading globe...</div>
      </div>
    )
  }

  if (renderError) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-600 mb-2">Error loading globe</div>
          <div className="text-sm text-muted-foreground">{renderError}</div>
          <div className="text-xs text-muted-foreground mt-2">
            Your device may not support WebGL. Please try a different browser.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg overflow-hidden flex items-center justify-center">
      <GlobeErrorBoundary
        onError={(error) => {
          if (error.message?.includes('WebGPU') || error.message?.includes('GPUShaderStage')) {
            setRenderError('WebGPU is not supported on this device. Please use a browser with WebGL support.')
          } else {
            setRenderError(error.message || 'Failed to render globe')
          }
        }}
      >
        <Globe
          ref={globeEl}
          globeImageUrl={uniformOceanTexture || undefined}
          backgroundImageUrl={null}
          polygonsData={countriesData}
          polygonAltitude={0.01}
          polygonCapColor={getPolygonColor}
          polygonSideColor={() => 'rgba(0, 0, 0, 0)'}
          polygonStrokeColor={() => 'rgba(148, 163, 184, 0.3)'} // Subtle borders for dark mode
          polygonsTransitionDuration={300}
          onPolygonClick={handlePolygonClick}
          onGlobeClick={() => {
            if (onCountrySelect) onCountrySelect(null)
          }}
          onPolygonHover={(polygon: any) => {
            if (polygon) {
              const countryName = polygon.properties?.NAME || polygon.properties?.name
              setHoveredCountry(countryName)
              document.body.style.cursor = 'pointer'
            } else {
              setHoveredCountry(null)
              document.body.style.cursor = 'default'
            }
          }}
          onGlobeReady={handleGlobeReady}
          enablePointerInteraction={true}
          showAtmosphere={false}
          showGlobe={true}
          showGraticules={false}
          backgroundColor="rgba(5, 7, 26, 0)"
          // Hide default 3D cylinders and instead render HTML pins
          pointsData={[]}
          // HTML pins: avatar + halo + minimal tooltip
          htmlElementsData={markers}
          htmlLat="lat"
          htmlLng="lng"
          htmlAltitude={0.01}
          htmlElement={(d: any) => {
            const community: Community = d.community
            const activityKey: string = d.activityKey
            const coreColor = activityColors[activityKey] || activityColors['moderate']
            const haloColor = haloColors[activityKey] || haloColors['moderate']

            const el = document.createElement('button')
            el.className = 'globe-pin'
            el.style.width = `${d.size}px`
            el.style.height = `${d.size}px`
            el.style.cursor = 'pointer'
            el.style.transform = 'translate(-50%, -50%)'
            el.style.borderRadius = '9999px'
            el.style.background = 'transparent'
            el.style.border = 'none'
            el.style.padding = '0'
            el.style.outline = 'none'
            el.dataset.selected = d.isSelected ? 'true' : 'false'
            el.dataset.hovered = d.isHovered ? 'true' : 'false'
            el.dataset.communityId = community.id

            const activityConfig = getActivityLevelConfig(community.activityLevel)
            const activityStatus = getActivityStatus(community.activityLevel, community.eventFrequency)
            const nextEventDate = getNextEventDate(community)
            const topFocusAreas = community.focusAreas.slice(0, 3)
            const isBeginner = isBeginnerFriendly(community)
            
            el.innerHTML = `
              <div class="globe-pin-halo" style="
                background: ${haloColor};
                box-shadow: 0 0 0 0 ${haloColor};
              "></div>
              <div class="globe-pin-core" style="background:${coreColor};">
                <img
                  src="${community.logo}"
                  alt="${community.name}"
                  class="globe-pin-core-img"
                />
              </div>
              <div class="globe-pin-tooltip-wrapper">
                <div class="globe-pin-tooltip">
                  ${community.banner ? `
                    <div class="globe-pin-tooltip-banner">
                      <img src="${community.banner}" alt="${community.name} banner" />
                    </div>
                  ` : ''}
                  <div class="globe-pin-tooltip-header">
                  <div class="globe-pin-tooltip-logo">
                    <img src="${community.logo}" alt="${community.name}" />
                  </div>
                  <div class="globe-pin-tooltip-header-content">
                    <div class="globe-pin-tooltip-name">${community.name}</div>
                    <div class="globe-pin-tooltip-location">
                      <svg class="globe-pin-tooltip-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      ${community.location.city}, ${community.location.country}
                    </div>
                  </div>
                </div>
                <div class="globe-pin-tooltip-body">
                  <div class="globe-pin-tooltip-stats">
                    <div class="globe-pin-tooltip-stat">
                      <svg class="globe-pin-tooltip-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>${community.location.city}, ${community.location.country}</span>
                    </div>
                    <div class="globe-pin-tooltip-stat">
                      <svg class="globe-pin-tooltip-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>${nextEventDate ? `Next event: ${nextEventDate}` : 'No upcoming events'}</span>
                    </div>
                  </div>
                  ${(isBeginner || topFocusAreas.length > 0) ? `
                    <div class="globe-pin-tooltip-tags">
                      ${isBeginner ? `
                        <span class="globe-pin-tooltip-tag globe-pin-tooltip-tag-beginner">Beginner-friendly</span>
                      ` : ''}
                      ${topFocusAreas.map(focus => `
                        <span class="globe-pin-tooltip-tag">${focus}</span>
                      `).join('')}
                    </div>
                  ` : ''}
                  </div>
                </div>
                <div class="globe-pin-tooltip-arrow"></div>
              </div>
            `

            // Interaction wiring back into React state
            el.onclick = (event) => {
              event.stopPropagation()
              onCommunitySelect(community)
            }
            el.onmouseenter = () => {
              el.dataset.hovered = 'true'
              onCommunityHover?.(community.id)
            }
            el.onmouseleave = () => {
              el.dataset.hovered = 'false'
              onCommunityHover?.(null)
            }

            el.setAttribute(
              'aria-label',
              `${community.name}, ${community.location.city}, ${community.location.country}`
            )

            return el
          }}
        />
      </GlobeErrorBoundary>
    </div>
  )
}
