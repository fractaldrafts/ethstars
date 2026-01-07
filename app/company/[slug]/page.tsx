import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import OpportunityTable from '@/components/OpportunityTable'
import { opportunities, getCompanySlug, getCompanyIntro } from '@/data/opportunities'
import { ArrowLeft } from 'lucide-react'
import { IconBrandX, IconBrandDiscord, IconBrandTelegram } from '@tabler/icons-react'

interface CompanyPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { slug } = await params

  const companyOpportunities = opportunities.filter(
    (opportunity) => getCompanySlug(opportunity.company) === slug
  )

  const company = companyOpportunities[0]
  const intro = company
    ? getCompanyIntro(slug, company.company) || `Explore jobs, bounties, grants, and projects at ${company.company}. Below are all the current opportunities we've indexed for this team.`
    : ''

  return (
    <main className="min-h-screen bg-[#05071A]">
      <Navbar />

      <div className="pt-20 pb-16">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          {company ? (
            <>
              <div className="mb-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to all opportunities</span>
                </Link>
              </div>

              {/* Company header */}
              <header className="pb-8 border-b border-[rgba(245,245,245,0.08)] mb-8">
                <div className="flex flex-col gap-5">
                  {/* Row: logo + name + pill (+ desktop socials on the right) */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded bg-[rgba(245,245,245,0.08)] border border-[rgba(245,245,245,0.16)] overflow-hidden flex-shrink-0">
                        <img
                          src={company.companyLogo}
                          alt={company.company}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col sm:items-center gap-2">
                          <h1 className="text-2xl font-semibold text-white">
                            {company.company}
                          </h1>
                          <span className="inline-flex items-center rounded-full bg-[rgba(245,245,245,0.06)] px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-200 uppercase">
                            {companyOpportunities.length}{' '}
                            {companyOpportunities.length === 1
                              ? 'open opportunity'
                              : 'open opportunities'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop social icons */}
                    <div className="hidden md:flex items-center gap-3">
                      {company.twitter && (
                        <a
                          href={company.twitter}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                          <IconBrandX className="w-5 h-5" />
                        </a>
                      )}
                      {company.discord && (
                        <a
                          href={company.discord}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                          <IconBrandDiscord className="w-5 h-5" />
                        </a>
                      )}
                      {company.telegram && (
                        <a
                          href={company.telegram}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                          <IconBrandTelegram className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Intro text under header */}
                  <p className="text-sm text-zinc-500 max-w-xl">
                    {intro}
                  </p>

                  {/* Mobile social buttons: full-width row */}
                  <div className="w-full md:hidden">
                    <div className="flex items-center gap-3 w-full">
                      {company.twitter && (
                        <a
                          href={company.twitter}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center h-12 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-100 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                          <IconBrandX className="w-5 h-5" />
                        </a>
                      )}
                      {company.discord && (
                        <a
                          href={company.discord}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center h-12 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-100 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                          <IconBrandDiscord className="w-5 h-5" />
                        </a>
                      )}
                      {company.telegram && (
                        <a
                          href={company.telegram}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center h-12 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-100 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                          <IconBrandTelegram className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </header>

              {/* Opportunities table */}
              <section>
                <h2 className="text-lg font-semibold text-white mb-4">
                  Opportunities at {company.company}
                </h2>
                <OpportunityTable baseOpportunities={companyOpportunities} />
              </section>
            </>
          ) : (
            <div className="py-20 text-center text-zinc-500">
              <h1 className="text-2xl font-semibold text-white mb-2">Company not found</h1>
              <p className="text-sm">
                We couldn&apos;t find any opportunities for this company right now.
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}


