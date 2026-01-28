'use client'

import { useRef, useState, useMemo, useEffect } from 'react'
import { Download, X, Loader2, Globe } from 'lucide-react'
import html2canvas from 'html2canvas'
import { type Community, communities as allCommunities } from '@/data/communities'

interface CommunitiesShareableImageProps {
  communities: Community[]
  onClose: () => void
}

// Mercator projection for converting lat/lng to x/y coordinates
function latLngToXY(lat: number, lng: number, width: number, height: number): { x: number; y: number } {
  // Simple Mercator projection
  const x = ((lng + 180) / 360) * width
  
  // Mercator projection for latitude (clamped for better display)
  const clampedLat = Math.max(-80, Math.min(80, lat))
  const latRad = (clampedLat * Math.PI) / 180
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2))
  const y = (height / 2) - (width * mercN) / (2 * Math.PI)
  
  return { x, y }
}

export default function CommunitiesShareableImage({
  communities,
  onClose,
}: CommunitiesShareableImageProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [useAllCommunities, setUseAllCommunities] = useState(true)
  
  // Use all communities or filtered based on toggle
  const displayCommunities = useAllCommunities ? allCommunities : communities

  // Calculate stats
  const stats = useMemo(() => {
    const countries = new Set(displayCommunities.map(c => c.location.country))
    const cities = new Set(displayCommunities.map(c => c.location.city))
    
    return {
      total: displayCommunities.length,
      countries: countries.size,
      cities: cities.size,
    }
  }, [displayCommunities])

  // Group communities by country for the top countries display
  const topCountries = useMemo(() => {
    const countryCount: Record<string, number> = {}
    displayCommunities.forEach(c => {
      countryCount[c.location.country] = (countryCount[c.location.country] || 0) + 1
    })
    return Object.entries(countryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [displayCommunities])

  const handleDownload = async () => {
    if (!canvasRef.current) return
    
    setIsGenerating(true)
    
    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2, // Higher resolution for crisp social media images
        backgroundColor: '#05071a',
        logging: false,
        useCORS: true,
        allowTaint: true,
      })
      
      // Create download link
      const link = document.createElement('a')
      link.download = `ethereum-communities-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
    } catch (error) {
      console.error('Error generating image:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })

  const isFiltered = communities.length !== allCommunities.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative max-w-4xl w-full max-h-[90vh] overflow-auto bg-[#0a0a14] rounded-2xl border border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex flex-col gap-3 p-4 border-b border-zinc-800 bg-[#0a0a14]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Share Ethereum Communities</h2>
              <p className="text-sm text-zinc-500">Download and share on social media</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-medium rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PNG
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Toggle for All vs Filtered communities */}
          {isFiltered && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <Globe className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-400">Data to include:</span>
              <div className="flex items-center gap-1 p-0.5 bg-zinc-800 rounded-full">
                <button
                  onClick={() => setUseAllCommunities(true)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    useAllCommunities 
                      ? 'bg-red-500 text-white' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All ({allCommunities.length})
                </button>
                <button
                  onClick={() => setUseAllCommunities(false)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    !useAllCommunities 
                      ? 'bg-red-500 text-white' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Filtered ({communities.length})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview Container */}
        <div className="p-6">
          {/* The actual shareable image content */}
          <div
            ref={canvasRef}
            className="w-full aspect-[1.91/1] rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #05071a 0%, #0a1628 50%, #05071a 100%)',
            }}
          >
            <div className="relative w-full h-full p-8 flex flex-col">
              {/* Top Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  {/* Ethereum Logo */}
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(98, 126, 234, 0.2), rgba(98, 126, 234, 0.05))' }}>
                    <svg viewBox="0 0 256 417" className="w-6 h-10" preserveAspectRatio="xMidYMid">
                      <g>
                        <polygon fill="#627EEA" points="127.9611 0 125.1661 9.5 125.1661 285.168 127.9611 287.958 255.9231 212.32"/>
                        <polygon fill="#C1CCF7" points="127.962 0 0 212.32 127.962 287.959 127.962 154.158"/>
                        <polygon fill="#8198EE" points="127.9611 0 127.9611 154.158 127.9611 287.959 255.9211 212.32"/>
                        <polygon fill="#627EEA" points="127.962 312.187 126.386 314.107 126.386 412.306 127.962 416.905 256 236.587"/>
                        <polygon fill="#C1CCF7" points="127.962 416.905 127.962 312.187 0 236.587"/>
                        <polygon fill="#8198EE" points="127.9611 312.187 255.9211 236.587 127.9611 416.905"/>
                      </g>
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Ethereum Communities</h1>
                    <p className="text-xs text-zinc-400">Global Ecosystem Overview • {currentDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <img src="/logo.png" alt="Ethstars" className="w-4 h-4 object-contain" />
                  <span className="text-xs font-medium text-zinc-300">Curated by Ethstars</span>
                </div>
              </div>

              {/* Main Content - Map and Stats */}
              <div className="flex-1 flex gap-6 min-h-0">
                {/* World Map */}
                <div className="flex-1 relative rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {/* World Map SVG */}
                  <svg
                    viewBox="0 0 1000 500"
                    className="w-full h-full"
                    style={{ background: 'transparent' }}
                    preserveAspectRatio="xMidYMid slice"
                  >
                    {/* Actual World Map Paths - Natural Earth simplified */}
                    <g fill="rgba(100, 116, 139, 0.35)" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.5">
                      {/* North America */}
                      <path d="M130,120 L180,95 L220,90 L260,100 L280,85 L300,90 L280,110 L270,140 L250,155 L220,165 L200,180 L180,175 L160,185 L150,200 L155,220 L145,235 L130,220 L120,190 L110,165 L100,140 L115,125 Z" />
                      {/* Greenland */}
                      <path d="M290,60 L330,50 L360,55 L370,75 L355,95 L320,100 L295,90 L285,75 Z" />
                      {/* Central America & Caribbean */}
                      <path d="M155,235 L175,230 L195,240 L205,255 L195,265 L180,275 L160,270 L150,255 Z" />
                      {/* South America */}
                      <path d="M200,275 L230,270 L260,285 L280,320 L285,360 L275,400 L255,430 L230,450 L210,445 L195,420 L185,380 L180,340 L185,305 L195,285 Z" />
                      {/* Europe */}
                      <path d="M440,95 L480,85 L510,90 L530,100 L540,120 L530,140 L510,150 L490,155 L470,150 L455,140 L445,125 L435,110 Z" />
                      {/* UK & Ireland */}
                      <path d="M420,100 L435,95 L445,105 L440,120 L425,125 L415,115 Z" />
                      {/* Scandinavia */}
                      <path d="M480,55 L500,50 L520,60 L530,80 L520,95 L500,90 L485,75 Z" />
                      {/* Africa */}
                      <path d="M450,175 L490,165 L530,175 L555,200 L565,240 L560,290 L545,335 L520,365 L485,380 L455,375 L430,350 L420,310 L425,265 L435,220 L445,190 Z" />
                      {/* Middle East */}
                      <path d="M540,155 L575,150 L600,165 L610,190 L600,210 L575,215 L555,200 L545,175 Z" />
                      {/* Russia/Northern Asia */}
                      <path d="M540,60 L620,50 L720,55 L800,70 L850,85 L870,100 L865,120 L840,125 L780,120 L700,115 L620,110 L560,105 L545,85 Z" />
                      {/* Central Asia */}
                      <path d="M560,120 L620,115 L670,125 L680,145 L660,165 L620,170 L580,165 L565,145 Z" />
                      {/* India */}
                      <path d="M620,180 L660,175 L690,195 L695,240 L680,280 L650,300 L620,290 L605,255 L610,215 Z" />
                      {/* China */}
                      <path d="M680,130 L750,120 L800,130 L830,155 L825,190 L795,215 L750,225 L710,215 L685,190 L680,155 Z" />
                      {/* Southeast Asia */}
                      <path d="M700,230 L740,225 L770,245 L780,280 L765,310 L735,320 L705,305 L695,270 L700,245 Z" />
                      {/* Japan */}
                      <path d="M840,140 L860,135 L875,150 L870,175 L855,185 L840,175 L835,155 Z" />
                      {/* Korea */}
                      <path d="M820,155 L835,150 L845,165 L840,185 L825,190 L815,175 Z" />
                      {/* Indonesia */}
                      <path d="M720,330 L780,325 L840,340 L870,355 L860,375 L810,380 L750,370 L720,355 Z" />
                      {/* Australia */}
                      <path d="M780,400 L850,385 L910,400 L930,430 L920,470 L880,485 L830,480 L795,460 L780,430 Z" />
                      {/* New Zealand */}
                      <path d="M945,450 L960,445 L970,465 L960,485 L945,480 Z" />
                    </g>

                    {/* Grid lines for visual appeal */}
                    <g stroke="rgba(148, 163, 184, 0.06)" strokeWidth="0.5" fill="none">
                      {[...Array(9)].map((_, i) => (
                        <line key={`h-${i}`} x1="0" y1={50 + i * 50} x2="1000" y2={50 + i * 50} />
                      ))}
                      {[...Array(11)].map((_, i) => (
                        <line key={`v-${i}`} x1={50 + i * 90} y1="0" x2={50 + i * 90} y2="500" />
                      ))}
                    </g>

                    {/* Community markers */}
                    {displayCommunities.map((community) => {
                      const { x, y } = latLngToXY(
                        community.location.coordinates.lat,
                        community.location.coordinates.lng,
                        1000,
                        500
                      )
                      // Use a consistent color for all markers (Ethereum blue-purple)
                      const color = '#627EEA'
                      const size = 8
                      
                      // Skip if marker would be outside viewable area
                      if (y < 30 || y > 480) return null
                      
                      return (
                        <g key={community.id}>
                          {/* Outer glow */}
                          <circle
                            cx={x}
                            cy={y}
                            r={size + 8}
                            fill={color}
                            opacity={0.15}
                          />
                          {/* Inner glow */}
                          <circle
                            cx={x}
                            cy={y}
                            r={size + 4}
                            fill={color}
                            opacity={0.3}
                          />
                          {/* Main dot */}
                          <circle
                            cx={x}
                            cy={y}
                            r={size}
                            fill={color}
                            stroke="rgba(255,255,255,0.5)"
                            strokeWidth={1}
                          />
                          {/* Highlight */}
                          <circle
                            cx={x - size * 0.25}
                            cy={y - size * 0.25}
                            r={size * 0.35}
                            fill="rgba(255,255,255,0.5)"
                          />
                        </g>
                      )
                    })}
                  </svg>

                  {/* Legend */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#627EEA' }} />
                      <span className="text-[9px] text-zinc-400">Community</span>
                    </div>
                  </div>
                </div>

                {/* Stats Panel */}
                <div className="w-48 flex flex-col gap-2">
                  {/* Main Stats */}
                  <div className="flex flex-col gap-2">
                    <div className="p-4 rounded-xl border border-zinc-800" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)' }}>
                      <p className="text-3xl font-bold text-white">{stats.total}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Communities</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl border border-zinc-800" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)' }}>
                        <p className="text-2xl font-bold text-white">{stats.countries}</p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Countries</p>
                      </div>
                      <div className="p-3 rounded-xl border border-zinc-800" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)' }}>
                        <p className="text-2xl font-bold text-white">{stats.cities}</p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Cities</p>
                      </div>
                    </div>
                  </div>

                  {/* Top Countries */}
                  <div className="flex-1 p-3 rounded-xl border border-zinc-800" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' }}>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-2 font-medium">Top Regions</p>
                    <div className="space-y-1.5">
                      {topCountries.map(([country, count], index) => (
                        <div key={country} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-600 w-3 font-medium">{index + 1}</span>
                            <span className="text-[11px] text-zinc-300">{country}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div 
                              className="h-1.5 rounded-full bg-gradient-to-r from-zinc-600 to-zinc-500" 
                              style={{ width: `${(count / topCountries[0][1]) * 40}px` }}
                            />
                            <span className="text-[10px] font-medium text-zinc-400 w-4 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="p-3 rounded-xl border border-red-500/30" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)' }}>
                    <p className="text-[10px] text-red-300 font-medium mb-0.5">Join the movement</p>
                    <p className="text-[10px] text-zinc-400">Connect with builders worldwide</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-[10px] text-zinc-500">Find your local community at <span className="text-zinc-400 font-medium">ethstars.xyz/communitie</span></p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-zinc-600">#EthereumCommunity</span>
                  </div>
                  <div className="h-3 w-px bg-zinc-700" />
                  <span className="text-[10px] text-zinc-600">@ethstars</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
