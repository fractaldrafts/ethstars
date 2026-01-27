'use client'

import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Users, ArrowUpRight, Calendar, Sparkles, Globe, Users2, Video, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { 
  type Community, 
  communities,
  isBeginnerFriendly,
  getMeetingFormatText,
  getNextEventDate
} from '@/data/communities'

interface RelatedCommunitiesSectionProps {
  community: Community
}

/**
 * Find related communities based on:
 * 1. Shared focus areas (highest priority)
 * 2. Same country
 * 3. Similar meeting format
 */
function getRelatedCommunities(currentCommunity: Community, limit: number = 6): Community[] {
  const otherCommunities = communities.filter(c => c.id !== currentCommunity.id)
  
  // Score each community based on similarity
  const scored = otherCommunities.map(community => {
    let score = 0
    
    // Shared focus areas (weight: 3 points per match)
    const sharedFocusAreas = currentCommunity.focusAreas.filter(focus => 
      community.focusAreas.includes(focus)
    )
    score += sharedFocusAreas.length * 3
    
    // Same country (weight: 2 points)
    if (community.location.country === currentCommunity.location.country) {
      score += 2
    }
    
    // Same meeting format (weight: 1 point)
    if (community.meetingFormat === currentCommunity.meetingFormat) {
      score += 1
    }
    
    // Similar activity level (weight: 1 point)
    if (community.activityLevel === currentCommunity.activityLevel) {
      score += 1
    }
    
    return { community, score }
  })
  
  // Sort by score (descending) and return top communities
  return scored
    .filter(item => item.score > 0) // Only include communities with some similarity
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.community)
}

export default function RelatedCommunitiesSection({ community }: RelatedCommunitiesSectionProps) {
  const relatedCommunities = useMemo(() => {
    return getRelatedCommunities(community, 6)
  }, [community])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [hasDragged, setHasDragged] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(1)
  const startXRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep the number of visible cards roughly in sync with breakpoints
  useEffect(() => {
    const updateItemsPerView = () => {
      if (typeof window === 'undefined') return
      const width = window.innerWidth
      
      if (width < 768) {
        setItemsPerView(1)
      } else if (width < 1024) {
        setItemsPerView(2)
      } else {
        setItemsPerView(3)
      }
    }

    updateItemsPerView()
    window.addEventListener('resize', updateItemsPerView)
    return () => window.removeEventListener('resize', updateItemsPerView)
  }, [])

  const maxIndex = Math.max(0, relatedCommunities.length - itemsPerView)
  const gapSize = 16

  // Ensure current index stays in range when layout/data changes
  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex))
  }, [maxIndex])

  // Get position for current index
  const getTranslateX = () => {
    if (!containerRef.current) return 0
    // Use fixed card width (360px on larger screens, 320px on mobile)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    const cardWidth = isMobile ? 320 : 360
    const slideWidth = cardWidth + gapSize
    return -(currentIndex * slideWidth) + dragOffset
  }

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    setHasDragged(false)
    startXRef.current = e.clientX
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    
    const diff = e.clientX - startXRef.current
    if (Math.abs(diff) > 5) {
      setHasDragged(true)
    }
    setDragOffset(diff)
  }

  const handlePointerUp = () => {
    if (!isDragging) return
    
    // Use fixed card width (360px on larger screens, 320px on mobile)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    const cardWidth = isMobile ? 320 : 360
    const threshold = cardWidth * 0.15
    
    const cardsMoved = Math.round(dragOffset / (cardWidth + gapSize))
    
    if (Math.abs(dragOffset) > threshold) {
      const newIndex = currentIndex - cardsMoved
      setCurrentIndex(Math.max(0, Math.min(newIndex, maxIndex)))
    }
    
    setIsDragging(false)
    setDragOffset(0)
    
    setTimeout(() => setHasDragged(false), 100)
  }

  const goTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, maxIndex)))
  }, [maxIndex])

  const prev = () => goTo(currentIndex - 1)
  const next = () => goTo(currentIndex + 1)

  if (relatedCommunities.length === 0) {
    return null
  }

  return (
    <section className="mt-12">
      {/* Section Header + Controls */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          Related Communities
        </h2>

        {relatedCommunities.length > itemsPerView && (
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              disabled={currentIndex === 0}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(245,245,245,0.08)] hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous related communities"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              disabled={currentIndex >= maxIndex}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(245,245,245,0.08)] hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next related communities"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Horizontal Scroll Container */}
      <div 
        ref={containerRef}
        className={`overflow-hidden -mx-6 md:-mx-12 px-6 md:px-12 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'pan-y pinch-zoom' }}
      >
        <div 
          className={`flex gap-4 pb-4 ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
          style={{ 
            transform: `translateX(${getTranslateX()}px)`,
            width: 'max-content'
          }}
          onWheel={(e) => {
            // Let vertical scroll on the page work normally when the user
            // isn't actively over the carousel.
            if (!containerRef.current) return
            
            const rect = containerRef.current.getBoundingClientRect()
            const isInsideY = e.clientY >= rect.top && e.clientY <= rect.bottom
            if (!isInsideY) return

            // Convert vertical scroll gesture into horizontal carousel movement
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              e.preventDefault()
              if (e.deltaY > 0 && currentIndex < maxIndex) {
                next()
              } else if (e.deltaY < 0 && currentIndex > 0) {
                prev()
              }
            }
          }}
        >
          {relatedCommunities.map((relatedCommunity) => (
            <div
              key={relatedCommunity.id}
              className="w-[320px] sm:w-[360px] flex-shrink-0"
            >
              <div className={`relative w-full text-left p-4 rounded-lg border bg-[rgba(245,245,245,0.04)] border-[rgba(245,245,245,0.08)] hover:bg-[rgba(245,245,245,0.06)] hover:border-zinc-700 transition-colors cursor-pointer group flex flex-col ${hasDragged ? 'pointer-events-none' : ''}`}>
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0">
                    <Link
                      href={`/communities/${relatedCommunity.id}`}
                      className="block"
                    >
                      <div className="w-12 h-12 rounded-lg bg-[rgba(245,245,245,0.08)] overflow-hidden border border-zinc-700">
                        <img
                          src={relatedCommunity.logo}
                          alt={relatedCommunity.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Community Name */}
                    <h3 className="text-base font-semibold text-white truncate mb-1 leading-tight group-hover:text-red-400 transition-colors">
                      <Link href={`/communities/${relatedCommunity.id}`}>
                        {relatedCommunity.name}
                      </Link>
                    </h3>
                    
                    {/* Location with Meeting Format */}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Link
                        href={`/communities/${relatedCommunity.id}`}
                        className="hover:text-red-400 transition-colors truncate flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{relatedCommunity.location.city}, {relatedCommunity.location.country}</span>
                      </Link>
                      <span className="text-zinc-600">•</span>
                      <span className="flex items-center gap-1 text-xs">
                        {relatedCommunity.meetingFormat === 'online' && <Video className="w-3.5 h-3.5" />}
                        {relatedCommunity.meetingFormat === 'in-person' && <Users2 className="w-3.5 h-3.5" />}
                        {relatedCommunity.meetingFormat === 'hybrid' && <Globe className="w-3.5 h-3.5" />}
                        <span>{getMeetingFormatText(relatedCommunity.meetingFormat)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Focus Areas - All visible (scrollable if needed) */}
                <div className="flex flex-nowrap gap-1.5 mb-3 overflow-x-auto -mx-4 px-4 scrollbar-hide">
                  {/* Beginner-friendly Badge - First tag */}
                  {isBeginnerFriendly(relatedCommunity) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <Sparkles className="w-3 h-3" />
                      Beginner-friendly
                    </span>
                  )}
                  {/* Focus Area Tags */}
                  {relatedCommunity.focusAreas.map((focus) => (
                    <span
                      key={focus}
                      className="px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap bg-[rgba(245,245,245,0.04)] text-zinc-500"
                    >
                      {focus}
                    </span>
                  ))}
                </div>

                {/* Meta info - Next Event Date */}
                {getNextEventDate(relatedCommunity) && (
                  <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3 pb-3 border-b border-[rgba(245,245,245,0.08)] flex-nowrap overflow-hidden">
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Next event: {getNextEventDate(relatedCommunity)}</span>
                    </span>
                  </div>
                )}

                {/* Footer - Main CTA */}
                <div className="mt-auto">
                  <Link
                    href={`/communities/${relatedCommunity.id}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-400 bg-[rgba(245,245,245,0.08)] hover:text-white hover:bg-red-500 rounded-full transition-colors w-full"
                  >
                    View Community
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Position indicators */}
      {relatedCommunities.length > itemsPerView && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-4 bg-red-500'
                  : 'w-1.5 bg-zinc-700 hover:bg-zinc-600'
              }`}
              aria-label={`Go to related communities slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

