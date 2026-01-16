'use client'

import { motion } from 'framer-motion'
import { Calendar, Globe, MapPin, ArrowUpRight } from 'lucide-react'
import { IconBrandX, IconGlobe, IconSend, IconBrandDiscord, IconBrandTelegram } from '@tabler/icons-react'
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
  const placeholderOrganizerLogo = `https://picsum.photos/seed/${encodeURIComponent(event.organizer || event.title)}/64/64`
  const organizerLogoSrc = event.organizerLogo || event.image || placeholderOrganizerLogo
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="relative"
    >
      <div className="relative bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg p-4 h-full flex flex-col">
        {/* 1. Logo & Name */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-[rgba(245,245,245,0.08)] overflow-hidden border border-zinc-700">
              <img 
                src={organizerLogoSrc} 
                alt={event.organizer}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget
                  if (target.src !== placeholderOrganizerLogo) {
                    target.src = placeholderOrganizerLogo
                  } else {
                    target.onerror = null
                  }
                }}
              />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <a
              href={event.registrationUrl || event.eventUrl || '#'}
              className="group/header block"
              style={{ touchAction: 'manipulation' }}
            >
              <h3 className="text-base font-semibold text-white truncate mb-1 leading-tight group-hover/header:text-red-400 transition-colors">
                {event.title}
              </h3>
            </a>
            
            {/* 2. Company Name (Organizer) */}
            <div className="text-sm text-gray-400">
              {event.organizer}
            </div>
          </div>
        </div>

        {/* 3. Tags with Location Type Badge */}
        <div className="flex flex-nowrap gap-1.5 mb-3 overflow-x-auto -mx-4 px-4 scrollbar-hide">
          {/* Location Type Badge */}
          <span className={`px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap ${config.bg} ${config.border} ${config.text} border`}>
            {formatLocationType(event.locationType)}
          </span>
          
          {/* Event Tags */}
          {event.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap bg-[rgba(245,245,245,0.04)] text-zinc-500"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 4. Location & Date */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3 pb-3 border-b border-[rgba(245,245,245,0.08)] flex-nowrap overflow-hidden">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            {event.locationType === 'online' ? (
              <Globe className="w-4 h-4 flex-shrink-0" />
            ) : (
              <MapPin className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="truncate">{event.location}</span>
          </span>
          <span className="text-zinc-600 flex-shrink-0">•</span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{formatDate(event.date)}</span>
          </span>
        </div>

        {/* 6. Footer - Social Icons & View Event Button */}
        <div className="flex items-center justify-between mt-auto">
          {/* Social Media Icons - Left */}
          <div className="flex items-center gap-2">
            {event.twitterUrl && (
              <a
                href={event.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                title="X (Twitter)"
                style={{ touchAction: 'manipulation' }}
              >
                <IconBrandX className="w-5 h-5" />
              </a>
            )}
            {event.eventUrl && (
              <a
                href={event.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                title="Event Website"
                style={{ touchAction: 'manipulation' }}
              >
                <IconGlobe className="w-5 h-5" />
              </a>
            )}
            {event.discordUrl && (
              <a
                href={event.discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                title="Discord"
                style={{ touchAction: 'manipulation' }}
              >
                <IconBrandDiscord className="w-5 h-5" />
              </a>
            )}
            {event.telegramUrl && (
              <a
                href={event.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                title="Telegram"
                style={{ touchAction: 'manipulation' }}
              >
                <IconSend className="w-5 h-5" />
              </a>
            )}
          </div>

          {/* View Event Button - Right */}
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

