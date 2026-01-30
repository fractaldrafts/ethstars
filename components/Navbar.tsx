'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import TimezoneSelector from './TimezoneSelector'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isEarnPage = pathname === '/'

  const navLinks = [
    { name: 'Earn', href: '/', active: pathname === '/' },
    { name: 'Communities', href: '/communities', active: pathname === '/communities' },
    { name: 'Events', href: '/events', active: pathname === '/events' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-glass">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <a href="https://ethstars.xyz" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="ETHStars" 
              className="h-7"
            />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-sm uppercase transition-colors ${
                  link.active 
                    ? 'text-white' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA - Add Opportunity on Earn page, TimezoneSelector elsewhere */}
          <div className="hidden md:flex items-center gap-3">
            {isEarnPage ? (
              <Link
                href="/earn/add-new"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-500/90 text-xs font-medium text-white hover:bg-red-500 transition-colors uppercase"
                aria-label="Add opportunity"
              >
                <img src="/add-opportunity.svg" alt="" className="w-4 h-4 opacity-90" />
                Add
              </Link>
            ) : (
              <TimezoneSelector />
            )}
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[rgba(245,245,245,0.06)] text-xs font-medium text-zinc-300 hover:bg-red-500 hover:text-white transition-colors uppercase">
              Login
            </button>
          </div>

          {/* Mobile CTA and menu button */}
          <div className="md:hidden flex items-center gap-2">
            {isEarnPage ? (
              <Link
                href="/earn/add-new"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-500/90 text-xs font-medium text-white hover:bg-red-500 transition-colors uppercase"
                aria-label="Add opportunity"
              >
                <img src="/add-opportunity.svg" alt="" className="w-4 h-4 opacity-90" />
                Add
              </Link>
            ) : (
              <TimezoneSelector />
            )}
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[rgba(245,245,245,0.06)] text-xs font-medium text-zinc-300 hover:bg-red-500 hover:text-white transition-colors uppercase">
              Login
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[rgba(245,245,245,0.08)] bg-[#05071A]">
          <div className="px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`block text-sm uppercase ${
                  link.active ? 'text-white' : 'text-zinc-500'
                }`}
              >
                {link.name}
              </a>
            ))}
            {isEarnPage && (
              <Link
                href="/earn/add-new"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-500/90 text-xs font-medium text-white hover:bg-red-500 transition-colors uppercase"
              >
                <img src="/add-opportunity.svg" alt="" className="w-4 h-4 opacity-90" />
                Add Opportunity
              </Link>
            )}
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[rgba(245,245,245,0.06)] text-xs font-medium text-zinc-300 hover:bg-red-500 hover:text-white mt-4 transition-colors uppercase">
              Login
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
