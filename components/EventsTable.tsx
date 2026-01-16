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
import EventCard from './EventCard'

type SortField = 'date' | 'title' | 'organizer' | 'location'
type SortDirection = 'asc' | 'desc'
type ViewMode = 'table' | 'calendar'
type LocationTypeFilter = 'all' | 'online' | 'in-person' | 'hybrid'
type DateFilter = 'all' | 'this-month' | 'next-month' | 'next-3-months' | 'next-6-months' | 'this-year'
type DurationFilter = 'all' | 'single-day' | '2-3-days' | '4-7-days' | '1-2-weeks' | '2+weeks'

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

function isEventInDateRange(eventDate: string, filter: DateFilter): boolean {
  if (filter === 'all') return true
  
  const event = new Date(eventDate)
  const now = new Date()
  // Normalize dates to start of day for comparison
  const eventDateOnly = new Date(event.getFullYear(), event.getMonth(), event.getDate())
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const thisMonth = getThisMonth()
  const nextMonth = getNextMonth()
  
  switch (filter) {
    case 'this-month':
      return isEventInMonth(eventDate, thisMonth.year, thisMonth.month)
    case 'next-month':
      return isEventInMonth(eventDate, nextMonth.year, nextMonth.month)
    case 'next-3-months': {
      const threeMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())
      return eventDateOnly >= nowDateOnly && eventDateOnly <= threeMonthsFromNow
    }
    case 'next-6-months': {
      const sixMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate())
      return eventDateOnly >= nowDateOnly && eventDateOnly <= sixMonthsFromNow
    }
    case 'this-year':
      return event.getFullYear() === now.getFullYear() && eventDateOnly >= nowDateOnly
    default:
      return true
  }
}

function getEventDuration(event: Event): number {
  if (!event.endDate) return 1 // Single day event
  const start = new Date(event.date)
  const end = new Date(event.endDate)
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end days
  return diffDays
}

function isEventInDurationRange(event: Event, filter: DurationFilter): boolean {
  if (filter === 'all') return true
  
  const duration = getEventDuration(event)
  
  switch (filter) {
    case 'single-day':
      return duration === 1
    case '2-3-days':
      return duration >= 2 && duration <= 3
    case '4-7-days':
      return duration >= 4 && duration <= 7
    case '1-2-weeks':
      return duration >= 8 && duration <= 14
    case '2+weeks':
      return duration > 14
    default:
      return true
  }
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

function getOrganizerFromTitle(title: string): string {
  // Remove common event type suffixes
  const suffixes = [
    ' Hackathon', ' Conference', ' Summit', ' Week', ' Festival',
    ' Meetup', ' Workshop', ' Event', ' 2025', ' 2026', ' 2027',
    ' @Expo', ' Future Summit'
  ]
  
  let organizer = title
  for (const suffix of suffixes) {
    if (organizer.endsWith(suffix)) {
      organizer = organizer.slice(0, -suffix.length)
    }
  }
  
  // Remove location suffixes (e.g., " in Berlin", " 2026")
  organizer = organizer.replace(/\s+(in|at)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/i, '')
  organizer = organizer.replace(/\s+\d{4}$/, '')
  
  // If title starts with common prefixes, extract the main part
  if (organizer.startsWith('ETH')) {
    // For ETH events, use the main part (e.g., "ETHSafari" -> "ETHSafari", "ETHGlobal New York" -> "ETHGlobal")
    const parts = organizer.split(' ')
    if (parts.length > 1 && (parts[1].match(/^(New York|Mumbai|Lisbon|Tokyo|Cannes|Prague|Buenos Aires|New Delhi|Denver)$/i))) {
      return parts[0]
    }
  }
  
  // Take first meaningful part (before first space if it's a location)
  const parts = organizer.split(' ')
  if (parts.length > 1) {
    // Check if second part looks like a location (starts with capital, common city names)
    const commonLocations = ['New', 'San', 'Los', 'Las', 'Hong', 'São', 'Buenos', 'Mexico']
    if (commonLocations.some(loc => parts[1].startsWith(loc))) {
      return parts[0]
    }
  }
  
  return organizer || title
}

export default function EventsTable() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [locationTypeFilter, setLocationTypeFilter] = useState<LocationTypeFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Advanced filters
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all')
  
  const hasActiveFilters = searchQuery || locationTypeFilter !== 'all' || dateFilter !== 'all' || 
    selectedTags.length > 0 || selectedOrganizer !== 'all' || selectedLocation !== 'all' || durationFilter !== 'all'

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Get unique values for filters
  const allTags = useMemo(
    () => Array.from(new Set(events.flatMap(e => e.tags))).sort(),
    []
  )

  const allOrganizers = useMemo(
    () => {
      const organizers = events.map(e => e.organizer || getOrganizerFromTitle(e.title))
      return Array.from(new Set(organizers)).sort()
    },
    []
  )

  const allLocations = useMemo(
    () => {
      const locations = events.map(e => {
        // Extract city/country from location string
        const parts = e.location.split(',').map(p => p.trim())
        return parts[parts.length - 1] || e.location
      })
      return Array.from(new Set(locations)).sort()
    },
    []
  )

  const filteredAndSortedEvents = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    let result = events.filter((event) => {
      // Only show upcoming events (date >= today)
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      if (eventDate < now) {
        return false
      }
      
      // Location type filter
      if (locationTypeFilter !== 'all' && event.locationType !== locationTypeFilter) {
        return false
      }
      
      // Date filter
      if (!isEventInDateRange(event.date, dateFilter)) {
        return false
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const organizerName = event.organizer || getOrganizerFromTitle(event.title)
        const matchesSearch = (
          event.title.toLowerCase().includes(query) ||
          organizerName.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.tags.some(tag => tag.toLowerCase().includes(query)) ||
          event.location.toLowerCase().includes(query)
        )
        if (!matchesSearch) return false
      }
      
      // Tags filter
      if (selectedTags.length > 0) {
        const hasTag = selectedTags.some(tag => event.tags.includes(tag))
        if (!hasTag) return false
      }
      
      // Organizer filter
      if (selectedOrganizer !== 'all') {
        const organizerName = event.organizer || getOrganizerFromTitle(event.title)
        if (organizerName !== selectedOrganizer) {
          return false
        }
      }
      
      // Location filter
      if (selectedLocation !== 'all') {
        const eventLocationParts = event.location.split(',').map(p => p.trim())
        const eventLocation = eventLocationParts[eventLocationParts.length - 1] || event.location
        if (eventLocation !== selectedLocation) {
          return false
        }
      }
      
      // Duration filter
      if (!isEventInDurationRange(event, durationFilter)) {
        return false
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
          const organizerA = a.organizer || getOrganizerFromTitle(a.title)
          const organizerB = b.organizer || getOrganizerFromTitle(b.title)
          comparison = organizerA.localeCompare(organizerB)
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
  }, [searchQuery, sortField, sortDirection, locationTypeFilter, dateFilter, selectedTags, selectedOrganizer, selectedLocation, durationFilter])

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
            
            {/* View Mode Toggle - Desktop Only */}
            <div className="hidden md:flex items-center gap-1 p-1 bg-[rgba(245,245,245,0.08)] rounded-full border border-[rgba(245,245,245,0.08)]">
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
          <div className="p-4 bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Date Range</label>
                <div className="relative">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                    className="w-full bg-[rgba(245,245,245,0.08)] border border-[rgba(245,245,245,0.08)] rounded-full pl-3 pr-10 py-2 text-sm text-white focus:border-zinc-700 appearance-none"
                  >
                    <option value="all">Any time</option>
                    <option value="this-month">This Month</option>
                    <option value="next-month">Next Month</option>
                    <option value="next-3-months">Next 3 Months</option>
                    <option value="next-6-months">Next 6 Months</option>
                    <option value="this-year">This Year</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Duration</label>
                <div className="relative">
                  <select
                    value={durationFilter}
                    onChange={(e) => setDurationFilter(e.target.value as DurationFilter)}
                    className="w-full bg-[rgba(245,245,245,0.08)] border border-[rgba(245,245,245,0.08)] rounded-full pl-3 pr-10 py-2 text-sm text-white focus:border-zinc-700 appearance-none"
                  >
                    <option value="all">Any duration</option>
                    <option value="single-day">Single Day</option>
                    <option value="2-3-days">2-3 Days</option>
                    <option value="4-7-days">4-7 Days</option>
                    <option value="1-2-weeks">1-2 Weeks</option>
                    <option value="2+weeks">2+ Weeks</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Organizer */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Organizer</label>
                <div className="relative">
                  <select
                    value={selectedOrganizer}
                    onChange={(e) => setSelectedOrganizer(e.target.value)}
                    className="w-full bg-[rgba(245,245,245,0.08)] border border-[rgba(245,245,245,0.08)] rounded-full pl-3 pr-10 py-2 text-sm text-white focus:border-zinc-700 appearance-none"
                  >
                    <option value="all">Any organizer</option>
                    {allOrganizers.map(organizer => (
                      <option key={organizer} value={organizer}>{organizer}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Location</label>
                <div className="relative">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full bg-[rgba(245,245,245,0.08)] border border-[rgba(245,245,245,0.08)] rounded-full pl-3 pr-10 py-2 text-sm text-white focus:border-zinc-700 appearance-none"
                  >
                    <option value="all">Any location</option>
                    {allLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Event Tags */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Event Types & Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      )
                    }}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-[rgba(245,245,245,0.08)] text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex justify-end pt-2 border-t border-[rgba(245,245,245,0.08)]">
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setLocationTypeFilter('all')
                    setDateFilter('all')
                    setSelectedTags([])
                    setSelectedOrganizer('all')
                    setSelectedLocation('all')
                    setDurationFilter('all')
                  }}
                  className="text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
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
              setSelectedTags([])
              setSelectedOrganizer('all')
              setSelectedLocation('all')
            }}
            className="ml-2 text-red-500 hover:text-red-400"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Mobile Cards View */}
      {filteredAndSortedEvents.length === 0 ? (
        <div className="md:hidden py-12 text-center">
          <p className="text-zinc-500 text-sm">No events found</p>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchQuery('')
                setLocationTypeFilter('all')
                setDateFilter('all')
                setSelectedTags([])
                setSelectedOrganizer('all')
                setSelectedLocation('all')
              }}
              className="text-sm text-red-500 hover:text-red-400 mt-2"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="md:hidden grid grid-cols-1 gap-4">
          {filteredAndSortedEvents.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Calendar View - Desktop Only */}
      {viewMode === 'calendar' && (
        <div className="hidden md:block">
          <EventsCalendarView events={filteredAndSortedEvents} />
        </div>
      )}

      {/* Events Table - Desktop Only */}
      {viewMode === 'table' && (
        <div className="hidden md:block overflow-x-auto -mx-6 md:-mx-12 px-6 md:px-12">
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
                        setSelectedTags([])
                        setSelectedOrganizer('all')
                        setSelectedLocation('all')
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
                    <TableRow 
                      key={event.id} 
                      event={event} 
                      selectedTags={selectedTags}
                      onTagClick={(tag) => {
                        setSelectedTags(prev => 
                          prev.includes(tag) 
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        )
                      }}
                    />
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

function TableRow({ 
  event, 
  selectedTags, 
  onTagClick 
}: { 
  event: Event
  selectedTags: string[]
  onTagClick: (tag: string) => void
}) {
  const placeholderEventLogo = `https://picsum.photos/seed/${encodeURIComponent(event.title)}/64/64`
  const organizerName = event.organizer || getOrganizerFromTitle(event.title)
  const placeholderOrganizerLogo = `https://picsum.photos/seed/${encodeURIComponent(organizerName)}/64/64`
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
          {organizerLogoSrc && (
            <div className="w-6 h-6 rounded bg-[rgba(245,245,245,0.08)] overflow-hidden flex-shrink-0">
              <img 
                src={organizerLogoSrc} 
                alt={event.organizer || event.title}
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
          )}
          <span className="text-sm text-zinc-400 truncate max-w-[120px]" title={event.organizer || getOrganizerFromTitle(event.title)}>
            {event.organizer || getOrganizerFromTitle(event.title)}
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
          {event.tags.slice(0, 3).map((tag, index) => {
            const isSelected = selectedTags.includes(tag)
            return (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onTagClick(tag)
                }}
                className={`text-[11px] md:text-[12px] font-medium px-2 py-0.5 rounded whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    : 'text-zinc-500 bg-[rgba(245,245,245,0.04)] hover:text-zinc-400 hover:bg-[rgba(245,245,245,0.08)]'
                }`}
                title={isSelected ? `Remove ${tag} filter` : `Filter by ${tag}`}
              >
                {tag}
              </button>
            )
          })}
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

