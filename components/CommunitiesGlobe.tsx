'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Globe from 'react-globe.gl'
import { type Community } from '@/data/communities'
import { isBeginnerFriendly, getActivityLevelConfig, getActivityStatus } from '@/data/communities'

interface CommunitiesGlobeProps {
  communities: Community[]
  selectedCommunity: Community | null
  onCommunitySelect: (community: Community) => void
  hoveredCommunityId?: string | null
  onCommunityHover?: (communityId: string | null) => void
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
}: CommunitiesGlobeProps) {
  const globeEl = useRef<any>()
  const [globeReady, setGlobeReady] = useState(false)

  // Prepare HTML-based pins that sit on top of the globe surface.
  // These render as circular avatars with a soft pulsing halo, inspired by the
  // reference designs (no 3D cylinders).
  const markers = useMemo(() => {
    return communities.map((community) => {
      const isSelected = selectedCommunity?.id === community.id
      const isHovered = hoveredCommunityId === community.id
      const isBeginner = isBeginnerFriendly(community)

      // Core visual size in pixels (HTML element), not globe radius.
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
      globeEl.current.camera().position.z = 300
      globeEl.current.controls().enableZoom = true
      globeEl.current.controls().enableRotate = true
      globeEl.current.controls().autoRotate = false
      setGlobeReady(true)
    }
  }, [globeReady])

  // Update element hover states when hoveredCommunityId changes
  useEffect(() => {
    if (!globeReady || !globeEl.current) return

    // Find all globe pin elements and update their data-hovered attribute
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

    // Small delay to ensure elements are rendered
    const timeoutId = setTimeout(updateHoverStates, 100)
    return () => clearTimeout(timeoutId)
  }, [hoveredCommunityId, globeReady])

  // Focus on selected community
  useEffect(() => {
    if (selectedCommunity && globeEl.current && globeReady) {
      const { lat, lng } = selectedCommunity.location.coordinates
      
      // Convert lat/lng to 3D coordinates on sphere surface
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lng + 180) * (Math.PI / 180)
      
      // Position camera to look at the point from a distance
      const distance = 300
      const x = -distance * Math.sin(phi) * Math.cos(theta)
      const y = distance * Math.cos(phi)
      const z = distance * Math.sin(phi) * Math.sin(theta)
      
      // Smoothly animate camera to focus on the point
      const camera = globeEl.current.camera()
      const controls = globeEl.current.controls()
      
      // Animate camera position
      const startPos = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      }
      const endPos = { x, y, z }
      const duration = 1000 // 1 second
      const startTime = Date.now()
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function for smooth animation
        const ease = (t: number) => t * (2 - t) // ease-out
        
        const easedProgress = ease(progress)
        
        camera.position.x = startPos.x + (endPos.x - startPos.x) * easedProgress
        camera.position.y = startPos.y + (endPos.y - startPos.y) * easedProgress
        camera.position.z = startPos.z + (endPos.z - startPos.z) * easedProgress
        
        camera.lookAt(0, 0, 0)
        controls.update()
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      
      animate()
    }
  }, [selectedCommunity, globeReady])

  return (
    <div className="relative w-full h-full bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg overflow-hidden flex items-center justify-center">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        showAtmosphere={true}
        atmosphereColor="#3a3a5c"
        atmosphereAltitude={0.15}
        // Hide default 3D cylinders and instead render HTML pins at the same lat/lng.
        pointsData={[]}
        // HTML pins: avatar + halo + minimal tooltip, all in 2D DOM for crispness.
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
          const topFocusAreas = community.focusAreas.slice(0, 3)
          
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
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span>${community.memberCount.toLocaleString()} members</span>
                  </div>
                  <div class="globe-pin-tooltip-stat">
                    <svg class="globe-pin-tooltip-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>${community.eventFrequency}</span>
                  </div>
                </div>
                <div class="globe-pin-tooltip-activity" style="--activity-color: ${coreColor};">
                  <div class="globe-pin-tooltip-activity-dot"></div>
                  <span>${activityStatus}</span>
                </div>
                ${topFocusAreas.length > 0 ? `
                  <div class="globe-pin-tooltip-tags">
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
      
      {/* Empty State */}
      {communities.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-[rgba(5,7,26,0.8)] z-50 rounded-lg" role="status" aria-live="polite">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-[rgba(245,245,245,0.08)]">
              <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-zinc-500 text-sm">No communities found</p>
            <p className="text-zinc-600 text-xs mt-1">Try adjusting your filters</p>
          </div>
        </div>
      )}
    </div>
  )
}
