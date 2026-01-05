'use client'

import Link from 'next/link'
import { ArrowUpRight, MapPin, Briefcase, Gift, Coins, Rocket, Clock } from 'lucide-react'
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

interface MobileOpportunityDetailProps {
  opportunity: Opportunity
}

export default function MobileOpportunityDetail({ opportunity }: MobileOpportunityDetailProps) {
  const config = typeConfig[opportunity.type]
  const TypeIcon = config.icon
  const companySlug = getCompanySlug(opportunity.company)
  const daysAgo = Math.floor((Date.now() - new Date(opportunity.postedAt).getTime()) / (1000 * 60 * 60 * 24))

  // Normalize location for display
  const normalizeLocation = (location: string): string => {
    const loc = location.toLowerCase()
    if (loc.includes('remote')) return 'Remote'
    if (location === 'Global' || location === 'Worldwide') return 'Remote'
    return location.split('/')[0].trim()
  }
  const normalizedLocation = normalizeLocation(opportunity.location)

  return (
    <div>
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col gap-4">
          {/* Logo and Title */}
          <div className="flex items-start gap-4">
            <Link 
              href={`/company/${companySlug}`} 
              className="flex-shrink-0"
            >
              <div className="w-16 h-16 rounded-lg bg-[rgba(245,245,245,0.08)] overflow-hidden border border-zinc-700">
                <img 
                  src={opportunity.companyLogo} 
                  alt={opportunity.company}
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white mb-1">
                {opportunity.title}
              </h1>
              <Link
                href={`/company/${companySlug}`}
                className="text-lg text-zinc-300 hover:text-red-400 transition-colors inline-block"
              >
                {opportunity.company}
              </Link>
            </div>
          </div>

          {/* Compensation and Type Tag - Spread horizontally */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Compensation */}
            <div className="text-2xl font-bold text-white">
              {opportunity.reward}
            </div>
            
            {/* Type badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md ${config.bg} ${config.border} border`}>
              <TypeIcon className={`w-4 h-4 ${config.text}`} />
              <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
            </div>
          </div>

          {/* Location, Seniority, and Date - Separated by separators */}
          <div className="flex items-center text-sm text-zinc-400 border border-[rgba(245,245,245,0.08)] rounded-lg overflow-hidden">
            {/* Location */}
            <div className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 border-r border-[rgba(245,245,245,0.08)]">
              <span className="truncate">{normalizedLocation}</span>
            </div>
            
            {/* Experience Level */}
            {opportunity.experienceLevel && opportunity.experienceLevel !== 'any' ? (
              <>
                <div className="flex-1 flex items-center justify-center px-4 py-2 border-r border-[rgba(245,245,245,0.08)]">
                  <span className="truncate">
                    {opportunity.experienceLevel === 'entry' ? 'Entry Level' :
                     opportunity.experienceLevel === 'mid' ? 'Mid Level' :
                     opportunity.experienceLevel === 'senior' ? 'Senior' :
                     opportunity.experienceLevel === 'lead' ? 'Lead / Principal' : ''}
                  </span>
                </div>
                
                {/* Posted date */}
                <div className="flex-1 flex items-center justify-center px-4 py-2">
                  <span className="truncate">
                    {opportunity.deadline
                      ? `Due ${new Date(opportunity.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`}
                  </span>
                </div>
              </>
            ) : (
              /* Posted date - when no experience level */
              <div className="flex-1 flex items-center justify-center px-4 py-2">
                <span className="truncate">
                  {opportunity.deadline
                    ? `Due ${new Date(opportunity.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`}
                </span>
              </div>
            )}
          </div>

          {/* Primary CTA and Social Links */}
          <div className="flex flex-col gap-3">
            {/* Primary CTA */}
            <a
              href={opportunity.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full px-6 py-3 transition-colors w-full"
            >
              Apply Now
              <ArrowUpRight className="w-4 h-4" />
            </a>
            
            {/* Social Links */}
            {(opportunity.twitter || opportunity.discord || opportunity.telegram) && (
              <div className="flex items-center gap-2">
                {opportunity.twitter && (
                  <a
                    href={opportunity.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center h-12 rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
                    aria-label="X (Twitter)"
                  >
                    <IconBrandX className="w-5 h-5" />
                  </a>
                )}
                {opportunity.discord && (
                  <a
                    href={opportunity.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center h-12 rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
                    aria-label="Discord"
                  >
                    <IconBrandDiscord className="w-5 h-5" />
                  </a>
                )}
                {opportunity.telegram && (
                  <a
                    href={opportunity.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center h-12 rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
                    aria-label="Telegram"
                  >
                    <IconBrandTelegram className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Description */}
        <div className="mb-8">
          <div 
            className="text-base text-zinc-400 leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0 [&_h3]:text-white [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:first:mt-0 [&_strong]:text-white [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:list-inside [&_ul]:my-3 [&_ul]:space-y-2 [&_ul]:ml-4 [&_li]:text-zinc-400"
            dangerouslySetInnerHTML={{ __html: opportunity.description }}
          />
        </div>

        {/* Tags/Skills */}
        {opportunity.tags.length > 0 && (
          <div className="mb-8 pb-8 border-b border-[rgba(245,245,245,0.08)]">
            <h2 className="text-sm font-semibold text-white mb-3">Skills & Requirements</h2>
            <div className="flex flex-wrap gap-2">
              {opportunity.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-[rgba(245,245,245,0.08)] text-zinc-400 border border-zinc-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* About the Company */}
        <div>
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
      </div>
    </div>
  )
}

