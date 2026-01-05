'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Inbox, Plus } from 'lucide-react'
import OpportunityCard from './OpportunityCard'
import OpportunityListItem from './OpportunityListItem'
import FilterBar from './FilterBar'
import { opportunities, type OpportunityType } from '@/data/opportunities'

export default function OpportunityList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<OpportunityType | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list') // Default to list view

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opportunity) => {
      // Type filter
      if (selectedType !== 'all' && opportunity.type !== selectedType) {
        return false
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          opportunity.title.toLowerCase().includes(query) ||
          opportunity.company.toLowerCase().includes(query) ||
          opportunity.intro.toLowerCase().includes(query) ||
          opportunity.tags.some(tag => tag.toLowerCase().includes(query))
        )
      }
      
      return true
    })
  }, [searchQuery, selectedType])

  return (
    <section>
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        resultCount={filteredOpportunities.length}
      />
      
      <AnimatePresence mode="wait">
        {filteredOpportunities.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Inbox className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No opportunities found</h3>
            <p className="text-gray-400 text-center max-w-md mb-6">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedType('all')
              }}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors"
            >
              Clear filters
            </button>
          </motion.div>
        ) : viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex flex-col gap-2"
          >
            {filteredOpportunities.map((opportunity, index) => (
              <OpportunityListItem
                key={opportunity.id}
                opportunity={opportunity}
                index={index}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredOpportunities.map((opportunity, index) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Post CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <button className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all group">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span className="hidden sm:inline">Post Opportunity</span>
        </button>
      </motion.div>
    </section>
  )
}
