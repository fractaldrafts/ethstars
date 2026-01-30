'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FeaturedSection from '@/components/FeaturedSection'
import OpportunityTable from '@/components/OpportunityTable'

export default function OpportunitiesPage() {
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-[#05071A]">
      <Navbar />
      
      <div className="pt-20 pb-16">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          {/* Header - secondary CTA "Add opportunity" on desktop only; mobile uses floating button */}
          <header className="py-8 border-b border-[rgba(245,245,245,0.08)] mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-2">Earning Opportunities</h1>
              <p className="text-zinc-500 text-sm">
                Jobs, bounties, grants, and projects from the Ethereum ecosystem
              </p>
            </div>
            <Link
              href="/earn/add-new"
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[rgba(245,245,245,0.15)] text-sm font-medium text-zinc-300 hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors shrink-0"
              aria-label="Add opportunity"
            >
              <img src="/add-opportunity.svg" alt="" className="w-4 h-4 opacity-90" />
              Add opportunity
            </Link>
          </header>

          {/* Featured Section */}
          <FeaturedSection onOpportunityClick={setSelectedOpportunityId} />

          {/* All Opportunities */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">All Opportunities</h2>
            <OpportunityTable selectOpportunityId={selectedOpportunityId} />
          </section>
        </div>
      </div>

      {/* Floating CTA Button - Mobile Only */}
      <Link
        href="/earn/add-new"
        className="md:hidden fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all"
        aria-label="Add opportunity"
      >
        <img src="/add-opportunity.svg" alt="" className="w-6 h-6" />
      </Link>

      <Footer />
    </main>
  )
}
