'use client'

import { Search, Filter, Grid3X3, List, Briefcase, Gift, Coins, Rocket, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { OpportunityType } from '@/data/opportunities'

interface FilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedType: OpportunityType | 'all'
  onTypeChange: (type: OpportunityType | 'all') => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  resultCount: number
}

const typeFilters: { type: OpportunityType | 'all'; label: string; icon: typeof Briefcase; color: string }[] = [
  { type: 'all', label: 'All', icon: Grid3X3, color: 'text-gray-400 hover:text-white' },
  { type: 'job', label: 'Jobs', icon: Briefcase, color: 'text-emerald-400' },
  { type: 'bounty', label: 'Bounties', icon: Gift, color: 'text-orange-400' },
  { type: 'grant', label: 'Grants', icon: Coins, color: 'text-violet-400' },
  { type: 'project', label: 'Projects', icon: Rocket, color: 'text-blue-400' },
]

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  viewMode,
  onViewModeChange,
  resultCount,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-10 py-3 text-white placeholder-gray-500 focus:border-violet-500/50 focus:bg-white/[0.07] transition-all"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => onSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
          <button
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-violet-600/20 to-blue-600/20 text-white border border-violet-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'grid'
                ? 'bg-gradient-to-r from-violet-600/20 to-blue-600/20 text-white border border-violet-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>
      
      {/* Type Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500 mr-1" />
        
        {typeFilters.map((filter) => {
          const isActive = selectedType === filter.type
          const FilterIcon = filter.icon
          
          return (
            <button
              key={filter.type}
              onClick={() => onTypeChange(filter.type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? filter.type === 'all'
                    ? 'bg-white/10 text-white border border-white/20'
                    : filter.type === 'job'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : filter.type === 'bounty'
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                    : filter.type === 'grant'
                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/30'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FilterIcon className="w-4 h-4" />
              {filter.label}
            </button>
          )
        })}
        
        {/* Result Count */}
        <div className="ml-auto text-sm text-gray-500">
          <span className="text-white font-medium">{resultCount}</span> opportunities
        </div>
      </div>
    </div>
  )
}

