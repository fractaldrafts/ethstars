'use client'

import Link from 'next/link'
import { MapPin, Clock } from 'lucide-react'
import type { Opportunity, OpportunityType } from '@/data/opportunities'
import { getCompanySlug } from '@/data/opportunities'

// Colored config for type tags
const typeTagConfig: Record<OpportunityType, {
  bg: string
  border: string
  text: string
  label: string
}> = {
  job: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Job' },
  bounty: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', label: 'Bounty' },
  grant: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', label: 'Grant' },
  project: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', label: 'Project' },
}

interface TwoColumnOpportunityItemProps {
  opportunity: Opportunity
  isSelected: boolean
  onClick: () => void
  onTagClick?: (tag: string) => void
  selectedTags?: string[]
  onTypeClick?: (type: OpportunityType) => void
  selectedType?: OpportunityType | 'all'
  onLocationClick?: (location: string) => void
  selectedLocation?: string
}

export default function TwoColumnOpportunityItem({
  opportunity,
  isSelected,
  onClick,
  onTagClick,
  selectedTags,
  onTypeClick,
  selectedType,
  onLocationClick,
  selectedLocation,
}: TwoColumnOpportunityItemProps) {
  const typeTagConfigValue = typeTagConfig[opportunity.type]
  const companySlug = getCompanySlug(opportunity.company)
  const daysAgo = Math.floor((Date.now() - new Date(opportunity.postedAt).getTime()) / (1000 * 60 * 60 * 24))

  // Check if posted recently (within 7 days) for "New" badge
  const isNew = daysAgo <= 7

  // Helper to normalize location for filtering (matching OpportunityTable logic)
  const normalizeLocation = (location: string): string => {
    const loc = location.toLowerCase()
    if (loc.includes('remote')) return 'Remote'
    if (location === 'Global' || location === 'Worldwide') return 'Remote'
    return location.split('/')[0].trim()
  }

  const normalizedLocation = normalizeLocation(opportunity.location)
  const isLocationSelected = selectedLocation === normalizedLocation
  const isTypeSelected = selectedType === opportunity.type

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={`relative w-full text-left p-4 rounded-lg border transition-colors cursor-pointer ${
        isSelected
          ? 'bg-[rgba(245,245,245,0.08)] border-zinc-700'
          : 'bg-[rgba(245,245,245,0.04)] border-[rgba(245,245,245,0.08)] hover:bg-[rgba(245,245,245,0.06)] hover:border-zinc-700'
      }`}
    >
      {/* Selected indicator - colored left border (like ZipRecruiter) */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg" />
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0">
          <Link
            href={`/company/${companySlug}`}
            className="block"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="w-12 h-12 rounded-lg bg-[rgba(245,245,245,0.08)] overflow-hidden border border-zinc-700">
            <img 
              src={opportunity.companyLogo} 
              alt={opportunity.company}
              className="w-full h-full object-cover"
            />
          </div>
          </Link>
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Job Title */}
          <h3 className="text-base font-semibold text-white truncate mb-1 leading-tight">
            {opportunity.title}
          </h3>
          
          {/* Company Name - Clickable */}
          <Link
            href={`/company/${companySlug}`}
            className="text-sm text-gray-400 hover:text-red-400 transition-colors truncate block"
            onClick={(e) => e.stopPropagation()}
          >
            {opportunity.company}
          </Link>
        </div>
      </div>

      {/* Tags - with type tag first (color coded), then "New", then other tags */}
      <div className="flex flex-nowrap gap-1.5 mb-3 overflow-x-auto -mx-4 px-4 scrollbar-hide">
        {/* Type tag - color coded, first, clickable */}
        {onTypeClick ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTypeClick(opportunity.type)
              onClick()
            }}
            className={`px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap border transition-colors ${
              isTypeSelected
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : `${typeTagConfigValue.bg} ${typeTagConfigValue.border} ${typeTagConfigValue.text}`
            }`}
          >
            {typeTagConfigValue.label}
          </button>
        ) : (
          <span className={`px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap border ${typeTagConfigValue.bg} ${typeTagConfigValue.border} ${typeTagConfigValue.text}`}>
            {typeTagConfigValue.label}
          </span>
        )}
        {/* New badge */}
          {isNew && (
          <span className="px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap bg-blue-500/20 text-blue-400 border border-blue-500/30">
              New
          </span>
        )}
        {/* Other tags */}
        {opportunity.tags.map((tag) => {
          const isTagSelected = selectedTags?.includes(tag)
          return onTagClick ? (
            <button
              key={tag}
              onClick={(e) => {
                e.stopPropagation()
                onTagClick(tag)
                onClick()
              }}
              className={`px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap transition-colors ${
                isTagSelected
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-[rgba(245,245,245,0.04)] text-zinc-500'
              }`}
            >
              {tag}
            </button>
          ) : (
            <span
              key={tag}
              className="px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap bg-[rgba(245,245,245,0.04)] text-zinc-500"
            >
              {tag}
            </span>
          )
        })}
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-3 text-sm text-zinc-500 mb-3 pb-3 border-b border-[rgba(245,245,245,0.08)]">
        {onLocationClick ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLocationClick(normalizedLocation)
              onClick()
            }}
            className={`flex items-center gap-1.5 transition-colors hover:text-zinc-400 ${
              isLocationSelected ? 'text-red-400' : ''
            }`}
          >
            <MapPin className="w-4 h-4" />
            {normalizedLocation}
          </button>
        ) : (
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {normalizedLocation}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          className="flex items-center gap-1.5 transition-colors hover:text-zinc-400"
        >
          <Clock className="w-4 h-4" />
          {opportunity.deadline ? (
            new Date(opportunity.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          ) : (
            daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`
          )}
        </button>
        </div>

      {/* Footer - Reward */}
      <div className="text-sm font-semibold text-white">
        {opportunity.reward}
      </div>
    </div>
  )
}

