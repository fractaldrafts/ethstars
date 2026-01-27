'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Users, ArrowUpRight, Calendar, Sparkles, Globe, Users2, Video, Plus, ArrowLeft } from 'lucide-react'
import { IconBrandDiscord, IconBrandTelegram, IconZoomExclamation } from '@tabler/icons-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  type Community, 
  isBeginnerFriendly,
  getMeetingFormatText,
  getNextEventDate
} from '@/data/communities'
import type { FilterEmptyStateConfig } from './FilterEmptyState'
import FilterEmptyState from './FilterEmptyState'
import CommunityDetail from './CommunityDetail'

interface CommunitiesListProps {
  communities: Community[]
  selectedCommunityId: string | null
  onCommunitySelect: (community: Community) => void
  hoveredCommunityId?: string | null
  onCommunityHover?: (communityId: string | null) => void
  selectedCountry?: string | null
  emptyStateConfig?: FilterEmptyStateConfig | null
}

export default function CommunitiesList({
  communities,
  selectedCommunityId,
  onCommunitySelect,
  hoveredCommunityId,
  onCommunityHover,
  selectedCountry,
  emptyStateConfig,
}: CommunitiesListProps) {
  const router = useRouter()
  const selectedRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Scroll selected community into view
  useEffect(() => {
    if (selectedCommunityId && selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [selectedCommunityId])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!listRef.current) return

    const currentIndex = focusedIndex !== null ? focusedIndex : 
      (selectedCommunityId ? communities.findIndex(c => c.id === selectedCommunityId) : 0)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        const nextIndex = currentIndex < communities.length - 1 ? currentIndex + 1 : 0
        setFocusedIndex(nextIndex)
        cardRefs.current.get(nextIndex)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        break
      case 'ArrowUp':
        e.preventDefault()
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : communities.length - 1
        setFocusedIndex(prevIndex)
        cardRefs.current.get(prevIndex)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        break
      case 'Enter':
        e.preventDefault()
        if (currentIndex >= 0 && currentIndex < communities.length) {
          onCommunitySelect(communities[currentIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setFocusedIndex(null)
        if (selectedCommunityId) {
          onCommunitySelect(communities.find(c => c.id === selectedCommunityId)!)
        }
        break
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        cardRefs.current.get(0)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        break
      case 'End':
        e.preventDefault()
        const lastIndex = communities.length - 1
        setFocusedIndex(lastIndex)
        cardRefs.current.get(lastIndex)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        break
    }
  }, [communities, focusedIndex, selectedCommunityId, onCommunitySelect])

  useEffect(() => {
    const listElement = listRef.current
    if (listElement) {
      listElement.addEventListener('keydown', handleKeyDown)
      listElement.setAttribute('tabIndex', '0')
      listElement.setAttribute('role', 'listbox')
      listElement.setAttribute('aria-label', 'Communities list')
      return () => {
        listElement.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [handleKeyDown])

  // Reset focused index when communities change
  useEffect(() => {
    setFocusedIndex(null)
  }, [communities])

  // Find selected community
  const selectedCommunity = selectedCommunityId 
    ? communities.find(c => c.id === selectedCommunityId) 
    : null

  // Handle back action
  const handleBack = () => {
    if (selectedCommunity) {
      onCommunitySelect(selectedCommunity)
    }
  }

  // If a community is selected, show detail view
  if (selectedCommunity) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <CommunityDetail
          community={selectedCommunity}
          onClose={handleBack}
          showBackButton={true}
        />
      </div>
    )
  }

  if (communities.length === 0) {
    if (emptyStateConfig) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <FilterEmptyState config={emptyStateConfig} />
        </div>
      )
    }
    if (selectedCountry && selectedCountry !== 'all') {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <IconZoomExclamation className="w-12 h-12 text-zinc-600 mb-4" />
          <p className="text-zinc-500 text-sm text-center mb-2">No communities found in {selectedCountry}</p>
          <button
            onClick={() => router.push('/communities?add=true')}
            className="mt-3 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-full transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Community
          </button>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <IconZoomExclamation className="w-12 h-12 text-zinc-600 mb-4" />
        <p className="text-zinc-500 text-sm text-center">No communities found</p>
        <p className="text-zinc-600 text-xs mt-1 text-center">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div 
      ref={listRef}
      className="space-y-3 h-full overflow-y-auto scrollbar-hide-on-idle"
      tabIndex={0}
      role="listbox"
      aria-label="Communities list"
    >
        {communities.map((community, index) => {
          const isSelected = selectedCommunityId === community.id
          const isHovered = hoveredCommunityId === community.id
          const isFocused = focusedIndex === index

          return (
            <div
              key={community.id}
              ref={(el) => {
                if (isSelected) selectedRef.current = el
                if (el) {
                  cardRefs.current.set(index, el)
                } else {
                  cardRefs.current.delete(index)
                }
              }}
              onClick={() => {
                onCommunitySelect(community)
                setFocusedIndex(index)
              }}
              onMouseEnter={() => {
                onCommunityHover?.(community.id)
                setFocusedIndex(index)
              }}
              onMouseLeave={() => {
                onCommunityHover?.(null)
              }}
              onFocus={() => setFocusedIndex(index)}
              role="option"
              aria-selected={isSelected}
              tabIndex={isFocused || isSelected ? 0 : -1}
              className={`relative w-full text-left p-4 rounded-lg border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-[rgba(5,7,26,0.8)] flex flex-col ${
                isSelected
                  ? 'bg-[rgba(245,245,245,0.08)] border-zinc-700'
                  : 'bg-[rgba(245,245,245,0.04)] border-[rgba(245,245,245,0.08)] hover:bg-[rgba(245,245,245,0.06)] hover:border-zinc-700'
              }`}
            >
              {/* Selected indicator - colored left border (like opportunities) */}
              {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg" />
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
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Link
                      href={`/communities/${community.id}`}
                      className="hover:text-red-400 transition-colors truncate flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{community.location.city}, {community.location.country}</span>
                    </Link>
                    <span className="text-zinc-600">•</span>
                    <span className="flex items-center gap-1 text-xs">
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
                {/* Next Event Badge */}
                {getNextEventDate(community) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <Calendar className="w-3 h-3" />
                    Next event: {getNextEventDate(community)}
                  </span>
                )}
                {/* Focus Area Tags */}
                {community.focusAreas.map((focus) => (
                  <span
                    key={focus}
                    className="px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap bg-[rgba(245,245,245,0.04)] text-zinc-500"
                  >
                    {focus}
                  </span>
                ))}
              </div>

              {/* Footer - Social Icons & View Community Button */}
              <div className="mt-auto pt-3 border-t border-[rgba(245,245,245,0.08)] flex items-center justify-between gap-3">
                {/* Social Media Icons - Left */}
                <div className="flex items-center gap-2">
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

                {/* View Community Button - Right */}
                <Link
                  href={`/communities/${community.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="group"
                  style={{ touchAction: 'manipulation' }}
                >
                  <div className="flex items-center gap-1 px-4 py-3 rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-400 group-hover:bg-red-500 group-hover:text-white text-sm font-medium transition-colors min-h-[40px]">
                    View Community
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </div>
            </div>
          )
        })}
    </div>
  )
}
