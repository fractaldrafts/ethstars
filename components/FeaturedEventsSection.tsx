'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowUpRight, MapPin, Calendar, ChevronLeft, ChevronRight, Globe } from 'lucide-react'
import { featuredEvents, type Event } from '@/data/events'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(time?: string): string {
  if (!time) return ''
  return time
}

function FeaturedCard({ event, isDragging }: { event: Event; isDragging: boolean }) {
  const locationTypeConfig = {
    'online': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
    'in-person': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    'hybrid': { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  }

  const config = locationTypeConfig[event.locationType]
  
  return (
    <Link
      href={event.eventUrl || '#'}
      className={`block bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg overflow-hidden hover:border-zinc-700 hover:bg-[rgba(245,245,245,0.08)] transition-all group h-full select-none ${isDragging ? 'pointer-events-none' : ''}`}
      draggable={false}
    >
      {/* Banner Header with Image */}
      <div 
        className={`relative rounded-t-lg overflow-hidden ${event.image ? 'aspect-[3/1]' : 'bg-gradient-to-br from-red-600/20 to-blue-600/20 h-24'}`}
        style={event.image ? {
          backgroundImage: `url(${event.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {}}
      >
        {/* Optional overlay gradient for better text readability */}
        {event.image && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        )}
      </div>

      {/* Card Body */}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {event.organizerLogo ? (
            <div className="w-10 h-10 rounded bg-[rgba(245,245,245,0.08)] overflow-hidden flex-shrink-0">
              <img 
                src={event.organizerLogo} 
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded bg-[rgba(245,245,245,0.08)] flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-zinc-500" />
            </div>
          )}
          <div>
            <span className="text-sm text-white font-medium block">
              {event.organizer}
            </span>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                {event.locationType === 'online' ? (
                  <Globe className="w-3 h-3" />
                ) : (
                  <MapPin className="w-3 h-3" />
                )}
                <span>{event.location}</span>
              </span>
            </div>
          </div>
        </div>
        <span className={`text-xs font-medium border px-2 py-1 rounded flex-shrink-0 transition-all duration-300 ${config.bg} ${config.border} ${config.text}`}>
          {event.locationType === 'online' ? 'Online' : event.locationType === 'in-person' ? 'In-Person' : 'Hybrid'}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-white font-medium mb-2 group-hover:text-red-400 transition-colors">
        {event.title}
      </h3>

      {/* Date & Time */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
        <Calendar className="w-3 h-3" />
        <span>{formatDate(event.date)}</span>
        {event.time && (
          <>
            <span className="text-zinc-600">•</span>
            <span>{formatTime(event.time)}</span>
          </>
        )}
      </div>

      {/* Tags */}
      {event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {event.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[11px] md:text-[12px] font-medium text-zinc-500 bg-[rgba(245,245,245,0.04)] px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-[rgba(245,245,245,0.08)]">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[rgba(245,245,245,0.06)] text-xs font-medium text-zinc-300 group-hover:bg-red-500 group-hover:text-white transition-colors">
            View Event
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function FeaturedEventsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [hasDragged, setHasDragged] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(3)
  const startXRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Keep the number of visible cards in sync with breakpoints
  useEffect(() => {
    const updateItemsPerView = () => {
      if (typeof window === 'undefined') return
      const width = window.innerWidth
      
      if (width < 768) {
        // Mobile: 1 card
        setItemsPerView(1)
      } else if (width < 1024) {
        // Tablet: 2 cards
        setItemsPerView(2)
      } else {
        // Desktop: 3 cards
        setItemsPerView(3)
      }
    }

    updateItemsPerView()
    window.addEventListener('resize', updateItemsPerView)
    return () => window.removeEventListener('resize', updateItemsPerView)
  }, [])

  const maxIndex = Math.max(0, featuredEvents.length - itemsPerView)
  const gapSize = 16

  // Make sure current index is always in range when layout changes
  useEffect(() => {
    setCurrentIndex(prev => Math.min(prev, maxIndex))
  }, [maxIndex])

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || featuredEvents.length <= itemsPerView) return
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [isAutoPlaying, maxIndex, featuredEvents.length])

  const goTo = useCallback((index: number) => {
    setIsAutoPlaying(false)
    setCurrentIndex(Math.max(0, Math.min(index, maxIndex)))
  }, [maxIndex])

  const prev = () => goTo(currentIndex - 1)
  const next = () => goTo(currentIndex + 1)

  // Get position for current index
  const getTranslateX = () => {
    if (!containerRef.current) return 0
    const containerWidth = containerRef.current.offsetWidth
    const cardWidth = (containerWidth - gapSize * (itemsPerView - 1)) / itemsPerView
    const slideWidth = cardWidth + gapSize
    return -(currentIndex * slideWidth) + dragOffset
  }

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    setHasDragged(false)
    setIsAutoPlaying(false)
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
    
    const containerWidth = containerRef.current?.offsetWidth || 0
    const cardWidth = (containerWidth - gapSize * (itemsPerView - 1)) / itemsPerView
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

  if (featuredEvents.length === 0) return null

  return (
    <section className="mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Featured Events</h2>
          <span className="text-sm text-zinc-500">{featuredEvents.length} event{featuredEvents.length !== 1 ? 's' : ''}</span>
        </div>
        
        {/* Navigation */}
        {featuredEvents.length > itemsPerView && (
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              disabled={currentIndex === 0}
              className="p-1.5 rounded bg-[rgba(245,245,245,0.08)] hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              disabled={currentIndex >= maxIndex}
              className="p-1.5 rounded bg-[rgba(245,245,245,0.08)] hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Carousel */}
      <div 
        ref={containerRef}
        className={`overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'pan-y pinch-zoom' }}
      >
        <div 
          className={`flex gap-4 ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
          style={{ 
            transform: `translateX(${getTranslateX()}px)` 
          }}
          onWheel={(e) => {
            if (!containerRef.current) return
            
            const rect = containerRef.current.getBoundingClientRect()
            const isInsideY = e.clientY >= rect.top && e.clientY <= rect.bottom
            if (!isInsideY) return

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
          {featuredEvents.map((event) => (
            <div 
              key={event.id} 
              className="w-full md:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] flex-shrink-0"
            >
              <FeaturedCard event={event} isDragging={hasDragged} />
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      {featuredEvents.length > itemsPerView && (
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
            />
          ))}
        </div>
      )}
    </section>
  )
}

