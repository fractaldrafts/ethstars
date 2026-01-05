'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowUpRight, Twitter, MessageCircle, Send, Clock, MapPin, Briefcase, Gift, Coins, Rocket } from 'lucide-react'
import { motion } from 'framer-motion'
import { featuredOpportunities, type Opportunity, type OpportunityType } from '@/data/opportunities'

const typeConfig: Record<OpportunityType, { 
  bg: string
  text: string
  label: string
  icon: typeof Briefcase
}> = {
  job: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', label: 'JOB', icon: Briefcase },
  bounty: { bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400', label: 'BOUNTY', icon: Gift },
  grant: { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400', label: 'GRANT', icon: Coins },
  project: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', label: 'PROJECT', icon: Rocket },
}

function FeaturedCard({ opportunity }: { opportunity: Opportunity }) {
  const config = typeConfig[opportunity.type]
  const TypeIcon = config.icon
  
  return (
    <div className="relative h-full">
      {/* Card */}
      <div className="h-full card p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
            <img 
              src={opportunity.companyLogo} 
              alt={opportunity.company}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${config.bg} ${config.text} border`}>
                <TypeIcon className="w-3 h-3" />
                {config.label}
              </span>
              {opportunity.remote && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  Remote
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white truncate">
              {opportunity.title}
            </h3>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <span>{opportunity.company}</span>
              <span className="text-gray-600">•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {(() => {
                  const loc = opportunity.location.toLowerCase()
                  if (loc.includes('remote')) return 'Remote'
                  if (opportunity.location === 'Global' || opportunity.location === 'Worldwide') return 'Remote'
                  return opportunity.location.split('/')[0].trim()
                })()}
              </span>
            </p>
          </div>
        </div>
        
        {/* Intro */}
        <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">
          {opportunity.intro}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {opportunity.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <div>
            <div className="text-lg font-semibold text-red-400">
              {opportunity.reward}
            </div>
            {opportunity.deadline && (
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                <Clock className="w-3 h-3" />
                Due {new Date(opportunity.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {opportunity.twitter && (
              <a href={opportunity.twitter} target="_blank" rel="noopener noreferrer" 
                 className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            )}
            {opportunity.discord && (
              <a href={opportunity.discord} target="_blank" rel="noopener noreferrer"
                 className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
            {opportunity.telegram && (
              <a href={opportunity.telegram} target="_blank" rel="noopener noreferrer"
                 className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                <Send className="w-4 h-4" />
              </a>
            )}
            <Link 
              href={`/opportunity/${opportunity.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500 hover:bg-red-400 text-white font-medium text-sm transition-colors"
            >
              View Details
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FeaturedCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredOpportunities.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const next = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % featuredOpportunities.length)
  }

  const prev = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + featuredOpportunities.length) % featuredOpportunities.length)
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white">Featured Opportunities</h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Carousel */}
      <div className="relative overflow-hidden">
        <motion.div 
          className="flex gap-4"
          animate={{ x: `-${currentIndex * (100 / 3)}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {featuredOpportunities.map((opportunity) => (
            <div 
              key={opportunity.id} 
              className="w-full md:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] flex-shrink-0"
            >
              <FeaturedCard opportunity={opportunity} />
            </div>
          ))}
        </motion.div>
      </div>
      
      {/* Indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-5">
        {featuredOpportunities.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsAutoPlaying(false)
              setCurrentIndex(index)
            }}
            className={`h-1 rounded-full transition-all ${
              index === currentIndex 
                ? 'w-6 bg-red-500' 
                : 'w-1.5 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
