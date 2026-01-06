'use client'

import React, { useState, useMemo } from 'react'
import { Calendar, Globe, MapPin, ArrowUpRight, Search, X as XIcon, Table2, CalendarDays, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react'
import { getCommunityEvents, type Community } from '@/data/communities'
import type { Event } from '@/data/events'
import EventsCalendarView from './EventsCalendarView'
import EventCard from './EventCard'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(time?: string): string {
  if (!time) return '—'
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

function getMonthKey(dateString: string): string {
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatMonth(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

type EventFilter = 'all' | 'upcoming' | 'past'
type LocationTypeFilter = 'all' | 'online' | 'in-person' | 'hybrid'
type ViewMode = 'table' | 'calendar'
type SortField = 'date' | 'title' | 'location' | 'type'
type SortDirection = 'asc' | 'desc'

export default function CommunityEventsSection({ community }: { community: Community }) {
  const [eventFilter, setEventFilter] = useState<EventFilter>('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [locationTypeFilter, setLocationTypeFilter] = useState<LocationTypeFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  
  const allEvents = getCommunityEvents(community)
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const upcomingEvents = allEvents.filter((event: Event) => {
    const eventDate = new Date(event.date)
    eventDate.setHours(0, 0, 0, 0)
    return eventDate >= now
  })

  const pastEvents = allEvents.filter((event: Event) => {
    const eventDate = new Date(event.date)
    eventDate.setHours(0, 0, 0, 0)
    return eventDate < now
  }).reverse() // Show most recent first

  // Filter events based on eventFilter (all/upcoming/past)
  const timeFilteredEvents = useMemo(() => {
    if (eventFilter === 'upcoming') return upcomingEvents
    if (eventFilter === 'past') return pastEvents
    return allEvents
  }, [eventFilter, upcomingEvents, pastEvents, allEvents])

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to ascending
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Apply search and location type filters
  const filteredAndSortedEvents = useMemo(() => {
    let result = timeFilteredEvents.filter((event) => {
      // Location type filter
      if (locationTypeFilter !== 'all' && event.locationType !== locationTypeFilter) {
        return false
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = (
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.tags.some(tag => tag.toLowerCase().includes(query)) ||
          event.location.toLowerCase().includes(query)
        )
        if (!matchesSearch) return false
      }
      
      return true
    })

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'location':
          comparison = a.location.localeCompare(b.location)
          break
        case 'type':
          comparison = a.locationType.localeCompare(b.locationType)
          break
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [timeFilteredEvents, searchQuery, locationTypeFilter, eventFilter, sortField, sortDirection])

  // Group events by month
  const groupEventsByMonth = (events: Event[]) => {
    const grouped = new Map<string, Event[]>()
    
    events.forEach(event => {
      const monthKey = getMonthKey(event.date)
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, [])
      }
      grouped.get(monthKey)!.push(event)
    })

    const sortedMonths = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b))
    
    return sortedMonths.map(([monthKey, monthEvents]) => ({
      monthKey,
      monthLabel: formatMonth(monthEvents[0].date),
      events: monthEvents,
    }))
  }

  const eventsByMonth = groupEventsByMonth(filteredAndSortedEvents)

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button 
      onClick={() => handleSort(field)}
      className="flex items-center gap-1.5 hover:text-white transition-colors group"
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ChevronUp className="w-3.5 h-3.5 text-red-500" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-red-500" />
        )
      ) : (
        <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50" />
      )}
    </button>
  )

  const locationTypeConfig: Record<Exclude<LocationTypeFilter, 'all'>, {
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

  const locationTypeFilters: { type: LocationTypeFilter; label: string }[] = [
    { type: 'all', label: 'All' },
    { type: 'online', label: 'Online' },
    { type: 'in-person', label: 'In-Person' },
    { type: 'hybrid', label: 'Hybrid' },
  ]

  const eventFilters: { type: EventFilter; label: string }[] = [
    { type: 'all', label: 'All' },
    { type: 'upcoming', label: 'Upcoming' },
    { type: 'past', label: 'Past' },
  ]

  const EventTableRow = ({ event }: { event: Event }) => {
    const config = locationTypeConfig[event.locationType]

    return (
      <tr className="hover:bg-[rgba(245,245,245,0.024)] transition-colors group">
        <td className="py-3 px-4">
          <div className="flex flex-col">
            <span className="text-sm text-white font-medium">
              {formatDate(event.date)}
            </span>
            {event.time && (
              <span className="text-xs text-zinc-500 mt-0.5">
                {formatTime(event.time)}
              </span>
            )}
          </div>
        </td>
        
        <td className="py-3 px-4">
          <div>
            <a
              href={event.eventUrl || '#'}
              className="text-sm text-white font-medium group-hover:text-red-400 transition-colors block"
              title={event.title}
            >
              {event.title}
            </a>
            {event.tags.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {event.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="text-[12px] px-1.5 py-0.5 rounded bg-[rgba(245,245,245,0.04)] text-zinc-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </td>
        
        <td className="py-3 px-4 hidden lg:table-cell">
          <div className="flex items-center gap-1.5 text-sm text-zinc-400">
            {event.locationType === 'online' ? (
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
            )}
            <span className="truncate max-w-[120px]" title={event.location}>
              {event.location}
            </span>
          </div>
        </td>
        
        <td className="py-3 px-4 hidden sm:table-cell">
          <span className={`inline-block text-xs font-medium border px-2 py-1 rounded ${config.bg} ${config.border} ${config.text}`}>
            {formatLocationType(event.locationType)}
          </span>
        </td>
        
        <td className="py-3 px-4 text-right">
          <a 
            href={event.registrationUrl || event.eventUrl || '#'}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-400 bg-[rgba(245,245,245,0.08)] group-hover:text-white group-hover:bg-red-500 rounded-full transition-colors"
          >
            View
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </td>
      </tr>
    )
  }

  return (
    <section>
      {/* Section Header */}
      <h2 className="text-lg font-semibold text-white mb-4">
        Events by {community.name}
      </h2>

      {/* Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Event Time Filters (All, Upcoming, Past) */}
          <div className="flex items-center gap-1">
            {eventFilters.map((filter) => {
              const isSelected = eventFilter === filter.type
              
              return (
                <button
                  key={filter.type}
                  onClick={() => {
                    setEventFilter(filter.type)
                    // Reset to default date sorting when changing time filter
                    setSortField('date')
                    setSortDirection('asc')
                  }}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md border ${
                    isSelected
                      ? 'bg-[rgba(245,245,245,0.08)] text-white border-transparent'
                      : 'text-zinc-500 hover:text-white hover:bg-[rgba(245,245,245,0.04)] border-transparent'
                  }`}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>

          {/* Search & View Toggle */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[rgba(245,245,245,0.08)] border border-[rgba(245,245,245,0.08)] rounded-md pl-9 pr-8 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-700 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[rgba(245,245,245,0.08)] rounded-md border border-[rgba(245,245,245,0.08)]">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[rgba(245,245,245,0.08)] text-white'
                    : 'text-zinc-500 hover:text-white'
                }`}
                title="Table View"
              >
                <Table2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-[rgba(245,245,245,0.08)] text-white'
                    : 'text-zinc-500 hover:text-white'
                }`}
                title="Calendar View"
              >
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-zinc-500 mt-4">
        {filteredAndSortedEvents.length} event{filteredAndSortedEvents.length !== 1 ? 's' : ''}
        {(searchQuery || locationTypeFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('')
              setLocationTypeFilter('all')
            }}
            className="ml-2 text-red-500 hover:text-red-400"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="mt-6">
          <EventsCalendarView events={filteredAndSortedEvents} />
        </div>
      )}

      {/* Mobile Cards View */}
      {viewMode === 'table' && (
        <>
          {filteredAndSortedEvents.length === 0 ? (
            <div className="md:hidden mt-6 py-12 text-center">
              <p className="text-zinc-500 text-sm">No events found</p>
              {(searchQuery || locationTypeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setLocationTypeFilter('all')
                  }}
                  className="text-sm text-red-500 hover:text-red-400 mt-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="md:hidden mt-6 space-y-6">
              {eventsByMonth.map(({ monthKey, monthLabel, events: monthEvents }) => (
                <div key={monthKey}>
                  {/* Month Header */}
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Calendar className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-semibold text-white">{monthLabel}</span>
                  </div>
                  {/* Event Cards */}
                  <div className="grid grid-cols-1 gap-4">
                    {monthEvents.map((event, index) => (
                      <EventCard key={event.id} event={event} index={index} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Desktop Table View */}
      {viewMode === 'table' && (
        <div className="hidden md:block mt-6 overflow-x-auto -mx-6 md:-mx-12 px-6 md:px-12">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-[rgba(245,245,245,0.04)] border-b border-[rgba(245,245,245,0.08)]">
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide min-w-[120px]">
                  <SortButton field="date">DATE</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide min-w-[250px]">
                  <SortButton field="title">EVENT</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide min-w-[150px] hidden lg:table-cell">
                  <SortButton field="location">LOCATION</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide min-w-[100px] hidden sm:table-cell">
                  <SortButton field="type">TYPE</SortButton>
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide w-24 min-w-[100px]">
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(245,245,245,0.04)]">
              {filteredAndSortedEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <p className="text-zinc-500 text-sm">No events found</p>
                    {(searchQuery || locationTypeFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          setLocationTypeFilter('all')
                        }}
                        className="text-sm text-red-500 hover:text-red-400 mt-2"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                eventsByMonth.map(({ monthKey, monthLabel, events: monthEvents }) => (
                  <React.Fragment key={monthKey}>
                    {/* Month Header Row */}
                    <tr className="bg-[rgba(245,245,245,0.04)]">
                      <td colSpan={5} className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-zinc-500" />
                          <span className="text-sm font-semibold text-white">{monthLabel}</span>
                        </div>
                      </td>
                    </tr>
                    {/* Events for this month */}
                    {monthEvents.map((event) => (
                      <EventTableRow key={event.id} event={event} />
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
