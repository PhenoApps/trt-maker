import { useMemo } from 'react'
import type { Trait } from '../types/trait'
import type { FilterCategory, FilterChip, TraitFilters } from '../utils/traitFilter'
import { FILTER_CATEGORIES, categoryOptions, getCategory, hasChip, isFiltering } from '../utils/traitFilter'

interface Props {
  traits: Trait[]
  filters: TraitFilters
  onChange: (filters: TraitFilters) => void
  onClear: () => void
}

export function TraitFilter({ traits, filters, onChange, onClear }: Props) {
  // Offer only values present in the list that aren't already chips; hide categories with nothing to offer
  const groups = useMemo(
    () =>
      FILTER_CATEGORIES.map((cat) => ({
        cat,
        options: categoryOptions(traits, cat).filter((o) => !hasChip(filters, { category: cat.key, value: o.value })),
      })).filter((g) => g.options.length > 0),
    [traits, filters],
  )

  function addChip(encoded: string) {
    const sep = encoded.indexOf(':')
    const chip: FilterChip = { category: encoded.slice(0, sep) as FilterCategory, value: encoded.slice(sep + 1) }
    if (!hasChip(filters, chip)) onChange({ ...filters, chips: [...filters.chips, chip] })
  }

  function removeChip(chip: FilterChip) {
    onChange({
      ...filters,
      chips: filters.chips.filter((c) => !(c.category === chip.category && c.value === chip.value)),
    })
  }

  return (
    <div className="mb-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Filter by name, alias, or details…"
          className="flex-1 min-w-48 rounded-sm border border-gray-300 px-2 py-1.5 text-sm shadow-xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onChange({ ...filters, query: '' })
          }}
          aria-label="Filter traits"
        />
        <select
          value=""
          onChange={(e) => e.target.value && addChip(e.target.value)}
          disabled={groups.length === 0}
          className="rounded-sm border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 shadow-xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 disabled:opacity-40"
          aria-label="Add filter"
        >
          <option value="">+ Add filter</option>
          {groups.map(({ cat, options }) => (
            <optgroup key={cat.key} label={cat.label}>
              {options.map((o) => (
                <option key={o.value} value={`${cat.key}:${o.value}`}>
                  {cat.formatValue(o.value)} ({o.count})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {isFiltering(filters) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.chips.map((chip) => {
            const cat = getCategory(chip.category)
            const label = `${cat.label}: ${cat.formatValue(chip.value)}`
            return (
              <span
                key={`${chip.category}:${chip.value}`}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-200 bg-blue-50 py-0.5 pl-2.5 pr-1 text-xs text-blue-800"
              >
                <span className="truncate">
                  <span className="text-blue-500">{cat.label}:</span> {cat.formatValue(chip.value)}
                </span>
                <button
                  onClick={() => removeChip(chip)}
                  className="rounded-full p-0.5 text-blue-400 hover:bg-blue-100 hover:text-blue-700"
                  aria-label={`Remove filter ${label}`}
                  title="Remove filter"
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </span>
            )
          })}
          <button
            onClick={onClear}
            className="rounded-sm px-2 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
