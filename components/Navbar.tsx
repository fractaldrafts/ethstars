'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

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

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-full text-sm font-semibold text-white uppercase transition-colors">
              Add Opportunity
            </button>
          </div>

          {/* Mobile CTA and menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-full text-sm font-semibold text-white uppercase transition-colors">
              Add Opportunity
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
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 rounded-full text-sm font-medium text-white mt-4">
              <img src="/add-opportunity.svg" alt="" className="w-4 h-4" />
              Add Opportunity
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
