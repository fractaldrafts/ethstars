'use client'

import * as React from 'react'
import { IconChevronDown, IconX } from '@tabler/icons-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'

export interface MultiSelectCreatableProps {
  label: string
  value: string // comma-separated
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  labelClass: string
  inputClass?: string
  className?: string
}

function parseValues(value: string): string[] {
  if (!value.trim()) return []
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

export function MultiSelectCreatable({
  label,
  value,
  onChange,
  options: initialOptions,
  placeholder = 'Select or add...',
  labelClass,
  inputClass = 'w-full pl-3 pr-10 py-2 rounded-lg bg-white/5 border border-[rgba(245,245,245,0.08)] text-white text-sm focus:border-red-500/50 transition-colors',
  className,
}: MultiSelectCreatableProps) {
  const selected = React.useMemo(() => parseValues(value), [value])
  const [open, setOpen] = React.useState(false)
  const [customOptions, setCustomOptions] = React.useState<string[]>([])
  const [customInput, setCustomInput] = React.useState('')

  const allOptions = React.useMemo(() => {
    const set = new Set([...initialOptions, ...customOptions])
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [initialOptions, customOptions])

  const toggle = (item: string) => {
    const next = selected.includes(item)
      ? selected.filter((s) => s !== item)
      : [...selected, item]
    onChange(next.join(', '))
  }

  const addCustom = () => {
    const trimmed = customInput.trim()
    if (!trimmed) return
    if (!allOptions.includes(trimmed)) {
      setCustomOptions((prev) => [...prev, trimmed])
    }
    if (!selected.includes(trimmed)) {
      onChange([...selected, trimmed].join(', '))
    }
    setCustomInput('')
  }

  const remove = (item: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter((s) => s !== item).join(', '))
  }

  const displayText = selected.length > 0 ? `${selected.length} selected` : placeholder

  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              inputClass,
              'flex items-center justify-between text-left min-h-[42px]',
              !selected.length && 'text-zinc-500'
            )}
          >
            <span className="truncate">
              {selected.length > 0 ? selected.join(', ') : displayText}
            </span>
            <IconChevronDown className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 rounded-lg border border-[rgba(245,245,245,0.08)] bg-[#17192A] text-white"
          align="start"
        >
          <Command className="bg-transparent">
            <CommandInput
              placeholder="Search or type to add..."
              className="border-0 border-b border-[rgba(245,245,245,0.08)] rounded-none focus:ring-0 text-white placeholder:text-zinc-500"
            />
            <CommandList className="max-h-[200px]">
              <CommandEmpty>No option found.</CommandEmpty>
              <CommandGroup className="p-1">
                {allOptions.map((item) => (
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
            <div className="border-t border-[rgba(245,245,245,0.08)] p-2 flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustom()
                  }
                }}
                placeholder="Add custom..."
                className="flex-1 px-3 py-2 rounded bg-white/5 border border-[rgba(245,245,245,0.08)] text-white text-sm placeholder:text-zinc-500 focus:border-red-500/50 outline-none"
              />
              <button
                type="button"
                onClick={addCustom}
                className="px-3 py-2 rounded bg-white/10 text-white text-sm font-medium hover:bg-white/15"
              >
                Add
              </button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-zinc-200 text-xs"
            >
              {item}
              <button
                type="button"
                onClick={(e) => remove(item, e)}
                className="hover:text-white focus:outline-none"
                aria-label={`Remove ${item}`}
              >
                <IconX className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
