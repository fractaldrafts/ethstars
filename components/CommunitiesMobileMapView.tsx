'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { MapPin, Users, Calendar, Sparkles, Globe, Users2, Video, ArrowUpRight } from 'lucide-react'
import { IconBrandDiscord, IconBrandTelegram } from '@tabler/icons-react'
import { type Community } from '@/data/communities'
import { getUserLocationFromIP, getCountryCenter } from '@/lib/geolocation'
import { isBeginnerFriendly, getMeetingFormatText, getNextEventDate } from '@/data/communities'

// Dynamically import Globe component to avoid SSR issues with Three.js
const CommunitiesGlobe = dynamic(() => import('./CommunitiesGlobe'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-full bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg overflow-hidden flex items-center justify-center">
      <div className="text-zinc-500 text-sm">Loading globe...</div>
    </div>
  ),
})

interface CommunitiesMobileMapViewProps {
  communities: Community[]
}

export default function CommunitiesMobileMapView({ communities }: CommunitiesMobileMapViewProps) {
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null)
  const [hoveredCommunityId, setHoveredCommunityId] = useState<string | null>(null)
  const [focusPoint, setFocusPoint] = useState<{ lat: number; lng: number; altitude?: number } | null>(null)

  // Refs to sync scroll <-> globe without feedback loops
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const isProgrammaticScrollRef = useRef(false)
  const isProgrammaticSelectRef = useRef(false)
  const isGlobeInteractionRef = useRef(false)
  // Use number here so this works in the browser environment without Node types
  const scrollTimeoutRef = useRef<number | null>(null)
  const cameraChangeTimeoutRef = useRef<number | null>(null)

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }, [])

  const handleCommunitySelect = useCallback((community: Community) => {
    setFocusPoint(null)
    isProgrammaticSelectRef.current = true
    isGlobeInteractionRef.current = false // Reset globe interaction flag when selecting from cards
    setSelectedCommunity((current) => {
      const newSelection = current?.id === community.id ? null : community
      return newSelection
    })
    setTimeout(() => {
      isProgrammaticSelectRef.current = false
    }, 100)
  }, [])

  // Handle camera changes from globe interaction
  const handleCameraChange = useCallback((cameraPosition: { lat: number; lng: number; altitude: number }) => {
    // Don't auto-select if this is a programmatic selection or scroll
    if (isProgrammaticSelectRef.current || isProgrammaticScrollRef.current) {
      return
    }

    // Debounce camera change handling
    if (cameraChangeTimeoutRef.current !== null) {
      window.clearTimeout(cameraChangeTimeoutRef.current)
    }

    cameraChangeTimeoutRef.current = window.setTimeout(() => {
      // Mark that this is a globe interaction (not a card scroll)
      isGlobeInteractionRef.current = true

      // Find the community closest to the camera center
      let closestCommunity: Community | null = null
      let closestDistance = Infinity
      const maxDistance = 1500 // Maximum distance in km to consider (adjust based on zoom level)

      for (const community of communities) {
        const distance = calculateDistance(
          cameraPosition.lat,
          cameraPosition.lng,
          community.location.coordinates.lat,
          community.location.coordinates.lng
        )

        // Adjust max distance based on zoom (higher altitude = wider view = larger max distance)
        const zoomAdjustedMaxDistance = maxDistance * (1 + (cameraPosition.altitude - 1.2) * 0.5)

        if (distance < closestDistance && distance < zoomAdjustedMaxDistance) {
          closestDistance = distance
          closestCommunity = community
        }
      }

      // Auto-select the closest community
      if (closestCommunity && closestCommunity.id !== selectedCommunity?.id) {
        isProgrammaticSelectRef.current = true
        setSelectedCommunity(closestCommunity)
        setTimeout(() => {
          isProgrammaticSelectRef.current = false
        }, 100)
      }
    }, 300) // Debounce to avoid too frequent updates
  }, [communities, calculateDistance, selectedCommunity])

  // Initialize focus point based on user location
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const userLocation = await getUserLocationFromIP()
        if (userLocation) {
          const countryCenter = getCountryCenter(userLocation.country)
          setFocusPoint({ lat: countryCenter.lat, lng: countryCenter.lng, altitude: 1.4 })
        }
      } catch (error) {
        console.warn('Failed to get user location:', error)
      }
    }
    initializeLocation()
  }, [])

  // When selected community changes (from globe tap or globe movement), scroll cards to center it
  useEffect(() => {
    if (!selectedCommunity) return
    // Only auto-scroll if the selection came from globe interaction (not from card scroll)
    if (!isGlobeInteractionRef.current) return
    
    const container = scrollContainerRef.current
    const card = cardRefs.current.get(selectedCommunity.id)
    if (!container || !card) return

    // Use a small delay to ensure the card is rendered
    const scrollTimeout = setTimeout(() => {
      const containerRect = container.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()
      const targetScrollLeft =
        container.scrollLeft +
        (cardRect.left - containerRect.left) -
        containerRect.width / 2 +
        cardRect.width / 2

      isProgrammaticScrollRef.current = true
      container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' })

      setTimeout(() => {
        isProgrammaticScrollRef.current = false
      }, 400)
    }, 50)

    return () => clearTimeout(scrollTimeout)
  }, [selectedCommunity])

  // When user scrolls the card strip, snap selection to the card nearest center
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || communities.length === 0) return

    let frameRequested = false

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return
      if (frameRequested) return
      frameRequested = true

      // Debounce scroll handling
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        window.requestAnimationFrame(() => {
          frameRequested = false
          const containerRect = container.getBoundingClientRect()
          const centerX = containerRect.left + containerRect.width / 2

          let closestId: string | null = null
          let closestDistance = Infinity

          cardRefs.current.forEach((el, id) => {
            if (!el) return
            const rect = el.getBoundingClientRect()
            const cardCenterX = rect.left + rect.width / 2
            const distance = Math.abs(cardCenterX - centerX)
            if (distance < closestDistance) {
              closestDistance = distance
              closestId = id
            }
          })

          if (closestId && closestId !== selectedCommunity?.id) {
            const community = communities.find((c) => c.id === closestId)
            if (community) {
              // Reset globe interaction flag when selecting from card scroll
              // This ensures the globe rotates when cards are swiped
              isGlobeInteractionRef.current = false
              isProgrammaticSelectRef.current = true
              setSelectedCommunity(community)
              setTimeout(() => {
                isProgrammaticSelectRef.current = false
              }, 100)
            }
          }
        })
      }, 100) // Reduced debounce for more responsive globe rotation during swipe
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current)
        scrollTimeoutRef.current = null
      }
      if (cameraChangeTimeoutRef.current !== null) {
        window.clearTimeout(cameraChangeTimeoutRef.current)
        cameraChangeTimeoutRef.current = null
      }
    }
  }, [communities, selectedCommunity])

  return (
    <div className="relative w-full" style={{ minHeight: '520px', height: 'calc(100vh - 220px)' }}>
      {/* Globe fills the available viewport height */}
      <div className="absolute inset-0">
        <CommunitiesGlobe
          communities={communities}
          selectedCommunity={selectedCommunity}
          onCommunitySelect={handleCommunitySelect}
          hoveredCommunityId={hoveredCommunityId}
          onCommunityHover={setHoveredCommunityId}
          focusPoint={focusPoint}
          onCameraChange={handleCameraChange}
        />
      </div>

      {/* Horizontal Scrolling Cards at Bottom, overlayed on top of globe */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 pb-4 z-20">
        {/* Gradient backdrop for readability */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#05071A] via-[#05071A]/80 to-transparent" />

        <div className="relative pointer-events-auto">
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto -mx-6 px-6 scrollbar-hide pb-2 snap-x snap-mandatory"
          >
            <div className="flex gap-3" style={{ width: 'max-content' }}>
              {communities.map((community) => {
                const isSelected = selectedCommunity?.id === community.id
                const isHovered = hoveredCommunityId === community.id

                return (
                  <div
                    key={community.id}
                    ref={(el) => {
                      if (el) {
                        cardRefs.current.set(community.id, el)
                      } else {
                        cardRefs.current.delete(community.id)
                      }
                    }}
                    onClick={() => handleCommunitySelect(community)}
                    onMouseEnter={() => setHoveredCommunityId(community.id)}
                    onMouseLeave={() => setHoveredCommunityId(null)}
                    className={`relative flex-shrink-0 w-80 text-left p-4 rounded-lg border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-[rgba(5,7,26,0.8)] flex flex-col snap-center backdrop-blur-xl ${
                      isSelected
                        ? 'bg-[rgba(245,245,245,0.16)] border-red-500/40 shadow-lg shadow-black/30'
                        : 'bg-[rgba(245,245,245,0.08)] border-[rgba(245,245,245,0.15)] hover:bg-[rgba(245,245,245,0.10)] hover:border-zinc-700/50 hover:shadow-md hover:shadow-black/10'
                    }`}
                  >
                    {/* Selected indicator - colored bottom border */}
                    {isSelected && (
                      <div className="absolute left-0 right-0 bottom-0 h-1 bg-red-500 rounded-b-lg" />
                    )}

                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0">
                        <Link
                          href={`/communities/${community.id}`}
                          className="block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="w-12 h-12 rounded-lg bg-[rgba(245,245,245,0.08)] overflow-hidden border border-zinc-700">
                            <img
                              src={community.logo}
                              alt={community.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </Link>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Community Name */}
                        <h3 className="text-base font-semibold text-white truncate mb-1 leading-tight">
                          {community.name}
                        </h3>
                        
                        {/* Location with Meeting Format */}
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <Link
                            href={`/communities/${community.id}`}
                            className="hover:text-red-400 transition-colors truncate flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{community.location.city}, {community.location.country}</span>
                          </Link>
                          <span className="text-zinc-500">•</span>
                          <span className="flex items-center gap-1 text-xs text-zinc-300">
                            {community.meetingFormat === 'online' && <Video className="w-3.5 h-3.5" />}
                            {community.meetingFormat === 'in-person' && <Users2 className="w-3.5 h-3.5" />}
                            {community.meetingFormat === 'hybrid' && <Globe className="w-3.5 h-3.5" />}
                            <span>{getMeetingFormatText(community.meetingFormat)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Focus Areas - All visible (scrollable if needed) */}
                    <div className="flex flex-nowrap gap-1.5 mb-3 overflow-x-auto -mx-4 px-4 scrollbar-hide">
                      {/* Beginner-friendly Badge - First tag */}
                      {isBeginnerFriendly(community) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <Sparkles className="w-3 h-3" />
                          Beginner-friendly
                        </span>
                      )}
                      {/* Focus Area Tags */}
                      {community.focusAreas.map((focus) => (
                        <span
                          key={focus}
                          className="px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap bg-[rgba(245,245,245,0.08)] text-zinc-300"
                        >
                          {focus}
                        </span>
                      ))}
                    </div>

                    {/* Meta info - Next Event Date */}
                    {getNextEventDate(community) && (
                      <div className="flex items-center gap-2 text-sm text-zinc-300 mb-3 pb-3 border-b border-[rgba(245,245,245,0.08)] flex-nowrap overflow-hidden">
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>Next event: {getNextEventDate(community)}</span>
                        </span>
                      </div>
                    )}

                    {/* Footer - CTA Button & Social Icons */}
                    <div className="mt-auto flex items-center justify-between gap-3">
                      {/* View Community CTA - Left */}
                      <Link
                        href={`/communities/${community.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-zinc-400 bg-[rgba(245,245,245,0.08)] rounded-full hover:bg-zinc-700 hover:text-white transition-colors"
                        style={{ touchAction: 'manipulation' }}
                      >
                        View Community
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>

                      {/* Social Media Icons - Right */}
                      <div className="flex items-center gap-3">
                        {community.discord && (
                          <a
                            href={community.discord}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                            title="Discord"
                            style={{ touchAction: 'manipulation' }}
                          >
                            <IconBrandDiscord className="w-5 h-5" />
                          </a>
                        )}
                        {community.telegram && (
                          <a
                            href={community.telegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                            title="Telegram"
                            style={{ touchAction: 'manipulation' }}
                          >
                            <IconBrandTelegram className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
