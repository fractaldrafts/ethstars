'use client'

import dynamic from 'next/dynamic'
import { useState, useMemo, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Search, Plus } from 'lucide-react'
import { IconCalendar, IconChevronDown, IconChevronRight, IconCircleCheck, IconPencil, IconUpload } from '@tabler/icons-react'
import type { Organization, OrganizationType } from '@/data/organizations'
import {
  mockOrganizations,
  ORGANIZATION_TYPES,
  FUNDING_OPTIONS,
} from '@/data/organizations'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false })
import OpportunityDetailsForm from '@/components/OpportunityDetailsForm'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export type OpportunityTypeFlow =
  | 'jobs'
  | 'grants'
  | 'hackathons'
  | 'volunteers'
  | 'investments'
  | 'bounties'
  | 'others'

const OPPORTUNITY_TYPES: { value: OpportunityTypeFlow; label: string }[] = [
  { value: 'jobs', label: 'Job/Intern' },
  { value: 'grants', label: 'Grant' },
  { value: 'hackathons', label: 'Hackathon' },
  { value: 'volunteers', label: 'Volunteer' },
  { value: 'investments', label: 'Investment' },
  { value: 'bounties', label: 'Bounty' },
  { value: 'others', label: 'Other' },
]

const FLOW_STEPS = [
  { title: 'Type', key: 'type' },
  { title: 'Organization', key: 'org' },
  { title: 'Opportunity', key: 'opportunity' },
  { title: 'Sign in', key: 'auth' },
  { title: 'Done', key: 'done' },
]

type OrgView = 'select' | 'new' | 'view' | 'suggest'

const emptyOrgForm: Partial<Organization> = {
  name: '',
  type: 'company',
  logo: '',
  coverImage: '',
  shortDescription: '',
  fullDescription: '',
  foundedIn: '',
  funding: '',
  website: '',
  twitter: '',
  discord: '',
  telegram: '',
  farcaster: '',
  contactEmail: '',
  country: '',
  state: '',
  city: '',
}

interface AddOpportunityFlowProps {
  onComplete?: () => void
  onCancel?: () => void
}

function getPopulatedOrgFields(org: Organization): { label: string; value: string }[] {
  const fields: { label: string; value: string }[] = []
  if (org.name) fields.push({ label: 'Name', value: org.name })
  if (org.type) fields.push({ label: 'Type', value: org.type })
  if (org.logo) fields.push({ label: 'Logo', value: org.logo })
  if (org.coverImage) fields.push({ label: 'Cover Image', value: org.coverImage })
  if (org.shortDescription) fields.push({ label: 'Short Description', value: org.shortDescription })
  if (org.fullDescription) fields.push({ label: 'Full Description', value: org.fullDescription })
  if (org.foundedIn) fields.push({ label: 'Founded In', value: org.foundedIn })
  if (org.funding) fields.push({ label: 'Funding', value: org.funding })
  if (org.website) fields.push({ label: 'Website', value: org.website })
  if (org.twitter) fields.push({ label: 'Twitter/X', value: org.twitter })
  if (org.discord) fields.push({ label: 'Discord', value: org.discord })
  if (org.telegram) fields.push({ label: 'Telegram', value: org.telegram })
  if (org.farcaster) fields.push({ label: 'Farcaster', value: org.farcaster })
  if (org.contactEmail) fields.push({ label: 'Contact Email', value: org.contactEmail })
  if (org.country) fields.push({ label: 'Country', value: org.country })
  if (org.state) fields.push({ label: 'State', value: org.state })
  if (org.city) fields.push({ label: 'City', value: org.city })
  return fields
}

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-white/5 border border-[rgba(245,245,245,0.08)] text-white placeholder-zinc-500 text-sm focus:border-red-500/50 transition-colors'
const selectClass =
  'w-full pl-3 pr-10 py-2 rounded-lg bg-white/5 border border-[rgba(245,245,245,0.08)] text-white text-sm focus:border-red-500/50 transition-colors appearance-none'
const labelClass = 'block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5'

const FOUNDED_YEARS = (() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: currentYear - 1980 + 1 }, (_, i) => String(currentYear - i))
})()

const COUNTRY_OPTIONS = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Bangladesh', 'Belgium', 'Brazil', 'Bulgaria',
  'Canada', 'Chile', 'China', 'Colombia', 'Croatia', 'Czech Republic', 'Denmark', 'Egypt', 'Estonia', 'Ethiopia',
  'Finland', 'France', 'Germany', 'Ghana', 'Greece', 'Hong Kong', 'Hungary', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Japan', 'Kenya', 'South Korea', 'Kuwait', 'Latvia', 'Lebanon', 'Lithuania', 'Luxembourg', 'Malaysia', 'Mexico', 'Morocco', 'Netherlands',
  'New Zealand', 'Nigeria', 'Norway', 'Pakistan', 'Philippines', 'Poland', 'Portugal', 'Romania', 'Russia', 'Saudi Arabia', 'Serbia',
  'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'Spain', 'Sweden', 'Switzerland', 'Taiwan', 'Thailand', 'Tunisia', 'Turkey',
  'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Vietnam', 'Zimbabwe',
].sort((a, b) => a.localeCompare(b))

// Opportunity details schema (shared enums / options)
const EXPERIENCE_LEVELS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'principal', label: 'Principal' },
]
const EMPLOYMENT_TYPE = [
  { value: 'job', label: 'Job' },
  { value: 'internship', label: 'Internship' },
]
const COMPENSATION_AMOUNT_TYPE = [
  { value: 'range', label: 'Range' },
  { value: 'fixed', label: 'Fixed amount' },
]
const DOMAINS_OPTIONS = [
  'DeFi', 'NFT', 'Infrastructure', 'DAO', 'Gaming', 'Security', 'Privacy', 'Scaling', 'DevEx', 'Research', 'Community', 'Governance', 'Grants', 'Public goods',
]
const SKILLS_OPTIONS = [
  'Solidity', 'React', 'TypeScript', 'Rust', 'Go', 'Subgraph', 'Smart contracts', 'Frontend', 'Backend', 'DevOps', 'Technical writing', 'Design', 'Product',
]
const WORKLOAD_COMMITMENT = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'flexible', label: 'Flexible' },
  { value: 'freelance', label: 'Freelance' },
]
const WORKLOAD_DURATION = [
  { value: 'short_term', label: 'Short-term' },
  { value: 'long_term', label: 'Long-term' },
  { value: 'fixed_term', label: 'Fixed-term' },
]
const TIMELINE_MODEL = [
  { value: 'fixed', label: 'Fixed dates' },
  { value: 'rolling', label: 'Rolling' },
  { value: 'indefinite', label: 'Indefinite' },
]
const LOCATION_SCOPE = [
  { value: 'remote', label: 'Remote' },
  { value: 'in_person', label: 'In-person' },
  { value: 'hybrid', label: 'Hybrid' },
]
const PARTICIPATION_TYPE = [
  { value: 'solo', label: 'Solo' },
  { value: 'team', label: 'Team' },
  { value: 'both', label: 'Solo or team' },
]
const INVESTMENT_STAGE = [
  { value: 'idea', label: 'Idea' },
  { value: 'pre_seed', label: 'Pre-seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'seed_plus', label: 'Seed+' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b', label: 'Series B' },
  { value: 'series_c_plus', label: 'Series C+' },
  { value: 'growth', label: 'Growth' },
]
const OTHER_OPPORTUNITY_TYPE = [
  { value: 'fellowship', label: 'Fellowship' },
  { value: 'residency', label: 'Residency' },
  { value: 'program', label: 'Program' },
  { value: 'initiative', label: 'Initiative' },
  { value: 'other', label: 'Other' },
]
const COMPENSATION_TYPE = [
  { value: 'salary', label: 'Salary' },
  { value: 'grant', label: 'Grant' },
  { value: 'bounty', label: 'Bounty' },
  { value: 'stipend', label: 'Stipend' },
  { value: 'scholarship', label: 'Scholarship' },
]
const CURRENCY_OPTIONS = ['USD', 'ETH', 'USDC', 'EUR', 'GBP']

const emptyOpportunityDetails: Record<string, string> = {
  title: '',
  short_description: '',
  full_description: '',
  apply_url: '',
  application_deadline: '',
  employment_type: '',
  compensation_display: 'fixed', // 'range' | 'fixed' — default fixed
  amount_min: '',
  amount_max: '',
  currency: 'USDC',
  workload_commitment: '',
  hours_per_week_min: '',
  hours_per_week_max: '',
  duration_type: '',
  duration_months: '',
  timeline_model: '',
  start_date: '',
  end_date: '',
  location_type: 'in_person', // default in-person, no empty option
  location_country: '',
  location_state: '',
  location_city: '',
  experience_level: '',
  benefits: '',
  volunteer_type: '',
  prize_pool_amount: '',
  prize_pool_currency: 'USDC',
  participation_type: '',
  needs_deposit: '',
  deposit_amount: '',
  deposit_currency: 'USDC',
  hackathon_telegram: '',
  hackathon_discord: '',
  hackathon_x: '',
  hackathon_status: '',
  ticket_min: '',
  ticket_max: '',
  investment_stage: '',
  investment_vertical: '',
  contact_email: '',
  application_link: '',
  investment_telegram: '',
  opportunity_type_other: '',
  opportunity_type_specify: '',
  benefits_other: '',
  domains: '',
  skills: '',
  required_skills: '',
}

export default function AddOpportunityFlow({ onComplete, onCancel }: AddOpportunityFlowProps) {
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [flowStep, setFlowStep] = useState(0)
  const [opportunityType, setOpportunityType] = useState<OpportunityTypeFlow>('jobs')
  const [orgView, setOrgView] = useState<OrgView>('select')
  const [orgSearch, setOrgSearch] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [orgForm, setOrgForm] = useState<Partial<Organization>>(emptyOrgForm)
  const [opportunityDetails, setOpportunityDetails] = useState<Record<string, string>>(emptyOpportunityDetails)
  const [deadlinePickerOpen, setDeadlinePickerOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const setOpportunityDetail = (key: string, value: string) => {
    setOpportunityDetails((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'employment_type' && value === 'internship') next.experience_level = 'junior'
      return next
    })
  }
  const getDetail = (key: string) => opportunityDetails[key] ?? ''

  useEffect(() => {
    setOpportunityDetails(emptyOpportunityDetails)
  }, [opportunityType])

  const filteredOrgs = useMemo(() => {
    if (!orgSearch.trim()) return mockOrganizations
    const q = orgSearch.toLowerCase()
    return mockOrganizations.filter((o) => o.name.toLowerCase().includes(q))
  }, [orgSearch])

  const updateOrgForm = (field: keyof Organization, value: string | undefined) => {
    setOrgForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleLogoFile = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    updateOrgForm('logo', url)
  }

  const handleCoverFile = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    updateOrgForm('coverImage', url)
  }

  const resetAndCancel = () => {
    setFlowStep(0)
    setOrgView('select')
    setSelectedOrg(null)
    setOrgForm(emptyOrgForm)
    setOrgSearch('')
    onCancel?.()
  }

  const goBack = () => {
    if (flowStep === 1 && orgView !== 'select') {
      if (orgView === 'new') {
        setOrgView('select')
        setOrgForm(emptyOrgForm)
      } else if (orgView === 'view' || orgView === 'suggest') {
        setOrgView('select')
        setSelectedOrg(null)
        setOrgForm(emptyOrgForm)
      }
    } else if (flowStep > 0) {
      setFlowStep((s) => s - 1)
    } else {
      resetAndCancel()
    }
  }

  const goNext = () => {
    if (flowStep === 1) {
      if (orgView === 'select') return
      setOrgView('select')
      setFlowStep(2)
    } else if (flowStep < 4) {
      setFlowStep((s) => s + 1)
    }
  }

  const handleSubmitChanges = () => {
    const successIcon = <IconCircleCheck className="h-5 w-5 text-emerald-400" aria-hidden />
    if (orgView === 'suggest') {
      const orgName = orgForm.name || selectedOrg?.name || 'this organization'
      toast(`Your changes to ${orgName} have been submitted.`, { icon: successIcon })
    } else if (orgView === 'new') {
      toast('Your organization has been added.', { icon: successIcon })
    }
    goNext()
  }

  const handleAddNewOrg = () => {
    setOrgView('new')
    setOrgForm({ ...emptyOrgForm, name: orgSearch.trim() || '' })
    setSelectedOrg(null)
  }

  const handleDiscardChanges = () => {
    setOrgView('view')
  }

  const handleSelectOrg = (org: Organization) => {
    setSelectedOrg(org)
    setOrgView('view')
  }

  const handleSuggestChanges = () => {
    setOrgView('suggest')
    setOrgForm({
      ...emptyOrgForm,
      ...selectedOrg,
      name: selectedOrg?.name ?? '',
      type: selectedOrg?.type ?? 'company',
    })
  }

  const handleSubmitAuth = () => {
    setSubmitted(true)
    setTimeout(() => {
      setFlowStep(0)
      setOrgView('select')
      setSelectedOrg(null)
      setOrgForm(emptyOrgForm)
      setOpportunityDetails(emptyOpportunityDetails)
      setSubmitted(false)
      onComplete?.()
    }, 2500)
  }

  // Breadcrumb shows 4 steps (sign-in hidden until user reaches it); step 3 label reflects selected category
  const opportunityStepLabel =
    opportunityType === 'others'
      ? 'OPPORTUNITY DETAILS'
      : `${OPPORTUNITY_TYPES.find((t) => t.value === opportunityType)?.label ?? 'Opportunity'} DETAILS`.toUpperCase()
  const BREADCRUMB_LABELS = ['CATEGORY', 'ORGANIZATION', opportunityStepLabel, 'SUBMIT']
  const breadcrumbActiveIndex = flowStep <= 3 ? flowStep : 3

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Page header — centered, like ADD YOUR GRANT */}
      <header className="py-8 border-b border-[rgba(245,245,245,0.08)] mb-8 text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Add opportunity</h1>
        {/* Breadcrumb: Category > Organization > Opportunity Details > Submit */}
        {!submitted && (
          <div
            className="mt-6 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-sm"
            role="navigation"
            aria-label="Progress"
          >
            {BREADCRUMB_LABELS.map((label, i) => (
              <span key={label} className="flex items-center gap-x-1.5">
                <button
                  type="button"
                  onClick={() => i < breadcrumbActiveIndex && setFlowStep(i)}
                  className={`transition-colors ${
                    i < breadcrumbActiveIndex ? 'cursor-pointer hover:text-white' : 'cursor-default'
                  } ${
                    i === breadcrumbActiveIndex
                      ? 'text-white font-medium'
                      : i < breadcrumbActiveIndex
                        ? 'text-zinc-400'
                        : 'text-zinc-500'
                  }`}
                  aria-label={`Step ${i + 1}: ${label}`}
                  aria-current={i === breadcrumbActiveIndex ? 'step' : undefined}
                >
                  {label}
                </button>
                {i < BREADCRUMB_LABELS.length - 1 && (
                  <IconChevronRight className="w-4 h-4 text-zinc-600 shrink-0" aria-hidden />
                )}
              </span>
            ))}
          </div>
        )}
        {submitted && (
          <p className="mt-6 text-sm text-zinc-500">Done</p>
        )}
      </header>

      {/* Content — no card, flows with page */}
      <div className="min-h-[320px]">
          {submitted ? (
            <section className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-400 mb-5">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Submission complete</h2>
              <p className="text-zinc-500 text-sm max-w-md mx-auto">
                Your opportunity has been submitted. If you suggested organization changes, they’ll go to the admin queue for approval.
              </p>
            </section>
          ) : (
            <>
              {flowStep === 0 && (
                <section className="space-y-6">
                  <p className="text-zinc-500 text-base text-center">Choose the type of opportunity you’re adding.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {OPPORTUNITY_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setOpportunityType(t.value)}
                        className={`px-5 py-3.5 rounded-lg border text-sm font-medium transition-colors ${
                          opportunityType === t.value
                            ? 'border-red-500 bg-red-500/10 text-white'
                            : 'border-[rgba(245,245,245,0.08)] text-zinc-400 hover:border-zinc-500 hover:text-white hover:bg-white/[0.02]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {flowStep === 1 && orgView === 'select' && (
                <div className="space-y-4">
                  <p className="text-zinc-400 text-base text-center">Search for an organization or add a new one.</p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={orgSearch}
                      onChange={(e) => setOrgSearch(e.target.value)}
                      placeholder="Search organizations..."
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                  <div className="border border-[rgba(245,245,245,0.08)] rounded-lg max-h-56 overflow-y-auto">
                    {filteredOrgs.map((org) => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => handleSelectOrg(org)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 border-b border-[rgba(245,245,245,0.06)] last:border-0"
                      >
                        {org.logo ? (
                          <img src={org.logo} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/10" />
                        )}
                        <span className="text-white text-sm font-medium">{org.name}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddNewOrg}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-[rgba(245,245,245,0.2)] text-zinc-400 hover:border-red-500/50 hover:text-red-400 text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Organization
                  </button>
                </div>
              )}

              {flowStep === 1 && (orgView === 'new' || orgView === 'suggest') && (
                <div className="space-y-5">
                  <p className="text-zinc-400 text-sm text-center">
                    {orgView === 'new' ? 'Add your organization details.' : 'Edit the field you want to suggest changes to'}
                  </p>
                  {/* Logo left; Name + Type right — uniform row */}
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0">
                      <label className={labelClass}>Logo</label>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          handleLogoFile(file ?? null)
                          e.target.value = ''
                        }}
                      />
                      <button
                        type="button"
                        title="Drag & drop or click to upload"
                        onClick={() => logoInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-red-500/50') }}
                        onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-red-500/50') }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.currentTarget.classList.remove('border-red-500/50')
                          const file = e.dataTransfer.files?.[0]
                          handleLogoFile(file ?? null)
                        }}
                        className="group relative mt-1.5 flex h-[7.5rem] w-[7.5rem] items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[rgba(245,245,245,0.2)] bg-white/5 transition-colors hover:border-zinc-500 hover:bg-white/[0.07]"
                      >
                        {orgForm.logo ? (
                          <>
                            <img src={orgForm.logo} alt="" className="h-full w-full object-cover" />
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                              <IconUpload className="h-8 w-8 text-white" />
                            </span>
                          </>
                        ) : (
                          <IconUpload className="h-6 w-6 text-zinc-500" />
                        )}
                      </button>
                    </div>
                    <div className="min-w-0 flex-1 space-y-5">
                      <div>
                        <label className={labelClass}>Name *</label>
                        <input
                          type="text"
                          value={orgForm.name ?? ''}
                          onChange={(e) => updateOrgForm('name', e.target.value)}
                          placeholder="Organization name"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Type</label>
                        <div className="relative">
                          <select
                            value={orgForm.type ?? 'company'}
                            onChange={(e) => updateOrgForm('type', e.target.value as OrganizationType)}
                            className={selectClass}
                          >
                            {ORGANIZATION_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                          <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Cover image</label>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        handleCoverFile(file ?? null)
                        e.target.value = ''
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-red-500/50') }}
                      onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-red-500/50') }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.remove('border-red-500/50')
                        const file = e.dataTransfer.files?.[0]
                        handleCoverFile(file ?? null)
                      }}
                      className="group relative w-full aspect-[3/1] overflow-hidden rounded-xl border-2 border-dashed border-[rgba(245,245,245,0.2)] bg-white/5 transition-colors hover:border-zinc-500 hover:bg-white/[0.07]"
                    >
                      {orgForm.coverImage ? (
                        <>
                          <img src={orgForm.coverImage} alt="" className="h-full w-full object-cover" />
                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <IconUpload className="h-10 w-10 text-white" />
                          </span>
                        </>
                      ) : (
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/20 text-zinc-400">
                          <IconUpload className="w-8 h-8 text-zinc-500" />
                          <span className="text-sm">Drag & drop here to upload</span>
                          <span className="text-xs text-zinc-500">or</span>
                          <span className="text-sm underline">Browse files</span>
                        </span>
                      )}
                    </button>
                  </div>
                  <div>
                    <label className={labelClass}>Short Description</label>
                    <textarea
                      value={orgForm.shortDescription ?? ''}
                      onChange={(e) => updateOrgForm('shortDescription', e.target.value)}
                      placeholder="Brief description"
                      rows={2}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Full Description (RTF)</label>
                    <RichTextEditor
                      value={orgForm.fullDescription ?? ''}
                      onChange={(value) => updateOrgForm('fullDescription', value)}
                      placeholder="Full description"
                      minHeight="120px"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Website</label>
                    <input
                      type="url"
                      value={orgForm.website ?? ''}
                      onChange={(e) => updateOrgForm('website', e.target.value)}
                      placeholder="https://..."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Contact Email</label>
                    <input
                      type="email"
                      value={orgForm.contactEmail ?? ''}
                      onChange={(e) => updateOrgForm('contactEmail', e.target.value)}
                      placeholder="contact@example.com"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Twitter/X</label>
                      <input
                        type="url"
                        value={orgForm.twitter ?? ''}
                        onChange={(e) => updateOrgForm('twitter', e.target.value)}
                        placeholder="https://twitter.com/..."
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Discord</label>
                      <input
                        type="url"
                        value={orgForm.discord ?? ''}
                        onChange={(e) => updateOrgForm('discord', e.target.value)}
                        placeholder="https://discord.gg/..."
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Telegram</label>
                      <input
                        type="url"
                        value={orgForm.telegram ?? ''}
                        onChange={(e) => updateOrgForm('telegram', e.target.value)}
                        placeholder="https://t.me/..."
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Farcaster</label>
                      <input
                        type="url"
                        value={orgForm.farcaster ?? ''}
                        onChange={(e) => updateOrgForm('farcaster', e.target.value)}
                        placeholder="https://warpcast.com/..."
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Founded In (Year)</label>
                      <div className="relative">
                        <select
                          value={orgForm.foundedIn ?? ''}
                          onChange={(e) => updateOrgForm('foundedIn', e.target.value)}
                          className={selectClass}
                        >
                          <option value="">—</option>
                          {FOUNDED_YEARS.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Funding</label>
                      <div className="relative">
                        <select
                          value={orgForm.funding ?? ''}
                          onChange={(e) => updateOrgForm('funding', e.target.value)}
                          className={selectClass}
                        >
                          <option value="">—</option>
                          {FUNDING_OPTIONS.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                        <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Country</label>
                      <div className="relative">
                        <select
                          value={orgForm.country ?? ''}
                          onChange={(e) => updateOrgForm('country', e.target.value)}
                          className={selectClass}
                        >
                          <option value="">—</option>
                          {COUNTRY_OPTIONS.map((country) => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                        <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>State</label>
                      <input
                        type="text"
                        value={orgForm.state ?? ''}
                        onChange={(e) => updateOrgForm('state', e.target.value)}
                        placeholder="State"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>City</label>
                      <input
                        type="text"
                        value={orgForm.city ?? ''}
                        onChange={(e) => updateOrgForm('city', e.target.value)}
                        placeholder="City"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              )}

              {flowStep === 1 && orgView === 'view' && selectedOrg && (
                <div className="space-y-4">
                  <p className="text-zinc-400 text-base text-center">Need to update something about the organization? Click Suggest Changes.</p>
                  <div className="rounded-xl border border-[rgba(245,245,245,0.08)] bg-white/[0.02] overflow-hidden">
                    {/* Cover image — 3:1 ratio; use placeholder when missing */}
                    <div className="aspect-[3/1] w-full bg-white/5">
                      <img
                        src={selectedOrg.coverImage ?? `https://picsum.photos/seed/${encodeURIComponent(selectedOrg.id)}/1500/500`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-5 sm:p-6">
                      {/* Logo + name + type */}
                      <div className="flex items-start gap-4">
                        {selectedOrg.logo ? (
                          <img
                            src={selectedOrg.logo}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
                          />
                        ) : (
                          <div className="h-14 w-14 shrink-0 rounded-xl bg-white/10 ring-1 ring-white/10" />
                        )}
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-white truncate">{selectedOrg.name}</h3>
                          <span className="inline-block mt-1 text-xs font-medium uppercase tracking-wider text-zinc-500 capitalize">
                            {selectedOrg.type}
                          </span>
                        </div>
                      </div>
                      {/* Short description */}
                      {selectedOrg.shortDescription && (
                        <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                          {selectedOrg.shortDescription}
                        </p>
                      )}
                      {/* Details grid — exclude logo, coverImage, name, type; combine city/state/country into Location */}
                      {(() => {
                        const excludeLabels = ['Logo', 'Cover Image', 'Short Description', 'Name', 'Type', 'Country', 'State', 'City']
                        const fields = getPopulatedOrgFields(selectedOrg).filter((f) => !excludeLabels.includes(f.label))
                        const locationParts = [selectedOrg.city, selectedOrg.state, selectedOrg.country].filter(Boolean) as string[]
                        const locationStr = locationParts.length > 0 ? locationParts.join(', ') : null
                        const withLocation = locationStr
                          ? [...fields, { label: 'Location', value: locationStr }]
                          : fields
                        if (withLocation.length === 0) return null
                        return (
                          <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 border-t border-[rgba(245,245,245,0.08)] pt-5">
                            {withLocation.map((f) => (
                              <div key={f.label}>
                                <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-0.5">
                                  {f.label}
                                </dt>
                                <dd className="text-sm text-zinc-300 break-all">
                                  {f.label === 'Location' ? (
                                    f.value
                                  ) : f.label === 'Website' || f.label === 'Twitter/X' || f.label === 'Discord' || f.label === 'Telegram' || f.label === 'Farcaster' || f.label === 'Contact Email' ? (
                                    <a
                                      href={f.value.startsWith('http') ? f.value : (f.label === 'Contact Email' ? `mailto:${f.value}` : f.value)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-red-400 hover:text-red-300 underline underline-offset-2"
                                    >
                                      {f.value}
                                    </a>
                                  ) : (
                                    f.value
                                  )}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {flowStep === 2 && (
                <OpportunityDetailsForm
                  opportunityType={opportunityType}
                  setOpportunityDetail={setOpportunityDetail}
                  getDetail={getDetail}
                  deadlinePickerOpen={deadlinePickerOpen}
                  setDeadlinePickerOpen={setDeadlinePickerOpen}
                  labelClass={labelClass}
                  inputClass={inputClass}
                  selectClass={selectClass}
                  OPPORTUNITY_TYPES={OPPORTUNITY_TYPES}
                  EXPERIENCE_LEVELS={EXPERIENCE_LEVELS}
                  EMPLOYMENT_TYPE={EMPLOYMENT_TYPE}
                  COMPENSATION_AMOUNT_TYPE={COMPENSATION_AMOUNT_TYPE}
                  DOMAINS_OPTIONS={DOMAINS_OPTIONS}
                  SKILLS_OPTIONS={SKILLS_OPTIONS}
                  WORKLOAD_COMMITMENT={WORKLOAD_COMMITMENT}
                  WORKLOAD_DURATION={WORKLOAD_DURATION}
                  TIMELINE_MODEL={TIMELINE_MODEL}
                  LOCATION_SCOPE={LOCATION_SCOPE}
                  PARTICIPATION_TYPE={PARTICIPATION_TYPE}
                  INVESTMENT_STAGE={INVESTMENT_STAGE}
                  OTHER_OPPORTUNITY_TYPE={OTHER_OPPORTUNITY_TYPE}
                  COMPENSATION_TYPE={COMPENSATION_TYPE}
                  CURRENCY_OPTIONS={CURRENCY_OPTIONS}
                  COUNTRY_OPTIONS={COUNTRY_OPTIONS}
                />
              )}

              {flowStep === 3 && (
                <div className="space-y-4">
                  <p className="text-zinc-400 text-base text-center">Sign in to submit your opportunity. Don’t have an account? You can create one below.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[rgba(245,245,245,0.08)] text-zinc-300 hover:border-zinc-500 hover:bg-white/5 text-sm font-medium transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      Google
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[rgba(245,245,245,0.08)] text-zinc-300 hover:border-zinc-500 hover:bg-white/5 text-sm font-medium transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                      GitHub
                    </button>
                  </div>
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[rgba(245,245,245,0.08)] text-zinc-300 hover:border-zinc-500 hover:bg-white/5 text-sm font-medium transition-colors"
                  >
                    Magic link (email)
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[rgba(245,245,245,0.08)] text-zinc-300 hover:border-zinc-500 hover:bg-white/5 text-sm font-medium transition-colors"
                  >
                    OTP (One-Time Password)
                  </button>
                  <p className="text-zinc-500 text-xs text-center">No account? You can create one with any option above.</p>
                </div>
              )}
            </>
          )}
      </div>

      {/* Actions — full width, page-level */}
      {!submitted && (
        <div className="flex items-center justify-between gap-4 border-t border-[rgba(245,245,245,0.08)] pt-8 mt-8">
          <button
            type="button"
            onClick={goBack}
            className="px-4 py-2 rounded-full text-sm font-medium text-zinc-500 hover:text-white transition-colors"
          >
            {flowStep === 0 ? 'Cancel' : 'Back'}
          </button>
          <div className="flex items-center gap-3">
            {flowStep === 1 && orgView === 'view' && (
              <>
                <button
                  type="button"
                  onClick={handleSuggestChanges}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(245,245,245,0.15)] text-zinc-300 text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  <IconPencil className="w-4 h-4 shrink-0" />
                  Suggest changes
                </button>
                <button type="button" onClick={goNext} className="px-5 py-2 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                  Next
                </button>
              </>
            )}
            {flowStep === 1 && orgView === 'new' && (
              <>
                <button
                  type="button"
                  onClick={goBack}
                  className="px-4 py-2 rounded-full border border-[rgba(245,245,245,0.15)] text-zinc-300 text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button type="button" onClick={handleSubmitChanges} className="px-5 py-2 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                  Create organisation
                </button>
              </>
            )}
            {flowStep === 1 && orgView === 'suggest' && (
              <>
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  className="px-4 py-2 rounded-full border border-[rgba(245,245,245,0.15)] text-zinc-300 text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  Discard changes
                </button>
                <button type="button" onClick={handleSubmitChanges} className="px-5 py-2 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                  Submit changes
                </button>
              </>
            )}
            {flowStep === 0 && (
              <button type="button" onClick={() => setFlowStep(1)} className="px-5 py-2 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                Next
              </button>
            )}
            {flowStep === 2 && (
              <button type="button" onClick={goNext} className="px-5 py-2 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                Next
              </button>
            )}
            {flowStep === 3 && (
              <button type="button" onClick={handleSubmitAuth} className="px-5 py-2 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                Sign in & submit
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
