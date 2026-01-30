export type OrganizationType = 'angel' | 'community' | 'company' | 'grant' | 'vc'

export interface Organization {
  id: string
  name: string
  type: OrganizationType
  logo?: string
  coverImage?: string
  shortDescription?: string
  fullDescription?: string
  foundedIn?: string
  funding?: string
  website?: string
  twitter?: string
  discord?: string
  telegram?: string
  farcaster?: string
  contactEmail?: string
  country?: string
  state?: string
  city?: string
}

export const ORGANIZATION_TYPES: { value: OrganizationType; label: string }[] = [
  { value: 'company', label: 'Company' },
  { value: 'community', label: 'Community' },
  { value: 'grant', label: 'Grant' },
  { value: 'vc', label: 'VC' },
  { value: 'angel', label: 'Angel' },
]

export const FUNDING_OPTIONS = [
  'Pre-seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C+',
  'Bootstrapped',
  'Grant-funded',
  'Other',
]

/** Mock organizations derived from existing opportunities (only populated fields shown for existing orgs) */
export const mockOrganizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Uniswap Labs',
    type: 'company',
    logo: 'https://avatars.githubusercontent.com/u/36115574?s=200&v=4',
    coverImage: 'https://picsum.photos/seed/org-1/800/340',
    shortDescription: 'Building the leading decentralized exchange protocol.',
    website: 'https://uniswap.org',
    twitter: 'https://twitter.com/Uniswap',
    discord: 'https://discord.gg/uniswap',
    country: 'USA',
    city: 'New York',
  },
  {
    id: 'org-2',
    name: 'zkSync',
    type: 'company',
    logo: 'https://avatars.githubusercontent.com/u/65557647?s=200&v=4',
    coverImage: 'https://picsum.photos/seed/org-2/800/340',
    shortDescription: 'ZK-rollup scaling solution for Ethereum.',
    twitter: 'https://twitter.com/zksync',
    telegram: 'https://t.me/zksync',
  },
  {
    id: 'org-3',
    name: 'Ethereum Foundation',
    type: 'grant',
    logo: 'https://avatars.githubusercontent.com/u/6250754?s=200&v=4',
    coverImage: 'https://picsum.photos/seed/org-3/800/340',
    shortDescription: 'Non-profit supporting the Ethereum ecosystem.',
    website: 'https://ethereum.org',
    twitter: 'https://twitter.com/ethereum',
  },
  {
    id: 'org-4',
    name: 'Paradigm',
    type: 'vc',
    logo: 'https://avatars.githubusercontent.com/u/68578462?s=200&v=4',
    coverImage: 'https://picsum.photos/seed/org-4/800/340',
    shortDescription: 'Research-driven investment firm in crypto and web3.',
    twitter: 'https://twitter.com/paradigm',
  },
  {
    id: 'org-5',
    name: 'Optimism',
    type: 'company',
    logo: 'https://avatars.githubusercontent.com/u/58171697?s=200&v=4',
    coverImage: 'https://picsum.photos/seed/org-5/800/340',
    shortDescription: 'Ethereum Layer 2 scaling and public goods funding.',
    website: 'https://optimism.io',
    twitter: 'https://twitter.com/Optimism',
  },
  {
    id: 'org-6',
    name: 'OpenZeppelin',
    type: 'company',
    logo: 'https://avatars.githubusercontent.com/u/20820676?s=200&v=4',
    coverImage: 'https://picsum.photos/seed/org-6/800/340',
    shortDescription: 'Secure tools and libraries for smart contract development.',
    website: 'https://openzeppelin.com',
  },
  {
    id: 'org-7',
    name: 'Gitcoin',
    type: 'community',
    logo: 'https://avatars.githubusercontent.com/u/30044474?s=200&v=4',
    coverImage: 'https://picsum.photos/seed/org-7/800/340',
    shortDescription: 'Platform for funding public goods and open-source.',
    website: 'https://gitcoin.co',
    twitter: 'https://twitter.com/gitcoin',
  },
  {
    id: 'org-8',
    name: 'Chainlink',
    type: 'company',
    logo: 'https://avatars.githubusercontent.com/u/38020273?s=200&v=4',
    coverImage: 'https://picsum.photos/seed/org-8/800/340',
    shortDescription: 'Decentralized oracle network for smart contracts.',
    website: 'https://chain.link',
    twitter: 'https://twitter.com/chainlink',
  },
  {
    id: 'org-9',
    name: 'Base',
    type: 'company',
    logo: 'https://avatars.githubusercontent.com/u/108554348?s=200&v=4',
    coverImage: 'https://picsum.photos/seed/org-9/800/340',
    shortDescription: 'Ethereum L2 incubated by Coinbase.',
    website: 'https://base.org',
    twitter: 'https://twitter.com/base',
  },
  {
    id: 'org-10',
    name: 'Encode Club',
    type: 'community',
    logo: 'https://avatars.githubusercontent.com/u/77616608?s=200&v=4',
    coverImage: 'https://picsum.photos/seed/org-10/800/340',
    shortDescription: 'Web3 education community: hackathons and accelerators.',
    website: 'https://encode.club',
  },
]
