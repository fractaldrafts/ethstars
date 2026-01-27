'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, ChevronDown, ChevronUp, ArrowUpRight, 
  X as XIcon, ArrowUpDown, SlidersHorizontal, MapPin, Users, Calendar, Table2, Map, LayoutGrid, Sparkles, Wifi
} from 'lucide-react'
import { IconBrandX, IconBrandDiscord, IconBrandTelegram } from '@tabler/icons-react'
import Link from 'next/link'
import { communities, type Community, type CommunityFocus, isBeginnerFriendly, getNextEventDate, getCommunityEvents } from '@/data/communities'
import CommunitiesMapSection from './CommunitiesMapSection'
import CommunitiesMobileMapView from './CommunitiesMobileMapView'
import CommunitiesList from './CommunitiesList'
import FilterEmptyState from './FilterEmptyState'
import { getUserLocationFromIP } from '@/lib/geolocation'

type SortField = 'name' | 'location' | 'eventFrequency'
type SortDirection = 'asc' | 'desc'
type ViewMode = 'table' | 'map'
type MobileViewMode = 'cards' | 'map'

type FilterType = CommunityFocus | 'all' | 'near-me' | 'remote' | 'Beginner-friendly' | 'Technical'

// Quick filters
const focusFilters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'near-me', label: 'Near me' },
  { value: 'Beginner-friendly', label: 'Beginner-friendly' },
  { value: 'Technical', label: 'Technical' },
  { value: 'remote', label: 'Remote' },
]

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Activity level filter removed - activity levels are manually set and not reliable

// Size filter removed - member count no longer available
const sizeFilters = [
  { value: 'all', label: 'All Sizes' },
  { value: 'large', label: 'Large (1000+)' },
  { value: 'medium', label: 'Medium (100-1000)' },
  { value: 'small', label: 'Small (<100)' },
]

export default function CommunitiesTable() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFocus, setSelectedFocus] = useState<FilterType>('all')
  // Activity level filter removed
  // Size filter removed - member count no longer available
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [selectedBeginnerFriendly, setSelectedBeginnerFriendly] = useState<string>('all') // 'all', 'beginner-friendly', 'technical', 'mixed'
  const [selectedEventCloseness, setSelectedEventCloseness] = useState<string>('all') // 'all', 'this-week', 'this-month', 'next-month', 'later', 'no-events'
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [mobileViewMode, setMobileViewMode] = useState<MobileViewMode>('cards')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; country: string } | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<CommunityFocus[]>([])

  // Get user location when "Near me" filter is selected
  useEffect(() => {
    if (selectedFocus === 'near-me' && !userLocation && !isLoadingLocation) {
      setIsLoadingLocation(true)
      getUserLocationFromIP()
        .then((location) => {
          if (location) {
            setUserLocation({
              lat: location.latitude,
              lng: location.longitude,
              country: location.country,
            })
          }
          setIsLoadingLocation(false)
        })
        .catch(() => {
          setIsLoadingLocation(false)
        })
    }
  }, [selectedFocus, userLocation, isLoadingLocation])

  // When Near me is selected and we have user location, select user's country on globe
  useEffect(() => {
    if (selectedFocus === 'near-me' && userLocation) {
      setSelectedLocation(userLocation.country)
    }
  }, [selectedFocus, userLocation])

  const allCountries = useMemo(
    () => Array.from(new Set(communities.map(c => c.location.country))).sort(),
    []
  )

  const allFocusAreas = useMemo(
    () => Array.from(new Set(communities.flatMap(c => c.focusAreas))).sort(),
    []
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Helper function to get next event date as Date object
  const getNextEventDateObj = (community: Community): Date | null => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    const matchingEvents = getCommunityEvents(community)
    const upcomingEvents = matchingEvents.filter((event) => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= now
    })
    
    if (upcomingEvents.length === 0) return null
    return new Date(upcomingEvents[0].date)
  }

  // Helper function to get event closeness category
  const getEventCloseness = (community: Community): string => {
    const nextEventDate = getNextEventDateObj(community)
    if (!nextEventDate) return 'no-events'
    
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const diffTime = nextEventDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 7) return 'this-week'
    if (diffDays <= 30) return 'this-month'
    if (diffDays <= 60) return 'next-month'
    return 'later'
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedFocus('all')
    setSelectedLocation('all')
    setSelectedBeginnerFriendly('all')
    setSelectedEventCloseness('all')
    setShowFeaturedOnly(false)
    setSelectedFocusAreas([])
  }

  const clearFocusFiltersOnly = () => {
    setSelectedFocus('all')
    setSelectedBeginnerFriendly('all')
    setSelectedFocusAreas([])
  }

  const clearLocationOnly = () => {
    setSelectedLocation('all')
  }

  const handleCountrySelect = (country: string | null) => {
    const next = country === 'all' || !country ? 'all' : country
    setSelectedLocation(next)
    if (next !== 'all' && next !== 'remote' && selectedFocus === 'near-me') {
      setSelectedFocus('all')
    }
  }

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value)
    if (value !== 'all' && value !== 'remote' && selectedFocus === 'near-me') {
      setSelectedFocus('all')
    }
  }

  const hasActiveFilters = searchQuery || selectedFocus !== 'all' || 
    selectedLocation !== 'all' || selectedBeginnerFriendly !== 'all' ||
    selectedEventCloseness !== 'all' || showFeaturedOnly || selectedFocusAreas.length > 0

  const filteredAndSortedCommunities = useMemo(() => {
    let result = communities.filter((community) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = (
          community.name.toLowerCase().includes(query) ||
          community.description.toLowerCase().includes(query) ||
          community.location.city.toLowerCase().includes(query) ||
          community.location.country.toLowerCase().includes(query) ||
          community.focusAreas.some(focus => focus.toLowerCase().includes(query))
        )
        if (!matchesSearch) return false
      }
      
      // Quick filter
      if (selectedFocus === 'near-me') {
        if (userLocation) {
          // Show only communities in user's country
          if (community.location.country !== userLocation.country) {
            return false
          }
        } else {
          // If location not available yet, show all (will filter once location is loaded)
          // This prevents showing no results while loading
        }
      } else if (selectedFocus === 'Beginner-friendly') {
        // Check if community is beginner-friendly
        if (!isBeginnerFriendly(community)) return false
      } else if (selectedFocus === 'Technical') {
        // Check if community has Technical focus area
        if (!community.focusAreas.includes('Technical')) return false
      } else if (selectedFocus === 'remote') {
        // Filter for remote/online communities (online or hybrid meeting format)
        if (community.meetingFormat !== 'online' && community.meetingFormat !== 'hybrid') {
          return false
        }
      }
      
      // Size filter removed - member count no longer available
      
      // Location filter (includes Remote option)
      if (selectedLocation !== 'all') {
        if (selectedLocation === 'remote') {
          // Filter for remote/online communities (online or hybrid meeting format)
          if (community.meetingFormat !== 'online' && community.meetingFormat !== 'hybrid') {
            return false
          }
        } else {
          // Filter by country
          if (community.location.country !== selectedLocation) {
            return false
          }
        }
      }
      
      // Beginner-friendly filter
      if (selectedBeginnerFriendly !== 'all') {
        const isBeginner = isBeginnerFriendly(community)
        const isTechnical = community.focusAreas.includes('Technical')
        
        if (selectedBeginnerFriendly === 'beginner-friendly' && !isBeginner) return false
        if (selectedBeginnerFriendly === 'technical' && !isTechnical) return false
        if (selectedBeginnerFriendly === 'mixed' && (!isBeginner || !isTechnical)) return false
      }
      
      // Event closeness filter
      if (selectedEventCloseness !== 'all') {
        const closeness = getEventCloseness(community)
        if (closeness !== selectedEventCloseness) return false
      }
      
      // Featured filter
      if (showFeaturedOnly && !community.featured) {
        return false
      }
      
      // Focus Areas filter
      if (selectedFocusAreas.length > 0) {
        const hasFocusArea = selectedFocusAreas.some(focusArea => community.focusAreas.includes(focusArea))
        if (!hasFocusArea) return false
      }
      
      return true
    })

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'location':
          comparison = a.location.country.localeCompare(b.location.country) || 
                      a.location.city.localeCompare(b.location.city)
          break
        case 'eventFrequency':
          const freqOrder = { 'Weekly': 4, 'Bi-weekly': 3, 'Monthly': 2, 'Quarterly': 1 }
          comparison = (freqOrder[a.eventFrequency as keyof typeof freqOrder] || 0) - 
                      (freqOrder[b.eventFrequency as keyof typeof freqOrder] || 0)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [searchQuery, selectedFocus, selectedLocation, selectedBeginnerFriendly, selectedEventCloseness, showFeaturedOnly, selectedFocusAreas, sortField, sortDirection, userLocation])

  const hasCountryFilter = selectedLocation !== 'all' && selectedLocation !== 'remote'
  const focusLabelMap: Record<string, string> = {
    'Beginner-friendly': 'beginner friendly',
    'Technical': 'technical',
    'remote': 'remote',
    'near-me': 'near me',
  }
  const focusLabel = selectedFocus !== 'all' ? focusLabelMap[selectedFocus] ?? selectedFocus.toLowerCase() : null

  const countInCountry = hasCountryFilter
    ? communities.filter((c) => c.location.country === selectedLocation).length
    : 0
  const hasCommunitiesInCountry = countInCountry > 0

  const emptyStateConfig =
    filteredAndSortedCommunities.length === 0 && hasActiveFilters
      ? (() => {
          const country = hasCountryFilter ? selectedLocation : null
          const addCommunityCta = {
            label: 'Add a new community',
            onClick: () => router.push('/communities?add=true'),
          }
          if (focusLabel && country && hasCommunitiesInCountry) {
            return {
              message: `No ${focusLabel} communities found in ${country}.`,
              primaryCta: {
                label: `Explore other communities in ${country}`,
                onClick: clearFocusFiltersOnly,
              },
              secondaryCta: addCommunityCta,
            }
          }
          if (focusLabel && country && !hasCommunitiesInCountry) {
            return {
              message: `No ${focusLabel} communities found in ${country}.`,
              primaryCta: { label: 'Clear location', onClick: clearLocationOnly },
              secondaryCta: addCommunityCta,
            }
          }
          if (country) {
            return {
              message: `No communities found in ${country}.`,
              primaryCta: { label: 'Clear location', onClick: clearLocationOnly },
              secondaryCta: addCommunityCta,
            }
          }
          if (focusLabel) {
            return {
              message: `No ${focusLabel} communities found.`,
              primaryCta: { label: 'Clear focus filters', onClick: clearFocusFiltersOnly },
              secondaryCta: addCommunityCta,
            }
          }
          return {
            message: 'No communities found.',
            primaryCta: { label: 'Clear filters', onClick: clearAllFilters },
            secondaryCta: addCommunityCta,
          }
        })()
      : null

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

  return (
    <div className="space-y-4">
      {/* Controls Row */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Focus Filters */}
          <div className="flex items-center gap-1 flex-nowrap sm:flex-wrap overflow-x-auto sm:overflow-x-visible -mx-6 px-6 sm:mx-0 sm:px-0 scrollbar-hide">
            {focusFilters.map((filter) => {
              const isSelected = selectedFocus === filter.value
              const isLoading = filter.value === 'near-me' && selectedFocus === 'near-me' && isLoadingLocation
              
              return (
                <button
                  key={filter.value}
                  onClick={() => {
                    setSelectedFocus(filter.value)
                    if (filter.value === 'near-me') setSelectedLocation('all')
                  }}
                  disabled={isLoading}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-full border flex-shrink-0 ${
                    isSelected
                      ? filter.value === 'all'
                        ? 'bg-[rgba(245,245,245,0.08)] text-white border-transparent'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                      : 'text-zinc-500 hover:text-white hover:bg-[rgba(245,245,245,0.04)] border-transparent'
                  } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {isLoading ? 'Loading...' : filter.label}
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
                placeholder="Search communities..."
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
            
            {/* Desktop View Mode Toggle */}
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
                onClick={() => setViewMode('map')}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  viewMode === 'map'
                    ? 'bg-[rgba(245,245,245,0.08)] text-white'
                    : 'text-zinc-500 hover:text-white'
                }`}
                title="Map View"
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="p-4 bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Location</label>
                <div className="relative">
                  <select
                    value={selectedLocation}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="w-full bg-[rgba(245,245,245,0.08)] border border-[rgba(245,245,245,0.08)] rounded-full pl-3 pr-10 py-2 text-sm text-white focus:border-zinc-700 appearance-none"
                  >
                    <option value="all">All locations</option>
                    <option value="remote">Remote</option>
                    {allCountries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Beginner-friendly Filter */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Skill Level</label>
                <div className="relative">
                  <select
                    value={selectedBeginnerFriendly}
                    onChange={(e) => setSelectedBeginnerFriendly(e.target.value)}
                    className="w-full bg-[rgba(245,245,245,0.08)] border border-[rgba(245,245,245,0.08)] rounded-full pl-3 pr-10 py-2 text-sm text-white focus:border-zinc-700 appearance-none"
                  >
                    <option value="all">All levels</option>
                    <option value="beginner-friendly">Beginner-friendly</option>
                    <option value="technical">Technical</option>
                    <option value="mixed">Mixed</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Event Closeness Filter */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Next Event</label>
                <div className="relative">
                  <select
                    value={selectedEventCloseness}
                    onChange={(e) => setSelectedEventCloseness(e.target.value)}
                    className="w-full bg-[rgba(245,245,245,0.08)] border border-[rgba(245,245,245,0.08)] rounded-full pl-3 pr-10 py-2 text-sm text-white focus:border-zinc-700 appearance-none"
                  >
                    <option value="all">All events</option>
                    <option value="this-week">This week</option>
                    <option value="this-month">This month</option>
                    <option value="next-month">Next month</option>
                    <option value="later">Later</option>
                    <option value="no-events">No upcoming events</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured-toggle"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                className="w-4 h-4 rounded bg-[rgba(245,245,245,0.08)] border-[rgba(245,245,245,0.08)] text-red-500 focus:ring-red-500/50 focus:ring-offset-0"
              />
              <label htmlFor="featured-toggle" className="text-sm text-zinc-400 cursor-pointer">
                Show featured communities only
              </label>
            </div>

            {/* Focus Areas Tags */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Focus Areas</label>
              <div className="flex flex-wrap gap-1.5">
                {allFocusAreas.map(focusArea => (
                  <button
                    key={focusArea}
                    onClick={() => {
                      setSelectedFocusAreas(prev => 
                        prev.includes(focusArea) 
                          ? prev.filter(f => f !== focusArea)
                          : [...prev, focusArea]
                      )
                    }}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      selectedFocusAreas.includes(focusArea)
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-[rgba(245,245,245,0.08)] text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    {focusArea}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex justify-end pt-2 border-t border-[rgba(245,245,245,0.08)]">
                <button
                  onClick={clearAllFilters}
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
        {filteredAndSortedCommunities.length} communit{filteredAndSortedCommunities.length !== 1 ? 'ies' : 'y'}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="ml-2 text-red-500 hover:text-red-400"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Mobile View Toggle */}
      <div className="md:hidden mb-4">
        <div className="flex items-center gap-1 p-1 bg-[rgba(245,245,245,0.08)] rounded-full border border-[rgba(245,245,245,0.08)]">
          <button
            onClick={() => setMobileViewMode('cards')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full transition-colors flex-1 ${
              mobileViewMode === 'cards'
                ? 'bg-[rgba(245,245,245,0.08)] text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Cards
          </button>
          <button
            onClick={() => setMobileViewMode('map')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full transition-colors flex-1 ${
              mobileViewMode === 'map'
                ? 'bg-[rgba(245,245,245,0.08)] text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            Map
          </button>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden">
        {mobileViewMode === 'cards' && (
          <CommunitiesList
            communities={filteredAndSortedCommunities}
            selectedCommunityId={null}
            onCommunitySelect={(community) => {
              router.push(`/communities/${community.id}`)
            }}
            emptyStateConfig={emptyStateConfig}
          />
        )}
        {mobileViewMode === 'map' && (
          <CommunitiesMobileMapView 
            communities={filteredAndSortedCommunities}
          />
        )}
      </div>

      {/* Desktop Map View */}
      {viewMode === 'map' && (
        <div className="hidden md:block">
          <CommunitiesMapSection 
            communities={filteredAndSortedCommunities}
            selectedLocation={selectedLocation}
            onCountrySelect={handleCountrySelect}
            allCountries={allCountries}
            emptyStateConfig={emptyStateConfig}
          />
        </div>
      )}

      {/* Desktop Table View */}
      {viewMode === 'table' && (
        <div className="hidden md:block overflow-x-auto -mx-6 md:-mx-12 px-6 md:px-12">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-[rgba(245,245,245,0.04)] border-b border-[rgba(245,245,245,0.08)]">
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide min-w-[200px]">
                  <SortButton field="name">COMMUNITY</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide min-w-[150px]">
                  <SortButton field="location">LOCATION</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden lg:table-cell min-w-[100px] whitespace-nowrap">
                  NEXT EVENT
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide min-w-[100px] hidden md:table-cell">
                  CONNECT
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide w-24 min-w-[100px]">
                  
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(245,245,245,0.04)]">
              {filteredAndSortedCommunities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    {emptyStateConfig ? (
                      <FilterEmptyState config={emptyStateConfig} className="py-4" />
                    ) : (
                      <>
                        <p className="text-zinc-500 text-sm">No communities found</p>
                        <button
                          onClick={clearAllFilters}
                          className="text-sm text-red-500 hover:text-red-400 mt-2"
                        >
                          Clear filters
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAndSortedCommunities.map((community) => (
                  <TableRow key={community.id} community={community} />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TableRow({ community }: { community: Community }) {
  const router = useRouter()
  
  const handleRowClick = () => {
    router.push(`/communities/${community.id}`)
  }
  
  return (
    <tr 
      onClick={handleRowClick}
      className="hover:bg-[rgba(245,245,245,0.024)] transition-colors group cursor-pointer"
    >
      {/* Community */}
      <td className="py-3 px-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-[rgba(245,245,245,0.08)] overflow-hidden flex-shrink-0">
            <img 
              src={community.logo} 
              alt={community.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-white font-medium block group-hover:text-red-400 transition-colors">
              {community.name}
            </span>
            <div className="overflow-x-auto scrollbar-hide -mx-1 px-1 mt-1">
              <div className="flex items-center gap-1.5">
                {isBeginnerFriendly(community) && (
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-zinc-500 bg-[rgba(245,245,245,0.04)] px-2 py-0.5 rounded flex-shrink-0 whitespace-nowrap border border-transparent group-hover:bg-emerald-500/10 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                    <Sparkles className="w-3 h-3 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                    Beginner-friendly
                  </span>
                )}
                {community.meetingFormat === 'online' && (
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-zinc-500 bg-[rgba(245,245,245,0.04)] px-2 py-0.5 rounded flex-shrink-0 whitespace-nowrap">
                    <Wifi className="w-3 h-3" />
                    Remote
                  </span>
                )}
                {community.focusAreas.map(focus => (
                  <span key={focus} className="text-[12px] font-medium text-zinc-500 bg-[rgba(245,245,245,0.04)] px-2 py-0.5 rounded flex-shrink-0 whitespace-nowrap">
                    {focus}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </td>
      
      {/* Location */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5 text-sm text-zinc-400">
          <MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
          <span className="whitespace-nowrap">{community.location.city}, {community.location.country}</span>
        </div>
      </td>
      
      {/* Next Event */}
      <td className="py-3 px-4 hidden lg:table-cell">
        <div className="flex items-center gap-1.5 text-sm text-zinc-400">
          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
          <span>{getNextEventDate(community) || 'No upcoming events'}</span>
        </div>
      </td>
      
      {/* Connect */}
      <td className="py-3 px-4 hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          {community.twitter && (
            <a
              href={community.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="X (Twitter)"
            >
              <IconBrandX className="w-4 h-4" />
            </a>
          )}
          {community.telegram && (
            <a
              href={community.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Telegram"
            >
              <IconBrandTelegram className="w-4 h-4" />
            </a>
          )}
          {community.discord && (
            <a
              href={community.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Discord"
            >
              <IconBrandDiscord className="w-4 h-4" />
            </a>
          )}
          {!community.twitter && !community.telegram && !community.discord && (
            <span className="text-xs text-zinc-500">—</span>
          )}
        </div>
      </td>
      
      {/* Action */}
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-400 bg-[rgba(245,245,245,0.08)] group-hover:text-white group-hover:bg-red-500 rounded-full transition-colors">
            View
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </td>
    </tr>
  )
}

