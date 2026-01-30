'use client'

import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AddOpportunityFlow from '@/components/AddOpportunityFlow'

export default function AddOpportunityPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#05071A]">
      <Navbar />

      <div className="pt-20 pb-16">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <AddOpportunityFlow
            onComplete={() => router.push('/')}
            onCancel={() => router.push('/')}
          />
        </div>
      </div>

      <Footer />
    </main>
  )
}
