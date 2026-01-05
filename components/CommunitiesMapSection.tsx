'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import CommunitiesList from './CommunitiesList'
import CommunityDetail from './CommunityDetail'
import { type Community } from '@/data/communities'

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

  const handleCommunitySelect = (community: Community) => {
    setSelectedCommunity(selectedCommunity?.id === community.id ? null : community)
  }

  const handleCloseDetail = () => {
    setSelectedCommunity(null)
  }

  return (
    <div className="flex gap-4 -mx-6 md:-mx-12 px-6 md:px-12">
      {/* Left Column - List */}
      <div className="w-96 flex-shrink-0">
        <CommunitiesList
          communities={communities}
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
            <CommunitiesGlobe
              communities={communities}
              selectedCommunity={selectedCommunity}
              onCommunitySelect={handleCommunitySelect}
              hoveredCommunityId={hoveredCommunityId}
              onCommunityHover={setHoveredCommunityId}
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

