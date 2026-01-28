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

function formatDateRange(startDate: string, endDate?: string): string {
  if (!endDate) return formatDate(startDate)
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (start.getTime() === end.getTime()) return formatDate(startDate)
  
  // Same month
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}`
  }
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function getEventDuration(event: Event): number {
  if (!event.endDate) return 1
  const start = new Date(event.date)
  const end = new Date(event.endDate)
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

function formatDuration(days: number): string {
  if (days === 1) return '1 day'
  if (days < 7) return `${days} days`
  if (days === 7) return '1 week'
  if (days < 14) return `${days} days`
  const weeks = Math.floor(days / 7)
  return `${weeks}+ weeks`
}

// Check if a date falls within an event's duration
function isDateInEvent(date: Date, event: Event): boolean {
  const eventStart = new Date(event.date)
  eventStart.setHours(0, 0, 0, 0)
  const eventEnd = event.endDate ? new Date(event.endDate) : eventStart
  eventEnd.setHours(23, 59, 59, 999)
  
  const checkDate = new Date(date)
  checkDate.setHours(12, 0, 0, 0)
  
  return checkDate >= eventStart && checkDate <= eventEnd
}

// Get position of date within event (start, middle, end, single)
function getDatePositionInEvent(date: Date, event: Event): 'start' | 'middle' | 'end' | 'single' {
  const duration = getEventDuration(event)
  if (duration === 1) return 'single'
  
  const eventStart = new Date(event.date)
  eventStart.setHours(0, 0, 0, 0)
  const eventEnd = event.endDate ? new Date(event.endDate) : eventStart
  eventEnd.setHours(0, 0, 0, 0)
  
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  if (checkDate.getTime() === eventStart.getTime()) return 'start'
  if (checkDate.getTime() === eventEnd.getTime()) return 'end'
  return 'middle'
}

// Check if event continues from previous day (for week boundary handling)
function eventContinuesFromPrevDay(date: Date, event: Event, isFirstDayOfWeek: boolean): boolean {
  const eventStart = new Date(event.date)
  eventStart.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  return checkDate.getTime() > eventStart.getTime()
}

// Check if event continues to next day (for week boundary handling)
function eventContinuesToNextDay(date: Date, event: Event, isLastDayOfWeek: boolean): boolean {
  if (!event.endDate) return false
  const eventEnd = new Date(event.endDate)
  eventEnd.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  return checkDate.getTime() < eventEnd.getTime()
}

export default function EventsCalendarView({ events, onEventClick }: EventsCalendarViewProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Filter to only future events
  const futureEvents = useMemo(() => {
    return events.filter(event => {
      const eventEnd = event.endDate ? new Date(event.endDate) : new Date(event.date)
      eventEnd.setHours(23, 59, 59, 999)
      return eventEnd.getTime() >= today.getTime()
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
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [currentEventIndex, setCurrentEventIndex] = useState<number | null>(null) // Last navigated event index
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number; cellRect: DOMRect } | null>(null)
  const [showPopup, setShowPopup] = useState(false)

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Check if click is outside the popup and calendar cells
      if (showPopup && !target.closest('[data-date-popup]') && !target.closest('[data-calendar-cell]')) {
        setShowPopup(false)
        setSelectedDate(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPopup])

  // Close popup when month changes
  useEffect(() => {
    setShowPopup(false)
  }, [currentMonth, currentYear])

  // Get events for a specific date (including multi-day events that span this date)
  const getEventsForDate = (date: Date): Event[] => {
    return futureEvents.filter(event => isDateInEvent(date, event))
  }

  // Get upcoming events for quick overview (next 7 days)
  const upcomingEvents = useMemo(() => {
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return futureEvents
      .filter(event => {
        const eventStart = new Date(event.date)
        eventStart.setHours(0, 0, 0, 0)
        return eventStart.getTime() <= nextWeek.getTime()
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
  }, [futureEvents, today])

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return []
    return getEventsForDate(selectedDate)
  }, [selectedDate, futureEvents])

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
    // Reset event navigation so Next Event goes back to the first event
    setCurrentEventIndex(null)
  }

  // Sort events by date for consistent cycling
  const sortedFutureEvents = useMemo(() => {
    return [...futureEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [futureEvents])

  const goToNextEvent = () => {
    if (sortedFutureEvents.length === 0) return

    // Determine which event to navigate to next
    const targetIndex = currentEventIndex === null ? 0 : Math.min(currentEventIndex + 1, sortedFutureEvents.length - 1)
    const event = sortedFutureEvents[targetIndex]
    const eventDate = new Date(event.date)
    eventDate.setHours(0, 0, 0, 0)
    
    // Navigate to the event's month and select its date
    setCurrentMonth(eventDate.getMonth())
    setCurrentYear(eventDate.getFullYear())
    setSelectedDate(eventDate)

    // Remember that we're now focused on this event
    setCurrentEventIndex(targetIndex)
  }

  const goToPrevEvent = () => {
    if (sortedFutureEvents.length === 0 || currentEventIndex === null || currentEventIndex === 0) return

    const targetIndex = currentEventIndex - 1
    const event = sortedFutureEvents[targetIndex]
    const eventDate = new Date(event.date)
    eventDate.setHours(0, 0, 0, 0)

    setCurrentMonth(eventDate.getMonth())
    setCurrentYear(eventDate.getFullYear())
    setSelectedDate(eventDate)

    setCurrentEventIndex(targetIndex)
  }

  // Get the next event name for button tooltip
  const nextEventName = sortedFutureEvents.length > 0 
    ? sortedFutureEvents[currentEventIndex === null ? 0 : Math.min(currentEventIndex + 1, sortedFutureEvents.length - 1)]?.title 
    : null

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  // Generate calendar days including previous and next month dates
  const calendarDays: Date[] = []
  
  // Add days from previous month to fill the first week
  if (firstDay > 0) {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)
    for (let i = firstDay - 1; i >= 0; i--) {
      calendarDays.push(new Date(prevYear, prevMonth, daysInPrevMonth - i))
    }
  }
  
  // Add days from current month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(currentYear, currentMonth, day))
  }
  
  // Add days from next month to complete the last week only
  const totalDaysSoFar = calendarDays.length
  const remainingInWeek = totalDaysSoFar % 7
  if (remainingInWeek > 0) {
    const daysToAdd = 7 - remainingInWeek
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear
    for (let day = 1; day <= daysToAdd; day++) {
      calendarDays.push(new Date(nextYear, nextMonth, day))
    }
  }
  
  // Helper to check if a date is in the current month
  const isCurrentMonth = (date: Date) => date.getMonth() === currentMonth && date.getFullYear() === currentYear

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const handleDateClick = (date: Date, e: React.MouseEvent<HTMLDivElement>) => {
    const events = getEventsForDate(date)
    const cellElement = e.currentTarget
    const cellRect = cellElement.getBoundingClientRect()
    
    // If clicking the same date, toggle popup
    if (selectedDate && date.getTime() === selectedDate.getTime()) {
      setShowPopup(!showPopup)
      if (showPopup) {
        setSelectedDate(null)
      }
      return
    }
    
    // If no events, just select the date without popup
    if (events.length === 0) {
      setSelectedDate(date)
      setShowPopup(false)
      return
    }
    
    setSelectedDate(date)
    setPopupPosition({ x: e.clientX, y: e.clientY, cellRect })
    setShowPopup(true)
  }

  const locationTypeConfig = {
    'online': { 
      bg: 'bg-blue-500/20', 
      bgSolid: 'bg-blue-500/30',
      border: 'border-blue-500/30', 
      text: 'text-blue-400', 
      dot: 'bg-blue-500',
      hover: 'hover:bg-blue-500/40'
    },
    'in-person': { 
      bg: 'bg-emerald-500/20', 
      bgSolid: 'bg-emerald-500/30',
      border: 'border-emerald-500/30', 
      text: 'text-emerald-400', 
      dot: 'bg-emerald-500',
      hover: 'hover:bg-emerald-500/40'
    },
    'hybrid': { 
      bg: 'bg-purple-500/20', 
      bgSolid: 'bg-purple-500/30',
      border: 'border-purple-500/30', 
      text: 'text-purple-400', 
      dot: 'bg-purple-500',
      hover: 'hover:bg-purple-500/40'
    },
  }

  // Compute consistent event slot assignments for the entire month
  // This ensures multi-day events maintain the same vertical position across all days
  const eventSlotAssignments = useMemo(() => {
    const assignments = new Map<string, number>()
    
    // Get all multi-day events sorted by start date, then by duration (longer first)
    const multiDayEvents = futureEvents
      .filter(e => getEventDuration(e) > 1)
      .sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime()
        if (dateCompare !== 0) return dateCompare
        return getEventDuration(b) - getEventDuration(a) // Longer events first
      })
    
    // Assign slots to each event
    multiDayEvents.forEach(event => {
      // Find the first available slot
      let slot = 0
      while (true) {
        let slotAvailable = true
        // Check if this slot conflicts with any already-assigned event
        for (const [assignedId, assignedSlot] of Array.from(assignments.entries())) {
          if (assignedSlot !== slot) continue
          const assignedEvent = futureEvents.find(e => e.id === assignedId)
          if (!assignedEvent) continue
          
          // Check for date overlap
          const aStart = new Date(event.date).getTime()
          const aEnd = event.endDate ? new Date(event.endDate).getTime() : aStart
          const bStart = new Date(assignedEvent.date).getTime()
          const bEnd = assignedEvent.endDate ? new Date(assignedEvent.endDate).getTime() : bStart
          
          if (aStart <= bEnd && aEnd >= bStart) {
            slotAvailable = false
            break
          }
        }
        if (slotAvailable) break
        slot++
      }
      assignments.set(event.id, slot)
    })
    
    return assignments
  }, [futureEvents])

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Navigation Chevrons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-[rgba(245,245,245,0.08)] hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-[rgba(245,245,245,0.08)] hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Month/Year Selectors */}
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
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-zinc-500">In-Person</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-zinc-500">Online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="text-zinc-500">Hybrid</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sortedFutureEvents.length > 0 && currentEventIndex !== null && (
              <button
                onClick={goToPrevEvent}
                className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-[rgba(245,245,245,0.08)] hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                aria-label="Previous event"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={goToNextEvent}
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white bg-[rgba(245,245,245,0.08)] hover:bg-zinc-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={sortedFutureEvents.length === 0}
              title={nextEventName ? `Go to: ${nextEventName}` : undefined}
            >
              Next Event
              {sortedFutureEvents.length > 1 && (
                <span className="ml-1 text-zinc-500">
                  ({currentEventIndex === null ? 1 : currentEventIndex + 1}/{sortedFutureEvents.length})
                </span>
              )}
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white bg-[rgba(245,245,245,0.08)] hover:bg-zinc-700 rounded-full transition-colors"
            >
              Today
            </button>
          </div>
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
        <div className="grid grid-cols-7 relative">
          {calendarDays.map((date, index) => {
            const dayEvents = getEventsForDate(date)
            const isToday = date.getTime() === today.getTime()
            const isSelected = selectedDate && date.getTime() === selectedDate.getTime()
            const isPast = date.getTime() < today.getTime()
            const isOtherMonth = !isCurrentMonth(date)
            const dayOfWeek = index % 7
            const isFirstOfWeek = dayOfWeek === 0
            const isLastOfWeek = dayOfWeek === 6

            // Separate multi-day and single-day events for proper stacking
            const multiDayEvents = dayEvents.filter(e => getEventDuration(e) > 1)
            const singleDayEvents = dayEvents.filter(e => getEventDuration(e) === 1)

            // Sort multi-day events by start date for consistent positioning
            multiDayEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

            // Past dates or other month dates that are past
            if (isPast || isOtherMonth) {
              return (
                <div
                  key={date.toISOString()}
                  data-calendar-cell
                  className={`relative min-h-[100px] md:min-h-[120px] border-r border-b border-[rgba(245,245,245,0.08)] transition-colors overflow-visible ${
                    isOtherMonth 
                      ? 'bg-[rgba(0,0,0,0.2)]' 
                      : 'bg-[rgba(245,245,245,0.02)]'
                  } ${isPast ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={(e) => !isPast && handleDateClick(date, e)}
                  onMouseEnter={() => setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  <div className="p-1.5 md:p-2 flex items-center justify-between">
                    <span className={`text-sm font-medium ${isOtherMonth ? 'text-zinc-600' : 'text-zinc-600'}`}>
                      {date.getDate()}
                    </span>
                  </div>
                  
                  {/* Show events even on other month days, but with reduced opacity */}
                  <div className={isOtherMonth && !isPast ? 'opacity-60' : 'opacity-40'}>
                    {/* Multi-day event bars */}
                    {multiDayEvents.slice(0, 2).map((event) => {
                      const position = getDatePositionInEvent(date, event)
                      const config = locationTypeConfig[event.locationType]
                      const duration = getEventDuration(event)
                      const slot = eventSlotAssignments.get(event.id) ?? 0
                      
                      const isStart = position === 'start'
                      const isEnd = position === 'end'
                      const isSingle = position === 'single'
                      
                      const isFirstOfMonth = date.getDate() === 1
                      const segmentStart = isStart || isSingle || isFirstOfWeek || isFirstOfMonth
                      const segmentEnd = isEnd || isSingle || isLastOfWeek
                      
                      const roundLeft = isStart || isSingle
                      const roundRight = isEnd || isSingle
                      
                      // Only show title at actual start or week boundaries, not month boundaries
                      const shouldShowTitle = isStart || isSingle || isFirstOfWeek
                      
                      const leftPos = segmentStart ? '4px' : '-1px'
                      const rightPos = segmentEnd ? '4px' : '-1px'
                      const topOffset = 32 + (slot * 30)
                      
                      return (
                        <div
                          key={event.id}
                          className={`absolute h-[26px] ${config.bgSolid} ${config.text} transition-all cursor-pointer`}
                          style={{
                            zIndex: 20 - slot,
                            top: `${topOffset}px`,
                            left: leftPos,
                            right: rightPos,
                            borderTopLeftRadius: roundLeft ? '9999px' : '0',
                            borderBottomLeftRadius: roundLeft ? '9999px' : '0',
                            borderTopRightRadius: roundRight ? '9999px' : '0',
                            borderBottomRightRadius: roundRight ? '9999px' : '0',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (event.eventUrl) {
                              window.open(event.eventUrl, '_blank')
                            }
                          }}
                          onMouseEnter={(e) => {
                            setHoveredEvent(event)
                            setMousePosition({ x: e.clientX, y: e.clientY })
                          }}
                          onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
                          onMouseLeave={() => setHoveredEvent(null)}
                        >
                          {shouldShowTitle && (
                            <div className="flex items-center gap-2 px-2 h-full whitespace-nowrap overflow-hidden">
                              {(event.organizerLogo || event.image) && (
                                <img 
                                  src={event.organizerLogo || event.image} 
                                  alt=""
                                  className="w-[18px] h-[18px] rounded flex-shrink-0 object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              )}
                              <span className="text-[11px] font-medium truncate">
                                {event.title}
                              </span>
                              {duration > 1 && (
                                <span className="text-[10px] opacity-60 flex-shrink-0">
                                  ({duration}d)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    
                    {/* "+N more" for past/other month cells */}
                    {dayEvents.length > 2 && (
                      <div 
                        className="absolute left-1 text-[11px] text-zinc-600"
                        style={{ top: `${32 + Math.min(multiDayEvents.length, 2) * 30 + 4}px` }}
                      >
                        {dayEvents.length - Math.min(multiDayEvents.length, 2)} more
                      </div>
                    )}
                  </div>
                </div>
              )
            }

            return (
              <div
                key={date.toISOString()}
                data-calendar-cell
                className={`relative min-h-[100px] md:min-h-[120px] border-r border-b border-[rgba(245,245,245,0.08)] ${
                  isSelected ? 'bg-red-500/5' : 'hover:bg-[rgba(245,245,245,0.02)]'
                } transition-colors cursor-pointer overflow-visible`}
                onClick={(e) => handleDateClick(date, e)}
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                {/* Day Header */}
                <div className="relative z-20 p-1.5 md:p-2 flex items-center justify-between pointer-events-none">
                  <span
                    className={`text-sm font-medium inline-flex items-center justify-center ${
                      isToday
                        ? 'w-6 h-6 rounded-full bg-red-500 text-white'
                        : isSelected
                        ? 'text-red-400'
                        : 'text-zinc-400'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </div>

                {/* Multi-day event bars - absolutely positioned for seamless connection */}
                {multiDayEvents.slice(0, 2).map((event) => {
                  const position = getDatePositionInEvent(date, event)
                  const config = locationTypeConfig[event.locationType]
                  const duration = getEventDuration(event)
                  const slot = eventSlotAssignments.get(event.id) ?? 0
                  
                  const isStart = position === 'start'
                  const isEnd = position === 'end'
                  const isSingle = position === 'single'
                  
                  // Segment boundaries for positioning (where to create visual gaps)
                  const isFirstOfMonth = date.getDate() === 1
                  const segmentStart = isStart || isSingle || isFirstOfWeek || isFirstOfMonth
                  const segmentEnd = isEnd || isSingle || isLastOfWeek
                  
                  // Only round corners on actual event start/end, not week boundaries
                  const roundLeft = isStart || isSingle
                  const roundRight = isEnd || isSingle
                  
                  // Only show title at actual start or week boundaries, not month boundaries
                  const shouldShowTitle = isStart || isSingle || isFirstOfWeek
                  
                  // Position: inset 4px at segment boundaries, overlap -1px for continuity
                  const leftPos = segmentStart ? '4px' : '-1px'
                  const rightPos = segmentEnd ? '4px' : '-1px'
                  
                  // Slot-based vertical positioning (below the date header ~32px)
                  const topOffset = 32 + (slot * 30)
                  
                  return (
                    <div
                      key={event.id}
                      className={`absolute h-[26px] ${config.bgSolid} ${config.text} ${config.hover}
                        transition-all cursor-pointer`}
                      style={{
                        zIndex: 20 - slot,
                        top: `${topOffset}px`,
                        left: leftPos,
                        right: rightPos,
                        borderTopLeftRadius: roundLeft ? '9999px' : '0',
                        borderBottomLeftRadius: roundLeft ? '9999px' : '0',
                        borderTopRightRadius: roundRight ? '9999px' : '0',
                        borderBottomRightRadius: roundRight ? '9999px' : '0',
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onEventClick) {
                          onEventClick(event)
                        } else if (event.eventUrl) {
                          window.open(event.eventUrl, '_blank')
                        }
                      }}
                      onMouseEnter={(e) => {
                        setHoveredEvent(event)
                        setMousePosition({ x: e.clientX, y: e.clientY })
                      }}
                      onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoveredEvent(null)}
                    >
                      {shouldShowTitle && (
                        <div className="flex items-center gap-2 px-2 h-full whitespace-nowrap overflow-hidden">
                          {/* Event Logo */}
                          {(event.organizerLogo || event.image) && (
                            <img 
                              src={event.organizerLogo || event.image} 
                              alt=""
                              className="w-[18px] h-[18px] rounded flex-shrink-0 object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          )}
                          <span className="text-[11px] font-medium truncate">
                            {event.title}
                          </span>
                          {duration > 1 && (
                            <span className="text-[10px] opacity-60 flex-shrink-0">
                              ({duration}d)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Single-day events - positioned below multi-day events */}
                <div 
                  className="absolute left-0 right-0 px-1 space-y-1"
                  style={{ top: `${32 + Math.min(multiDayEvents.length, 2) * 30 + (multiDayEvents.length > 0 ? 4 : 0)}px` }}
                >
                  {singleDayEvents.slice(0, Math.max(0, 3 - Math.min(multiDayEvents.length, 2))).map((event) => {
                    const config = locationTypeConfig[event.locationType]
                    return (
                      <div
                        key={event.id}
                        className={`h-[26px] ${config.bg} ${config.text} ${config.hover} 
                          rounded-full px-2 transition-all cursor-pointer overflow-hidden
                          flex items-center gap-2`}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onEventClick) {
                            onEventClick(event)
                          } else if (event.eventUrl) {
                            window.open(event.eventUrl, '_blank')
                          }
                        }}
                        onMouseEnter={(e) => {
                          setHoveredEvent(event)
                          setMousePosition({ x: e.clientX, y: e.clientY })
                        }}
                        onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredEvent(null)}
                      >
                        {/* Event Logo */}
                        {(event.organizerLogo || event.image) && (
                          <img 
                            src={event.organizerLogo || event.image} 
                            alt=""
                            className="w-[18px] h-[18px] rounded flex-shrink-0 object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <span className="text-[11px] font-medium truncate">
                          {event.title}
                        </span>
                      </div>
                    )
                  })}
                  
                  {/* "+N more" indicator - Google Calendar style */}
                  {(() => {
                    const visibleMultiDay = Math.min(multiDayEvents.length, 2)
                    const visibleSingleDay = Math.max(0, 3 - visibleMultiDay)
                    const totalVisible = visibleMultiDay + Math.min(singleDayEvents.length, visibleSingleDay)
                    const remaining = dayEvents.length - totalVisible
                    
                    if (remaining > 0) {
                      return (
                        <div className="text-[11px] text-zinc-500 hover:text-zinc-300 pl-2 pt-0.5 cursor-pointer transition-colors">
                          {remaining} more
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Event Hover Card */}
      {hoveredEvent && (
        <div 
          className="fixed z-[60] w-72 bg-[#12141f] border border-[rgba(245,245,245,0.12)] rounded-lg p-3 shadow-2xl pointer-events-none"
          style={{
            left: `${Math.min(mousePosition.x + 16, window.innerWidth - 304)}px`,
            top: `${Math.min(mousePosition.y + 16, window.innerHeight - 180)}px`,
          }}
        >
          {/* Logo & Title */}
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[rgba(245,245,245,0.08)] overflow-hidden flex-shrink-0">
              <img 
                src={hoveredEvent.organizerLogo || hoveredEvent.image || `https://picsum.photos/seed/${encodeURIComponent(hoveredEvent.title)}/64/64`}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white leading-tight line-clamp-2">{hoveredEvent.title}</h4>
              <p className="text-xs text-zinc-400 mt-0.5">{formatDateRange(hoveredEvent.date, hoveredEvent.endDate)}</p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${locationTypeConfig[hoveredEvent.locationType].bg} ${locationTypeConfig[hoveredEvent.locationType].text}`}>
              {hoveredEvent.locationType === 'online' ? 'Online' : hoveredEvent.locationType === 'hybrid' ? 'Hybrid' : 'In-Person'}
            </span>
            {getEventDuration(hoveredEvent) > 1 && (
              <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-[rgba(245,245,245,0.08)] text-zinc-400">
                {formatDuration(getEventDuration(hoveredEvent))}
              </span>
            )}
            {hoveredEvent.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-[rgba(245,245,245,0.06)] text-zinc-500">
                {tag}
              </span>
            ))}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 pt-2 border-t border-[rgba(245,245,245,0.08)]">
            {hoveredEvent.locationType === 'online' ? (
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
            )}
            <span className="truncate">{hoveredEvent.location}</span>
          </div>
        </div>
      )}

      {/* Selected Date Events Popup - Expanded Cell Style */}
      {showPopup && selectedDate && selectedDateEvents.length > 0 && popupPosition && (() => {
        const { cellRect } = popupPosition
        const popupWidth = Math.max(cellRect.width + 24, 200)
        const popupHeight = Math.min(32 + selectedDateEvents.length * 28 + 8, 340)
        
        // Center the popup over the cell
        const cellCenterX = cellRect.left + cellRect.width / 2
        const cellCenterY = cellRect.top + cellRect.height / 2
        
        let left = cellCenterX - popupWidth / 2
        let top = cellCenterY - popupHeight / 2
        
        // Constrain to viewport
        left = Math.max(8, Math.min(left, window.innerWidth - popupWidth - 8))
        top = Math.max(8, Math.min(top, window.innerHeight - popupHeight - 8))
        
        return (
          <div 
            data-date-popup
            className="fixed z-50 bg-[#0d0f1a] rounded-xl shadow-2xl overflow-hidden border border-[rgba(245,245,245,0.12)]"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${popupWidth}px`,
              transformOrigin: 'center center',
              animation: 'popupExpand 0.15s ease-out',
            }}
          >
            <style>{`
              @keyframes popupExpand {
                from { transform: scale(0.9); opacity: 0.8; }
                to { transform: scale(1); opacity: 1; }
              }
            `}</style>
            
            {/* Minimal Header - Just date number and close */}
            <div className="flex items-center justify-between px-2.5 py-2">
              <span className="text-sm font-medium text-zinc-400">
                {selectedDate.getDate()}
              </span>
              <button
                onClick={() => {
                  setShowPopup(false)
                  setSelectedDate(null)
                }}
                className="p-1 rounded hover:bg-[rgba(245,245,245,0.08)] text-zinc-500 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Events List - Matches cell event bars */}
            <div className="px-1 pb-2 max-h-[290px] overflow-y-auto space-y-1">
              {selectedDateEvents.map(event => {
                const config = locationTypeConfig[event.locationType]
                const duration = getEventDuration(event)
                const position = getDatePositionInEvent(selectedDate, event)
                
                // Determine if event continues beyond this day
                const continuesAfter = event.endDate && new Date(event.endDate).getTime() > selectedDate.getTime()
                const continuesBefore = new Date(event.date).getTime() < selectedDate.getTime()
                
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
                    className={`flex items-center gap-1.5 h-[26px] px-2 ${config.bgSolid} hover:brightness-110 transition-all overflow-hidden`}
                    style={{
                      borderRadius: continuesBefore && continuesAfter ? '0' : continuesBefore ? '0 9999px 9999px 0' : continuesAfter ? '9999px 0 0 9999px' : '9999px',
                      clipPath: continuesAfter ? 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)' : undefined,
                    }}
                  >
                    {(event.organizerLogo || event.image) && (
                      <img 
                        src={event.organizerLogo || event.image} 
                        alt=""
                        className="w-[18px] h-[18px] rounded flex-shrink-0 object-cover"
                      />
                    )}
                    
                    <span className={`text-[11px] font-medium ${config.text} truncate flex-1`}>
                      {event.title}
                    </span>
                    
                    {duration > 1 && (
                      <span className={`text-[10px] ${config.text} opacity-60 flex-shrink-0`}>
                        {position === 'start' ? '→' : position === 'end' ? '←' : `${Math.ceil((selectedDate.getTime() - new Date(event.date).getTime()) / (1000 * 60 * 60 * 24)) + 1}/${duration}`}
                      </span>
                    )}
                  </a>
                )
              })}
            </div>
          </div>
        )
      })()}

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
