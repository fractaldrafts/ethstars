import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MobileOpportunityDetail from '@/components/MobileOpportunityDetail'
import { opportunities } from '@/data/opportunities'
import { ArrowLeft } from 'lucide-react'

interface OpportunityPageProps {
  params: {
    id: string
  }
}

export default function OpportunityPage({ params }: OpportunityPageProps) {
  const { id } = params

  const opportunity = opportunities.find((opp) => opp.id === id)

  if (!opportunity) {
    return (
      <main className="min-h-screen bg-[#05071A]">
        <Navbar />
        <div className="pt-20 pb-16">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12">
            <div className="py-20 text-center text-zinc-500">
              <h1 className="text-2xl font-semibold text-white mb-2">Opportunity not found</h1>
              <p className="text-sm mb-6">
                We couldn&apos;t find this opportunity.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to all opportunities</span>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#05071A]">
      <Navbar />
      
      <div className="pt-20 pb-16">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          {/* Back button */}
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to all opportunities</span>
            </Link>
          </div>

          {/* Mobile detail view */}
          <MobileOpportunityDetail opportunity={opportunity} />
        </div>
      </div>

      <Footer />
    </main>
  )
}

