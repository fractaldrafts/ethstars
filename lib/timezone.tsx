'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface TimezoneContextType {
  timezone: string
  setTimezone: (tz: string) => void
  isDetecting: boolean
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined)

// Common timezones grouped by region
export const TIMEZONE_OPTIONS = [
  // Americas
  { value: 'America/Los_Angeles', label: 'Los Angeles (PT)', offset: 'UTC-8' },
  { value: 'America/Denver', label: 'Denver (MT)', offset: 'UTC-7' },
  { value: 'America/Chicago', label: 'Chicago (CT)', offset: 'UTC-6' },
  { value: 'America/New_York', label: 'New York (ET)', offset: 'UTC-5' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', offset: 'UTC-3' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires', offset: 'UTC-3' },
  { value: 'America/Mexico_City', label: 'Mexico City', offset: 'UTC-6' },
  { value: 'America/Toronto', label: 'Toronto', offset: 'UTC-5' },
  { value: 'America/Vancouver', label: 'Vancouver', offset: 'UTC-8' },
  
  // Europe
  { value: 'Europe/London', label: 'London (GMT)', offset: 'UTC+0' },
  { value: 'Europe/Paris', label: 'Paris (CET)', offset: 'UTC+1' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)', offset: 'UTC+1' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam', offset: 'UTC+1' },
  { value: 'Europe/Zurich', label: 'Zurich', offset: 'UTC+1' },
  { value: 'Europe/Rome', label: 'Rome', offset: 'UTC+1' },
  { value: 'Europe/Madrid', label: 'Madrid', offset: 'UTC+1' },
  { value: 'Europe/Prague', label: 'Prague', offset: 'UTC+1' },
  { value: 'Europe/Warsaw', label: 'Warsaw', offset: 'UTC+1' },
  { value: 'Europe/Moscow', label: 'Moscow', offset: 'UTC+3' },
  { value: 'Europe/Istanbul', label: 'Istanbul', offset: 'UTC+3' },
  { value: 'Europe/Kyiv', label: 'Kyiv', offset: 'UTC+2' },
  
  // Asia
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: 'UTC+4' },
  { value: 'Asia/Kolkata', label: 'India (IST)', offset: 'UTC+5:30' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: 'UTC+8' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', offset: 'UTC+8' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: 'UTC+8' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 'UTC+9' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)', offset: 'UTC+9' },
  { value: 'Asia/Bangkok', label: 'Bangkok', offset: 'UTC+7' },
  { value: 'Asia/Jakarta', label: 'Jakarta', offset: 'UTC+7' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh', offset: 'UTC+7' },
  
  // Oceania
  { value: 'Australia/Sydney', label: 'Sydney (AEST)', offset: 'UTC+10' },
  { value: 'Australia/Melbourne', label: 'Melbourne', offset: 'UTC+10' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)', offset: 'UTC+12' },
  
  // Africa
  { value: 'Africa/Lagos', label: 'Lagos (WAT)', offset: 'UTC+1' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)', offset: 'UTC+3' },
  { value: 'Africa/Cairo', label: 'Cairo', offset: 'UTC+2' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg', offset: 'UTC+2' },
]

// Get timezone abbreviation from IANA timezone
export function getTimezoneAbbreviation(timezone: string): string {
  try {
    const date = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    })
    const parts = formatter.formatToParts(date)
    const tzPart = parts.find(part => part.type === 'timeZoneName')
    return tzPart?.value || timezone.split('/').pop()?.replace('_', ' ') || timezone
  } catch {
    return timezone.split('/').pop()?.replace('_', ' ') || timezone
  }
}

// Get short label for display (e.g., "PT" from "Los Angeles (PT)")
export function getShortTimezoneLabel(timezone: string): string {
  const option = TIMEZONE_OPTIONS.find(opt => opt.value === timezone)
  if (option) {
    // Extract abbreviation from label if present
    const match = option.label.match(/\(([^)]+)\)/)
    if (match) return match[1]
    return option.label.split(' ')[0]
  }
  return getTimezoneAbbreviation(timezone)
}

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const [timezone, setTimezoneState] = useState<string>('')
  const [isDetecting, setIsDetecting] = useState(true)

  // Detect timezone from IP on mount
  useEffect(() => {
    const detectTimezone = async () => {
      // Check localStorage first
      const savedTimezone = localStorage.getItem('userTimezone')
      if (savedTimezone) {
        setTimezoneState(savedTimezone)
        setIsDetecting(false)
        return
      }

      try {
        // Try ipapi.co first (includes timezone field)
        const response = await fetch('https://ipapi.co/json/', {
          headers: { 'Accept': 'application/json' },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.timezone) {
            setTimezoneState(data.timezone)
            localStorage.setItem('userTimezone', data.timezone)
            setIsDetecting(false)
            return
          }
        }
      } catch (error) {
        console.warn('ipapi.co timezone detection failed:', error)
      }

      try {
        // Fallback to ip-api.com
        const response = await fetch('http://ip-api.com/json/?fields=timezone', {
          headers: { 'Accept': 'application/json' },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.timezone) {
            setTimezoneState(data.timezone)
            localStorage.setItem('userTimezone', data.timezone)
            setIsDetecting(false)
            return
          }
        }
      } catch (error) {
        console.warn('ip-api.com timezone detection failed:', error)
      }

      // Final fallback: use browser's timezone
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      setTimezoneState(browserTimezone)
      localStorage.setItem('userTimezone', browserTimezone)
      setIsDetecting(false)
    }

    detectTimezone()
  }, [])

  const setTimezone = useCallback((tz: string) => {
    setTimezoneState(tz)
    localStorage.setItem('userTimezone', tz)
  }, [])

  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone, isDetecting }}>
      {children}
    </TimezoneContext.Provider>
  )
}

export function useTimezone() {
  const context = useContext(TimezoneContext)
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider')
  }
  return context
}
