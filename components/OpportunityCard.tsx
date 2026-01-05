'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Twitter, MessageCircle, Send, Clock, MapPin, Briefcase, Gift, Coins, Rocket } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Opportunity, OpportunityType } from '@/data/opportunities'
import { getCompanySlug } from '@/data/opportunities'

const typeConfig: Record<OpportunityType, { 
  bg: string
  border: string
  text: string
  label: string
  icon: typeof Briefcase
}> = {
  job: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'JOB', icon: Briefcase },
  bounty: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', label: 'BOUNTY', icon: Gift },
  grant: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', label: 'GRANT', icon: Coins },
  project: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', label: 'PROJECT', icon: Rocket },
}

interface OpportunityCardProps {
  opportunity: Opportunity
  index: number
  onTagClick?: (tag: string) => void
  selectedTags?: string[]
  onTypeClick?: (type: OpportunityType) => void
  selectedType?: OpportunityType | 'all'
  onRemoteClick?: () => void
  isRemoteSelected?: boolean
}

export default function OpportunityCard({ 
  opportunity, 
  index,
  onTagClick,
  selectedTags,
  onTypeClick,
  selectedType,
  onRemoteClick,
  isRemoteSelected,
}: OpportunityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = typeConfig[opportunity.type]
  const TypeIcon = config.icon
  const daysAgo = Math.floor((Date.now() - new Date(opportunity.postedAt).getTime()) / (1000 * 60 * 60 * 24))
  const companySlug = getCompanySlug(opportunity.company)
  
  // Check if intro is long enough to be truncated (roughly 120 chars for 2 lines)
  const isLongIntro = opportunity.intro.length > 120

  // Check if posted recently (within 7 days) for "New" badge
  const isNew = daysAgo <= 7
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="relative"
    >
      <div className="relative bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg p-5 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative flex-shrink-0">
            <Link
              href={`/company/${companySlug}`}
              className="block"
            >
              <div className="w-14 h-14 rounded bg-[rgba(245,245,245,0.08)] border border-zinc-700 overflow-hidden">
                <img 
                  src={opportunity.companyLogo} 
                  alt={opportunity.company}
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {onTypeClick ? (
                <button
                  onClick={() => onTypeClick(opportunity.type)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors ${
                    selectedType && selectedType === opportunity.type
                      ? 'bg-red-500/20 border-red-500/40 text-red-300'
                      : `${config.bg} ${config.border} ${config.text}`
                  }`}
                >
                  {config.label}
                </button>
              ) : (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${config.bg} ${config.border} ${config.text} border`}>
                  {config.label}
                </span>
              )}
              {opportunity.remote && (
                onRemoteClick ? (
                  <button
                    onClick={onRemoteClick}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${
                      isRemoteSelected
                        ? 'bg-red-500/20 border-red-500/40 text-red-300'
                        : 'bg-[rgba(245,245,245,0.04)] border border-zinc-700 text-zinc-400'
                    }`}
                  >
                    REMOTE
                  </button>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[rgba(245,245,245,0.04)] border border-zinc-700 text-zinc-400">
                    REMOTE
                  </span>
                )
              )}
            </div>
            <h3 className="text-base font-medium text-white truncate">
              {opportunity.title}
            </h3>
            <Link
              href={`/company/${companySlug}`}
              className="text-sm text-gray-400 flex items-center gap-1.5 hover:text-red-400 transition-colors"
            >
              {opportunity.company}
            </Link>
          </div>
        </div>
        
        {/* Intro */}
        <div className="mb-4 flex-grow">
          <p
            className={`text-gray-400 text-sm ${!isExpanded && isLongIntro ? 'line-clamp-2' : ''}`}
            title={isLongIntro ? opportunity.intro : undefined}
          >
            {opportunity.intro}
          </p>
          {isLongIntro && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-sm font-medium text-zinc-500 hover:text-zinc-400 transition-colors"
            >
              {isExpanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>
        
        {/* Tags - with "New" as first highlighted tag */}
        <div className="flex flex-nowrap gap-1.5 mb-4 overflow-x-auto -mx-5 px-5 scrollbar-hide">
          {isNew && (
            <span className="px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap bg-blue-500/20 text-blue-400 border border-blue-500/30">
              New
            </span>
          )}
          {opportunity.tags.map((tag) => {
            const isSelected = selectedTags?.includes(tag)
            const commonClasses =
              'px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap transition-colors'

            return onTagClick ? (
              <button
                key={tag}
                onClick={() => onTagClick(tag)}
                className={`${commonClasses} ${
                  isSelected
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-[rgba(245,245,245,0.04)] text-zinc-500'
                }`}
              >
                {tag}
              </button>
            ) : (
              <span
                key={tag}
                className={`${commonClasses} bg-[rgba(245,245,245,0.04)] text-zinc-500`}
              >
                {tag}
              </span>
            )
          })}
        </div>
        
        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-zinc-500 mb-4 pb-4 border-b border-[rgba(245,245,245,0.08)]">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {(() => {
              const loc = opportunity.location.toLowerCase()
              if (loc.includes('remote')) return 'Remote'
              if (opportunity.location === 'Global' || opportunity.location === 'Worldwide') return 'Remote'
              return opportunity.location.split('/')[0].trim()
            })()}
          </span>
          {opportunity.deadline ? (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(opportunity.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`}
            </span>
          )}
        </div>
        
        {/* Footer - whole row clickable */}
        <Link
          href={`/opportunity/${opportunity.id}`}
          className="flex items-center justify-between mt-auto group"
          style={{ touchAction: 'manipulation' }}
        >
          <div className="text-lg font-semibold text-white group-hover:text-red-400 transition-colors">
            {opportunity.reward}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Social Links - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-3">
              {opportunity.twitter && (
                <span className="p-3 rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-500 group-hover:bg-zinc-700 group-hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </span>
              )}
              {opportunity.discord && (
                <span className="p-3 rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-500 group-hover:bg-zinc-700 group-hover:text-white transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </span>
              )}
              {opportunity.telegram && (
                <span className="p-3 rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-500 group-hover:bg-zinc-700 group-hover:text-white transition-colors">
                  <Send className="w-5 h-5" />
                </span>
              )}
            </div>
            
            {/* View Details CTA */}
            <div className="flex items-center gap-1 px-4 py-3 rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-400 group-hover:bg-red-500 group-hover:text-white text-sm font-medium transition-colors min-h-[44px]">
              View Details
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  )
}

