'use client'

import * as React from 'react'
import { IconChevronDown, IconX } from '@tabler/icons-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'

export interface ComboboxChipsProps {
  label: string
  value: string // comma-separated
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  labelClass: string
  className?: string
}

function parseValues(value: string): string[] {
  if (!value.trim()) return []
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

export function ComboboxChips({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  labelClass,
  className,
}: ComboboxChipsProps) {
  const selected = React.useMemo(() => parseValues(value), [value])
  const [open, setOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const toggle = (item: string) => {
    const next = selected.includes(item)
      ? selected.filter((s) => s !== item)
      : [...selected, item]
    onChange(next.join(', '))
  }

  const remove = (item: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onChange(selected.filter((s) => s !== item).join(', '))
  }

  const isEmpty = selected.length === 0
  const triggerClass = cn(
    'w-full flex flex-wrap items-center gap-1.5 px-3 rounded-lg bg-white/5 border border-[rgba(245,245,245,0.08)] text-sm focus-within:border-red-500/50 transition-colors cursor-text text-left',
    isEmpty ? 'h-[38px] py-0' : 'min-h-[38px] py-2'
  )

  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            role="combobox"
            aria-expanded={open}
            className={triggerClass}
            onClick={() => inputRef.current?.focus()}
          >
            {selected.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-white/10 text-zinc-200 text-xs shrink-0"
              >
                {item}
                <button
                  type="button"
                  onClick={(e) => remove(item, e)}
                  className="hover:text-white focus:outline-none rounded p-0.5"
                  aria-label={`Remove ${item}`}
                >
                  <IconX className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              type="text"
              readOnly
              value=""
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && selected.length > 0) {
                  onChange(selected.slice(0, -1).join(', '))
                  return
                }
                if (e.key === 'Escape') {
                  setOpen(false)
                  inputRef.current?.blur()
                }
              }}
              placeholder={selected.length === 0 ? placeholder : ''}
              className={cn(
                'min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none border-0 focus:ring-0 cursor-pointer',
                isEmpty ? 'h-full py-0 leading-[38px]' : 'py-2'
              )}
            />
            <IconChevronDown
              className="h-4 w-4 shrink-0 text-zinc-400 ml-auto self-center pointer-events-none"
              aria-hidden
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 rounded-lg border border-[rgba(245,245,245,0.08)] bg-[#17192A] text-white"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command className="bg-transparent">
            <CommandInput
              placeholder="Search..."
              className="border-0 border-b border-[rgba(245,245,245,0.08)] rounded-none focus:ring-0 text-white placeholder:text-zinc-500"
            />
            <CommandList className="max-h-[200px]">
              <CommandEmpty>No option found.</CommandEmpty>
              <CommandGroup className="p-1">
                {options.map((item) => (
                  <CommandItem
                    key={item}
                    onSelect={() => toggle(item)}
                    className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer rounded"
                  >
                    <span className="flex-1">{item}</span>
                    {selected.includes(item) && (
                      <span className="text-red-400 text-xs">✓</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
