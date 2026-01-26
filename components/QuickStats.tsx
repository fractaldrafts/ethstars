'use client'

import { Briefcase, Calendar, Globe, CheckCircle2 } from 'lucide-react'

export default function QuickStats() {
  const stats = [
    {
      label: 'Earning Opportunities',
      value: '1,200+',
      icon: Briefcase,
    },
    {
      label: 'Global Events',
      value: 'Weekly',
      icon: Calendar,
    },
    {
      label: 'Active Communities',
      value: '40+ Countries',
      icon: Globe,
    },
    {
      label: 'Quality Check',
      value: 'Manually Curated',
      icon: CheckCircle2,
    },
  ]

  return (
    <section className="py-8 border-y border-white/5 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center text-center md:flex-row md:text-left md:items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5 text-zinc-400">
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-white font-semibold text-lg leading-tight mb-1">
                  {stat.value}
                </div>
                <div className="text-zinc-500 text-sm font-medium">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
