'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FeaturedCommunitiesSection from '@/components/FeaturedCommunitiesSection'
import CommunitiesTable from '@/components/CommunitiesTable'

export default function CommunitiesPage() {
  return (
    <main className="min-h-screen bg-[#05071A]">
      <Navbar />
      
      <div className="pt-20 pb-16">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          {/* Header */}
          <header className="py-8 border-b border-[rgba(245,245,245,0.08)] mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">Ethereum Communities</h1>
            <p className="text-zinc-500 text-sm">
              Discover and connect with Ethereum communities around the world. Find local meetups, developer groups, and builders in your city.
            </p>
          </header>

          {/* Featured Communities Section */}
          <FeaturedCommunitiesSection />

          {/* All Communities */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">All Communities</h2>
            <CommunitiesTable />
          </section>
        </div>
      </div>

      {/* Floating CTA Button - Mobile Only */}
      <button className="md:hidden fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all">
        <img src="/add-opportunity.svg" alt="Add Community" className="w-6 h-6" />
      </button>

      <Footer />
    </main>
  )
}

