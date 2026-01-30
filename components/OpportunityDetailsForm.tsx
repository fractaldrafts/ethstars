'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { IconCalendar, IconChevronDown } from '@tabler/icons-react'
import { ComboboxChips } from '@/components/ComboboxChips'
import { Switch } from '@/components/ui/switch'
import type { OpportunityTypeFlow } from './AddOpportunityFlow'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false })

type Option = { value: string; label: string }

interface OpportunityDetailsFormProps {
  opportunityType: OpportunityTypeFlow
  setOpportunityDetail: (key: string, value: string) => void
  getDetail: (key: string) => string
  deadlinePickerOpen: boolean
  setDeadlinePickerOpen: (open: boolean) => void
  labelClass: string
  inputClass: string
  selectClass: string
  OPPORTUNITY_TYPES: { value: OpportunityTypeFlow; label: string }[]
  EXPERIENCE_LEVELS: Option[]
  EMPLOYMENT_TYPE?: Option[]
  COMPENSATION_AMOUNT_TYPE?: Option[]
  DOMAINS_OPTIONS?: string[]
  SKILLS_OPTIONS?: string[]
  WORKLOAD_COMMITMENT: Option[]
  WORKLOAD_DURATION: Option[]
  TIMELINE_MODEL: Option[]
  LOCATION_SCOPE: Option[]
  PARTICIPATION_TYPE: Option[]
  INVESTMENT_STAGE: Option[]
  OTHER_OPPORTUNITY_TYPE: Option[]
  COMPENSATION_TYPE: Option[]
  CURRENCY_OPTIONS: string[]
  COUNTRY_OPTIONS: string[]
}

function SelectField({
  label,
  value,
  onChange,
  options,
  className,
  selectClass,
  labelClass,
  allowEmpty = true,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Option[] | string[]
  className?: string
  selectClass: string
  labelClass: string
  allowEmpty?: boolean
}) {
  const isOptionArray = options.length > 0 && typeof options[0] === 'object' && options[0] !== null && 'value' in (options[0] as object)
  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
          {allowEmpty && <option value="">—</option>}
          {isOptionArray
            ? (options as Option[]).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))
            : (options as string[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
        </select>
        <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
      </div>
    </div>
  )
}

function DatePickerField({
  label,
  value,
  onChange,
  open,
  onOpenChange,
  inputClass,
  labelClass,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  open: boolean
  onOpenChange: (o: boolean) => void
  inputClass: string
  labelClass: string
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`${inputClass} relative text-left font-normal pr-10 ${!value ? 'text-zinc-500' : ''}`}
          >
            {value
              ? new Date(value + 'T12:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
              : 'Select date'}
            <IconCalendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent className="date-picker-theme w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value + 'T12:00:00') : undefined}
            onSelect={(date) => {
              if (date) {
                onChange(date.toISOString().slice(0, 10))
                onOpenChange(false)
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default function OpportunityDetailsForm({
  opportunityType,
  setOpportunityDetail,
  getDetail,
  deadlinePickerOpen,
  setDeadlinePickerOpen,
  labelClass,
  inputClass,
  selectClass,
  OPPORTUNITY_TYPES,
  EXPERIENCE_LEVELS,
  EMPLOYMENT_TYPE = [],
  COMPENSATION_AMOUNT_TYPE = [],
  DOMAINS_OPTIONS = [],
  SKILLS_OPTIONS = [],
  WORKLOAD_COMMITMENT,
  WORKLOAD_DURATION,
  TIMELINE_MODEL,
  LOCATION_SCOPE,
  PARTICIPATION_TYPE,
  INVESTMENT_STAGE,
  OTHER_OPPORTUNITY_TYPE,
  COMPENSATION_TYPE,
  CURRENCY_OPTIONS,
  COUNTRY_OPTIONS,
}: OpportunityDetailsFormProps) {
  const typeLabel = OPPORTUNITY_TYPES.find((t) => t.value === opportunityType)?.label?.toLowerCase() ?? 'opportunity'
  const locationType = getDetail('location_type')
  const showLocationFields = locationType === 'in_person' || locationType === 'hybrid'
  const compensationDisplay = getDetail('compensation_display')
  const [hackathonStartDateOpen, setHackathonStartDateOpen] = useState(false)
  const [hackathonEndDateOpen, setHackathonEndDateOpen] = useState(false)
  const [bountyStartDateOpen, setBountyStartDateOpen] = useState(false)
  const [bountyEndDateOpen, setBountyEndDateOpen] = useState(false)
  const [othersStartDateOpen, setOthersStartDateOpen] = useState(false)
  const [othersEndDateOpen, setOthersEndDateOpen] = useState(false)

  return (
    <div className="space-y-5">
      {/* Job / Intern — Title, Application URL, Employment* | Experience*, Short*, Full* (RTF), then rest */}
      {(opportunityType === 'jobs') && (
        <>
          <p className="text-zinc-400 text-base text-center">
            Add details for this {typeLabel} opportunity.
          </p>
          <div>
            <label className={labelClass}>Title *</label>
            <input
              type="text"
              value={getDetail('title')}
              onChange={(e) => setOpportunityDetail('title', e.target.value)}
              placeholder="e.g. Senior Solidity Developer"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Application URL *</label>
            <input
              type="url"
              value={getDetail('apply_url')}
              onChange={(e) => setOpportunityDetail('apply_url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {EMPLOYMENT_TYPE.length > 0 && (
              <SelectField label="Employment type *" value={getDetail('employment_type')} onChange={(v) => setOpportunityDetail('employment_type', v)} options={EMPLOYMENT_TYPE} selectClass={selectClass} labelClass={labelClass} />
            )}
            <SelectField label="Experience level *" value={getDetail('experience_level')} onChange={(v) => setOpportunityDetail('experience_level', v)} options={EXPERIENCE_LEVELS} selectClass={selectClass} labelClass={labelClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {DOMAINS_OPTIONS.length > 0 && (
              <ComboboxChips
                label="Domains (optional)"
                value={getDetail('domains')}
                onChange={(v) => setOpportunityDetail('domains', v)}
                options={DOMAINS_OPTIONS}
                placeholder="Select domains..."
                labelClass={labelClass}
              />
            )}
            {SKILLS_OPTIONS.length > 0 && (
              <ComboboxChips
                label="Skills (optional)"
                value={getDetail('skills')}
                onChange={(v) => setOpportunityDetail('skills', v)}
                options={SKILLS_OPTIONS}
                placeholder="Select skills..."
                labelClass={labelClass}
              />
            )}
          </div>
          <div>
            <label className={labelClass}>Short description *</label>
            <input
              type="text"
              value={getDetail('short_description')}
              onChange={(e) => setOpportunityDetail('short_description', e.target.value)}
              placeholder="One-line summary"
              className={inputClass}
            />
          </div>
          <div className="full-description-rtf">
            <label className={labelClass}>Full description *</label>
            <RichTextEditor
              value={getDetail('full_description')}
              onChange={(v) => setOpportunityDetail('full_description', v)}
              placeholder="Roles, requirements, benefits, or program details"
              minHeight="220px"
              className="rounded-lg border border-[rgba(245,245,245,0.08)] w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Workload" value={getDetail('workload_commitment')} onChange={(v) => setOpportunityDetail('workload_commitment', v)} options={WORKLOAD_COMMITMENT} selectClass={selectClass} labelClass={labelClass} />
            <SelectField label="Duration" value={getDetail('duration_type')} onChange={(v) => setOpportunityDetail('duration_type', v)} options={WORKLOAD_DURATION} selectClass={selectClass} labelClass={labelClass} />
          </div>
          <div className="rounded-lg border border-[rgba(245,245,245,0.08)] p-4 space-y-4 bg-white/[0.02]">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Compensation (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              {COMPENSATION_AMOUNT_TYPE.length > 0 && (
                <SelectField label="Amount type" value={getDetail('compensation_display') || 'fixed'} onChange={(v) => setOpportunityDetail('compensation_display', v)} options={COMPENSATION_AMOUNT_TYPE} selectClass={selectClass} labelClass={labelClass} allowEmpty={false} />
              )}
              <SelectField label="Currency" value={getDetail('currency') || 'USDC'} onChange={(v) => setOpportunityDetail('currency', v)} options={CURRENCY_OPTIONS} selectClass={selectClass} labelClass={labelClass} allowEmpty={false} />
            </div>
            {compensationDisplay === 'range' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Min amount</label>
                  <input type="text" value={getDetail('amount_min')} onChange={(e) => setOpportunityDetail('amount_min', e.target.value)} placeholder="e.g. 120000" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Max amount</label>
                  <input type="text" value={getDetail('amount_max')} onChange={(e) => setOpportunityDetail('amount_max', e.target.value)} placeholder="e.g. 180000" className={inputClass} />
                </div>
              </div>
            )}
            {compensationDisplay === 'fixed' && (
              <div>
                <label className={labelClass}>Amount</label>
                <input type="text" value={getDetail('amount_min')} onChange={(e) => setOpportunityDetail('amount_min', e.target.value)} placeholder="e.g. 150000" className={inputClass} />
              </div>
            )}
          </div>
          <SelectField label="Location" value={getDetail('location_type') || 'in_person'} onChange={(v) => setOpportunityDetail('location_type', v)} options={LOCATION_SCOPE} selectClass={selectClass} labelClass={labelClass} allowEmpty={false} />
          {showLocationFields && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SelectField label="Country" value={getDetail('location_country')} onChange={(v) => setOpportunityDetail('location_country', v)} options={COUNTRY_OPTIONS} selectClass={selectClass} labelClass={labelClass} />
              <div>
                <label className={labelClass}>State / Region</label>
                <input type="text" value={getDetail('location_state')} onChange={(e) => setOpportunityDetail('location_state', e.target.value)} placeholder="State or region" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>City</label>
                <input type="text" value={getDetail('location_city')} onChange={(e) => setOpportunityDetail('location_city', e.target.value)} placeholder="City" className={inputClass} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Volunteer — Title, Apply URL, Workload | Duration (with fixed-term input), Domains | Skills, Short*, Full* (RTF), Benefits, Location */}
      {(opportunityType === 'volunteers') && (
        <>
          <p className="text-zinc-400 text-base text-center">
            Add details for this {typeLabel} opportunity.
          </p>
          <div>
            <label className={labelClass}>Title *</label>
            <input type="text" value={getDetail('title')} onChange={(e) => setOpportunityDetail('title', e.target.value)} placeholder="e.g. Community Moderator" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Application URL *</label>
            <input type="url" value={getDetail('apply_url')} onChange={(e) => setOpportunityDetail('apply_url', e.target.value)} placeholder="https://..." className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Workload *" value={getDetail('workload_commitment')} onChange={(v) => setOpportunityDetail('workload_commitment', v)} options={WORKLOAD_COMMITMENT} selectClass={selectClass} labelClass={labelClass} />
            <div className="flex gap-4 items-end">
              <SelectField label="Duration" value={getDetail('duration_type')} onChange={(v) => setOpportunityDetail('duration_type', v)} options={WORKLOAD_DURATION} selectClass={selectClass} labelClass={labelClass} className="flex-1 min-w-0" />
              {getDetail('duration_type') === 'fixed_term' && (
                <div className="flex-1 min-w-0">
                  <label className={labelClass}>Fixed term</label>
                  <input type="text" value={getDetail('duration_months')} onChange={(e) => setOpportunityDetail('duration_months', e.target.value)} placeholder="e.g. 3 months" className={inputClass} />
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {DOMAINS_OPTIONS.length > 0 && (
              <ComboboxChips label="Domains (optional)" value={getDetail('domains')} onChange={(v) => setOpportunityDetail('domains', v)} options={DOMAINS_OPTIONS} placeholder="Select domains..." labelClass={labelClass} />
            )}
            {SKILLS_OPTIONS.length > 0 && (
              <ComboboxChips label="Required skills (optional)" value={getDetail('skills')} onChange={(v) => setOpportunityDetail('skills', v)} options={SKILLS_OPTIONS} placeholder="Select skills..." labelClass={labelClass} />
            )}
          </div>
          <div>
            <label className={labelClass}>Short description *</label>
            <input type="text" value={getDetail('short_description')} onChange={(e) => setOpportunityDetail('short_description', e.target.value)} placeholder="One-line summary" className={inputClass} />
          </div>
          <div className="full-description-rtf">
            <label className={labelClass}>Full description *</label>
            <RichTextEditor value={getDetail('full_description')} onChange={(v) => setOpportunityDetail('full_description', v)} placeholder="Roles, requirements, benefits" minHeight="220px" className="rounded-lg border border-[rgba(245,245,245,0.08)] w-full" />
          </div>
          <div>
            <label className={labelClass}>Benefits (optional)</label>
            <input type="text" value={getDetail('benefits')} onChange={(e) => setOpportunityDetail('benefits', e.target.value)} placeholder="e.g. Mentorship, network access" className={inputClass} />
          </div>
          <SelectField label="Location" value={getDetail('location_type') || 'remote'} onChange={(v) => setOpportunityDetail('location_type', v)} options={LOCATION_SCOPE} selectClass={selectClass} labelClass={labelClass} allowEmpty={false} />
          {showLocationFields && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SelectField label="Country" value={getDetail('location_country')} onChange={(v) => setOpportunityDetail('location_country', v)} options={COUNTRY_OPTIONS} selectClass={selectClass} labelClass={labelClass} />
              <div>
                <label className={labelClass}>State / Region</label>
                <input type="text" value={getDetail('location_state')} onChange={(e) => setOpportunityDetail('location_state', e.target.value)} placeholder="State or region" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>City</label>
                <input type="text" value={getDetail('location_city')} onChange={(e) => setOpportunityDetail('location_city', e.target.value)} placeholder="City" className={inputClass} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Grant — Title, Apply URL, Application deadline*, Domains, Short*, Full* (RTF), Grant pool (optional) */}
      {(opportunityType === 'grants') && (
        <>
          <p className="text-zinc-400 text-base text-center">
            Add details for this {typeLabel} opportunity.
          </p>
          <div>
            <label className={labelClass}>Title *</label>
            <input type="text" value={getDetail('title')} onChange={(e) => setOpportunityDetail('title', e.target.value)} placeholder="e.g. Public Goods Grant" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Application URL *</label>
            <input type="url" value={getDetail('apply_url')} onChange={(e) => setOpportunityDetail('apply_url', e.target.value)} placeholder="https://..." className={inputClass} />
          </div>
          <DatePickerField
            label="Application deadline *"
            value={getDetail('application_deadline')}
            onChange={(v) => setOpportunityDetail('application_deadline', v)}
            open={deadlinePickerOpen}
            onOpenChange={setDeadlinePickerOpen}
            inputClass={inputClass}
            labelClass={labelClass}
          />
          {DOMAINS_OPTIONS.length > 0 && (
            <ComboboxChips label="Domains (optional)" value={getDetail('domains')} onChange={(v) => setOpportunityDetail('domains', v)} options={DOMAINS_OPTIONS} placeholder="Select domains..." labelClass={labelClass} />
          )}
          <div>
            <label className={labelClass}>Short description *</label>
            <input type="text" value={getDetail('short_description')} onChange={(e) => setOpportunityDetail('short_description', e.target.value)} placeholder="One-line summary" className={inputClass} />
          </div>
          <div className="full-description-rtf">
            <label className={labelClass}>Full description *</label>
            <RichTextEditor value={getDetail('full_description')} onChange={(v) => setOpportunityDetail('full_description', v)} placeholder="Eligibility, scope, deliverables" minHeight="220px" className="rounded-lg border border-[rgba(245,245,245,0.08)] w-full" />
          </div>
          <div className="rounded-lg border border-[rgba(245,245,245,0.08)] p-4 space-y-4 bg-white/[0.02]">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Grant pool (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              {COMPENSATION_AMOUNT_TYPE.length > 0 && (
                <SelectField label="Amount type" value={getDetail('compensation_display') || 'fixed'} onChange={(v) => setOpportunityDetail('compensation_display', v)} options={COMPENSATION_AMOUNT_TYPE} selectClass={selectClass} labelClass={labelClass} allowEmpty={false} />
              )}
              <SelectField label="Currency" value={getDetail('currency') || 'USDC'} onChange={(v) => setOpportunityDetail('currency', v)} options={CURRENCY_OPTIONS} selectClass={selectClass} labelClass={labelClass} allowEmpty={false} />
            </div>
            {compensationDisplay === 'range' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Min amount</label>
                  <input type="text" value={getDetail('amount_min')} onChange={(e) => setOpportunityDetail('amount_min', e.target.value)} placeholder="e.g. 5000" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Max amount</label>
                  <input type="text" value={getDetail('amount_max')} onChange={(e) => setOpportunityDetail('amount_max', e.target.value)} placeholder="e.g. 50000" className={inputClass} />
                </div>
              </div>
            )}
            {compensationDisplay === 'fixed' && (
              <div>
                <label className={labelClass}>Amount</label>
                <input type="text" value={getDetail('amount_min')} onChange={(e) => setOpportunityDetail('amount_min', e.target.value)} placeholder="e.g. 25000" className={inputClass} />
              </div>
            )}
          </div>
        </>
      )}

      {/* Bounty — Title, Apply URL, Domains | Skills, Short*, Full* (RTF), Compensation (range/fixed), Timeline, Start & End date (calendar), no application deadline */}
      {(opportunityType === 'bounties') && (
        <>
          <p className="text-zinc-400 text-base text-center">
            Add details for this {typeLabel} opportunity.
          </p>
          <div>
            <label className={labelClass}>Title *</label>
            <input type="text" value={getDetail('title')} onChange={(e) => setOpportunityDetail('title', e.target.value)} placeholder="e.g. Security Audit Bounty" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Application URL *</label>
            <input type="url" value={getDetail('apply_url')} onChange={(e) => setOpportunityDetail('apply_url', e.target.value)} placeholder="https://..." className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {DOMAINS_OPTIONS.length > 0 && (
              <ComboboxChips label="Domains (optional)" value={getDetail('domains')} onChange={(v) => setOpportunityDetail('domains', v)} options={DOMAINS_OPTIONS} placeholder="Select domains..." labelClass={labelClass} />
            )}
            {SKILLS_OPTIONS.length > 0 && (
              <ComboboxChips label="Required skills (optional)" value={getDetail('required_skills')} onChange={(v) => setOpportunityDetail('required_skills', v)} options={SKILLS_OPTIONS} placeholder="Select skills..." labelClass={labelClass} />
            )}
          </div>
          <SelectField label="Timeline" value={getDetail('timeline_model')} onChange={(v) => setOpportunityDetail('timeline_model', v)} options={TIMELINE_MODEL} selectClass={selectClass} labelClass={labelClass} />
          <div className={getDetail('timeline_model') === 'indefinite' ? '' : 'grid grid-cols-2 gap-4'}>
            <DatePickerField label="Start date" value={getDetail('start_date')} onChange={(v) => setOpportunityDetail('start_date', v)} open={bountyStartDateOpen} onOpenChange={setBountyStartDateOpen} inputClass={inputClass} labelClass={labelClass} />
            {getDetail('timeline_model') !== 'indefinite' && (
              <DatePickerField label="End date (deadline)" value={getDetail('end_date')} onChange={(v) => setOpportunityDetail('end_date', v)} open={bountyEndDateOpen} onOpenChange={setBountyEndDateOpen} inputClass={inputClass} labelClass={labelClass} />
            )}
          </div>
          <div>
            <label className={labelClass}>Short description *</label>
            <input type="text" value={getDetail('short_description')} onChange={(e) => setOpportunityDetail('short_description', e.target.value)} placeholder="One-line summary" className={inputClass} />
          </div>
          <div className="full-description-rtf">
            <label className={labelClass}>Full description *</label>
            <RichTextEditor value={getDetail('full_description')} onChange={(v) => setOpportunityDetail('full_description', v)} placeholder="Scope, deliverables, criteria" minHeight="220px" className="rounded-lg border border-[rgba(245,245,245,0.08)] w-full" />
          </div>
          <div className="rounded-lg border border-[rgba(245,245,245,0.08)] p-4 space-y-4 bg-white/[0.02]">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Compensation (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              {COMPENSATION_AMOUNT_TYPE.length > 0 && (
                <SelectField label="Amount type" value={getDetail('compensation_display') || 'fixed'} onChange={(v) => setOpportunityDetail('compensation_display', v)} options={COMPENSATION_AMOUNT_TYPE} selectClass={selectClass} labelClass={labelClass} allowEmpty={false} />
              )}
              <SelectField label="Currency" value={getDetail('currency') || 'USDC'} onChange={(v) => setOpportunityDetail('currency', v)} options={CURRENCY_OPTIONS} selectClass={selectClass} labelClass={labelClass} allowEmpty={false} />
            </div>
            {compensationDisplay === 'range' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Min amount</label>
                  <input type="text" value={getDetail('amount_min')} onChange={(e) => setOpportunityDetail('amount_min', e.target.value)} placeholder="e.g. 500" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Max amount</label>
                  <input type="text" value={getDetail('amount_max')} onChange={(e) => setOpportunityDetail('amount_max', e.target.value)} placeholder="e.g. 5000" className={inputClass} />
                </div>
              </div>
            )}
            {compensationDisplay === 'fixed' && (
              <div>
                <label className={labelClass}>Amount</label>
                <input type="text" value={getDetail('amount_min')} onChange={(e) => setOpportunityDetail('amount_min', e.target.value)} placeholder="e.g. 500" className={inputClass} />
              </div>
            )}
          </div>
        </>
      )}

      {/* Hackathon — Title, Application URL, Participation type, Domains, Start & End date*, Short*, Full*, Location, Country & City, Prize pool, Deposit, Contact */}
      {(opportunityType === 'hackathons') && (
        <>
          <p className="text-zinc-400 text-base text-center">
            Add details for this {typeLabel} opportunity.
          </p>
          <div>
            <label className={labelClass}>Title *</label>
            <input type="text" value={getDetail('title')} onChange={(e) => setOpportunityDetail('title', e.target.value)} placeholder="e.g. ETHGlobal Hackathon" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Application URL *</label>
            <input type="url" value={getDetail('apply_url')} onChange={(e) => setOpportunityDetail('apply_url', e.target.value)} placeholder="https://..." className={inputClass} />
          </div>
          <SelectField label="Participation type *" value={getDetail('participation_type')} onChange={(v) => setOpportunityDetail('participation_type', v)} options={PARTICIPATION_TYPE} selectClass={selectClass} labelClass={labelClass} />
          {DOMAINS_OPTIONS.length > 0 && (
            <ComboboxChips label="Domains *" value={getDetail('domains')} onChange={(v) => setOpportunityDetail('domains', v)} options={DOMAINS_OPTIONS} placeholder="Select domains..." labelClass={labelClass} />
          )}
          <div className="grid grid-cols-2 gap-4">
            <DatePickerField label="Start date *" value={getDetail('start_date')} onChange={(v) => setOpportunityDetail('start_date', v)} open={hackathonStartDateOpen} onOpenChange={setHackathonStartDateOpen} inputClass={inputClass} labelClass={labelClass} />
            <DatePickerField label="End date *" value={getDetail('end_date')} onChange={(v) => setOpportunityDetail('end_date', v)} open={hackathonEndDateOpen} onOpenChange={setHackathonEndDateOpen} inputClass={inputClass} labelClass={labelClass} />
          </div>
          <div>
            <label className={labelClass}>Short description *</label>
            <input type="text" value={getDetail('short_description')} onChange={(e) => setOpportunityDetail('short_description', e.target.value)} placeholder="One-line summary" className={inputClass} />
          </div>
          <div className="full-description-rtf">
            <label className={labelClass}>Full description *</label>
            <RichTextEditor value={getDetail('full_description')} onChange={(v) => setOpportunityDetail('full_description', v)} placeholder="Tracks, prizes, rules" minHeight="220px" className="rounded-lg border border-[rgba(245,245,245,0.08)] w-full" />
          </div>
          <SelectField label="Location" value={getDetail('location_type') || 'in_person'} onChange={(v) => setOpportunityDetail('location_type', v)} options={LOCATION_SCOPE} selectClass={selectClass} labelClass={labelClass} allowEmpty={false} />
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Country" value={getDetail('location_country')} onChange={(v) => setOpportunityDetail('location_country', v)} options={COUNTRY_OPTIONS} selectClass={selectClass} labelClass={labelClass} />
            <div>
              <label className={labelClass}>City</label>
              <input type="text" value={getDetail('location_city')} onChange={(e) => setOpportunityDetail('location_city', e.target.value)} placeholder="City" className={inputClass} />
            </div>
          </div>
          <div className="rounded-lg border border-[rgba(245,245,245,0.08)] p-4 space-y-4 bg-white/[0.02]">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Prize pool (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Amount</label>
                <input type="text" value={getDetail('prize_pool_amount')} onChange={(e) => setOpportunityDetail('prize_pool_amount', e.target.value)} placeholder="e.g. 100000" className={inputClass} />
              </div>
              <SelectField label="Currency" value={getDetail('prize_pool_currency') || 'USDC'} onChange={(v) => setOpportunityDetail('prize_pool_currency', v)} options={CURRENCY_OPTIONS} selectClass={selectClass} labelClass={labelClass} allowEmpty={false} />
            </div>
          </div>
          <div className="rounded-lg border border-[rgba(245,245,245,0.08)] p-4 space-y-4 bg-white/[0.02]">
            <div className="flex items-center justify-between gap-4">
              <label className={`${labelClass} mb-0`}>Deposit required?</label>
              <Switch
                checked={getDetail('needs_deposit') === 'yes'}
                onCheckedChange={(checked) => setOpportunityDetail('needs_deposit', checked ? 'yes' : 'no')}
                className="data-[state=checked]:bg-red-500/90"
              />
            </div>
            {getDetail('needs_deposit') === 'yes' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className={labelClass}>Amount</label>
                  <input type="text" value={getDetail('deposit_amount')} onChange={(e) => setOpportunityDetail('deposit_amount', e.target.value)} placeholder="e.g. 50" className={inputClass} />
                </div>
                <SelectField label="Currency" value={getDetail('deposit_currency') || 'USDC'} onChange={(v) => setOpportunityDetail('deposit_currency', v)} options={CURRENCY_OPTIONS} selectClass={selectClass} labelClass={labelClass} allowEmpty={false} />
              </div>
            )}
          </div>
          <div className="rounded-lg border border-[rgba(245,245,245,0.08)] p-4 space-y-4 bg-white/[0.02]">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Contact details</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Telegram</label>
                <input type="text" value={getDetail('hackathon_telegram')} onChange={(e) => setOpportunityDetail('hackathon_telegram', e.target.value)} placeholder="@handle" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Discord</label>
                <input type="text" value={getDetail('hackathon_discord')} onChange={(e) => setOpportunityDetail('hackathon_discord', e.target.value)} placeholder="Server or handle" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>X (Twitter)</label>
                <input type="text" value={getDetail('hackathon_x')} onChange={(e) => setOpportunityDetail('hackathon_x', e.target.value)} placeholder="@handle" className={inputClass} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Investment — Title, Contact (side by side), Investment stage, Domains* (vertical), Short*, Full* (RTF), Ticket size */}
      {(opportunityType === 'investments') && (
        <>
          <p className="text-zinc-400 text-base text-center">
            Add details for this {typeLabel} opportunity.
          </p>
          <div>
            <label className={labelClass}>Title *</label>
            <input type="text" value={getDetail('title')} onChange={(e) => setOpportunityDetail('title', e.target.value)} placeholder="e.g. Web3 Infrastructure Fund" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Application / intro link *</label>
            <input type="url" value={getDetail('application_link')} onChange={(e) => setOpportunityDetail('application_link', e.target.value)} placeholder="https://..." className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Contact email</label>
              <input type="email" value={getDetail('contact_email')} onChange={(e) => setOpportunityDetail('contact_email', e.target.value)} placeholder="contact@fund.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Telegram handle</label>
              <input type="text" value={getDetail('investment_telegram')} onChange={(e) => setOpportunityDetail('investment_telegram', e.target.value)} placeholder="@handle" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Investment stage" value={getDetail('investment_stage')} onChange={(v) => setOpportunityDetail('investment_stage', v)} options={INVESTMENT_STAGE} selectClass={selectClass} labelClass={labelClass} />
            {DOMAINS_OPTIONS.length > 0 && (
              <ComboboxChips label="Domains / vertical *" value={getDetail('domains')} onChange={(v) => setOpportunityDetail('domains', v)} options={DOMAINS_OPTIONS} placeholder="Select domains..." labelClass={labelClass} />
            )}
          </div>
          <div>
            <label className={labelClass}>Short description *</label>
            <input type="text" value={getDetail('short_description')} onChange={(e) => setOpportunityDetail('short_description', e.target.value)} placeholder="One-line summary" className={inputClass} />
          </div>
          <div className="full-description-rtf">
            <label className={labelClass}>Full description *</label>
            <RichTextEditor value={getDetail('full_description')} onChange={(v) => setOpportunityDetail('full_description', v)} placeholder="Focus, criteria, process" minHeight="220px" className="rounded-lg border border-[rgba(245,245,245,0.08)] w-full" />
          </div>
          <div className="rounded-lg border border-[rgba(245,245,245,0.08)] p-4 space-y-4 bg-white/[0.02]">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Ticket size (optional)</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Min</label>
                <input type="text" value={getDetail('ticket_min')} onChange={(e) => setOpportunityDetail('ticket_min', e.target.value)} placeholder="e.g. 50k" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Max</label>
                <input type="text" value={getDetail('ticket_max')} onChange={(e) => setOpportunityDetail('ticket_max', e.target.value)} placeholder="e.g. 500k" className={inputClass} />
              </div>
              <SelectField label="Currency" value={getDetail('currency') || 'USDC'} onChange={(v) => setOpportunityDetail('currency', v)} options={CURRENCY_OPTIONS} selectClass={selectClass} labelClass={labelClass} allowEmpty={false} />
            </div>
          </div>
        </>
      )}

      {/* Other — Title, Apply URL, Opportunity type*, Domains, Short*, Full* (RTF), Location, Benefits */}
      {(opportunityType === 'others') && (
        <>
          <p className="text-zinc-400 text-base text-center">
            Add details for this {typeLabel} opportunity.
          </p>
          <div>
            <label className={labelClass}>Title *</label>
            <input type="text" value={getDetail('title')} onChange={(e) => setOpportunityDetail('title', e.target.value)} placeholder="Opportunity title" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Application URL *</label>
            <input type="url" value={getDetail('apply_url')} onChange={(e) => setOpportunityDetail('apply_url', e.target.value)} placeholder="https://..." className={inputClass} />
          </div>
          <div className={getDetail('opportunity_type_other') === 'other' ? 'grid grid-cols-2 gap-4' : ''}>
            <SelectField label="Opportunity type *" value={getDetail('opportunity_type_other')} onChange={(v) => setOpportunityDetail('opportunity_type_other', v)} options={OTHER_OPPORTUNITY_TYPE} selectClass={selectClass} labelClass={labelClass} allowEmpty={false} />
            {getDetail('opportunity_type_other') === 'other' && (
              <div>
                <label className={labelClass}>Other (please specify)</label>
                <input type="text" value={getDetail('opportunity_type_specify')} onChange={(e) => setOpportunityDetail('opportunity_type_specify', e.target.value)} placeholder="e.g. Accelerator, Incubator" className={inputClass} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {DOMAINS_OPTIONS.length > 0 && (
              <ComboboxChips label="Domains (optional)" value={getDetail('domains')} onChange={(v) => setOpportunityDetail('domains', v)} options={DOMAINS_OPTIONS} placeholder="Select domains..." labelClass={labelClass} />
            )}
            {SKILLS_OPTIONS.length > 0 && (
              <ComboboxChips label="Skills (optional)" value={getDetail('skills')} onChange={(v) => setOpportunityDetail('skills', v)} options={SKILLS_OPTIONS} placeholder="Select skills..." labelClass={labelClass} />
            )}
          </div>
          <SelectField label="Timeline" value={getDetail('timeline_model')} onChange={(v) => setOpportunityDetail('timeline_model', v)} options={TIMELINE_MODEL} selectClass={selectClass} labelClass={labelClass} />
          <div className={getDetail('timeline_model') === 'indefinite' ? '' : 'grid grid-cols-2 gap-4'}>
            <DatePickerField label="Start date" value={getDetail('start_date')} onChange={(v) => setOpportunityDetail('start_date', v)} open={othersStartDateOpen} onOpenChange={setOthersStartDateOpen} inputClass={inputClass} labelClass={labelClass} />
            {getDetail('timeline_model') !== 'indefinite' && (
              <DatePickerField label="End date (deadline)" value={getDetail('end_date')} onChange={(v) => setOpportunityDetail('end_date', v)} open={othersEndDateOpen} onOpenChange={setOthersEndDateOpen} inputClass={inputClass} labelClass={labelClass} />
            )}
          </div>
          <div>
            <label className={labelClass}>Short description *</label>
            <input type="text" value={getDetail('short_description')} onChange={(e) => setOpportunityDetail('short_description', e.target.value)} placeholder="One-line summary" className={inputClass} />
          </div>
          <div className="full-description-rtf">
            <label className={labelClass}>Full description *</label>
            <RichTextEditor value={getDetail('full_description')} onChange={(v) => setOpportunityDetail('full_description', v)} placeholder="Details, requirements, benefits" minHeight="220px" className="rounded-lg border border-[rgba(245,245,245,0.08)] w-full" />
          </div>
          <SelectField label="Location" value={getDetail('location_type') || 'remote'} onChange={(v) => setOpportunityDetail('location_type', v)} options={LOCATION_SCOPE} selectClass={selectClass} labelClass={labelClass} allowEmpty={false} />
          {showLocationFields && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SelectField label="Country" value={getDetail('location_country')} onChange={(v) => setOpportunityDetail('location_country', v)} options={COUNTRY_OPTIONS} selectClass={selectClass} labelClass={labelClass} />
              <div>
                <label className={labelClass}>State / Region</label>
                <input type="text" value={getDetail('location_state')} onChange={(e) => setOpportunityDetail('location_state', e.target.value)} placeholder="State or region" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>City</label>
                <input type="text" value={getDetail('location_city')} onChange={(e) => setOpportunityDetail('location_city', e.target.value)} placeholder="City" className={inputClass} />
              </div>
            </div>
          )}
          <div>
            <label className={labelClass}>Benefits (optional)</label>
            <input type="text" value={getDetail('benefits_other')} onChange={(e) => setOpportunityDetail('benefits_other', e.target.value)} placeholder="e.g. Stipend, mentorship" className={inputClass} />
          </div>
        </>
      )}
    </div>
  )
}
