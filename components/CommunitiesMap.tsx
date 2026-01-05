'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Search, Navigation, Info, X, MapPin, Users, Calendar, Sparkles, ChevronRight, Globe, Video, Users2 } from 'lucide-react'
import { Map, MapMarker, MarkerContent, MarkerTooltip, MapControls, useMap } from '@/components/ui/map'
import { useRouter } from 'next/navigation'
import { type Community } from '@/data/communities'
import { getUserLocationFromIP, getCountryCenter } from '@/lib/geolocation'
import { isBeginnerFriendly, getNextEventTiming, getMeetingFormatText } from '@/data/communities'

// Map controller component to handle zoom and center changes
function MapController({ 
  selectedCommunity,
  center,
  zoom
}: { 
  selectedCommunity: Community | null
  center: [number, number] // [lat, lng]
  zoom: number
}) {
  const { map, isLoaded } = useMap()
  const hasInitialized = useRef(false)
  const lastCenter = useRef<[number, number] | null>(null)
  const lastZoom = useRef<number | null>(null)
  
  // Set initial map view if provided
  useEffect(() => {
    if (!hasInitialized.current && center && zoom !== undefined && map && isLoaded) {
      map.setCenter([center[1], center[0]]) // MapLibre uses [lng, lat]
      map.setZoom(zoom)
      lastCenter.current = center
      lastZoom.current = zoom
      hasInitialized.current = true
    }
  }, [map, isLoaded])
  
  // Update map when center or zoom changes externally
  useEffect(() => {
    if (!map || !isLoaded || !hasInitialized.current) return
    
    const centerChanged = !lastCenter.current || 
      (lastCenter.current[0] !== center[0] || lastCenter.current[1] !== center[1])
    const zoomChanged = lastZoom.current === null || lastZoom.current !== zoom
    
    if (centerChanged || zoomChanged) {
      map.flyTo({
        center: [center[1], center[0]], // MapLibre uses [lng, lat]
        zoom: zoom,
        duration: 300,
      })
      lastCenter.current = center
      lastZoom.current = zoom
    }
  }, [map, isLoaded, center, zoom])
  
  // Center map on selected community
  useEffect(() => {
    if (selectedCommunity && map && isLoaded && hasInitialized.current) {
      const { lat, lng } = selectedCommunity.location.coordinates
      const currentZoom = map.getZoom()
      map.flyTo({
        center: [lng, lat], // MapLibre uses [lng, lat]
        zoom: Math.max(currentZoom, 8),
        duration: 500,
      })
    }
  }, [selectedCommunity, map, isLoaded])
  
  return null
}

interface CommunitiesMapProps {
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

// Calculate marker size based on member count
function getMarkerSize(memberCount: number, isSelected: boolean, isHovered: boolean): number {
  let baseSize = isSelected ? 32 : 20
  if (isHovered && !isSelected) baseSize = 24
  
  // Scale: 100 members = base, 1000 members = 1.5x, 5000+ = 2x
  const scale = Math.min(2, Math.max(1, 1 + (memberCount / 2000)))
  return baseSize * scale
}

export default function CommunitiesMap({ 
  communities,
  selectedCommunity,
  onCommunitySelect,
  hoveredCommunityId,
  onCommunityHover,
}: CommunitiesMapProps) {
  const router = useRouter()
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]) // [lat, lng]
  const [mapZoom, setMapZoom] = useState(2)
  const [locationSearch, setLocationSearch] = useState('')
  const [showLegend, setShowLegend] = useState(false)
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Get user location from IP and set initial map view
  useEffect(() => {
    if (isInitialized) return

    const initializeMapLocation = async () => {
      try {
        const userLocation = await getUserLocationFromIP()
        
        if (userLocation) {
          // Get country center coordinates and appropriate zoom level
          const countryCenter = getCountryCenter(userLocation.country)
          
          setMapCenter([countryCenter.lat, countryCenter.lng])
          setMapZoom(countryCenter.zoom)
        } else {
          // Fallback: Calculate initial map center based on communities
          if (communities.length > 0) {
            const avgLat = communities.reduce((sum, c) => sum + c.location.coordinates.lat, 0) / communities.length
            const avgLng = communities.reduce((sum, c) => sum + c.location.coordinates.lng, 0) / communities.length
            setMapCenter([avgLat, avgLng])
            setMapZoom(2)
          }
        }
      } catch (error) {
        console.warn('Failed to get user location from IP:', error)
        // Fallback to community average
        if (communities.length > 0) {
          const avgLat = communities.reduce((sum, c) => sum + c.location.coordinates.lat, 0) / communities.length
          const avgLng = communities.reduce((sum, c) => sum + c.location.coordinates.lng, 0) / communities.length
          setMapCenter([avgLat, avgLng])
          setMapZoom(2)
        }
      } finally {
        setIsInitialized(true)
      }
    }

    initializeMapLocation()
  }, [communities, isInitialized])

  // Get unique cities and countries for search
  const locationOptions = useMemo(() => {
    const cities = new Set<string>()
    const countries = new Set<string>()
    communities.forEach(c => {
      cities.add(`${c.location.city}, ${c.location.country}`)
      countries.add(c.location.country)
    })
    return {
      cities: Array.from(cities).sort(),
      countries: Array.from(countries).sort(),
    }
  }, [communities])

  // Filter location suggestions
  const filteredLocations = useMemo(() => {
    if (!locationSearch) return []
    const query = locationSearch.toLowerCase()
    return [
      ...locationOptions.cities.filter(loc => loc.toLowerCase().includes(query)),
      ...locationOptions.countries.filter(country => country.toLowerCase().includes(query)),
    ].slice(0, 8)
  }, [locationSearch, locationOptions])

  const handleLocationSelect = (location: string) => {
    setLocationSearch(location)
    setShowLocationSuggestions(false)
    
    // Find community with this location
    const community = communities.find(c => 
      `${c.location.city}, ${c.location.country}` === location || 
      c.location.country === location
    )
    
    if (community) {
      const { lat, lng } = community.location.coordinates
      setMapCenter([lat, lng])
      setMapZoom(8)
      onCommunitySelect(community)
    }
  }

  const handleFindMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setMapCenter([latitude, longitude])
        setMapZoom(10)
      },
      (error) => {
        console.error('Error getting location:', error)
        alert('Unable to get your location. Please search for a city instead.')
      }
    )
  }

  const handleResetView = async () => {
    try {
      // Try to get user's country location
      const userLocation = await getUserLocationFromIP()
      
      if (userLocation) {
        const countryCenter = getCountryCenter(userLocation.country)
        setMapCenter([countryCenter.lat, countryCenter.lng])
        setMapZoom(countryCenter.zoom)
      } else {
        // Fallback to community average
        if (communities.length > 0) {
          const avgLat = communities.reduce((sum, c) => sum + c.location.coordinates.lat, 0) / communities.length
          const avgLng = communities.reduce((sum, c) => sum + c.location.coordinates.lng, 0) / communities.length
          setMapCenter([avgLat, avgLng])
          setMapZoom(2)
        }
      }
    } catch (error) {
      console.warn('Failed to reset view:', error)
      // Fallback to community average
      if (communities.length > 0) {
        const avgLat = communities.reduce((sum, c) => sum + c.location.coordinates.lat, 0) / communities.length
        const avgLng = communities.reduce((sum, c) => sum + c.location.coordinates.lng, 0) / communities.length
        setMapCenter([avgLat, avgLng])
        setMapZoom(2)
      }
    }
  }

  // Custom map controls component
  function CustomMapControls() {
    const { map, isLoaded } = useMap()
    
    // Update zoom state when map zoom changes
    useEffect(() => {
      if (!map || !isLoaded) return
      
      const handleZoomEnd = () => {
        setMapZoom(map.getZoom())
        const center = map.getCenter()
        setMapCenter([center.lat, center.lng])
      }
      
      const handleMoveEnd = () => {
        const center = map.getCenter()
        setMapCenter([center.lat, center.lng])
      }
      
      map.on('zoomend', handleZoomEnd)
      map.on('moveend', handleMoveEnd)
      
      return () => {
        map.off('zoomend', handleZoomEnd)
        map.off('moveend', handleMoveEnd)
      }
    }, [map, isLoaded])
    
    const handleZoomIn = () => {
      if (map && isLoaded) {
        map.zoomIn({ duration: 300 })
      }
    }

    const handleZoomOut = () => {
      if (map && isLoaded) {
        map.zoomOut({ duration: 300 })
      }
    }

    if (!isLoaded) return null

    return (
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
        <div className="flex flex-col gap-1 bg-[rgba(10,10,20,0.9)] backdrop-blur-sm border border-[rgba(245,245,245,0.2)] rounded-lg p-1 shadow-lg">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-[rgba(245,245,245,0.1)] rounded transition-colors text-zinc-400 hover:text-white"
            title="Zoom In"
            aria-label="Zoom in on map"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-[rgba(245,245,245,0.1)] rounded transition-colors text-zinc-400 hover:text-white"
            title="Zoom Out"
            aria-label="Zoom out on map"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 hover:bg-[rgba(245,245,245,0.1)] rounded transition-colors text-zinc-400 hover:text-white"
            title="Reset View"
            aria-label="Reset map view to show all communities"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="p-2 hover:bg-[rgba(245,245,245,0.1)] rounded transition-colors text-zinc-400 hover:text-white"
            title="Show Legend"
            aria-label={showLegend ? "Hide map legend" : "Show map legend"}
            aria-expanded={showLegend}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Location Search Bar */}
      <div className="absolute top-4 left-4 z-30 w-[calc(100%-8rem)] md:w-80">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search city or country..."
            value={locationSearch}
            onChange={(e) => {
              setLocationSearch(e.target.value)
              setShowLocationSuggestions(true)
            }}
            onFocus={() => setShowLocationSuggestions(true)}
            className="w-full bg-[rgba(10,10,20,0.95)] backdrop-blur-sm border border-[rgba(245,245,245,0.2)] rounded-lg pl-10 pr-20 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-red-500/50 focus:outline-none transition-colors"
            aria-label="Search for city or country"
            aria-autocomplete="list"
            aria-expanded={showLocationSuggestions && filteredLocations.length > 0}
            role="combobox"
          />
          <button
            onClick={handleFindMyLocation}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded bg-[rgba(245,245,245,0.1)] hover:bg-[rgba(245,245,245,0.2)] text-zinc-400 hover:text-white transition-colors"
            title="Find my location"
            aria-label="Find my current location on the map"
          >
            <Navigation className="w-4 h-4" />
          </button>
          
          {/* Location Suggestions */}
          {showLocationSuggestions && filteredLocations.length > 0 && (
            <div 
              className="absolute top-full left-0 right-0 mt-1 bg-[rgba(10,10,20,0.95)] backdrop-blur-sm border border-[rgba(245,245,245,0.2)] rounded-lg overflow-hidden z-40 shadow-xl"
              role="listbox"
              aria-label="Location suggestions"
            >
              {filteredLocations.map((location, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(location)}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[rgba(245,245,245,0.1)] transition-colors flex items-center gap-2"
                  role="option"
                  aria-label={`Select ${location}`}
                >
                  <Search className="w-3.5 h-3.5 text-zinc-500" />
                  {location}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 z-30 bg-[rgba(10,10,20,0.95)] backdrop-blur-sm border border-[rgba(245,245,245,0.2)] rounded-lg p-4 max-w-xs shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Map Legend</h3>
            <button
              onClick={() => setShowLegend(false)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <div className="text-zinc-400 mb-1.5">Activity Level</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-zinc-300">Very Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-zinc-300">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-zinc-300">Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-zinc-500"></div>
                  <span className="text-zinc-300">New</span>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-[rgba(245,245,245,0.1)]">
              <div className="text-zinc-400 mb-1.5">Marker Size</div>
              <div className="text-zinc-300">Larger = More members</div>
            </div>
            <div className="pt-2 border-t border-[rgba(245,245,245,0.1)]">
              <div className="text-zinc-400 mb-1.5">Special Indicators</div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></div>
                <span className="text-zinc-300 text-xs">Beginner-friendly communities</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        className="relative w-full h-full bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg overflow-hidden"
        onClick={() => setShowLocationSuggestions(false)}
        role="application"
        aria-label="Communities map"
      >
        <div className="w-full h-full">
          <Map
            center={[mapCenter[1], mapCenter[0]]} // MapLibre uses [lng, lat]
            zoom={mapZoom}
            styles={{
              dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
              light: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', // Use dark for both
            }}
          >
          <MapController 
            selectedCommunity={selectedCommunity}
            center={mapCenter}
            zoom={mapZoom}
          />
          <CustomMapControls />
          
          {/* Map accessibility: Announce community count */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {communities.length} {communities.length === 1 ? 'community' : 'communities'} displayed on map
          </div>
          
          {communities.map((community) => {
            const isSelected = selectedCommunity?.id === community.id
            const isHovered = hoveredCommunityId === community.id
            const isBeginner = isBeginnerFriendly(community)
            const markerSize = getMarkerSize(community.memberCount, isSelected, !!isHovered)
            // Selected: red border, keep activity color background
            // Beginner: green border, activity color background
            // Default: white border, activity color background
            const borderColor = isSelected ? '#ef4444' : (isBeginner ? '#10b981' : 'rgba(255, 255, 255, 0.8)')
            const borderWidth = isSelected ? 3 : (isBeginner ? 2.5 : 2)
            const shadowColor = isSelected 
              ? 'rgba(239, 68, 68, 0.5)' 
              : (isBeginner ? 'rgba(16, 185, 129, 0.3)' : 'rgba(0, 0, 0, 0.3)')
            // Always use activity color as background, never red
            const fallbackColor = activityColors[community.activityLevel] || activityColors['moderate']
            
            return (
              <MapMarker
                key={community.id}
                longitude={community.location.coordinates.lng}
                latitude={community.location.coordinates.lat}
                onClick={() => onCommunitySelect(community)}
                onMouseEnter={() => onCommunityHover?.(community.id)}
                onMouseLeave={() => onCommunityHover?.(null)}
              >
                <MarkerContent>
                  <div
                    style={{
                      width: `${markerSize}px`,
                      height: `${markerSize}px`,
                      borderRadius: '50%',
                      background: fallbackColor,
                      border: `${borderWidth}px solid ${borderColor}`,
                      boxShadow: isSelected
                        ? `0 0 0 ${isSelected ? '3px' : '0px'} rgba(239, 68, 68, 0.3), 0 4px 12px ${shadowColor}`
                        : (isBeginner 
                          ? `0 0 0 2px rgba(16, 185, 129, 0.2), 0 2px 8px ${shadowColor}`
                          : `0 2px 8px ${shadowColor}`),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      zIndex: isSelected ? 1000 : (isBeginner ? 150 : 100),
                      overflow: 'hidden',
                      padding: '2px',
                      transform: isSelected ? 'scale(1.15)' : (isHovered ? 'scale(1.05)' : 'scale(1)'),
                    }}
                    aria-label={`${community.name} - ${community.location.city}, ${community.location.country}${isBeginner ? ' - Beginner-friendly' : ''}`}
                  >
                    <img 
                      src={community.logo} 
                      alt={community.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        // If image fails, show a fallback with initial letter
                        const parent = target.parentElement
                        if (parent && !parent.querySelector('.fallback-initial')) {
                          const initial = document.createElement('div')
                          initial.className = 'fallback-initial'
                          initial.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; color: white;'
                          initial.textContent = community.name.charAt(0).toUpperCase()
                          parent.appendChild(initial)
                        }
                      }}
                    />
                  </div>
                </MarkerContent>
                <MarkerTooltip className="!bg-transparent !p-0 !shadow-none !border-none">
                  <div 
                    className="w-64 bg-[rgba(10,10,20,0.98)] backdrop-blur-xl border border-[rgba(245,245,245,0.12)] rounded-lg shadow-2xl overflow-hidden cursor-pointer hover:border-[rgba(245,245,245,0.2)] transition-all group"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/communities/${community.id}`)
                    }}
                  >
                    {/* Compact Header */}
                    <div className="p-3 border-b border-[rgba(245,245,245,0.08)]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-[rgba(245,245,245,0.08)] overflow-hidden border border-[rgba(245,245,245,0.12)] flex-shrink-0">
                          <img
                            src={community.logo}
                            alt={community.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white mb-0.5 group-hover:text-red-400 transition-colors truncate">
                            {community.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <MapPin className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                            <span className="truncate">{community.location.city}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Compact Content */}
                    <div className="p-3 space-y-2.5">
                      {/* Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isBeginnerFriendly(community) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Sparkles className="w-2.5 h-2.5" />
                            Beginner
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[rgba(245,245,245,0.08)] text-zinc-300 border border-[rgba(245,245,245,0.12)]">
                          {community.meetingFormat === 'online' && <Video className="w-2.5 h-2.5" />}
                          {community.meetingFormat === 'in-person' && <Users2 className="w-2.5 h-2.5" />}
                          {community.meetingFormat === 'hybrid' && <Globe className="w-2.5 h-2.5" />}
                          {getMeetingFormatText(community.meetingFormat)}
                        </span>
                      </div>

                      {/* Compact Stats */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-zinc-300 font-medium">{community.memberCount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-orange-400" />
                          <span className="text-zinc-300">{community.eventFrequency}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-3 py-2 bg-[rgba(245,245,245,0.03)] border-t border-[rgba(245,245,245,0.08)]">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 group-hover:text-red-400 transition-colors">
                        <span>View details</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </MarkerTooltip>
              </MapMarker>
            )
          })}
          </Map>
        </div>

        {/* Empty State */}
        {communities.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(5,7,26,0.8)] z-50 rounded-lg" role="status" aria-live="polite">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-[rgba(245,245,245,0.08)]">
                <Navigation className="w-6 h-6 text-zinc-600" aria-hidden="true" />
              </div>
              <p className="text-zinc-500 text-sm">No communities found</p>
              <p className="text-zinc-600 text-xs mt-1">Try adjusting your filters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
