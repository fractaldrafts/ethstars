'use client'

import { useState, useMemo } from 'react'
import { 
  Search, ChevronDown, ChevronUp, ArrowUpRight, 
  X as XIcon, ArrowUpDown, MapPin, Calendar, Globe, Building2, Table2, CalendarDays, SlidersHorizontal
} from 'lucide-react'
import { IconBrandX, IconBrandDiscord, IconBrandTelegram } from '@tabler/icons-react'
import Link from 'next/link'
import { events, type Event } from '@/data/events'
import EventsCalendarView from './EventsCalendarView'

type SortField = 'date' | 'title' | 'organizer' | 'location'
type SortDirection = 'asc' | 'desc'
type ViewMode = 'table' | 'calendar'
type LocationTypeFilter = 'all' | 'online' | 'in-person' | 'hybrid'
type DateFilter = 'all' | 'this-month' | 'next-month'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateRange(startDate: string, endDate?: string): string {
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : null
  
  if (!end || start.getTime() === end.getTime()) {
    // Single day event
    return formatDate(startDate)
  }
  
  // Check if same month
  if (start.getMonth() === end!.getMonth() && start.getFullYear() === end!.getFullYear()) {
    // Same month: "Sep 1-5, 2026"
    const startDay = start.getDate()
    const endDay = end!.getDate()
    const month = start.toLocaleDateString('en-US', { month: 'short' })
    const year = start.getFullYear()
    return `${month} ${startDay}-${endDay}, ${year}`
  } else {
    // Different months: "Sep 1 - Oct 5, 2026"
    const startFormatted = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endFormatted = end!.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startFormatted} - ${endFormatted}`
  }
}

function formatMonth(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function getMonthKey(dateString: string): string {
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function isEventInMonth(eventDate: string, targetYear: number, targetMonth: number): boolean {
  const event = new Date(eventDate)
  return event.getFullYear() === targetYear && event.getMonth() === targetMonth
}

function getThisMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

function getNextMonth(): { year: number; month: number } {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { year: nextMonth.getFullYear(), month: nextMonth.getMonth() }
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

export default function EventsTable() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [locationTypeFilter, setLocationTypeFilter] = useState<LocationTypeFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  const hasActiveFilters = searchQuery || locationTypeFilter !== 'all' || dateFilter !== 'all'

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedEvents = useMemo(() => {
    let result = events.filter((event) => {
      // Location type filter
      if (locationTypeFilter !== 'all' && event.locationType !== locationTypeFilter) {
        return false
      }
      
      // Date filter
      if (dateFilter !== 'all') {
        if (dateFilter === 'this-month') {
          const thisMonth = getThisMonth()
          if (!isEventInMonth(event.date, thisMonth.year, thisMonth.month)) {
            return false
          }
        } else if (dateFilter === 'next-month') {
          const nextMonth = getNextMonth()
          if (!isEventInMonth(event.date, nextMonth.year, nextMonth.month)) {
            return false
          }
        }
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = (
          event.title.toLowerCase().includes(query) ||
          event.organizer.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.tags.some(tag => tag.toLowerCase().includes(query)) ||
          event.location.toLowerCase().includes(query)
        )
        if (!matchesSearch) return false
      }
      
      return true
    })

    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'organizer':
          comparison = a.organizer.localeCompare(b.organizer)
          break
        case 'location':
          comparison = a.location.localeCompare(b.location)
          break
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [searchQuery, sortField, sortDirection, locationTypeFilter, dateFilter])

  // Group events by month
  const eventsByMonth = useMemo(() => {
    const grouped = new Map<string, Event[]>()
    
    filteredAndSortedEvents.forEach(event => {
      const monthKey = getMonthKey(event.date)
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, [])
      }
      grouped.get(monthKey)!.push(event)
    })

    // Sort months chronologically
    const sortedMonths = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b))
    
    return sortedMonths.map(([monthKey, monthEvents]) => ({
      monthKey,
      monthLabel: formatMonth(monthEvents[0].date),
      events: monthEvents,
    }))
  }, [filteredAndSortedEvents])

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

  const locationTypeFilters: { type: LocationTypeFilter; label: string }[] = [
    { type: 'all', label: 'All' },
    { type: 'online', label: 'Online' },
    { type: 'in-person', label: 'In-Person' },
    { type: 'hybrid', label: 'Hybrid' },
  ]

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

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Filters */}
          <div className="flex items-center gap-1 flex-nowrap sm:flex-wrap overflow-x-auto sm:overflow-x-visible -mx-6 px-6 sm:mx-0 sm:px-0 scrollbar-hide">
            {/* All Filter */}
            <button
              onClick={() => setLocationTypeFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-full border flex-shrink-0 ${
                locationTypeFilter === 'all'
                  ? 'bg-[rgba(245,245,245,0.08)] text-white border-transparent'
                  : 'text-zinc-500 hover:text-white hover:bg-[rgba(245,245,245,0.04)] border-transparent'
              }`}
            >
              All
            </button>
            
            {/* Date Filters */}
            <button
              onClick={() => setDateFilter(dateFilter === 'this-month' ? 'all' : 'this-month')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-full border flex-shrink-0 ${
                dateFilter === 'this-month'
                  ? 'bg-[rgba(245,245,245,0.08)] text-white border-transparent'
                  : 'text-zinc-500 hover:text-white hover:bg-[rgba(245,245,245,0.04)] border-transparent'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateFilter(dateFilter === 'next-month' ? 'all' : 'next-month')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-full border flex-shrink-0 ${
                dateFilter === 'next-month'
                  ? 'bg-[rgba(245,245,245,0.08)] text-white border-transparent'
                  : 'text-zinc-500 hover:text-white hover:bg-[rgba(245,245,245,0.04)] border-transparent'
              }`}
            >
              Next Month
            </button>
            
            {/* Location Type Filters (excluding All) */}
            {locationTypeFilters.filter(filter => filter.type !== 'all').map((filter) => {
              const isSelected = locationTypeFilter === filter.type
              const config = locationTypeConfig[filter.type as Exclude<LocationTypeFilter, 'all'>]

              return (
                <button
                  key={filter.type}
                  onClick={() => setLocationTypeFilter(filter.type)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-full border flex-shrink-0 ${
                    isSelected
                      ? `${config.bg} ${config.border} ${config.text}`
                      : 'text-zinc-500 hover:text-white hover:bg-[rgba(245,245,245,0.04)] border-transparent'
                  }`}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>

          {/* Search, Filter & View Toggle */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchQuery ? 'text-zinc-400' : 'text-zinc-500'}`} />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-full pl-9 pr-8 py-2 text-sm font-medium transition-colors ${
                  searchQuery
                    ? 'bg-[rgba(245,245,245,0.08)] border-zinc-700 text-white'
                    : 'bg-transparent border-[rgba(245,245,245,0.08)] text-zinc-500 placeholder-zinc-600 hover:text-white hover:border-zinc-700 focus:text-white focus:bg-[rgba(245,245,245,0.08)] focus:border-zinc-700'
                }`}
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
            
            {/* Filter Button */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full border transition-colors ${
                showAdvancedFilters || hasActiveFilters
                  ? 'bg-[rgba(245,245,245,0.08)] border-zinc-700 text-white'
                  : 'border-[rgba(245,245,245,0.08)] text-zinc-500 hover:text-white hover:border-zinc-700'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              )}
            </button>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[rgba(245,245,245,0.08)] rounded-full border border-[rgba(245,245,245,0.08)]">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-full transition-colors ${
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
                className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-full transition-colors ${
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
        
        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="p-4 bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg">
            <p className="text-sm text-zinc-500">Advanced filters coming soon...</p>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-zinc-500">
        {filteredAndSortedEvents.length} event{filteredAndSortedEvents.length !== 1 ? 's' : ''}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchQuery('')
              setLocationTypeFilter('all')
              setDateFilter('all')
            }}
            className="ml-2 text-red-500 hover:text-red-400"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <EventsCalendarView events={filteredAndSortedEvents} />
      )}

      {/* Events Table */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto -mx-6 md:-mx-12 px-6 md:px-12">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-[rgba(245,245,245,0.04)] border-b border-[rgba(245,245,245,0.08)]">
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide min-w-[250px]">
                <SortButton field="title">EVENT</SortButton>
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide min-w-[150px] hidden md:table-cell">
                <SortButton field="organizer">ORGANIZER</SortButton>
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide min-w-[150px] hidden lg:table-cell">
                <SortButton field="location">LOCATION</SortButton>
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide min-w-[150px] hidden sm:table-cell">
                TAGS
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide min-w-[100px] hidden md:table-cell">
                CONNECT
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide w-24 min-w-[100px]">
                
              </th>
            </tr>
          </thead>
            <tbody className="divide-y divide-[rgba(245,245,245,0.04)]">
            {filteredAndSortedEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <p className="text-zinc-500 text-sm">No events found</p>
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setLocationTypeFilter('all')
                        setDateFilter('all')
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
                <>
                  {/* Month Header Row */}
                  <tr key={`month-${monthKey}`} className="bg-[rgba(245,245,245,0.04)]">
                    <td colSpan={6} className="py-3 px-4">
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{monthLabel}</span>
                    </td>
                  </tr>
                  {/* Events for this month */}
                  {monthEvents.map((event) => (
                    <TableRow key={event.id} event={event} />
                  ))}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}

function TableRow({ event }: { event: Event }) {
  const placeholderEventLogo = `https://picsum.photos/seed/${encodeURIComponent(event.title)}/64/64`
  const placeholderOrganizerLogo = `https://picsum.photos/seed/${encodeURIComponent(event.organizer)}/64/64`
  const eventLogoSrc = event.image || event.organizerLogo || placeholderEventLogo
  const organizerLogoSrc = event.organizerLogo || placeholderOrganizerLogo

  return (
    <tr className="hover:bg-[rgba(245,245,245,0.024)] transition-colors group">
      {/* Event Title */}
      <td className="py-3 px-4">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(245,245,245,0.08)] overflow-hidden flex-shrink-0">
            <img
              src={eventLogoSrc}
              alt={event.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget
                if (target.src !== placeholderEventLogo) {
                  target.src = placeholderEventLogo
                } else {
                  target.onerror = null
                }
              }}
            />
          </div>
          <div className="min-w-0">
            <a
              href={event.eventUrl || '#'}
              className="text-sm text-white font-medium group-hover:text-red-400 transition-colors block"
              title={event.title}
            >
              {event.title}
            </a>
            {/* Date */}
            <div className="flex items-center gap-1.5 mt-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
              <span className="text-xs text-zinc-400 font-medium">
                {formatDateRange(event.date, event.endDate)}
                {event.time && ` • ${formatTime(event.time)}`}
              </span>
            </div>
          </div>
        </div>
      </td>
      
      {/* Organizer */}
      <td className="py-3 px-4 hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[rgba(245,245,245,0.08)] overflow-hidden flex-shrink-0">
            <img 
              src={organizerLogoSrc} 
              alt={event.organizer}
              className="w-full h-full object-cover"
              loading="lazy"
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
          <span className="text-sm text-zinc-400 truncate max-w-[120px]">
            {event.organizer}
          </span>
        </div>
      </td>
      
      {/* Location */}
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
      
      {/* Tags */}
      <td className="py-3 px-4 hidden sm:table-cell">
        <div className="flex flex-wrap gap-1.5">
          {event.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="text-[11px] md:text-[12px] font-medium text-zinc-500 bg-[rgba(245,245,245,0.04)] px-2 py-0.5 rounded whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
          {event.tags.length > 3 && (
            <span className="text-[11px] md:text-[12px] font-medium text-zinc-500">
              +{event.tags.length - 3}
            </span>
          )}
        </div>
      </td>
      
      {/* Connect */}
      <td className="py-3 px-4 hidden md:table-cell">
        <div className="flex items-center gap-1.5">
          {event.twitterUrl && (
            <a
              href={event.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="X (Twitter)"
            >
              <IconBrandX className="w-4 h-4" />
            </a>
          )}
          {event.farcasterUrl && (
            <a
              href={event.farcasterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Farcaster"
            >
              <svg className="w-4 h-[15px]" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.5894 3.27471H16.9894V0.719727H4.33135V3.27471H0.963379L1.71836 5.82969H2.35732V16.1647C2.03666 16.1648 1.77637 16.425 1.77637 16.7457V17.4418H1.66035C1.3398 17.4419 1.08031 17.7022 1.08027 18.0228V18.7197H7.5833V18.0228C7.58327 17.7021 7.32301 17.4418 7.00234 17.4418H6.88633V16.7457C6.88633 16.425 6.62605 16.1647 6.30537 16.1647H6.18936V10.4747H6.20781C6.41318 8.196 8.3282 6.40985 10.6604 6.40977C12.9926 6.40977 14.9075 8.19594 15.1129 10.4747H15.1313V16.1753C14.8663 16.2291 14.6673 16.4648 14.6673 16.7457V17.4418H14.5513C14.2306 17.4418 13.9703 17.7021 13.9703 18.0228V18.7197H20.4733V18.0228C20.4733 17.7022 20.2137 17.442 19.8933 17.4418H19.7764V16.7457C19.7764 16.4251 19.5169 16.1649 19.1963 16.1647V5.82969H19.8344L20.5894 3.27471Z" stroke="currentColor" strokeWidth="1.7"/>
              </svg>
            </a>
          )}
          {event.telegramUrl && (
            <a
              href={event.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Telegram"
            >
              <IconBrandTelegram className="w-4 h-4" />
            </a>
          )}
          {event.discordUrl && (
            <a
              href={event.discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Discord"
            >
              <IconBrandDiscord className="w-4 h-4" />
            </a>
          )}
          {!event.twitterUrl && !event.farcasterUrl && !event.telegramUrl && !event.discordUrl && (
            <span className="text-xs text-zinc-500">—</span>
          )}
        </div>
      </td>
      
      {/* Action */}
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

