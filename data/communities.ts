// Import Event type and events array for next event matching
import type { Event } from './events'
import { events } from './events'

export type CommunityFocus = 
  | 'Technical' 
  | 'Beginner-friendly' 
  | 'DeFi' 
  | 'NFTs' 
  | 'Gaming' 
  | 'DAO' 
  | 'Developer' 
  | 'Entrepreneur' 
  | 'Research' 
  | 'Education'
  | 'Art'
  | 'Social Impact'
  | 'Infrastructure'
  | 'Privacy'
  | 'Scaling'

export type ActivityLevel = 'very-active' | 'active' | 'moderate' | 'new'
export type CommunitySize = 'large' | 'medium' | 'small'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'all-levels'
export type MeetingFormat = 'online' | 'in-person' | 'hybrid'

export interface Community {
  id: string
  name: string
  description: string
  shortDescription: string
  logo: string
  banner?: string // Banner image URL (3:1 aspect ratio, e.g., 1500x500px)
  location: {
    city: string
    country: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  focusAreas: CommunityFocus[]
  activityLevel: ActivityLevel
  memberCount: number
  eventFrequency: string // e.g., "Weekly", "Monthly", "Bi-weekly"
  lastActivity: string // ISO date string
  foundedDate?: string // ISO date string
  website?: string
  discord?: string
  telegram?: string
  twitter?: string
  github?: string
  featured?: boolean
  language?: string
  organizer?: string
  values?: string[]
  // New fields for Phase 1 improvements
  skillLevel?: SkillLevel // Determines if beginner-friendly
  meetingFormat?: MeetingFormat // online, in-person, or hybrid
}

const activityLevelConfig: Record<ActivityLevel, { label: string; color: string }> = {
  'very-active': { label: 'Very Active', color: 'text-emerald-400' },
  'active': { label: 'Active', color: 'text-blue-400' },
  'moderate': { label: 'Moderate', color: 'text-yellow-400' },
  'new': { label: 'New', color: 'text-zinc-400' },
}

export function getActivityLevelConfig(level: ActivityLevel) {
  return activityLevelConfig[level]
}

export function getCommunitySize(memberCount: number): CommunitySize {
  if (memberCount >= 1000) return 'large'
  if (memberCount >= 100) return 'medium'
  return 'small'
}

/**
 * Calculate activity health score based on activity level and event frequency
 * Higher score = more active/recently active
 */
export function getActivityHealthScore(activityLevel: ActivityLevel, eventFrequency: string): number {
  const activityScores: Record<ActivityLevel, number> = {
    'very-active': 4,
    'active': 3,
    'moderate': 2,
    'new': 1,
  }
  
  const frequencyScores: Record<string, number> = {
    'Weekly': 4,
    'Bi-weekly': 3,
    'Monthly': 2,
    'Quarterly': 1,
  }
  
  return activityScores[activityLevel] + (frequencyScores[eventFrequency] || 1)
}

/**
 * Get activity status text based on activity level and event frequency
 * Provides a human-readable "recently active" indicator
 */
export function getActivityStatus(activityLevel: ActivityLevel, eventFrequency: string): string {
  if (activityLevel === 'very-active') {
    return 'Very active'
  } else if (activityLevel === 'active') {
    return 'Active'
  } else if (activityLevel === 'moderate') {
    return 'Moderately active'
  } else {
    return 'Getting started'
  }
}

/**
 * Calculate next likely event timing based on event frequency
 * Returns a human-readable string like "Next likely: This week" or "Next likely: Next month"
 */
export function getNextEventTiming(eventFrequency: string): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  
  switch (eventFrequency) {
    case 'Weekly':
      return 'Next likely: This week'
    case 'Bi-weekly':
      return 'Next likely: Within 2 weeks'
    case 'Monthly':
      // If it's early in the month, likely this month, otherwise next month
      const dayOfMonth = now.getDate()
      return dayOfMonth < 15 ? 'Next likely: This month' : 'Next likely: Next month'
    case 'Quarterly':
      return 'Next likely: This quarter'
    default:
      return 'Regular events'
  }
}

/**
 * Check if community is beginner-friendly
 */
export function isBeginnerFriendly(community: Community): boolean {
  // Explicit skill level
  if (community.skillLevel === 'beginner' || community.skillLevel === 'all-levels') {
    return true
  }
  
  // Check focus areas
  if (community.focusAreas.includes('Beginner-friendly') || community.focusAreas.includes('Education')) {
    return true
  }
  
  return false
}

/**
 * Get meeting format display text
 */
export function getMeetingFormatText(format?: MeetingFormat): string {
  if (!format) return 'In-person' // Default assumption
  switch (format) {
    case 'online':
      return 'Online'
    case 'in-person':
      return 'In-person'
    case 'hybrid':
      return 'Hybrid'
    default:
      return 'In-person'
  }
}

/**
 * Get all matching events for a community
 * Returns array of events that match the community
 */
export function getCommunityEvents(community: Community): Event[] {
  // Extract keywords from community for matching
  const communityName = community.name.toLowerCase()
  const communityCity = community.location.city.toLowerCase()
  const communityOrganizer = community.organizer?.toLowerCase() || ''
  
  // Find matching events
  const matchingEvents = events.filter((event: Event) => {
    const eventTitle = event.title.toLowerCase()
    const eventOrganizer = event.organizer?.toLowerCase() || ''
    const eventLocation = event.location?.toLowerCase() || ''
    
    // Match by community name in event title/organizer/location
    if (eventTitle.includes(communityName) || 
        eventOrganizer.includes(communityName) ||
        eventLocation.includes(communityName)) {
      return true
    }
    
    // Match by community city in event location
    if (eventLocation.includes(communityCity)) {
      return true
    }
    
    // Match by organizer (fuzzy match)
    if (communityOrganizer && (
        eventOrganizer.includes(communityOrganizer) ||
        communityOrganizer.includes(eventOrganizer)
    )) {
      return true
    }
    
    return false
  })
  
  // Sort by date (ascending)
  return matchingEvents.sort((a: Event, b: Event) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateA - dateB
  })
}

/**
 * Get next event date for a community by matching events
 * Returns formatted date string or null if no upcoming event found
 */
export function getNextEventDate(community: Community): string | null {
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Reset time to start of day
  
  const matchingEvents = getCommunityEvents(community)
  
  // Find next upcoming event
  const upcomingEvents = matchingEvents
    .filter((event: Event) => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= now
    })
  
  if (upcomingEvents.length === 0) {
    return null
  }
  
  // Format the date
  const nextEventDate = new Date(upcomingEvents[0].date)
  const currentYear = now.getFullYear()
  const eventYear = nextEventDate.getFullYear()
  
  // Format: "Jan 15" if same year, "Jan 15, 2026" if different year
  const month = nextEventDate.toLocaleDateString('en-US', { month: 'short' })
  const day = nextEventDate.getDate()
  
  if (eventYear === currentYear) {
    return `${month} ${day}`
  } else {
    return `${month} ${day}, ${eventYear}`
  }
}

export const communities: Community[] = [
  {
    id: '1',
    name: 'Ethereum NYC',
    description: 'The largest Ethereum community in New York City, bringing together developers, entrepreneurs, and enthusiasts. We host weekly meetups, hackathons, and educational workshops.',
    shortDescription: 'New York City\'s premier Ethereum community for developers and enthusiasts',
    logo: 'https://avatars.githubusercontent.com/u/6250754?s=200&v=4',
    banner: 'https://picsum.photos/1200/400?random=101',
    location: {
      city: 'New York',
      country: 'United States',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    focusAreas: ['Technical', 'Developer', 'DeFi', 'DAO'],
    activityLevel: 'very-active',
    memberCount: 3500,
    eventFrequency: 'Weekly',
    lastActivity: '2025-12-20',
    foundedDate: '2017-03-15',
    website: 'https://ethereumnyc.org',
    discord: 'https://discord.gg/ethereumnyc',
    twitter: 'https://twitter.com/ethereumnyc',
    featured: true,
    language: 'English',
    organizer: 'Ethereum NYC Team',
    values: ['Open Source', 'Inclusivity', 'Education', 'Innovation'],
    skillLevel: 'all-levels',
    meetingFormat: 'in-person'
  },
  {
    id: '2',
    name: 'Berlin Ethereum Meetup',
    description: 'A vibrant community of Ethereum developers and enthusiasts in Berlin. We focus on technical deep-dives, smart contract security, and building the future of Web3.',
    shortDescription: 'Technical Ethereum community in Berlin focused on development and security',
    logo: 'https://avatars.githubusercontent.com/u/36115574?s=200&v=4',
    banner: 'https://picsum.photos/1200/400?random=102',
    location: {
      city: 'Berlin',
      country: 'Germany',
      coordinates: { lat: 52.5200, lng: 13.4050 }
    },
    focusAreas: ['Technical', 'Developer', 'Infrastructure', 'Privacy'],
    activityLevel: 'very-active',
    memberCount: 2100,
    eventFrequency: 'Bi-weekly',
    lastActivity: '2025-12-19',
    website: 'https://berlin-ethereum.org',
    discord: 'https://discord.gg/berlinethereum',
    telegram: 'https://t.me/berlinethereum',
    twitter: 'https://twitter.com/berlinethereum',
    featured: true,
    language: 'English, German',
    organizer: 'Berlin Ethereum Organizers',
    values: ['Privacy', 'Decentralization', 'Technical Excellence'],
    skillLevel: 'intermediate',
    meetingFormat: 'in-person'
  },
  {
    id: '3',
    name: 'Ethereum Singapore',
    description: 'Connecting the Ethereum ecosystem across Southeast Asia. We host monthly meetups, hackathons, and provide resources for builders in the region.',
    shortDescription: 'Southeast Asia\'s hub for Ethereum builders and enthusiasts',
    logo: 'https://avatars.githubusercontent.com/u/47617460?s=200&v=4',
    banner: 'https://picsum.photos/1200/400?random=103',
    location: {
      city: 'Singapore',
      country: 'Singapore',
      coordinates: { lat: 1.3521, lng: 103.8198 }
    },
    focusAreas: ['Technical', 'Entrepreneur', 'DeFi', 'Education'],
    activityLevel: 'active',
    memberCount: 1800,
    eventFrequency: 'Monthly',
    lastActivity: '2025-12-18',
    website: 'https://ethereum.sg',
    discord: 'https://discord.gg/ethereumsg',
    twitter: 'https://twitter.com/ethereumsg',
    featured: true,
    language: 'English, Mandarin',
    organizer: 'Ethereum Singapore Team',
    values: ['Innovation', 'Collaboration', 'Regional Growth'],
    skillLevel: 'all-levels',
    meetingFormat: 'hybrid'
  },
  {
    id: '4',
    name: 'London Ethereum Developers',
    description: 'A community for Ethereum developers in London. We focus on Solidity development, smart contract security, and building production-ready dApps.',
    shortDescription: 'London-based community for Ethereum developers and builders',
    logo: 'https://avatars.githubusercontent.com/u/20820676?s=200&v=4',
    banner: 'https://picsum.photos/1200/400?random=104',
    location: {
      city: 'London',
      country: 'United Kingdom',
      coordinates: { lat: 51.5074, lng: -0.1278 }
    },
    focusAreas: ['Technical', 'Developer', 'Infrastructure'],
    activityLevel: 'active',
    memberCount: 1200,
    eventFrequency: 'Bi-weekly',
    lastActivity: '2025-12-17',
    discord: 'https://discord.gg/londoneth',
    twitter: 'https://twitter.com/londoneth',
    github: 'https://github.com/london-ethereum',
    featured: true,
    language: 'English',
    organizer: 'London Ethereum Organizers',
    values: ['Technical Excellence', 'Security', 'Best Practices'],
    skillLevel: 'intermediate',
    meetingFormat: 'in-person'
  },
  {
    id: '5',
    name: 'Ethereum Tokyo',
    description: 'Japan\'s leading Ethereum community, bringing together developers, artists, and entrepreneurs. We host events in both English and Japanese.',
    shortDescription: 'Japan\'s premier Ethereum community for developers and creators',
    logo: 'https://avatars.githubusercontent.com/u/65557647?s=200&v=4',
    banner: 'https://picsum.photos/1200/400?random=105',
    location: {
      city: 'Tokyo',
      country: 'Japan',
      coordinates: { lat: 35.6762, lng: 139.6503 }
    },
    focusAreas: ['Technical', 'NFTs', 'Gaming', 'Art'],
    activityLevel: 'active',
    memberCount: 2400,
    eventFrequency: 'Monthly',
    lastActivity: '2025-12-19',
    website: 'https://ethereum.tokyo',
    discord: 'https://discord.gg/ethereumtokyo',
    twitter: 'https://twitter.com/ethereumtokyo',
    featured: true,
    language: 'English, Japanese',
    organizer: 'Ethereum Tokyo Team',
    values: ['Creativity', 'Innovation', 'Cultural Exchange'],
    skillLevel: 'all-levels',
    meetingFormat: 'hybrid'
  },
  {
    id: '6',
    name: 'San Francisco Ethereum',
    description: 'The heart of Ethereum in the Bay Area. We connect developers, founders, and investors building the future of Web3.',
    shortDescription: 'Bay Area Ethereum community for builders and entrepreneurs',
    logo: 'https://avatars.githubusercontent.com/u/58171697?s=200&v=4',
    banner: 'https://picsum.photos/1200/400?random=106',
    location: {
      city: 'San Francisco',
      country: 'United States',
      coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    focusAreas: ['Technical', 'Entrepreneur', 'DeFi', 'Infrastructure'],
    activityLevel: 'very-active',
    memberCount: 4200,
    eventFrequency: 'Weekly',
    lastActivity: '2025-12-20',
    website: 'https://sfethereum.org',
    discord: 'https://discord.gg/sfethereum',
    twitter: 'https://twitter.com/sfethereum',
    featured: true,
    language: 'English',
    organizer: 'SF Ethereum Organizers',
    values: ['Innovation', 'Entrepreneurship', 'Technical Excellence'],
    skillLevel: 'all-levels',
    meetingFormat: 'in-person'
  },
  {
    id: '7',
    name: 'Ethereum Paris',
    description: 'A vibrant community of Ethereum enthusiasts in Paris. We focus on education, DeFi, and bringing Web3 to mainstream audiences.',
    shortDescription: 'Paris-based Ethereum community focused on education and DeFi',
    logo: 'https://avatars.githubusercontent.com/u/95037846?s=200&v=4',
    location: {
      city: 'Paris',
      country: 'France',
      coordinates: { lat: 48.8566, lng: 2.3522 }
    },
    focusAreas: ['Education', 'DeFi', 'Beginner-friendly', 'Technical'],
    activityLevel: 'active',
    memberCount: 1500,
    eventFrequency: 'Monthly',
    lastActivity: '2025-12-16',
    discord: 'https://discord.gg/ethereumparis',
    twitter: 'https://twitter.com/ethereumparis',
    language: 'French, English',
    organizer: 'Ethereum Paris Team',
    values: ['Education', 'Accessibility', 'Community'],
    skillLevel: 'beginner',
    meetingFormat: 'in-person'
  },
  {
    id: '8',
    name: 'Ethereum Sydney',
    description: 'Australia\'s leading Ethereum community. We host regular meetups, workshops, and connect builders across the Asia-Pacific region.',
    shortDescription: 'Australia\'s hub for Ethereum builders and enthusiasts',
    logo: 'https://avatars.githubusercontent.com/u/38020273?s=200&v=4',
    location: {
      city: 'Sydney',
      country: 'Australia',
      coordinates: { lat: -33.8688, lng: 151.2093 }
    },
    focusAreas: ['Technical', 'Developer', 'Education', 'DAO'],
    activityLevel: 'moderate',
    memberCount: 800,
    eventFrequency: 'Monthly',
    lastActivity: '2025-12-15',
    website: 'https://ethereum.sydney',
    discord: 'https://discord.gg/ethereumsydney',
    twitter: 'https://twitter.com/ethereumsydney',
    language: 'English',
    organizer: 'Ethereum Sydney Organizers',
    values: ['Community', 'Education', 'Regional Growth'],
    skillLevel: 'all-levels',
    meetingFormat: 'hybrid'
  },
  {
    id: '9',
    name: 'Ethereum Toronto',
    description: 'Canada\'s largest Ethereum community. We bring together developers, researchers, and entrepreneurs building on Ethereum.',
    shortDescription: 'Toronto-based Ethereum community for developers and builders',
    logo: 'https://avatars.githubusercontent.com/u/48327834?s=200&v=4',
    location: {
      city: 'Toronto',
      country: 'Canada',
      coordinates: { lat: 43.6532, lng: -79.3832 }
    },
    focusAreas: ['Technical', 'Research', 'Developer', 'Infrastructure'],
    activityLevel: 'active',
    memberCount: 1900,
    eventFrequency: 'Bi-weekly',
    lastActivity: '2025-12-18',
    discord: 'https://discord.gg/ethereumtoronto',
    twitter: 'https://twitter.com/ethereumtoronto',
    language: 'English',
    organizer: 'Ethereum Toronto Team',
    values: ['Research', 'Innovation', 'Technical Excellence'],
    skillLevel: 'intermediate',
    meetingFormat: 'in-person'
  },
  {
    id: '10',
    name: 'Ethereum Mumbai',
    description: 'India\'s premier Ethereum community. We focus on education, developer onboarding, and building the Web3 ecosystem in India.',
    shortDescription: 'India\'s leading Ethereum community for developers and learners',
    logo: 'https://avatars.githubusercontent.com/u/30044474?s=200&v=4',
    banner: 'https://picsum.photos/1200/400?random=110',
    location: {
      city: 'Mumbai',
      country: 'India',
      coordinates: { lat: 19.0760, lng: 72.8777 }
    },
    focusAreas: ['Education', 'Beginner-friendly', 'Developer', 'Technical'],
    activityLevel: 'very-active',
    memberCount: 3200,
    eventFrequency: 'Weekly',
    lastActivity: '2025-12-20',
    website: 'https://ethereum.mumbai',
    discord: 'https://discord.gg/ethereummumbai',
    telegram: 'https://t.me/ethereummumbai',
    twitter: 'https://twitter.com/ethereummumbai',
    featured: true,
    language: 'English, Hindi',
    organizer: 'Ethereum Mumbai Team',
    values: ['Education', 'Accessibility', 'Inclusivity', 'Growth'],
    skillLevel: 'beginner',
    meetingFormat: 'hybrid'
  },
  {
    id: '11',
    name: 'Ethereum Amsterdam',
    description: 'The Netherlands\' Ethereum community. We host DevCon, regular meetups, and connect the global Ethereum ecosystem.',
    shortDescription: 'Amsterdam-based Ethereum community, home of DevCon',
    logo: 'https://avatars.githubusercontent.com/u/6250754?s=200&v=4',
    banner: 'https://picsum.photos/1200/400?random=111',
    location: {
      city: 'Amsterdam',
      country: 'Netherlands',
      coordinates: { lat: 52.3676, lng: 4.9041 }
    },
    focusAreas: ['Technical', 'Developer', 'Infrastructure', 'Research'],
    activityLevel: 'very-active',
    memberCount: 2800,
    eventFrequency: 'Bi-weekly',
    lastActivity: '2025-12-19',
    website: 'https://ethereum.amsterdam',
    discord: 'https://discord.gg/ethereumamsterdam',
    twitter: 'https://twitter.com/ethereumamsterdam',
    featured: true,
    language: 'English, Dutch',
    organizer: 'Ethereum Amsterdam Organizers',
    values: ['Open Source', 'Research', 'Global Community'],
    skillLevel: 'intermediate',
    meetingFormat: 'in-person'
  },
  {
    id: '12',
    name: 'Ethereum Seoul',
    description: 'South Korea\'s Ethereum community. We focus on DeFi, NFTs, and connecting Korean builders with the global ecosystem.',
    shortDescription: 'Seoul-based Ethereum community for DeFi and NFT builders',
    logo: 'https://avatars.githubusercontent.com/u/114407616?s=200&v=4',
    location: {
      city: 'Seoul',
      country: 'South Korea',
      coordinates: { lat: 37.5665, lng: 126.9780 }
    },
    focusAreas: ['DeFi', 'NFTs', 'Gaming', 'Technical'],
    activityLevel: 'active',
    memberCount: 1600,
    eventFrequency: 'Monthly',
    lastActivity: '2025-12-17',
    discord: 'https://discord.gg/ethereumseoul',
    telegram: 'https://t.me/ethereumseoul',
    twitter: 'https://twitter.com/ethereumseoul',
    language: 'Korean, English',
    organizer: 'Ethereum Seoul Team',
    values: ['Innovation', 'DeFi', 'NFT Culture'],
    skillLevel: 'all-levels',
    meetingFormat: 'hybrid'
  },
  {
    id: '13',
    name: 'Ethereum São Paulo',
    description: 'Brazil\'s largest Ethereum community. We focus on education, DeFi, and bringing Web3 to Latin America.',
    shortDescription: 'Brazil\'s premier Ethereum community for builders and learners',
    logo: 'https://avatars.githubusercontent.com/u/10818037?s=200&v=4',
    location: {
      city: 'São Paulo',
      country: 'Brazil',
      coordinates: { lat: -23.5505, lng: -46.6333 }
    },
    focusAreas: ['Education', 'DeFi', 'Beginner-friendly', 'Social Impact'],
    activityLevel: 'active',
    memberCount: 2200,
    eventFrequency: 'Monthly',
    lastActivity: '2025-12-18',
    website: 'https://ethereum.sp',
    discord: 'https://discord.gg/ethereumsp',
    twitter: 'https://twitter.com/ethereumsp',
    language: 'Portuguese, English',
    organizer: 'Ethereum São Paulo Team',
    values: ['Education', 'Accessibility', 'Social Impact'],
    skillLevel: 'beginner',
    meetingFormat: 'hybrid'
  },
  {
    id: '14',
    name: 'Ethereum Tel Aviv',
    description: 'Israel\'s Ethereum community. We focus on technical development, zero-knowledge proofs, and scaling solutions.',
    shortDescription: 'Tel Aviv-based Ethereum community focused on ZK and scaling',
    logo: 'https://avatars.githubusercontent.com/u/38987369?s=200&v=4',
    location: {
      city: 'Tel Aviv',
      country: 'Israel',
      coordinates: { lat: 32.0853, lng: 34.7818 }
    },
    focusAreas: ['Technical', 'Developer', 'Privacy', 'Scaling', 'Research'],
    activityLevel: 'active',
    memberCount: 1100,
    eventFrequency: 'Bi-weekly',
    lastActivity: '2025-12-16',
    discord: 'https://discord.gg/ethereumtelaviv',
    twitter: 'https://twitter.com/ethereumtelaviv',
    language: 'Hebrew, English',
    organizer: 'Ethereum Tel Aviv Organizers',
    values: ['Technical Excellence', 'Innovation', 'Research'],
    skillLevel: 'advanced',
    meetingFormat: 'in-person'
  },
  {
    id: '15',
    name: 'Ethereum Zurich',
    description: 'Switzerland\'s Ethereum community. We focus on research, infrastructure, and connecting with the global Ethereum Foundation.',
    shortDescription: 'Zurich-based Ethereum community focused on research and infrastructure',
    logo: 'https://avatars.githubusercontent.com/u/76433670?s=200&v=4',
    location: {
      city: 'Zurich',
      country: 'Switzerland',
      coordinates: { lat: 47.3769, lng: 8.5417 }
    },
    focusAreas: ['Research', 'Infrastructure', 'Technical', 'Developer'],
    activityLevel: 'moderate',
    memberCount: 900,
    eventFrequency: 'Monthly',
    lastActivity: '2025-12-14',
    website: 'https://ethereum.zurich',
    discord: 'https://discord.gg/ethereumzurich',
    twitter: 'https://twitter.com/ethereumzurich',
    language: 'German, English',
    organizer: 'Ethereum Zurich Organizers',
    values: ['Research', 'Infrastructure', 'Technical Excellence'],
    skillLevel: 'intermediate',
    meetingFormat: 'in-person'
  },
  {
    id: '16',
    name: 'Ethereum Austin',
    description: 'Texas\' Ethereum community. We focus on education, beginner-friendly events, and building a welcoming community for all.',
    shortDescription: 'Austin-based Ethereum community welcoming to beginners and experts',
    logo: 'https://avatars.githubusercontent.com/u/108554348?s=200&v=4',
    location: {
      city: 'Austin',
      country: 'United States',
      coordinates: { lat: 30.2672, lng: -97.7431 }
    },
    focusAreas: ['Beginner-friendly', 'Education', 'Technical', 'DAO'],
    activityLevel: 'active',
    memberCount: 1300,
    eventFrequency: 'Monthly',
    lastActivity: '2025-12-17',
    discord: 'https://discord.gg/ethereumaustin',
    twitter: 'https://twitter.com/ethereumaustin',
    language: 'English',
    organizer: 'Ethereum Austin Team',
    values: ['Inclusivity', 'Education', 'Community'],
    skillLevel: 'beginner',
    meetingFormat: 'in-person'
  },
  {
    id: '17',
    name: 'Ethereum Dubai',
    description: 'UAE\'s Ethereum community. We focus on DeFi, infrastructure, and connecting Middle Eastern builders with the global ecosystem.',
    shortDescription: 'Dubai-based Ethereum community for DeFi and infrastructure builders',
    logo: 'https://avatars.githubusercontent.com/u/69736773?s=200&v=4',
    location: {
      city: 'Dubai',
      country: 'United Arab Emirates',
      coordinates: { lat: 25.2048, lng: 55.2708 }
    },
    focusAreas: ['DeFi', 'Infrastructure', 'Entrepreneur', 'Technical'],
    activityLevel: 'active',
    memberCount: 1700,
    eventFrequency: 'Monthly',
    lastActivity: '2025-12-18',
    website: 'https://ethereum.dubai',
    discord: 'https://discord.gg/ethereumdubai',
    twitter: 'https://twitter.com/ethereumdubai',
    language: 'English, Arabic',
    organizer: 'Ethereum Dubai Team',
    values: ['Innovation', 'DeFi', 'Regional Growth'],
    skillLevel: 'all-levels',
    meetingFormat: 'hybrid'
  },
  {
    id: '18',
    name: 'Ethereum Lisbon',
    description: 'Portugal\'s Ethereum community. We focus on education, DAOs, and building a vibrant Web3 ecosystem in Portugal.',
    shortDescription: 'Lisbon-based Ethereum community focused on education and DAOs',
    logo: 'https://avatars.githubusercontent.com/u/44791704?s=200&v=4',
    location: {
      city: 'Lisbon',
      country: 'Portugal',
      coordinates: { lat: 38.7223, lng: -9.1393 }
    },
    focusAreas: ['Education', 'DAO', 'Beginner-friendly', 'Technical'],
    activityLevel: 'moderate',
    memberCount: 750,
    eventFrequency: 'Monthly',
    lastActivity: '2025-12-15',
    discord: 'https://discord.gg/ethereumlisbon',
    twitter: 'https://twitter.com/ethereumlisbon',
    language: 'Portuguese, English',
    organizer: 'Ethereum Lisbon Organizers',
    values: ['Education', 'DAO Governance', 'Community'],
    skillLevel: 'beginner',
    meetingFormat: 'hybrid'
  },
  {
    id: '19',
    name: 'Ethereum Bangalore',
    description: 'India\'s tech hub Ethereum community. We focus on developer education, hackathons, and building the next generation of Web3 builders.',
    shortDescription: 'Bangalore-based Ethereum community for developers and builders',
    logo: 'https://avatars.githubusercontent.com/u/77616608?s=200&v=4',
    banner: 'https://picsum.photos/1200/400?random=119',
    location: {
      city: 'Bangalore',
      country: 'India',
      coordinates: { lat: 12.9716, lng: 77.5946 }
    },
    focusAreas: ['Developer', 'Technical', 'Education', 'Infrastructure'],
    activityLevel: 'very-active',
    memberCount: 2800,
    eventFrequency: 'Bi-weekly',
    lastActivity: '2025-12-19',
    website: 'https://ethereum.bangalore',
    discord: 'https://discord.gg/ethereumbangalore',
    telegram: 'https://t.me/ethereumbangalore',
    twitter: 'https://twitter.com/ethereumbangalore',
    featured: true,
    language: 'English, Kannada, Hindi',
    organizer: 'Ethereum Bangalore Team',
    values: ['Developer Education', 'Hackathons', 'Innovation'],
    skillLevel: 'all-levels',
    meetingFormat: 'hybrid'
  },
  {
    id: '20',
    name: 'Ethereum Shanghai',
    description: 'China\'s Ethereum community. We focus on technical development, DeFi, and connecting Chinese builders with the global ecosystem.',
    shortDescription: 'Shanghai-based Ethereum community for technical builders',
    logo: 'https://avatars.githubusercontent.com/u/35608259?s=200&v=4',
    location: {
      city: 'Shanghai',
      country: 'China',
      coordinates: { lat: 31.2304, lng: 121.4737 }
    },
    focusAreas: ['Technical', 'DeFi', 'Developer', 'Infrastructure'],
    activityLevel: 'active',
    memberCount: 1900,
    eventFrequency: 'Monthly',
    lastActivity: '2025-12-16',
    telegram: 'https://t.me/ethereumshanghai',
    twitter: 'https://twitter.com/ethereumshanghai',
    language: 'Chinese, English',
    organizer: 'Ethereum Shanghai Team',
    values: ['Technical Excellence', 'DeFi', 'Innovation'],
    skillLevel: 'intermediate',
    meetingFormat: 'hybrid'
  }
]

export const featuredCommunities = communities.filter(c => c.featured)

