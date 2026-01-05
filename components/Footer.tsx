'use client'

import { useState } from 'react'
import { IconBrandX, IconBrandTelegram } from '@tabler/icons-react'

export default function Footer() {
  const [email, setEmail] = useState('')

  const navLinks = [
    { name: 'Earn', href: '/' },
    { name: 'Communities', href: 'https://ethstars.xyz/communities' },
    { name: 'Events', href: 'https://ethstars.xyz/events' },
    { name: 'Geode Labs', href: 'https://geodelab.com' },
  ]

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle newsletter subscription
    console.log('Subscribe:', email)
    setEmail('')
  }

  return (
    <footer className="bg-[#05071A] w-full">
      <div className="max-w-[1280px] mx-auto px-5 md:px-16 pt-0 pb-12 md:pb-20">
        {/* Top Divider */}
        <div className="border-t border-[rgba(245,245,245,0.08)] mb-20"></div>

        {/* Main Content */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-12 md:gap-0 mb-12 md:mb-8">
          {/* Left Column - Logo and Links */}
          <div className="flex flex-col gap-8 flex-1 items-center md:items-start">
            {/* Logo */}
            <div className="flex items-center justify-center md:justify-start">
              <a href="https://ethstars.xyz" className="flex items-center">
                <img 
                  src="/logo.png" 
                  alt="ETHStars" 
                  className="h-9"
                />
              </a>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-wrap gap-8 justify-center md:justify-start">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm text-white hover:text-zinc-400 transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Right Column - Newsletter */}
          <div className="flex flex-col gap-4 md:w-[400px] w-full items-center md:items-start">
            <p className="text-white text-base text-center md:text-left">
              <span className="font-medium">Subscribe</span>
              <span className="font-light"> to our newsletter</span>
            </p>

            {/* Newsletter Form */}
            <form onSubmit={handleSubscribe} className="w-full flex flex-col md:flex-row gap-4 md:gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 bg-[rgba(255,255,255,0.08)] px-4 py-3 rounded-full md:rounded-[30px] text-white placeholder:text-[rgba(255,255,255,0.6)] text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                required
              />
              <button
                type="submit"
                className="bg-[#ec3131] hover:bg-[#d32a2a] px-6 py-3 rounded-full text-white text-base font-medium transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Divider */}
        <div className="border-t border-[rgba(245,245,245,0.08)] mb-8"></div>

        {/* Footer Credits Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Footer Links */}
          <div className="flex gap-6 justify-center md:justify-start">
            <a
              href="#"
              className="text-sm text-white underline font-light hover:text-zinc-400 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-sm text-white underline font-light hover:text-zinc-400 transition-colors"
            >
              Terms of Service
            </a>
          </div>

          {/* Social Icons */}
          <div className="flex gap-4 justify-center md:justify-start">
            <a
              href="https://twitter.com/ethstars"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-zinc-400 transition-colors"
              aria-label="X (Twitter)"
            >
              <IconBrandX className="w-5 h-5" />
            </a>
            <a
              href="https://t.me/ethstars"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-zinc-400 transition-colors"
              aria-label="Telegram"
            >
              <IconBrandTelegram className="w-5 h-5" />
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-white font-light text-center md:text-left">
            © 2025 Geode Labs. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
