'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowUpRight, MapPin, Briefcase, Gift, Coins, Rocket } from 'lucide-react'
import { IconBrandX, IconBrandDiscord, IconBrandTelegram } from '@tabler/icons-react'
import type { Opportunity, OpportunityType } from '@/data/opportunities'
import { getCompanySlug, getCompanyIntro } from '@/data/opportunities'

const typeConfig: Record<OpportunityType, {
  bg: string
  border: string
  text: string
  label: string
  icon: typeof Briefcase
}> = {
  job: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    label: 'Job',
    icon: Briefcase,
  },
  bounty: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    label: 'Bounty',
    icon: Gift,
  },
  grant: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    label: 'Grant',
    icon: Coins,
  },
  project: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    label: 'Project',
    icon: Rocket,
  },
}

interface TwoColumnOpportunityDetailProps {
  opportunity: Opportunity
  onTagClick?: (tag: string) => void
  selectedTags?: string[]
}

export default function TwoColumnOpportunityDetail({
  opportunity,
  onTagClick,
  selectedTags,
}: TwoColumnOpportunityDetailProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const config = typeConfig[opportunity.type]
  const TypeIcon = config.icon
  const companySlug = getCompanySlug(opportunity.company)

  // Reset scroll position when opportunity changes
  const prevOpportunityIdRef = useRef<string | null>(null)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container && prevOpportunityIdRef.current !== null && prevOpportunityIdRef.current !== opportunity.id) {
      // Only reset if opportunity actually changed (not on initial mount)
      container.scrollTop = 0
      setIsScrolled(false)
    }
    prevOpportunityIdRef.current = opportunity.id
  }, [opportunity.id])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(container.scrollTop > 10)
          ticking = false
        })
        ticking = true
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div 
      ref={scrollContainerRef}
      className="bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg h-[calc(100vh-40px)] max-h-[calc(100vh-40px)] overflow-y-auto overflow-x-hidden flex flex-col min-h-0"
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Header Section - Collapsible */}
      <div className={`sticky top-0 z-10 backdrop-blur-sm border-b border-[rgba(245,245,245,0.08)] transition-colors duration-200 ${
        isScrolled 
          ? 'py-3 px-4 bg-[#05071A]/95' 
          : 'p-6 bg-[rgba(245,245,245,0.06)]'
      }`}>
        <div className={`flex items-start gap-4 ${isScrolled ? 'flex-row items-center' : 'flex-col'}`}>
          {/* Logo and Title Section */}
          <div className={`flex items-start gap-4 flex-1 min-w-0 ${isScrolled ? 'items-center' : ''}`}>
            <Link 
              href={`/company/${companySlug}`} 
              className={`flex-shrink-0 transition-all duration-200 ${isScrolled ? 'w-10 h-10' : 'w-16 h-16'}`}
            >
              <div className={`transition-all duration-200 ${isScrolled ? 'w-10 h-10' : 'w-16 h-16'} rounded-lg bg-[rgba(245,245,245,0.08)] overflow-hidden border border-zinc-700`}>
                <img 
                  src={opportunity.companyLogo} 
                  alt={opportunity.company}
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
            
            <div className="flex-1 min-w-0">
              <h1 className={`font-bold text-white mb-1 transition-all duration-200 ${isScrolled ? 'text-base truncate' : 'text-2xl'}`}>
                {opportunity.title}
              </h1>
              {!isScrolled && (
                <Link
                  href={`/company/${companySlug}`}
                  className="text-lg text-zinc-300 hover:text-red-400 transition-colors inline-block"
                >
                  {opportunity.company}
                </Link>
              )}
              {isScrolled && (
                <div className="text-sm text-zinc-400 truncate">
                  {opportunity.company}
                </div>
              )}
            </div>
          </div>

          {/* Apply Button and Social Links */}
          <div className={`flex items-center gap-2 ${isScrolled ? 'flex-shrink-0' : 'w-full'}`}>
            <a
              href={opportunity.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full transition-colors ${
                isScrolled 
                  ? 'px-4 py-2 text-sm' 
                  : 'flex-1 px-6 py-3'
              }`}
            >
              Apply Now
              <ArrowUpRight className="w-4 h-4" />
            </a>
            
            {/* Social Links */}
            {(opportunity.twitter || opportunity.discord || opportunity.telegram) && (
              <div className="flex items-center gap-1.5">
                {opportunity.twitter && (
                  <a
                    href={opportunity.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
                    style={isScrolled ? { width: '36px', height: '36px' } : { width: '48px', height: '48px' }}
                    aria-label="X (Twitter)"
                  >
                    <IconBrandX className="w-4 h-4" />
                  </a>
                )}
                {opportunity.discord && (
                  <a
                    href={opportunity.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700 ${
                      isScrolled ? 'px-2 py-2' : 'w-[48px] h-[48px]'
                    }`}
                    aria-label="Discord"
                  >
                    <IconBrandDiscord className="w-4 h-4" />
                  </a>
                )}
                {opportunity.telegram && (
                  <a
                    href={opportunity.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700 ${
                      isScrolled ? 'px-2 py-2' : 'w-[48px] h-[48px]'
                    }`}
                    aria-label="Telegram"
                  >
                    <IconBrandTelegram className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Key Info - Only show when not scrolled */}
        {!isScrolled && (
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            {/* Compensation - Prominent */}
            <div className="text-xl font-bold text-white">
              {opportunity.reward}
            </div>
            
            <div className="w-px h-4 bg-zinc-700" />
            
            {/* Type */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${config.bg} ${config.border} border`}>
              <TypeIcon className={`w-4 h-4 ${config.text}`} />
              <span className={config.text}>{config.label}</span>
            </div>
            
            <div className="w-px h-4 bg-zinc-700" />
            
            {/* Location */}
            <div className="flex items-center gap-1.5 text-zinc-400">
              <MapPin className="w-4 h-4 text-zinc-500" />
              <span>{(() => {
                const loc = opportunity.location.toLowerCase()
                if (loc.includes('remote')) return 'Remote'
                if (opportunity.location === 'Global' || opportunity.location === 'Worldwide') return 'Remote'
                return opportunity.location.split('/')[0].trim()
              })()}</span>
            </div>
            
            {/* Experience Level */}
            {opportunity.experienceLevel && opportunity.experienceLevel !== 'any' && (
              <>
                <div className="w-px h-4 bg-zinc-700" />
                <span className="text-zinc-400">
                  {opportunity.experienceLevel === 'entry' ? 'Entry Level' :
                   opportunity.experienceLevel === 'mid' ? 'Mid Level' :
                   opportunity.experienceLevel === 'senior' ? 'Senior' :
                   opportunity.experienceLevel === 'lead' ? 'Lead / Principal' : ''}
                </span>
              </>
            )}
          </div>
        )}

      </div>

      {/* Content */}
      <div className="flex-1 p-6 pb-16 min-h-0">
        {/* Tags/Skills */}
        {opportunity.tags.length > 0 && (
          <div className="mb-8 pb-0">
            <h2 className="text-sm font-semibold text-white mb-3">Skills and Domains</h2>
            <div className="flex flex-wrap gap-2">
              {opportunity.tags.map((tag) => {
                const isSelected = selectedTags?.includes(tag)
                return onTagClick ? (
                  <button
                    key={tag}
                    onClick={() => onTagClick(tag)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-[rgba(245,245,245,0.08)] text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    {tag}
                  </button>
                ) : (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-[rgba(245,245,245,0.08)] text-zinc-400 border border-zinc-700"
                  >
                    {tag}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-white mb-3">Description</h2>
          <div 
            className="text-base text-zinc-400 leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0 [&_h3]:text-white [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:first:mt-0 [&_strong]:text-white [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:list-inside [&_ul]:my-3 [&_ul]:space-y-2 [&_ul]:ml-4 [&_li]:text-zinc-400"
            dangerouslySetInnerHTML={{ __html: opportunity.description }}
          />
        </div>

        {/* About the Company */}
        <div className="bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg p-6">
          <h2 className="text-sm font-semibold text-white mb-5">About the Company</h2>
          
          {/* Logo and Company Name */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-[rgba(245,245,245,0.08)] overflow-hidden border border-zinc-700 flex-shrink-0">
              <img 
                src={opportunity.companyLogo} 
                alt={opportunity.company}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-base font-semibold text-white">{opportunity.company}</h3>
          </div>
          
          {/* Description */}
          <p className="text-sm text-zinc-400 leading-relaxed mb-5">
            {getCompanyIntro(companySlug, opportunity.company)}
          </p>
          
          {/* CTA Button */}
          <Link
            href={`/company/${companySlug}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-300 hover:bg-[rgba(245,245,245,0.12)] hover:text-white border border-zinc-700 hover:border-zinc-600 transition-colors text-sm font-medium"
          >
            View Details
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Bottom spacing */}
        <div className="h-6"></div>

      </div>
    </div>
  )
}
