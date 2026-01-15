'use client'

import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon, MapPin, Globe, ArrowUpRight, Clock } from 'lucide-react'
import { type Event } from '@/data/events'

interface EventsCalendarViewProps {
  events: Event[]
  onEventClick?: (event: Event) => void
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTime(time?: string): string {
  if (!time) return ''
  return time
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
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

export default function EventsCalendarView({ events, onEventClick }: EventsCalendarViewProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Filter to only future events
  const futureEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate.getTime() >= today.getTime()
    })
  }, [events])

  // Find first event date to start calendar from
  const firstEventDate = useMemo(() => {
    if (futureEvents.length === 0) return today
    const dates = futureEvents.map(e => new Date(e.date))
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())))
    return earliest < today ? today : earliest
  }, [futureEvents, today])

  const [currentMonth, setCurrentMonth] = useState(firstEventDate.getMonth())
  const [currentYear, setCurrentYear] = useState(firstEventDate.getFullYear())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)

  // Auto-select today or first upcoming event date
  useEffect(() => {
    if (!selectedDate && futureEvents.length > 0) {
      // Check if today has events
      const todayKey = today.toISOString().split('T')[0]
      const todayEvents = futureEvents.filter(e => {
        const eventDate = new Date(e.date)
        eventDate.setHours(0, 0, 0, 0)
        return eventDate.toISOString().split('T')[0] === todayKey
      })

      if (todayEvents.length > 0) {
        setSelectedDate(today)
        setCurrentMonth(today.getMonth())
        setCurrentYear(today.getFullYear())
      } else {
        // Select first upcoming event date
        const firstEvent = futureEvents[0]
        const firstDate = new Date(firstEvent.date)
        firstDate.setHours(0, 0, 0, 0)
        setSelectedDate(firstDate)
        setCurrentMonth(firstDate.getMonth())
        setCurrentYear(firstDate.getFullYear())
      }
    }
  }, [futureEvents, today, selectedDate])

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, Event[]>()
    futureEvents.forEach(event => {
      const date = new Date(event.date)
      date.setHours(0, 0, 0, 0)
      const dateKey = date.toISOString().split('T')[0]
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(event)
    })
    return grouped
  }, [futureEvents])

  // Get upcoming events for quick overview (next 7 days)
  const upcomingEvents = useMemo(() => {
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return futureEvents
      .filter(event => {
        const eventDate = new Date(event.date)
        eventDate.setHours(0, 0, 0, 0)
        return eventDate.getTime() <= nextWeek.getTime()
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5) // Top 5 upcoming
  }, [futureEvents, today])

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return []
    const dateKey = selectedDate.toISOString().split('T')[0]
    return eventsByDate.get(dateKey) || []
  }, [selectedDate, eventsByDate])

  // Get events for hovered date (for tooltip)
  const hoveredDateEvents = useMemo(() => {
    if (!hoveredDate) return []
    const dateKey = hoveredDate.toISOString().split('T')[0]
    return eventsByDate.get(dateKey) || []
  }, [hoveredDate, eventsByDate])

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const handleMonthYearChange = (month: number, year: number) => {
    setCurrentMonth(month)
    setCurrentYear(year)
  }

  // Generate available months/years (current year and next 2 years)
  const availableYears = useMemo(() => {
    const years = []
    const currentYearVal = new Date().getFullYear()
    for (let y = currentYearVal; y <= currentYearVal + 2; y++) {
      years.push(y)
    }
    return years
  }, [])

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const goToToday = () => {
    const now = new Date()
    setCurrentMonth(now.getMonth())
    setCurrentYear(now.getFullYear())
    setSelectedDate(now)
  }

  const goToNextEvent = () => {
    if (futureEvents.length === 0) return
    const nextEvent = futureEvents[0]
    const nextDate = new Date(nextEvent.date)
    nextDate.setHours(0, 0, 0, 0)
    setCurrentMonth(nextDate.getMonth())
    setCurrentYear(nextDate.getFullYear())
    setSelectedDate(nextDate)
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Generate calendar days
  const calendarDays: (Date | null)[] = []
  
  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(currentYear, currentMonth, day))
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const dateKey = date.toISOString().split('T')[0]
    const dayEvents = eventsByDate.get(dateKey)
    if (dayEvents && dayEvents.length > 0 && onEventClick && dayEvents.length === 1) {
      onEventClick(dayEvents[0])
    }
  }

  const locationTypeConfig = {
    'online': { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-500' },
    'in-person': { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    'hybrid': { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-500' },
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Events Quick Overview */}
      {upcomingEvents.length > 0 && (
        <div className="border border-[rgba(245,245,245,0.08)] rounded-lg p-4 bg-[rgba(245,245,245,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500" />
              Upcoming Events (Next 7 Days)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {upcomingEvents.map(event => {
              const eventDate = new Date(event.date)
              const config = locationTypeConfig[event.locationType]
              return (
                <a
                  key={event.id}
                  href={event.eventUrl || '#'}
                  onClick={(e) => {
                    if (onEventClick) {
                      e.preventDefault()
                      onEventClick(event)
                    }
                  }}
                  className="block p-2 bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded hover:border-zinc-700 hover:bg-[rgba(245,245,245,0.08)] transition-all group"
                >
                  <div className="text-xs text-zinc-500 mb-1">{formatDate(event.date)}</div>
                  <div className="text-sm font-medium text-white group-hover:text-red-400 transition-colors truncate">
                    {event.title}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {event.locationType === 'online' ? (
                      <Globe className="w-3 h-3 text-zinc-500" />
                    ) : (
                      <MapPin className="w-3 h-3 text-zinc-500" />
                    )}
                    <span className="text-xs text-zinc-500 truncate">{event.location}</span>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-full bg-[rgba(245,245,245,0.08)] hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {/* Month/Year Picker */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={currentMonth}
                onChange={(e) => handleMonthYearChange(Number(e.target.value), currentYear)}
                className="bg-[rgba(245,245,245,0.08)] border border-[rgba(245,245,245,0.08)] rounded-full pl-3 pr-8 py-1.5 text-sm text-white focus:border-zinc-700 focus:outline-none cursor-pointer appearance-none"
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>{month}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={currentYear}
                onChange={(e) => handleMonthYearChange(currentMonth, Number(e.target.value))}
                className="bg-[rgba(245,245,245,0.08)] border border-[rgba(245,245,245,0.08)] rounded-full pl-3 pr-8 py-1.5 text-sm text-white focus:border-zinc-700 focus:outline-none cursor-pointer appearance-none"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-full bg-[rgba(245,245,245,0.08)] hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToNextEvent}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white bg-[rgba(245,245,245,0.08)] hover:bg-zinc-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={futureEvents.length === 0}
          >
            Next Event
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white bg-[rgba(245,245,245,0.08)] hover:bg-zinc-700 rounded-full transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-[rgba(245,245,245,0.08)] rounded-lg overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-[rgba(245,245,245,0.04)] border-b border-[rgba(245,245,245,0.08)]">
          {weekDays.map(day => (
            <div
              key={day}
              className="py-3 px-2 text-center text-xs font-medium text-zinc-500 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            if (!date) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[120px] md:min-h-[140px] border-r border-b border-[rgba(245,245,245,0.08)] bg-[rgba(245,245,245,0.02)]"
                />
              )
            }

            const dateKey = date.toISOString().split('T')[0]
            const dayEvents = eventsByDate.get(dateKey) || []
            const isToday = date.getTime() === today.getTime()
            const isSelected = selectedDate && date.getTime() === selectedDate.getTime()
            const isHovered = hoveredDate && date.getTime() === hoveredDate.getTime()
            const isPast = date.getTime() < today.getTime()

            // Past dates - show but disabled
            if (isPast) {
              return (
                <div
                  key={`past-${index}`}
                  className="min-h-[120px] md:min-h-[140px] border-r border-b border-[rgba(245,245,245,0.08)] bg-[rgba(245,245,245,0.02)] opacity-30 cursor-not-allowed"
                >
                  <div className="p-2">
                    <span className="text-sm font-medium text-zinc-600">{date.getDate()}</span>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={dateKey}
                className="relative group"
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                <button
                  onClick={() => handleDateClick(date)}
                  className={`w-full min-h-[120px] md:min-h-[140px] p-2 border-r border-b border-[rgba(245,245,245,0.08)] text-left hover:bg-[rgba(245,245,245,0.04)] transition-colors ${
                    isSelected ? 'bg-red-500/10 border-red-500/30' : ''
                  } ${isHovered ? 'bg-[rgba(245,245,245,0.06)]' : ''}`}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm md:text-base font-medium ${
                        isToday
                          ? 'w-6 h-6 md:w-7 md:h-7 rounded-full bg-red-500 text-white flex items-center justify-center'
                          : isSelected
                          ? 'text-red-400'
                          : 'text-white'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-xs text-zinc-500 bg-[rgba(245,245,245,0.08)] px-1.5 py-0.5 rounded">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event List - Show up to 3 events */}
                  <div className="space-y-1 mt-1">
                    {dayEvents.slice(0, 3).map((event) => {
                      const config = locationTypeConfig[event.locationType]
                      return (
                        <div
                          key={event.id}
                          className={`text-xs px-1.5 py-0.5 rounded truncate border ${config.bg} ${config.border} ${config.text} cursor-pointer hover:opacity-80 transition-opacity`}
                          title={event.title}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onEventClick) {
                              onEventClick(event)
                            } else if (event.eventUrl) {
                              window.open(event.eventUrl, '_blank')
                            }
                          }}
                        >
                          {event.title}
                        </div>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-zinc-500 px-1.5">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </button>

                {/* Hover Tooltip */}
                {isHovered && hoveredDateEvents.length > 0 && (
                  <div className="absolute z-50 left-0 top-full mt-1 w-64 p-3 bg-[#1a1a2e] border border-[rgba(245,245,245,0.08)] rounded-lg shadow-xl">
                    <div className="text-xs font-semibold text-white mb-2">
                      {formatDate(date.toISOString())} • {hoveredDateEvents.length} event{hoveredDateEvents.length !== 1 ? 's' : ''}
                    </div>
                    <div className="space-y-2">
                      {hoveredDateEvents.slice(0, 3).map(event => {
                        const config = locationTypeConfig[event.locationType]
                        return (
                          <div key={event.id} className="text-xs">
                            <div className="font-medium text-white truncate">{event.title}</div>
                            <div className="text-zinc-500 truncate">{event.location}</div>
                          </div>
                        )
                      })}
                      {hoveredDateEvents.length > 3 && (
                        <div className="text-xs text-zinc-500">+{hoveredDateEvents.length - 3} more events</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>


      {/* No events message */}
      {selectedDate && selectedDateEvents.length === 0 && (
        <div className="border border-[rgba(245,245,245,0.08)] rounded-lg p-8 text-center bg-[rgba(245,245,245,0.04)]">
          <CalendarIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">No events on {formatDate(selectedDate.toISOString())}</p>
        </div>
      )}

      {/* No future events */}
      {futureEvents.length === 0 && (
        <div className="border border-[rgba(245,245,245,0.08)] rounded-lg p-12 text-center bg-[rgba(245,245,245,0.04)]">
          <CalendarIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-white mb-2">No upcoming events</p>
          <p className="text-sm text-zinc-500">Check back later for new events</p>
        </div>
      )}
    </div>
  )
}
