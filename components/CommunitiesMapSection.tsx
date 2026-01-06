'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'
import CommunitiesList from './CommunitiesList'
import CommunityDetail from './CommunityDetail'
import { type Community } from '@/data/communities'
import { getUserLocationFromIP, getCountryCenter } from '@/lib/geolocation'
import { IconCurrentLocation } from '@tabler/icons-react'

// Dynamically import Globe component to avoid SSR issues with Three.js
const CommunitiesGlobe = dynamic(() => import('./CommunitiesGlobe'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-full bg-[rgba(245,245,245,0.04)] border border-[rgba(245,245,245,0.08)] rounded-lg overflow-hidden flex items-center justify-center">
      <div className="text-zinc-500 text-sm">Loading globe...</div>
    </div>
  ),
})

interface CommunitiesMapSectionProps {
  communities: Community[]
}

export default function CommunitiesMapSection({ communities }: CommunitiesMapSectionProps) {
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null)
  const [hoveredCommunityId, setHoveredCommunityId] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [focusPoint, setFocusPoint] = useState<{ lat: number; lng: number; altitude?: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')

  const allCountries = useMemo(
    () => Array.from(new Set(communities.map((c) => c.location.country))).sort(),
    [communities]
  )

  const filteredCountries = useMemo(
    () =>
      allCountries.filter((country) =>
        country.toLowerCase().includes(countrySearch.trim().toLowerCase())
      ),
    [allCountries, countrySearch]
  )

  const visibleCommunities = useMemo(
    () =>
      communities.filter((community) =>
        selectedCountry === 'all' ? true : community.location.country === selectedCountry
      ),
    [communities, selectedCountry]
  )

  // If the current selection is no longer visible under the country filter, clear it
  useEffect(() => {
    if (selectedCommunity && !visibleCommunities.some((c) => c.id === selectedCommunity.id)) {
      setSelectedCommunity(null)
    }
  }, [visibleCommunities, selectedCommunity])

  const handleCommunitySelect = (community: Community) => {
    // When user explicitly picks a community, let that control the camera
    setFocusPoint(null)
    setSelectedCommunity(selectedCommunity?.id === community.id ? null : community)
  }

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value)

    if (value === 'all') {
      // World view
      setFocusPoint({ lat: 20, lng: 0, altitude: 1.8 })
    } else {
      const { lat, lng, zoom } = getCountryCenter(value)
      // Map zoom (approx. 2–11) -> globe altitude (~0.7–1.9)
      const altitude = Math.max(0.7, 2.2 - zoom * 0.15)
      setFocusPoint({ lat, lng, altitude })
    }
  }

  const handleCloseDetail = () => {
    setSelectedCommunity(null)
  }

  return (
    <div className="flex gap-4 -mx-6 md:-mx-12 px-6 md:px-12">
      {/* Left Column - List */}
      <div className="w-96 flex-shrink-0">
        <CommunitiesList
          communities={visibleCommunities}
          selectedCommunityId={selectedCommunity?.id || null}
          onCommunitySelect={handleCommunitySelect}
          hoveredCommunityId={hoveredCommunityId}
          onCommunityHover={setHoveredCommunityId}
        />
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
                          setSelectedCountry(location.country)
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
                      selectedCountry === 'all'
                        ? 'border-[rgba(245,245,245,0.12)] bg-[rgba(5,7,26,0.9)] text-zinc-200 hover:border-zinc-500'
                        : 'border-red-500/70 bg-red-500/25 text-red-100 hover:border-red-400'
                    } focus:outline-none focus:border-red-500 transition-colors`}
                  >
                    <span className="max-w-[120px] truncate">
                      {selectedCountry === 'all' ? 'All countries' : selectedCountry}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${
                        isCountryMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {selectedCountry !== 'all' && (
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
                            placeholder="Search countries..."
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
                            selectedCountry === 'all'
                              ? 'bg-red-500/10 text-red-400'
                              : 'text-zinc-200 hover:bg-[rgba(15,23,42,0.9)]'
                          }`}
                        >
                          <span>All countries</span>
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
                              selectedCountry === country
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
            />
            
            {/* Community Details Overlay - Slides in from right */}
            <AnimatePresence>
              {selectedCommunity && (
                <motion.div
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1], // Custom cubic-bezier for organic feel
                  }}
                  className="absolute top-4 right-4 bottom-4 w-[480px] z-50"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="h-full"
                  >
                    <CommunityDetail
                      community={selectedCommunity}
                      onClose={handleCloseDetail}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

