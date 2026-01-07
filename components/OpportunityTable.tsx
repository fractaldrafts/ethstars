'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { 
  Search, ChevronDown, ChevronUp, ArrowUpRight, 
  X as XIcon, ArrowUpDown, SlidersHorizontal, MapPin, Clock, Table2, LayoutList
} from 'lucide-react'
import Link from 'next/link'
import { opportunities, type Opportunity, type OpportunityType, type ExperienceLevel, getCompanySlug } from '@/data/opportunities'
import OpportunityCard from './OpportunityCard'
import TwoColumnOpportunityItem from './TwoColumnOpportunityItem'
import TwoColumnOpportunityDetail from './TwoColumnOpportunityDetail'

type SortField = 'company' | 'title' | 'type' | 'reward' | 'applicants' | 'postedAt' | 'location' | 'deadline'
type SortDirection = 'asc' | 'desc'
type ViewMode = 'table' | 'two-column'

const typeFilters: { type: OpportunityType | 'all'; label: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'job', label: 'Jobs' },
  { type: 'bounty', label: 'Bounties' },
  { type: 'grant', label: 'Grants' },
  { type: 'project', label: 'Projects' },
]

const typeConfig: Record<OpportunityType, {
  bg: string
  border: string
  text: string
  hoverBg: string
  hoverBorder: string
  hoverText: string
}> = {
  job: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    hoverBg: 'group-hover:bg-emerald-500/20',
    hoverBorder: 'group-hover:border-emerald-500/50',
    hoverText: 'group-hover:text-emerald-300',
  },
  bounty: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    hoverBg: 'group-hover:bg-orange-500/20',
    hoverBorder: 'group-hover:border-orange-500/50',
    hoverText: 'group-hover:text-orange-300',
  },
  grant: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    hoverBg: 'group-hover:bg-purple-500/20',
    hoverBorder: 'group-hover:border-purple-500/50',
    hoverText: 'group-hover:text-purple-300',
  },
  project: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    hoverBg: 'group-hover:bg-blue-500/20',
    hoverBorder: 'group-hover:border-blue-500/50',
    hoverText: 'group-hover:text-blue-300',
  },
}

const workTypeOptions = ['Any', 'Remote', 'On-site', 'Hybrid'] as const

const experienceLevels: { value: ExperienceLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'Any level' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead / Principal' },
]

const datePostedOptions = [
  { value: 'all', label: 'Any time' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
] as const

const compensationRanges = [
  { value: 'all', label: 'Any' },
  { value: '0-50k', label: '$0 - $50k' },
  { value: '50k-100k', label: '$50k - $100k' },
  { value: '100k-150k', label: '$100k - $150k' },
  { value: '150k+', label: '$150k+' },
] as const

interface OpportunityTableProps {
  baseOpportunities?: Opportunity[]
  selectOpportunityId?: string | null
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1d ago'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDeadline(deadline?: string): string {
  if (!deadline) return '—'
  const date = new Date(deadline)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'Expired'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return `${diffDays}d left`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w left`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isWithinDateRange(dateString: string, range: string): boolean {
  if (range === 'all') return true
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  switch (range) {
    case '24h': return diffDays <= 1
    case '7d': return diffDays <= 7
    case '30d': return diffDays <= 30
    default: return true
  }
}

function isInCompensationRange(reward: string, range: string): boolean {
  if (range === 'all') return true
  const numericValue = parseInt(reward.replace(/[^0-9]/g, '')) || 0
  
  switch (range) {
    case '0-50k': return numericValue <= 50000
    case '50k-100k': return numericValue > 50000 && numericValue <= 100000
    case '100k-150k': return numericValue > 100000 && numericValue <= 150000
    case '150k+': return numericValue > 150000
    default: return true
  }
}

export default function OpportunityTable({ baseOpportunities, selectOpportunityId: externalSelectOpportunityId }: OpportunityTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<OpportunityType | 'all'>('all')
  const [sortField, setSortField] = useState<SortField>('postedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('two-column')
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null)
  const source = baseOpportunities ?? opportunities
  const listContainerRef = useRef<HTMLDivElement>(null)
  
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [workType, setWorkType] = useState<typeof workTypeOptions[number]>('Any')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | 'all'>('all')
  const [datePosted, setDatePosted] = useState<string>('all')
  const [compensation, setCompensation] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('all')

  const allTags = useMemo(
    () => Array.from(new Set(source.flatMap(o => o.tags))).sort(),
    [source]
  )

  const allLocations = useMemo(
    () =>
      Array.from(
        new Set(
          source.map(o => {
            const loc = o.location.toLowerCase()
            if (loc.includes('remote')) return 'Remote'
            if (o.location === 'Global' || o.location === 'Worldwide') return 'Remote'
            // Extract city name (first part before '/')
            return o.location.split('/')[0].trim()
          })
        )
      ).sort(),
    [source]
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedType('all')
    setWorkType('Any')
    setExperienceLevel('all')
    setDatePosted('all')
    setCompensation('all')
    setSelectedTags([])
    setSelectedLocation('all')
  }

  const hasActiveFilters = searchQuery || selectedType !== 'all' || workType !== 'Any' || 
    experienceLevel !== 'all' || datePosted !== 'all' || compensation !== 'all' || 
    selectedTags.length > 0 || selectedLocation !== 'all'

  // Auto-select first opportunity in two-column mode
  const filteredAndSortedOpportunities = useMemo(() => {
    let result = source.filter((opportunity) => {
      // Type filter
      if (selectedType !== 'all' && opportunity.type !== selectedType) return false
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = (
          opportunity.title.toLowerCase().includes(query) ||
          opportunity.company.toLowerCase().includes(query) ||
          opportunity.intro.toLowerCase().includes(query) ||
          opportunity.tags.some(tag => tag.toLowerCase().includes(query)) ||
          opportunity.location.toLowerCase().includes(query)
        )
        if (!matchesSearch) return false
      }
      
      // Work type filter
      if (workType !== 'Any') {
        const isRemote = opportunity.remote || 
          opportunity.location.toLowerCase().includes('remote') ||
          opportunity.location === 'Global' ||
          opportunity.location === 'Worldwide'
        
        if (workType === 'Remote' && !isRemote) return false
        if (workType === 'On-site' && isRemote) return false
        if (workType === 'Hybrid' && !opportunity.location.includes('/')) return false
      }
      
      // Experience level filter
      if (experienceLevel !== 'all') {
        if (opportunity.experienceLevel && opportunity.experienceLevel !== experienceLevel && opportunity.experienceLevel !== 'any') {
          return false
        }
      }
      
      // Date posted filter
      if (!isWithinDateRange(opportunity.postedAt, datePosted)) return false
      
      // Compensation filter
      if (!isInCompensationRange(opportunity.reward, compensation)) return false
      
      // Tags filter
      if (selectedTags.length > 0) {
        const hasTag = selectedTags.some(tag => opportunity.tags.includes(tag))
        if (!hasTag) return false
      }
      
      // Location filter
      if (selectedLocation !== 'all') {
        // Normalize opportunity location for comparison
        const normalizeLocation = (location: string): string => {
          const loc = location.toLowerCase()
          if (loc.includes('remote')) return 'Remote'
          if (location === 'Global' || location === 'Worldwide') return 'Remote'
          return location.split('/')[0].trim()
        }
        const oppLocationNormalized = normalizeLocation(opportunity.location)
        if (oppLocationNormalized !== selectedLocation) {
          return false
        }
      }
      
      return true
    })

    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'company':
          comparison = a.company.localeCompare(b.company)
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'location':
          comparison = a.location.localeCompare(b.location)
          break
        case 'postedAt':
          comparison = new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime()
          break
        case 'applicants':
          comparison = (a.applicants || 0) - (b.applicants || 0)
          break
        case 'reward':
          const getNumeric = (s: string) => parseInt(s.replace(/[^0-9]/g, '')) || 0
          comparison = getNumeric(a.reward) - getNumeric(b.reward)
          break
        case 'deadline':
          const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Infinity
          const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Infinity
          comparison = aDeadline - bDeadline
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [searchQuery, selectedType, sortField, sortDirection, workType, experienceLevel, datePosted, compensation, selectedTags, selectedLocation, source])

  // Auto-select first opportunity in two-column mode when results change
  useEffect(() => {
    if (viewMode === 'two-column' && filteredAndSortedOpportunities.length > 0 && !selectedOpportunityId) {
      setSelectedOpportunityId(filteredAndSortedOpportunities[0].id)
    } else if (viewMode === 'two-column' && filteredAndSortedOpportunities.length > 0 && selectedOpportunityId) {
      // Check if selected opportunity still exists in filtered results
      const stillExists = filteredAndSortedOpportunities.some(o => o.id === selectedOpportunityId)
      if (!stillExists) {
        setSelectedOpportunityId(filteredAndSortedOpportunities[0].id)
      }
    } else if (viewMode === 'table') {
      // Clear selection when switching to table view
      setSelectedOpportunityId(null)
    }
  }, [filteredAndSortedOpportunities, viewMode, selectedOpportunityId])

  // Track previous filter values to only scroll when filters actually change
  const prevFiltersRef = useRef({ selectedTags, selectedLocation, selectedType })
  
  // Scroll to top of list when filters change
  useEffect(() => {
    // Only scroll if filters actually changed (not on initial mount)
    const filtersChanged = 
      JSON.stringify(prevFiltersRef.current.selectedTags) !== JSON.stringify(selectedTags) ||
      prevFiltersRef.current.selectedLocation !== selectedLocation ||
      prevFiltersRef.current.selectedType !== selectedType
    
    if (viewMode === 'two-column' && listContainerRef.current && filtersChanged) {
      // Scroll the container into view smoothly
      listContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    
    // Update previous filter values
    prevFiltersRef.current = { selectedTags, selectedLocation, selectedType }
  }, [selectedTags, selectedLocation, selectedType, viewMode])

  // Handle external opportunity selection request (e.g., from FeaturedSection)
  const prevExternalSelectRef = useRef<string | null | undefined>(null)
  useEffect(() => {
    // Only trigger if the external selection changed (not on initial mount with same value)
    if (externalSelectOpportunityId && externalSelectOpportunityId !== prevExternalSelectRef.current) {
      prevExternalSelectRef.current = externalSelectOpportunityId
      // Check if opportunity exists in filtered results
      const exists = filteredAndSortedOpportunities.some(o => o.id === externalSelectOpportunityId)
      if (exists) {
        // Switch to two-column view if not already
        if (viewMode !== 'two-column') {
          setViewMode('two-column')
        }
        // Select the opportunity
        setSelectedOpportunityId(externalSelectOpportunityId)
        // Scroll to the list container after a brief delay to ensure it's rendered
        setTimeout(() => {
          if (listContainerRef.current) {
            listContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
            // Also scroll the selected item into view within the list
            const selectedElement = listContainerRef.current.querySelector(`[data-opportunity-id="${externalSelectOpportunityId}"]`)
            if (selectedElement) {
              selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }
        }, 150)
      }
    } else if (!externalSelectOpportunityId) {
      prevExternalSelectRef.current = null
    }
  }, [externalSelectOpportunityId, filteredAndSortedOpportunities, viewMode])

  const selectedOpportunity = filteredAndSortedOpportunities.find(o => o.id === selectedOpportunityId) || null

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
          {/* Type Filters */}
          <div className="flex items-center gap-1">
            {typeFilters.map((filter) => {
              const isSelected = selectedType === filter.type
              const isAll = filter.type === 'all'
              const config = !isAll ? typeConfig[filter.type as OpportunityType] : null
              
              return (
                <button
                  key={filter.type}
                  onClick={() => setSelectedType(filter.type)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-full border ${
                    isSelected
                      ? isAll
                        ? 'bg-[rgba(245,245,245,0.08)] text-white border-transparent'
                        : `${config!.bg} ${config!.border} ${config!.text}`
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
                placeholder="Search opportunities..."
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
                onClick={() => setViewMode('two-column')}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  viewMode === 'two-column'
                    ? 'bg-[rgba(245,245,245,0.08)] text-white'
                    : 'text-zinc-500 hover:text-white'
                }`}
                title="Two Column View"
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="p-4 bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Work Type */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Work Type</label>
                <div className="relative">
                  <select
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value as typeof workTypeOptions[number])}
                    className="w-full bg-[rgba(245,245,245,0.08)] border border-[rgba(245,245,245,0.08)] rounded-full pl-3 pr-10 py-2 text-sm text-white focus:border-zinc-700 appearance-none"
                  >
                    {workTypeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Experience</label>
                <div className="relative">
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel | 'all')}
                    className="w-full bg-[rgba(245,245,245,0.08)] border border-[rgba(245,245,245,0.08)] rounded-full pl-3 pr-10 py-2 text-sm text-white focus:border-zinc-700 appearance-none"
                  >
                    {experienceLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
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
                    {allLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Compensation */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Compensation</label>
                <div className="relative">
                  <select
                    value={compensation}
                    onChange={(e) => setCompensation(e.target.value)}
                    className="w-full bg-[rgba(245,245,245,0.08)] border border-[rgba(245,245,245,0.08)] rounded-full pl-3 pr-10 py-2 text-sm text-white focus:border-zinc-700 appearance-none"
                  >
                    {compensationRanges.map(range => (
                      <option key={range.value} value={range.value}>{range.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Date Posted */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Date Posted</label>
                <div className="relative">
                  <select
                    value={datePosted}
                    onChange={(e) => setDatePosted(e.target.value)}
                    className="w-full bg-[rgba(245,245,245,0.08)] border border-[rgba(245,245,245,0.08)] rounded-full pl-3 pr-10 py-2 text-sm text-white focus:border-zinc-700 appearance-none"
                  >
                    {datePostedOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Skills Tags */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Skills</label>
              <div className="flex flex-wrap gap-1.5">
                {allTags.slice(0, 16).map(tag => (
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
        {filteredAndSortedOpportunities.length} opportunities
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="ml-2 text-red-500 hover:text-red-400"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Mobile Cards View */}
      {filteredAndSortedOpportunities.length === 0 ? (
        <div className="md:hidden py-12 text-center">
          <p className="text-zinc-500 text-sm">No opportunities found</p>
          <button
            onClick={clearAllFilters}
            className="text-sm text-red-500 hover:text-red-400 mt-2"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="md:hidden grid grid-cols-1 gap-4">
          {filteredAndSortedOpportunities.map((opportunity, index) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              index={index}
              onTagClick={(tag) => {
                setSelectedTags(prev =>
                  prev.includes(tag)
                    ? prev.filter(t => t !== tag)
                    : [...prev, tag]
                )
              }}
              selectedTags={selectedTags}
              onTypeClick={(type) => {
                setSelectedType(type === selectedType ? 'all' : type)
              }}
              selectedType={selectedType}
              onRemoteClick={() => {
                setWorkType(workType === 'Remote' ? 'Any' : 'Remote')
              }}
              isRemoteSelected={workType === 'Remote'}
            />
          ))}
        </div>
      )}

      {/* Desktop Table View */}
      {viewMode === 'table' && (
        <div className="hidden md:block overflow-x-auto -mx-6 md:-mx-12 px-6 md:px-12">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-[rgba(245,245,245,0.04)] border-b border-[rgba(245,245,245,0.08)]">
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide min-w-[150px]">
                  <SortButton field="company">COMPANY</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide min-w-[200px]">
                  <SortButton field="title">TITLE</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden sm:table-cell min-w-[80px]">
                  <SortButton field="type">TYPE</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden lg:table-cell min-w-[120px]">
                  <SortButton field="location">LOCATION</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide min-w-[120px]">
                  <SortButton field="reward">COMPENSATION</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden md:table-cell min-w-[100px]">
                  <SortButton field="applicants">APPLICANT</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden sm:table-cell min-w-[90px]">
                  <SortButton field="postedAt">POSTED</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden lg:table-cell min-w-[100px]">
                  <SortButton field="deadline">DEADLINE</SortButton>
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide w-24 min-w-[100px]">
                  
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(245,245,245,0.04)]">
              {filteredAndSortedOpportunities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <p className="text-zinc-500 text-sm">No opportunities found</p>
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-red-500 hover:text-red-400 mt-2"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredAndSortedOpportunities.map((opportunity) => (
                  <TableRow 
                    key={opportunity.id} 
                    opportunity={opportunity}
                    onTagClick={(tag) => {
                      setSelectedTags(prev => 
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      )
                    }}
                    selectedTags={selectedTags}
                    onTypeClick={(type) => {
                      setSelectedType(type === selectedType ? 'all' : type)
                    }}
                    selectedType={selectedType}
                    onExperienceLevelClick={(level) => {
                      setExperienceLevel(level === experienceLevel ? 'all' : level)
                    }}
                    selectedExperienceLevel={experienceLevel}
                    onLocationClick={(location) => {
                      setSelectedLocation(location === selectedLocation ? 'all' : location)
                    }}
                    selectedLocation={selectedLocation}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Desktop Two-Column View */}
      {viewMode === 'two-column' && (
        <div className="hidden md:flex gap-4 -mx-6 md:-mx-12 px-6 md:px-12">
          {/* Left Column - List */}
          <div ref={listContainerRef} className="w-96 flex-shrink-0 space-y-3">
            {filteredAndSortedOpportunities.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-zinc-500 text-sm">No opportunities found</p>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-red-500 hover:text-red-400 mt-2"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filteredAndSortedOpportunities.map((opportunity) => {
                // Normalize location for filtering (same logic as in filter)
                const normalizeLocation = (location: string): string => {
                  const loc = location.toLowerCase()
                  if (loc.includes('remote')) return 'Remote'
                  if (location === 'Global' || location === 'Worldwide') return 'Remote'
                  return location.split('/')[0].trim()
                }
                const normalizedLocation = normalizeLocation(opportunity.location)

                return (
                  <div key={opportunity.id} data-opportunity-id={opportunity.id}>
                    <TwoColumnOpportunityItem
                      opportunity={opportunity}
                      isSelected={opportunity.id === selectedOpportunityId}
                      onClick={() => setSelectedOpportunityId(opportunity.id)}
                      onTagClick={(tag) => {
                        setSelectedTags(prev => 
                          prev.includes(tag) 
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        )
                      }}
                      selectedTags={selectedTags}
                      onTypeClick={(type) => {
                        setSelectedType(type === selectedType ? 'all' : type)
                      }}
                      selectedType={selectedType}
                      onLocationClick={(location) => {
                        setSelectedLocation(location === selectedLocation ? 'all' : location)
                      }}
                      selectedLocation={selectedLocation}
                    />
                  </div>
                )
              })
            )}
          </div>

          {/* Right Column - Detail (Sticky) */}
          <div className="flex-1 min-w-0">
            <div className="sticky top-4 self-start">
              {selectedOpportunity ? (
                <TwoColumnOpportunityDetail
                  key={selectedOpportunity.id}
                  opportunity={selectedOpportunity}
                  onTagClick={(tag) => {
                    setSelectedTags(prev => 
                      prev.includes(tag) 
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    )
                  }}
                  selectedTags={selectedTags}
                />
              ) : (
                <div className="flex items-center justify-center bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg" style={{ minHeight: '400px' }}>
                  <p className="text-zinc-500 text-sm">Select an opportunity to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TableRow({ 
  opportunity, 
  onTagClick, 
  selectedTags,
  onTypeClick,
  selectedType,
  onExperienceLevelClick,
  selectedExperienceLevel,
  onLocationClick,
  selectedLocation
}: { 
  opportunity: Opportunity
  onTagClick: (tag: string) => void
  selectedTags: string[]
  onTypeClick: (type: OpportunityType) => void
  selectedType: OpportunityType | 'all'
  onExperienceLevelClick: (level: ExperienceLevel) => void
  selectedExperienceLevel: ExperienceLevel | 'all'
  onLocationClick: (location: string) => void
  selectedLocation: string
}) {
  const typeLabels: Record<OpportunityType, string> = {
    job: 'Job',
    bounty: 'Bounty',
    grant: 'Grant',
    project: 'Project',
  }

  const levelLabels: Record<ExperienceLevel, string> = {
    entry: 'Entry',
    mid: 'Mid',
    senior: 'Senior',
    lead: 'Lead',
    any: '',
  }

  // When tag filters are active, bring matching tags to the front so the filtered-by tag is visible
  const hasSelectedTags = selectedTags.length > 0
  const sortedTags = hasSelectedTags
    ? [...opportunity.tags].sort((a, b) => {
        const aSelected = selectedTags.includes(a)
        const bSelected = selectedTags.includes(b)
        if (aSelected === bSelected) return 0
        return aSelected ? -1 : 1
      })
    : opportunity.tags

  const previewTags = sortedTags.slice(0, 2)

  const formatLocation = (location: string) => {
    const loc = location.toLowerCase()
    if (loc.includes('remote')) return 'Remote'
    if (location === 'Global' || location === 'Worldwide') return 'Remote'
    return location.split('/')[0].trim()
  }

  return (
    <tr className="hover:bg-[rgba(245,245,245,0.024)] transition-colors group">
      {/* Company */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/company/${getCompanySlug(opportunity.company)}`}
            className="block"
          >
            <div className="w-8 h-8 rounded bg-[rgba(245,245,245,0.08)] overflow-hidden flex-shrink-0">
              <img 
                src={opportunity.companyLogo} 
                alt={opportunity.company}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
          <Link
            href={`/company/${getCompanySlug(opportunity.company)}`}
            className="text-sm text-white font-medium truncate max-w-[120px] hover:text-red-400 transition-colors"
            title={opportunity.company}
          >
            {opportunity.company}
          </Link>
        </div>
      </td>
      
      {/* Role */}
      <td className="py-3 px-4">
        <div>
          <a
            href={opportunity.applicationUrl}
            className="text-sm text-white font-medium group-hover:text-red-400 transition-colors block"
            title={opportunity.title}
          >
            {opportunity.title}
          </a>
          {/* Skills preview */}
          <div className="flex items-center gap-1.5 mt-1 flex-nowrap overflow-hidden min-w-0">
            {previewTags.map(tag => {
              const isSelected = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTagClick(tag)
                  }}
                  className={`text-[12px] px-1.5 py-0.5 rounded transition-colors cursor-pointer whitespace-nowrap max-w-[110px] overflow-hidden text-ellipsis ${
                    isSelected
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-[rgba(245,245,245,0.04)] text-zinc-500 hover:bg-[rgba(245,245,245,0.08)] hover:text-zinc-400'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
            {opportunity.experienceLevel && opportunity.experienceLevel !== 'any' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onExperienceLevelClick(opportunity.experienceLevel!)
                }}
                className={`text-[12px] px-1.5 py-0.5 rounded transition-colors cursor-pointer whitespace-nowrap ${
                  selectedExperienceLevel === opportunity.experienceLevel
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'text-zinc-400 hover:bg-[rgba(245,245,245,0.08)] hover:text-zinc-300'
                }`}
              >
                · {levelLabels[opportunity.experienceLevel]}
              </button>
            )}
          </div>
        </div>
      </td>
      
      {/* Type */}
      <td className="py-3 px-4 hidden sm:table-cell">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onTypeClick(opportunity.type)
          }}
          className={`text-sm transition-colors cursor-pointer ${
            selectedType === opportunity.type
              ? `${typeConfig[opportunity.type].text} font-medium`
              : `text-zinc-400 ${typeConfig[opportunity.type].hoverText}`
          }`}
        >
          {typeLabels[opportunity.type]}
        </button>
      </td>
      
      {/* Location */}
      <td className="py-3 px-4 hidden lg:table-cell">
        <div className="flex items-center gap-1.5 text-sm text-zinc-400">
          <MapPin className="w-3.5 h-3.5 text-zinc-500" />
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLocationClick(formatLocation(opportunity.location))
            }}
            className={`truncate max-w-[100px] text-left transition-colors cursor-pointer ${
              selectedLocation !== 'all' && selectedLocation === formatLocation(opportunity.location)
                ? 'text-red-400 font-medium'
                : 'hover:text-zinc-300'
            }`}
            title={formatLocation(opportunity.location)}
          >
            {formatLocation(opportunity.location)}
          </button>
        </div>
      </td>
      
      {/* Compensation */}
      <td className="py-3 px-4">
        <span className="text-sm text-white font-medium">
          {opportunity.reward}
        </span>
      </td>
      
      {/* Applicants */}
      <td className="py-3 px-4 hidden md:table-cell">
        <span className="text-sm text-zinc-400">
          {opportunity.applicants || '—'}
        </span>
      </td>
      
      {/* Posted */}
      <td className="py-3 px-4 hidden sm:table-cell">
        <span className="text-sm text-zinc-500">
          {formatDate(opportunity.postedAt)}
        </span>
      </td>
      
      {/* Deadline */}
      <td className="py-3 px-4 hidden lg:table-cell">
        {opportunity.deadline ? (
          <span className={`text-sm ${(() => {
            const deadline = new Date(opportunity.deadline)
            const now = new Date()
            const diffDays = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            if (diffDays >= 0 && diffDays <= 7) return 'text-yellow-500'
            return 'text-zinc-400'
          })()}`}>
            {formatDeadline(opportunity.deadline)}
          </span>
        ) : (
          <span className="text-sm text-zinc-500">—</span>
        )}
      </td>
      
      {/* Action */}
      <td className="py-3 px-4 text-right">
        <a 
          href={opportunity.applicationUrl}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-400 bg-[rgba(245,245,245,0.08)] group-hover:text-white group-hover:bg-red-500 rounded-full transition-colors"
        >
          Apply
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </td>
    </tr>
  )
}
