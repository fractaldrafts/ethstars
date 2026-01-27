'use client'

import { IconZoomExclamation } from '@tabler/icons-react'
import { Plus } from 'lucide-react'

export interface EmptyStateCta {
  label: string
  onClick: () => void
}

export interface FilterEmptyStateConfig {
  message: string
  primaryCta: EmptyStateCta
  secondaryCta?: EmptyStateCta
}

interface FilterEmptyStateProps {
  config: FilterEmptyStateConfig
  /** Optional class for the wrapper (e.g. py-12 for table cell) */
  className?: string
}

export default function FilterEmptyState({ config, className = '' }: FilterEmptyStateProps) {
  const { message, primaryCta, secondaryCta } = config

  return (
    <div
      className={`flex flex-col items-center justify-center px-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      <IconZoomExclamation className="w-12 h-12 text-zinc-600 mb-4 flex-shrink-0" aria-hidden />
      <p className="text-zinc-500 text-sm text-center mb-4 max-w-sm">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={primaryCta.onClick}
          className="inline-flex items-center justify-center gap-2 w-[276px] h-[42px] flex-shrink-0 text-sm font-medium rounded-full transition-colors border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500/70"
        >
          {primaryCta.label}
        </button>
        {secondaryCta && (
          <button
            type="button"
            onClick={secondaryCta.onClick}
            className="inline-flex items-center justify-center gap-2 w-[276px] h-[42px] flex-shrink-0 text-sm font-medium rounded-full transition-colors border border-[rgba(245,245,245,0.2)] text-zinc-400 hover:text-white hover:border-zinc-500"
          >
            <Plus className="w-4 h-4" />
            {secondaryCta.label}
          </button>
        )}
      </div>
    </div>
  )
}
