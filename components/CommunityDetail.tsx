'use client'

import { useMemo } from 'react'
import { X, MapPin, Users, Calendar, Globe, ExternalLink, Sparkles, Video, Users2, Maximize2, ArrowUpRight } from 'lucide-react'
import { IconBrandX, IconBrandDiscord, IconBrandTelegram, IconGlobe } from '@tabler/icons-react'
import Link from 'next/link'
import { type Community, isBeginnerFriendly, getMeetingFormatText, getCommunityEvents } from '@/data/communities'
import type { Event } from '@/data/events'

interface CommunityDetailProps {
  community: Community
  onClose: () => void
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CommunityDetail({ community, onClose }: CommunityDetailProps) {
  // Get upcoming events for this community
  const upcomingEvents = useMemo(() => {
    const allEvents = getCommunityEvents(community)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    return allEvents
      .filter((event: Event) => {
        const eventDate = new Date(event.date)
        eventDate.setHours(0, 0, 0, 0)
        return eventDate >= now
      })
      .slice(0, 5) // Limit to 5 upcoming events
  }, [community])

  return (
    <div className="h-full flex flex-col bg-[rgba(5,7,26,0.98)] backdrop-blur-xl border border-[rgba(245,245,245,0.12)] rounded-lg shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[rgba(245,245,245,0.08)] flex-shrink-0">
        <h2 className="text-xs font-medium uppercase text-zinc-400 tracking-wide">Community Details</h2>
        <div className="flex items-center gap-1.5">
          <Link
            href={`/communities/${community.id}`}
            className="p-1.5 rounded hover:bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:text-white transition-colors"
            aria-label="Open community details page"
          >
            <Maximize2 className="w-4 h-4" />
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[rgba(245,245,245,0.08)] text-zinc-400 hover:text-white transition-colors"
            aria-label="Close community details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Banner Image */}
        {community.banner && (
          <div 
            className="w-full aspect-[3/1] bg-[rgba(245,245,245,0.08)] overflow-hidden"
            style={{
              backgroundImage: `url(${community.banner})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <img
              src={community.banner}
              alt={`${community.name} banner`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}
        <div className="p-4 space-y-6">
          {/* Community Header */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-[rgba(245,245,245,0.08)] overflow-hidden flex-shrink-0 border border-[rgba(245,245,245,0.12)]">
              <img
                src={community.logo}
                alt={community.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-white mb-2">{community.name}</h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{community.location.city}, {community.location.country}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>{community.memberCount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-zinc-300 text-sm leading-relaxed">{community.description}</p>
          </div>

          {/* Badges + Focus Areas */}
          <div className="flex flex-nowrap gap-1.5 overflow-x-auto -mx-4 px-4 scrollbar-hide">
            {isBeginnerFriendly(community) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3 h-3" />
                Beginner-friendly
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap bg-[rgba(245,245,245,0.04)] text-zinc-500">
              {community.meetingFormat === 'online' && <Video className="w-3 h-3" />}
              {community.meetingFormat === 'in-person' && <Users2 className="w-3 h-3" />}
              {community.meetingFormat === 'hybrid' && <Globe className="w-3 h-3" />}
              {getMeetingFormatText(community.meetingFormat)}
            </span>
            {community.focusAreas.map((focus) => (
              <span
                key={focus}
                className="px-2 py-1 rounded text-[12px] font-medium flex-shrink-0 whitespace-nowrap bg-[rgba(245,245,245,0.04)] text-zinc-500"
              >
                {focus}
              </span>
            ))}
          </div>

          {/* Social Links */}
          {(community.discord || community.telegram || community.website || community.twitter) && (
            <div>
              <h4 className="text-xs font-medium text-zinc-500 mb-3">Connect</h4>
              <div className="flex items-center gap-3">
                {community.twitter && (
                  <a
                    href={community.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-400 hover:text-white hover:bg-zinc-800 border border-[rgba(245,245,245,0.14)] transition-colors text-xs font-medium"
                    aria-label="X (Twitter)"
                  >
                    <IconBrandX className="w-5 h-5" />
                    <span className="truncate">X / Twitter</span>
                  </a>
                )}
                {community.discord && (
                  <a
                    href={community.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-400 hover:text-white hover:bg-zinc-800 border border-[rgba(245,245,245,0.14)] transition-colors text-xs font-medium"
                    aria-label="Discord"
                  >
                    <IconBrandDiscord className="w-5 h-5" />
                    <span className="truncate">Discord</span>
                  </a>
                )}
                {community.telegram && (
                  <a
                    href={community.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-400 hover:text-white hover:bg-zinc-800 border border-[rgba(245,245,245,0.14)] transition-colors text-xs font-medium"
                    aria-label="Telegram"
                  >
                    <IconBrandTelegram className="w-5 h-5" />
                    <span className="truncate">Telegram</span>
                  </a>
                )}
                {community.website && (
                  <a
                    href={community.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-400 hover:text-white hover:bg-zinc-800 border border-[rgba(245,245,245,0.14)] transition-colors text-xs font-medium"
                    aria-label="Website"
                  >
                    <IconGlobe className="w-5 h-5" />
                    <span className="truncate">Website</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-zinc-500 mb-3">Upcoming Events</h4>
              <div className="space-y-2">
                {upcomingEvents.map((event) => {
                  return (
                    <a
                      key={event.id}
                      href={event.eventUrl || '#'}
                      target={event.eventUrl ? '_blank' : undefined}
                      rel={event.eventUrl ? 'noopener noreferrer' : undefined}
                      className="block p-3 bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg hover:border-zinc-700 hover:bg-[rgba(245,245,245,0.08)] transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="text-sm font-medium text-white group-hover:text-red-400 transition-colors line-clamp-1">
                              {event.title}
                            </h5>
                            <span
                              className={`text-[10px] font-medium border px-1.5 py-0.5 rounded whitespace-nowrap transition-colors
                                ${
                                  event.locationType === 'online'
                                    ? 'border-zinc-700 text-zinc-400 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 group-hover:text-blue-400'
                                    : event.locationType === 'in-person'
                                    ? 'border-zinc-700 text-zinc-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 group-hover:text-emerald-400'
                                    : 'border-zinc-700 text-zinc-400 group-hover:bg-purple-500/10 group-hover:border-purple-500/30 group-hover:text-purple-400'
                                }
                              `}
                            >
                              {event.locationType === 'online'
                                ? 'Online'
                                : event.locationType === 'in-person'
                                ? 'In-Person'
                                : 'Hybrid'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>{formatDate(event.date)}</span>
                            {event.location && event.locationType !== 'online' && (
                              <>
                                <span className="text-zinc-600">•</span>
                                <span className="truncate">{event.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {event.eventUrl && (
                          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-400 transition-colors flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* View Full Details Link */}
          <div className="pt-4 border-t border-[rgba(245,245,245,0.08)]">
            <Link
              href={`/communities/${community.id}`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
            >
              <span>View Full Details</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

