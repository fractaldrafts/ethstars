'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe, ChevronDown, Check, Loader2 } from 'lucide-react'
import { useTimezone, TIMEZONE_OPTIONS, getShortTimezoneLabel } from '@/lib/timezone'

export default function TimezoneSelector() {
  const { timezone, setTimezone, isDetecting } = useTimezone()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Filter timezones based on search
  const filteredTimezones = TIMEZONE_OPTIONS.filter(tz => 
    tz.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tz.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tz.offset.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group timezones by region
  const groupedTimezones = filteredTimezones.reduce((acc, tz) => {
    const region = tz.value.split('/')[0]
    if (!acc[region]) acc[region] = []
    acc[region].push(tz)
    return acc
  }, {} as Record<string, typeof TIMEZONE_OPTIONS>)

  const regionOrder = ['America', 'Europe', 'Asia', 'Australia', 'Pacific', 'Africa']
  const sortedRegions = Object.keys(groupedTimezones).sort(
    (a, b) => regionOrder.indexOf(a) - regionOrder.indexOf(b)
  )

  const displayLabel = timezone ? getShortTimezoneLabel(timezone) : '...'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[rgba(245,245,245,0.06)] text-xs font-medium text-zinc-300 hover:bg-[rgba(245,245,245,0.1)] transition-colors"
        aria-label="Select timezone"
      >
        {isDetecting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
        ) : (
          <Globe className="w-3.5 h-3.5 text-zinc-400" />
        )}
        <span className="uppercase tracking-wide">{displayLabel}</span>
        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[#0a0d1c] border border-[rgba(245,245,245,0.1)] rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-[rgba(245,245,245,0.08)]">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search timezone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-[rgba(245,245,245,0.05)] border border-[rgba(245,245,245,0.1)] rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[rgba(245,245,245,0.2)]"
            />
          </div>

          {/* Timezone list */}
          <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            {sortedRegions.map(region => (
              <div key={region}>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider bg-[rgba(245,245,245,0.03)] sticky top-0">
                  {region === 'America' ? 'Americas' : region === 'Australia' || region === 'Pacific' ? 'Oceania' : region}
                </div>
                {groupedTimezones[region].map(tz => (
                  <button
                    key={tz.value}
                    onClick={() => {
                      setTimezone(tz.value)
                      setIsOpen(false)
                      setSearchQuery('')
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[rgba(245,245,245,0.05)] transition-colors ${
                      timezone === tz.value ? 'bg-[rgba(239,68,68,0.1)]' : ''
                    }`}
                  >
                    <span className={`text-sm ${timezone === tz.value ? 'text-red-400' : 'text-zinc-300'}`}>
                      {tz.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">{tz.offset}</span>
                      {timezone === tz.value && (
                        <Check className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}

            {filteredTimezones.length === 0 && (
              <div className="px-3 py-4 text-sm text-zinc-500 text-center">
                No timezones found
              </div>
            )}
          </div>

          {/* Current selection indicator */}
          {timezone && (
            <div className="px-3 py-2 border-t border-[rgba(245,245,245,0.08)] bg-[rgba(245,245,245,0.02)]">
              <p className="text-[10px] text-zinc-500">
                Detected: <span className="text-zinc-400">{timezone}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
