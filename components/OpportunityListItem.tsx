'use client'

import { ExternalLink, Twitter, MessageCircle, Send, Clock, MapPin, Briefcase, Gift, Coins, Rocket, Users, ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Opportunity, OpportunityType } from '@/data/opportunities'

const typeConfig: Record<OpportunityType, { 
  bg: string
  border: string
  text: string
  label: string
  icon: typeof Briefcase
}> = {
  job: { bg: 'bg-[rgba(245,245,245,0.04)]', border: 'border-zinc-700', text: 'text-zinc-400', label: 'JOB', icon: Briefcase },
  bounty: { bg: 'bg-[rgba(245,245,245,0.04)]', border: 'border-zinc-700', text: 'text-zinc-400', label: 'BOUNTY', icon: Gift },
  grant: { bg: 'bg-[rgba(245,245,245,0.04)]', border: 'border-zinc-700', text: 'text-zinc-400', label: 'GRANT', icon: Coins },
  project: { bg: 'bg-[rgba(245,245,245,0.04)]', border: 'border-zinc-700', text: 'text-zinc-400', label: 'PROJECT', icon: Rocket },
}

interface OpportunityListItemProps {
  opportunity: Opportunity
  index: number
}

export default function OpportunityListItem({ opportunity, index }: OpportunityListItemProps) {
  const config = typeConfig[opportunity.type]
  const TypeIcon = config.icon
  const daysAgo = Math.floor((Date.now() - new Date(opportunity.postedAt).getTime()) / (1000 * 60 * 60 * 24))
  
  return (
    <motion.a
      href={opportunity.applicationUrl}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="group flex items-center gap-4 p-4 rounded-lg bg-[rgba(245,245,245,0.04)] md:hover:bg-[rgba(245,245,245,0.056)] border border-[rgba(245,245,245,0.08)] md:hover:border-zinc-700 transition-colors min-h-[60px]"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Company Logo */}
      <div className="flex-shrink-0 relative">
        <div className="w-12 h-12 rounded bg-[rgba(245,245,245,0.08)] border border-zinc-700 overflow-hidden">
          <img 
            src={opportunity.companyLogo} 
            alt={opportunity.company}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-medium text-white truncate">
            {opportunity.title}
          </h3>
          {opportunity.featured && (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[rgba(245,245,245,0.04)] text-zinc-400 border border-zinc-700">
              FEATURED
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <span className="font-medium text-zinc-300">{opportunity.company}</span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {(() => {
              const loc = opportunity.location.toLowerCase()
              if (loc.includes('remote')) return 'Remote'
              if (opportunity.location === 'Global' || opportunity.location === 'Worldwide') return 'Remote'
              return opportunity.location.split('/')[0].trim()
            })()}
          </span>
        </div>
      </div>

      {/* Tags - Hidden on mobile */}
      <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0 max-w-[200px]">
        {opportunity.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium bg-[rgba(245,245,245,0.04)] text-zinc-500 truncate">
            {tag}
          </span>
        ))}
        {opportunity.tags.length > 2 && (
          <span className="text-[11px] text-zinc-500">+{opportunity.tags.length - 2}</span>
        )}
      </div>

      {/* Type Badge */}
      <div className="flex-shrink-0">
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${config.bg} ${config.border} ${config.text} border`}>
          <TypeIcon className="w-3 h-3" />
          <span className="hidden sm:inline">{config.label}</span>
        </span>
      </div>

      {/* Applicants - Only for bounties/projects */}
      {opportunity.applicants && (
        <div className="flex-shrink-0 hidden md:flex items-center gap-1.5 text-xs text-zinc-500">
          <Users className="w-3.5 h-3.5" />
          <span>{opportunity.applicants}</span>
        </div>
      )}

      {/* Reward */}
      <div className="flex-shrink-0 text-right min-w-[100px] hidden sm:block">
        <div className="text-sm font-semibold text-white">{opportunity.reward}</div>
        <div className="text-xs text-zinc-500">
          {opportunity.deadline 
            ? `Due ${new Date(opportunity.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : daysAgo === 0 ? 'Today' : `${daysAgo}d ago`
          }
        </div>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 hidden md:block opacity-0 md:group-hover:opacity-100 transition-opacity">
        <ArrowUpRight className="w-5 h-5 text-zinc-400" />
      </div>
    </motion.a>
  )
}

