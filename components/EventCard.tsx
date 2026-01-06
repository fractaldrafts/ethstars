'use client'

import { motion } from 'framer-motion'
import { Calendar, Globe, MapPin, ArrowUpRight } from 'lucide-react'
import { IconBrandX, IconGlobe, IconSend } from '@tabler/icons-react'
import type { Event } from '@/data/events'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(time?: string): string {
  if (!time) return ''
  return time
}

function formatLocationType(locationType: 'online' | 'in-person' | 'hybrid'): string {
  switch (locationType) {
    case 'online':
      return 'Online'
    case 'in-person':
      return 'In-Person'
    case 'hybrid':
      return 'Hybrid'
    default:
      return locationType
  }
}

const locationTypeConfig: Record<'online' | 'in-person' | 'hybrid', {
  bg: string
  border: string
  text: string
}> = {
  'online': {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
  },
  'in-person': {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
  },
  'hybrid': {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
  },
}

interface EventCardProps {
  event: Event
  index: number
}

export default function EventCard({ event, index }: EventCardProps) {
  const config = locationTypeConfig[event.locationType]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="relative"
    >
      <div className="relative bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg p-5 h-full flex flex-col">
        {/* Header - Clickable */}
        <a
          href={event.registrationUrl || event.eventUrl || '#'}
          className="flex items-center gap-4 mb-4 group/header"
          style={{ touchAction: 'manipulation' }}
        >
          {event.organizerLogo && (
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded bg-[rgba(245,245,245,0.08)] border border-zinc-700 overflow-hidden">
                <img 
                  src={event.organizerLogo} 
                  alt={event.organizer}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-white group-hover/header:text-red-400 transition-colors">
              {event.title}
            </h3>
          </div>
        </a>
        
        {/* Meta info - location & date */}
        <div className="flex items-center gap-3 text-sm text-zinc-500 mb-3">
          <span className="flex items-center gap-1 min-w-0">
            {event.locationType === 'online' ? (
              <Globe className="w-4 h-4 flex-shrink-0" />
            ) : (
              <MapPin className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="truncate">{event.location}</span>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(event.date)}</span>
          </span>
        </div>
        
        {/* Description */}
        {event.description && (
          <div className="mb-4">
            <p className="text-gray-400 text-sm line-clamp-2">
              {event.description}
            </p>
          </div>
        )}
        
        {/* Tags with Location Type Badge - Horizontal Scrollable */}
        <div className="flex flex-nowrap gap-1.5 mb-4 pb-4 border-b border-[rgba(245,245,245,0.08)] overflow-x-auto -mx-5 px-5 scrollbar-hide">
          {/* Location Type Badge */}
          <span className={`px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap ${config.bg} ${config.border} ${config.text} border`}>
            {formatLocationType(event.locationType)}
          </span>
          
          {/* Event Tags */}
          {event.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap bg-[rgba(245,245,245,0.04)] text-zinc-400 border border-[rgba(245,245,245,0.08)]"
            >
              {tag}
            </span>
          ))}
        </div>
        
        {/* Footer - Social Icons & CTA in one row */}
        <div className="mt-auto flex items-center justify-between gap-3">
          {/* Social Media Icons */}
          <div className="flex items-center gap-3">
            {/* Twitter/X - placeholder for future social field */}
            <a
              href="#"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
              onClick={(e) => {
                e.preventDefault()
                // TODO: Add twitter field to Event type
              }}
              style={{ touchAction: 'manipulation' }}
            >
              <IconBrandX className="w-5 h-5" />
            </a>
            
            {/* Event Website */}
            {event.eventUrl && (
              <a
                href={event.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                style={{ touchAction: 'manipulation' }}
              >
                <IconGlobe className="w-5 h-5" />
              </a>
            )}
            
            {/* Share/Send */}
            <a
              href="#"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
              onClick={(e) => {
                e.preventDefault()
                if (navigator.share && event.eventUrl) {
                  navigator.share({
                    title: event.title,
                    text: event.description,
                    url: event.eventUrl,
                  }).catch(() => {})
                }
              }}
              style={{ touchAction: 'manipulation' }}
            >
              <IconSend className="w-5 h-5" />
            </a>
          </div>

          {/* View CTA */}
          <a
            href={event.registrationUrl || event.eventUrl || '#'}
            className="group"
            style={{ touchAction: 'manipulation' }}
          >
            <div className="flex items-center gap-1 px-4 py-3 rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-400 group-hover:bg-red-500 group-hover:text-white text-sm font-medium transition-colors min-h-[44px]">
              View Event
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </a>
        </div>
      </div>
    </motion.div>
  )
}

