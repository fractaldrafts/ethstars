import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { communities } from '@/data/communities'
import { ArrowLeft } from 'lucide-react'
import { getActivityLevelConfig } from '@/data/communities'
import { IconBrandX, IconBrandDiscord, IconBrandTelegram } from '@tabler/icons-react'
import CommunityEventsSection from '@/components/CommunityEventsSection'
import RelatedCommunitiesSection from '@/components/RelatedCommunitiesSection'

interface CommunityPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CommunityPage({ params }: CommunityPageProps) {
  const { id } = await params

  const community = communities.find((c) => c.id === id)

  if (!community) {
    return (
      <main className="min-h-screen bg-[#05071A]">
        <Navbar />
        <div className="pt-20 pb-16">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12">
            <div className="py-20 text-center text-zinc-500">
              <h1 className="text-2xl font-semibold text-white mb-2">Community not found</h1>
              <p className="text-sm mb-6">
                We couldn&apos;t find this community.
              </p>
              <Link
                href="/communities"
                className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to all communities</span>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  const activityConfig = getActivityLevelConfig(community.activityLevel)

  return (
    <main className="min-h-screen bg-[#05071A]">
      <Navbar />
      
      <div className="pt-20 pb-16">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="mb-4">
            <Link
              href="/communities"
              className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to all communities</span>
            </Link>
          </div>

          {/* Community Banner */}
          {community.banner && (
            <div className="w-full aspect-[3/1] rounded-lg overflow-hidden bg-[rgba(245,245,245,0.08)] mb-8">
              <img
                src={community.banner}
                alt={`${community.name} banner`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Community header */}
          <header className="pb-8 border-b border-[rgba(245,245,245,0.08)] mb-8">
            <div className="flex flex-col gap-5">
              {/* Row: logo + name + pill (+ desktop socials on the right) */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded bg-[rgba(245,245,245,0.08)] border border-[rgba(245,245,245,0.16)] overflow-hidden flex-shrink-0">
                    <img
                      src={community.logo}
                      alt={community.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold text-white">
                      {community.name}
                    </h1>
                    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-[rgba(245,245,245,0.06)] px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-200 uppercase w-fit">{community.memberCount.toLocaleString()} MEMBERS</span>
                  </div>
                </div>

                {/* Desktop social icons */}
                <div className="hidden md:flex items-center gap-3">
                  {community.twitter && (
                    <a
                      href={community.twitter}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <IconBrandX className="w-5 h-5" />
                    </a>
                  )}
                  {community.discord && (
                    <a
                      href={community.discord}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <IconBrandDiscord className="w-5 h-5" />
                    </a>
                  )}
                  {community.telegram && (
                    <a
                      href={community.telegram}
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
                {community.description}
              </p>

              {/* Mobile social buttons: full-width row */}
              <div className="w-full md:hidden">
                <div className="flex items-center gap-3 w-full">
                  {community.twitter && (
                    <a
                      href={community.twitter}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center h-12 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-100 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <IconBrandX className="w-5 h-5" />
                    </a>
                  )}
                  {community.discord && (
                    <a
                      href={community.discord}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center h-12 rounded-full bg-[rgba(245,245,245,0.06)] text-zinc-100 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <IconBrandDiscord className="w-5 h-5" />
                    </a>
                  )}
                  {community.telegram && (
                    <a
                      href={community.telegram}
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

          {/* Events Section */}
          <CommunityEventsSection community={community} />

          {/* Related Communities Section */}
          <RelatedCommunitiesSection community={community} />
        </div>
      </div>

      <Footer />
    </main>
  )
}
