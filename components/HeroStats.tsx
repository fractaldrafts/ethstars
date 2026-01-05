'use client'

import { motion } from 'framer-motion'
import { Briefcase, Gift, Coins, Rocket, TrendingUp, Users } from 'lucide-react'

const stats = [
  { label: 'Active Jobs', value: '240+', icon: Briefcase, color: 'from-emerald-500 to-emerald-600' },
  { label: 'Open Bounties', value: '85', icon: Gift, color: 'from-orange-500 to-orange-600' },
  { label: 'Available Grants', value: '$2.5M', icon: Coins, color: 'from-violet-500 to-violet-600' },
  { label: 'Active Projects', value: '120+', icon: Rocket, color: 'from-blue-500 to-blue-600' },
]

export default function HeroStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300" style={{ backgroundImage: `linear-gradient(135deg, ${stat.color.split(' ')[0].replace('from-', '')}20, transparent)` }} />
            
            <div className="relative glass rounded-2xl p-5 card-hover">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-display font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">
                {stat.label}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

