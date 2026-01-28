'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ChevronDown, Search, Share2 } from 'lucide-react'
import CommunitiesList from './CommunitiesList'
import { type Community } from '@/data/communities'
import { getUserLocationFromIP, getCountryCenter } from '@/lib/geolocation'
import { IconCurrentLocation } from '@tabler/icons-react'
import CommunitiesShareableImage from './CommunitiesShareableImage'

// Dynamically import Globe component to avoid SSR issues with Three.js
const CommunitiesGlobe = dynamic(() => import('./CommunitiesGlobe'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-full bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg overflow-hidden flex items-center justify-center">
      <div className="text-zinc-500 text-sm">Loading globe...</div>
    </div>
  ),
})

import type { FilterEmptyStateConfig } from './FilterEmptyState'

interface CommunitiesMapSectionProps {
  communities: Community[]
  selectedLocation: string
  onCountrySelect: (country: string | null) => void
  allCountries: string[]
  emptyStateConfig?: FilterEmptyStateConfig | null
}

export default function CommunitiesMapSection({
  communities,
  selectedLocation,
  onCountrySelect,
  allCountries,
  emptyStateConfig,
}: CommunitiesMapSectionProps) {
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null)
  const [hoveredCommunityId, setHoveredCommunityId] = useState<string | null>(null)
  const [focusPoint, setFocusPoint] = useState<{ lat: number; lng: number; altitude?: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)

  const filteredCountries = useMemo(
    () =>
      allCountries.filter((country) =>
        country.toLowerCase().includes(countrySearch.trim().toLowerCase())
      ),
    [allCountries, countrySearch]
  )

  // Communities already filtered by table (including location). Use as-is.
  const visibleCommunities = communities

  // If the current selection is no longer visible, clear it
  useEffect(() => {
    if (selectedCommunity && !visibleCommunities.some((c) => c.id === selectedCommunity.id)) {
      setSelectedCommunity(null)
    }
  }, [visibleCommunities, selectedCommunity])

  // Sync globe focus when selectedLocation changes (e.g. from table advanced filters)
  useEffect(() => {
    if (selectedLocation === 'all' || selectedLocation === 'remote') {
      setFocusPoint({ lat: 20, lng: 0, altitude: 1.8 })
    } else {
      const { lat, lng, zoom } = getCountryCenter(selectedLocation)
      const altitude = Math.max(0.7, 2.2 - zoom * 0.15)
      setFocusPoint({ lat, lng, altitude })
    }
  }, [selectedLocation])

  const handleCommunitySelect = (community: Community) => {
    // When user explicitly picks a community, let that control the camera
    setFocusPoint(null)
    setSelectedCommunity(selectedCommunity?.id === community.id ? null : community)
  }

  // Map TopoJSON country names to community country names
  const mapTopoJSONCountryToCommunityCountry = (topoJSONCountry: string): string | null => {
    // First try exact match
    if (allCountries.includes(topoJSONCountry)) {
      return topoJSONCountry
    }
    
    // Try case-insensitive match
    const exactMatch = allCountries.find(
      country => country.toLowerCase() === topoJSONCountry.toLowerCase()
    )
    if (exactMatch) {
      return exactMatch
    }
    
    // Common mappings from TopoJSON to community data
    const countryMappings: Record<string, string> = {
      'United States of America': 'USA',
      'United States': 'USA',
      'United Kingdom': 'UK',
      'United Arab Emirates': 'UAE',
    }
    
    if (countryMappings[topoJSONCountry]) {
      const mapped = countryMappings[topoJSONCountry]
      if (allCountries.includes(mapped)) {
        return mapped
      }
    }
    
    // Try partial match (e.g., "United States" contains "USA")
    const partialMatch = allCountries.find(country => {
      const topoLower = topoJSONCountry.toLowerCase()
      const commLower = country.toLowerCase()
      return topoLower.includes(commLower) || commLower.includes(topoLower)
    })
    
    return partialMatch || null
  }

  const handleCountryChange = (value: string) => {
    onCountrySelect(value === 'all' ? null : value)

    if (value === 'all') {
      setFocusPoint({ lat: 20, lng: 0, altitude: 1.8 })
    } else {
      const { lat, lng, zoom } = getCountryCenter(value)
      const altitude = Math.max(0.7, 2.2 - zoom * 0.15)
      setFocusPoint({ lat, lng, altitude })
    }
  }

  const handleCountrySelectFromGlobe = (topoJSONCountry: string | null) => {
    if (!topoJSONCountry) {
      handleCountryChange('all')
      return
    }
    const communityCountry = mapTopoJSONCountryToCommunityCountry(topoJSONCountry)
    const countryToSelect = communityCountry || topoJSONCountry
    handleCountryChange(countryToSelect === 'all' ? 'all' : countryToSelect)
  }


  return (
    <div className="flex gap-4 -mx-6 md:-mx-12 px-6 md:px-12">
      {/* Left Column - List */}
      <div className="w-96 flex-shrink-0">
        <div className="sticky top-4 h-[calc(100vh-200px)] max-h-[calc(100vh-200px)] min-h-[500px]">
          <CommunitiesList
            communities={visibleCommunities}
            selectedCommunityId={selectedCommunity?.id || null}
            onCommunitySelect={handleCommunitySelect}
            hoveredCommunityId={hoveredCommunityId}
            onCommunityHover={setHoveredCommunityId}
            selectedCountry={selectedLocation === 'all' || selectedLocation === 'remote' ? null : selectedLocation}
            emptyStateConfig={emptyStateConfig}
          />
        </div>
      </div>

      {/* Right Column - Globe with Overlay */}
      <div className="flex-1 min-w-0">
        <div className="sticky top-4 self-start">
          <div className="h-[calc(100vh-200px)] max-h-[calc(100vh-200px)] min-h-[500px] relative">
            {/* Top-right controls: Locate me & Country filter */}
            <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setIsLocating(true)
                      const location = await getUserLocationFromIP()
                      if (location) {
                        // Filter to user's country if we have communities there
                        const hasCommunitiesInCountry = communities.some(
                          (c) => c.location.country === location.country
                        )
                        if (hasCommunitiesInCountry) {
                          onCountrySelect(location.country)
                        }

                        setFocusPoint({
                          lat: location.latitude,
                          lng: location.longitude,
                          altitude: 1.4,
                        })
                      }
                    } finally {
                      setIsLocating(false)
                    }
                  }}
                  disabled={isLocating}
                  aria-label="Locate me"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[rgba(245,245,245,0.16)] bg-[rgba(5,7,26,0.9)] text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-[rgba(15,23,42,0.95)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <IconCurrentLocation
                    className={`w-4 h-4 ${isLocating ? 'animate-pulse text-red-400' : ''}`}
                    stroke={1.7}
                  />
                </button>

                <div className="relative flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCountryMenuOpen((open) => !open)}
                    className={`inline-flex items-center justify-between gap-1.5 pl-3 pr-2 py-1.5 text-xs rounded-full border w-[156px] ${
                      selectedLocation === 'all'
                        ? 'border-[rgba(245,245,245,0.12)] bg-[rgba(5,7,26,0.9)] text-zinc-200 hover:border-zinc-500'
                        : 'border-red-500/70 bg-red-500/25 text-red-100 hover:border-red-400'
                    } focus:outline-none focus:border-red-500 transition-colors`}
                  >
                    <span className="max-w-[120px] truncate">
                      {selectedLocation === 'all' ? 'All locations' : selectedLocation}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${
                        isCountryMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {selectedLocation !== 'all' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCountryChange('all')
                        setCountrySearch('')
                        setIsCountryMenuOpen(false)
                      }}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs rounded-full border border-red-500/60 text-red-100 hover:bg-red-500/20 transition-colors h-[30px]"
                    >
                      Clear
                    </button>
                  )}

                  {isCountryMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-[rgba(148,163,184,0.35)] bg-[rgba(9,9,20,0.98)] shadow-xl shadow-black/40 backdrop-blur-lg z-50">
                      <div className="p-2 border-b border-[rgba(148,163,184,0.25)]">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                          <input
                            type="text"
                            autoFocus
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="Search locations..."
                            className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg bg-[rgba(15,23,42,0.9)] border border-[rgba(148,163,184,0.3)] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500/70"
                          />
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto py-1">
                        <button
                          type="button"
                          onClick={() => {
                            handleCountryChange('all')
                            setCountrySearch('')
                            setIsCountryMenuOpen(false)
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs rounded-md flex items-center justify-between ${
                            selectedLocation === 'all'
                              ? 'bg-red-500/10 text-red-400'
                              : 'text-zinc-200 hover:bg-[rgba(15,23,42,0.9)]'
                          }`}
                        >
                          <span>All locations</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleCountryChange('remote')
                            setCountrySearch('')
                            setIsCountryMenuOpen(false)
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs rounded-md flex items-center justify-between ${
                            selectedLocation === 'remote'
                              ? 'bg-red-500/10 text-red-400'
                              : 'text-zinc-200 hover:bg-[rgba(15,23,42,0.9)]'
                          }`}
                        >
                          <span>Remote</span>
                        </button>

                        {filteredCountries.length === 0 && (
                          <div className="px-3 py-2 text-[11px] text-zinc-500">No matches</div>
                        )}

                        {filteredCountries.map((country) => (
                          <button
                            key={country}
                            type="button"
                            onClick={() => {
                              handleCountryChange(country)
                              setCountrySearch('')
                              setIsCountryMenuOpen(false)
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs rounded-md flex items-center justify-between ${
                              selectedLocation === country
                                ? 'bg-red-500/10 text-red-400'
                                : 'text-zinc-200 hover:bg-[rgba(15,23,42,0.9)]'
                            }`}
                          >
                            <span className="truncate">{country}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <CommunitiesGlobe
              communities={visibleCommunities}
              selectedCommunity={selectedCommunity}
              onCommunitySelect={handleCommunitySelect}
              hoveredCommunityId={hoveredCommunityId}
              onCommunityHover={setHoveredCommunityId}
              focusPoint={focusPoint}
              onCountrySelect={handleCountrySelectFromGlobe}
              selectedCountryFilter={selectedLocation === 'all' || selectedLocation === 'remote' ? null : selectedLocation}
            />

            {/* Bottom-right Share Button */}
            <div className="absolute bottom-4 right-4 z-40">
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                aria-label="Share community map"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-[rgba(245,245,245,0.16)] bg-[rgba(5,7,26,0.9)] text-zinc-300 hover:text-white hover:border-red-500/50 hover:bg-red-500/10 transition-colors backdrop-blur-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shareable Image Modal */}
      {showShareModal && (
        <CommunitiesShareableImage
          communities={visibleCommunities}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}

