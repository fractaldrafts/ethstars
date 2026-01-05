'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { ArrowUpRight, MapPin, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { featuredOpportunities, type Opportunity, type OpportunityType } from '@/data/opportunities'

const typeLabels: Record<OpportunityType, string> = {
  job: 'Job',
  bounty: 'Bounty',
  grant: 'Grant',
  project: 'Project',
}

const typeConfig: Record<OpportunityType, {
  bg: string
  border: string
  text: string
  hoverBg: string
  hoverBorder: string
  hoverText: string
}> = {
  job: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    hoverBg: 'group-hover:bg-emerald-500/20',
    hoverBorder: 'group-hover:border-emerald-500/50',
    hoverText: 'group-hover:text-emerald-300',
  },
  bounty: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    hoverBg: 'group-hover:bg-orange-500/20',
    hoverBorder: 'group-hover:border-orange-500/50',
    hoverText: 'group-hover:text-orange-300',
  },
  grant: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    hoverBg: 'group-hover:bg-purple-500/20',
    hoverBorder: 'group-hover:border-purple-500/50',
    hoverText: 'group-hover:text-purple-300',
  },
  project: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    hoverBg: 'group-hover:bg-blue-500/20',
    hoverBorder: 'group-hover:border-blue-500/50',
    hoverText: 'group-hover:text-blue-300',
  },
}

function isExpired(deadline: string): boolean {
  const date = new Date(deadline)
  const now = new Date()
  return date.getTime() < now.getTime()
}

function formatPosted(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1d ago'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDeadline(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return '1 day left'
  if (diffDays < 7) return `${diffDays} days left`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks left`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function FeaturedCard({ opportunity, isDragging, onOpportunityClick }: { opportunity: Opportunity; isDragging: boolean; onOpportunityClick?: (opportunityId: string) => void }) {
  const hasDeadline = opportunity.deadline && (opportunity.type === 'bounty' || opportunity.type === 'grant')
  const config = typeConfig[opportunity.type]
  
  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    // On desktop (md and up), scroll to opportunity table instead of navigating
    if (typeof window !== 'undefined' && window.innerWidth >= 768 && onOpportunityClick) {
      e.preventDefault()
      e.stopPropagation()
      onOpportunityClick(opportunity.id)
      return
    }
  }
  
  return (
    <Link
      href={`/opportunity/${opportunity.id}`}
      onClick={handleClick}
      className={`block p-5 bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg hover:border-zinc-700 hover:bg-[rgba(245,245,245,0.08)] transition-all group h-full select-none ${isDragging ? 'pointer-events-none' : ''}`}
      draggable={false}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[rgba(245,245,245,0.08)] overflow-hidden flex-shrink-0">
            <img 
              src={opportunity.companyLogo} 
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
          <div>
            <span className="text-sm text-white font-medium block">
              {opportunity.company}
            </span>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>
                  {(() => {
                    const loc = opportunity.location.toLowerCase()
                    if (loc.includes('remote')) return 'Remote'
                    if (opportunity.location === 'Global' || opportunity.location === 'Worldwide') return 'Remote'
                    return opportunity.location.split('/')[0].trim()
                  })()}
                </span>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatPosted(opportunity.postedAt)}</span>
              </span>
            </div>
          </div>
        </div>
        <span className={`text-xs font-medium border px-2 py-1 rounded flex-shrink-0 transition-all duration-300 ${config.bg} ${config.border} ${config.text} ${config.hoverBg} ${config.hoverBorder} ${config.hoverText}`}>
          {typeLabels[opportunity.type]}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-white font-medium mb-2 group-hover:text-red-400 transition-colors">
        {opportunity.title}
      </h3>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {opportunity.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-[11px] md:text-[12px] font-medium text-zinc-500 bg-[rgba(245,245,245,0.04)] px-2 py-0.5 rounded">
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[rgba(245,245,245,0.08)]">
        <span className="text-white font-semibold">
          {opportunity.reward}
        </span>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[rgba(245,245,245,0.06)] text-xs font-medium text-zinc-300 group-hover:bg-red-500 group-hover:text-white transition-colors">
          View Details
          <ArrowUpRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  )
}

interface FeaturedSectionProps {
  onOpportunityClick?: (opportunityId: string) => void
}

export default function FeaturedSection({ onOpportunityClick }: FeaturedSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [hasDragged, setHasDragged] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(3)
  const startXRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Filter out expired opportunities
  const activeFeaturedOpportunities = useMemo(() => {
    return featuredOpportunities.filter(opp => {
      // If it has a deadline, check if it's expired
      if (opp.deadline) {
        return !isExpired(opp.deadline)
      }
      // Jobs and projects without deadlines are always shown
      return true
    })
  }, [])
  
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

  const maxIndex = Math.max(0, activeFeaturedOpportunities.length - itemsPerView)
  const gapSize = 16

  // Make sure current index is always in range when layout changes
  useEffect(() => {
    setCurrentIndex(prev => Math.min(prev, maxIndex))
  }, [maxIndex])

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || activeFeaturedOpportunities.length <= itemsPerView) return
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [isAutoPlaying, maxIndex, activeFeaturedOpportunities.length])

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

  if (activeFeaturedOpportunities.length === 0) return null

  return (
    <section className="mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Featured</h2>
          <span className="text-sm text-zinc-500">{activeFeaturedOpportunities.length} opportunities</span>
        </div>
        
        {/* Navigation */}
        {activeFeaturedOpportunities.length > itemsPerView && (
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
          {activeFeaturedOpportunities.map((opportunity) => (
            <div 
              key={opportunity.id} 
              className="w-full md:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] flex-shrink-0"
            >
              <FeaturedCard opportunity={opportunity} isDragging={hasDragged} onOpportunityClick={onOpportunityClick} />
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      {activeFeaturedOpportunities.length > itemsPerView && (
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
