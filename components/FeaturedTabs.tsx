'use client'

import { useState } from 'react'
import { featuredOpportunities } from '@/data/opportunities'
import { events } from '@/data/events'
import { featuredCommunities } from '@/data/communities'
import { ArrowRight, MapPin, Calendar, Users, DollarSign } from 'lucide-react'
import Link from 'next/link'

type Tab = 'Live Opportunities' | 'Happening This Week' | 'New Communities'

export default function FeaturedTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('Live Opportunities')

  const renderContent = () => {
    switch (activeTab) {
      case 'Live Opportunities':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredOpportunities.slice(0, 3).map(opp => (
              <Link key={opp.id} href={`/opportunity/${opp.id}`} className="group block p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.07]">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden">
                    <img src={opp.companyLogo} alt={opp.company} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded border ${
                    opp.type === 'job' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    opp.type === 'bounty' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                    'bg-purple-500/10 border-purple-500/20 text-purple-400'
                  }`}>
                    {opp.type}
                  </span>
                </div>
                <h3 className="text-white font-medium mb-1 truncate group-hover:text-blue-400 transition-colors">{opp.title}</h3>
                <p className="text-zinc-500 text-sm mb-3 truncate">{opp.company}</p>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span>{opp.reward}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      case 'Happening This Week':
        // Mock filter for "This Week" or just take next 3 upcoming events
        // In a real app we'd filter strictly by date range
        const upcomingEvents = events
          .filter(e => new Date(e.date) >= new Date())
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3)

        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingEvents.map(event => (
              <a key={event.id} href={event.eventUrl} target="_blank" rel="noopener noreferrer" className="group block p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.07]">
                 <div className="flex items-start justify-between mb-3">
                   {/* Fallback icon or image logic */}
                   <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                     <Calendar className="w-5 h-5" />
                   </div>
                   <span className="text-xs px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                     Event
                   </span>
                 </div>
                 <h3 className="text-white font-medium mb-1 truncate group-hover:text-blue-400 transition-colors">{event.title}</h3>
                 <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2">
                   <div className="flex items-center gap-1">
                     <Calendar className="w-3 h-3" />
                     <span>{new Date(event.date).toLocaleDateString()}</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <MapPin className="w-3 h-3" />
                     <span className="truncate max-w-[100px]">{event.location}</span>
                   </div>
                 </div>
              </a>
            ))}
          </div>
        )
      case 'New Communities':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredCommunities.slice(0, 3).map(community => (
              <Link key={community.id} href={`/communities/${community.id}`} className="group block p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.07]">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden">
                    <img src={community.logo} alt={community.name} className="w-full h-full object-cover" />
                  </div>
                   <span className="text-xs px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
                     Community
                   </span>
                </div>
                <h3 className="text-white font-medium mb-1 truncate group-hover:text-blue-400 transition-colors">{community.name}</h3>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{community.memberCount.toLocaleString()} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{community.location.city}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
    }
  }

  return (
    <section className="py-12 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex gap-1 bg-white/5 p-1 rounded-lg self-start">
            {['Live Opportunities', 'Happening This Week', 'New Communities'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as Tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <Link href="/opportunities" className="hidden sm:flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {renderContent()}
      </div>
    </section>
  )
}
