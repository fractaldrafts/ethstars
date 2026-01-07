'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowUpRight, MapPin, Calendar, ChevronLeft, ChevronRight, Globe, Star } from 'lucide-react'
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
  const bannerImage = event.image || `https://picsum.photos/seed/${encodeURIComponent(event.title)}/600/200`
  
  return (
    <Link
      href={event.eventUrl || '#'}
      className={`block bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg overflow-hidden hover:border-zinc-700 hover:bg-[rgba(245,245,245,0.08)] transition-all group h-full select-none ${isDragging ? 'pointer-events-none' : ''}`}
      draggable={false}
    >
      {/* Banner Header with Image */}
      <div 
        className="relative rounded-t-lg overflow-hidden aspect-[3/1]"
        style={{
          backgroundImage: `url(${bannerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* FEATURED Badge */}
        <div className="absolute top-3 right-4 z-10 flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600 opacity-100 group-hover:opacity-0 transition-opacity duration-300 ease-out">
          <Star className="w-3 h-3 text-white fill-white" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wide">FEATURED</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5">
        {/* Logo Icon and Title */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-[rgba(245,245,245,0.08)] overflow-hidden flex-shrink-0">
            <img 
              src={event.organizerLogo || event.image || `https://picsum.photos/seed/${encodeURIComponent(event.title)}/64/64`} 
              alt={event.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-white group-hover:text-red-400 transition-colors">
              {event.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
              <span>{event.locationType === 'online' ? 'Online' : event.locationType === 'hybrid' ? 'Hybrid' : 'In-person'}</span>
              <span className="text-zinc-600">•</span>
              <span>{event.location}</span>
            </div>
          </div>
        </div>

        {/* Focus Areas Tags */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide">
          {event.tags.map(tag => (
            <span key={tag} className="text-[11px] md:text-[12px] font-medium text-zinc-500 bg-[rgba(245,245,245,0.04)] px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0">
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[rgba(245,245,245,0.08)]">
          <span className="text-white font-semibold">
            {formatDate(event.date)}
          </span>
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
          <h2 className="text-lg font-semibold text-white">Featured</h2>
          <span className="text-sm text-zinc-500">{featuredEvents.length} event{featuredEvents.length !== 1 ? 's' : ''}</span>
        </div>
        
        {/* Navigation */}
        {featuredEvents.length > itemsPerView && (
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              disabled={currentIndex === 0}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(245,245,245,0.08)] hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              disabled={currentIndex >= maxIndex}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(245,245,245,0.08)] hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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

