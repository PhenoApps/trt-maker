import type { Trait } from '../types/trait'
import { FORMAT_LABELS, FORMAT_TYPES } from '../types/trait'

export type FilterCategory = 'format' | 'growthStage' | 'status'

export interface FilterChip {
  category: FilterCategory
  value: string
}

export interface TraitFilters {
  query: string
  chips: FilterChip[]
}

export const EMPTY_FILTERS: TraitFilters = { query: '', chips: [] }

interface CategoryDef {
  key: FilterCategory
  label: string
  getValue: (t: Trait) => string | undefined
  formatValue: (value: string) => string
  compare: (a: string, b: string) => number
}

const formatOrder = (v: string) => FORMAT_TYPES.indexOf(v as (typeof FORMAT_TYPES)[number])

export const FILTER_CATEGORIES: CategoryDef[] = [
  {
    key: 'format',
    label: 'Format',
    getValue: (t) => t.format,
    formatValue: (v) => FORMAT_LABELS[v as keyof typeof FORMAT_LABELS] ?? v,
    compare: (a, b) => formatOrder(a) - formatOrder(b),
  },
  {
    key: 'growthStage',
    label: 'Growth stage',
    getValue: (t) => t.growthStage || undefined,
    formatValue: (v) => v,
    compare: (a, b) => a.localeCompare(b),
  },
  {
    key: 'status',
    label: 'Status',
    getValue: (t) => t.status || undefined,
    formatValue: (v) => v,
    compare: (a, b) => a.localeCompare(b),
  },
]

export function getCategory(key: FilterCategory): CategoryDef {
  return FILTER_CATEGORIES.find((c) => c.key === key)!
}

export function isFiltering(filters: TraitFilters) {
  return filters.query.trim() !== '' || filters.chips.length > 0
}

export function hasChip(filters: TraitFilters, chip: FilterChip) {
  return filters.chips.some((c) => c.category === chip.category && c.value === chip.value)
}

function matchesQuery(trait: Trait, q: string) {
  return (
    trait.name.toLowerCase().includes(q) ||
    !!trait.alias?.toLowerCase().includes(q) ||
    !!trait.details?.toLowerCase().includes(q) ||
    !!trait.synonyms?.some((s) => s.toLowerCase().includes(q))
  )
}

// Chips in the same category are OR'd together; different categories are AND'd
export function filterTraits(traits: Trait[], filters: TraitFilters): Trait[] {
  const q = filters.query.toLowerCase().trim()
  const active = FILTER_CATEGORIES.map((cat) => ({
    cat,
    values: new Set(filters.chips.filter((c) => c.category === cat.key).map((c) => c.value)),
  })).filter(({ values }) => values.size > 0)

  return traits.filter(
    (t) =>
      active.every(({ cat, values }) => {
        const v = cat.getValue(t)
        return v !== undefined && values.has(v)
      }) &&
      (!q || matchesQuery(t, q)),
  )
}

// Distinct values per category with counts, in display order
export function categoryOptions(traits: Trait[], cat: CategoryDef): { value: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const t of traits) {
    const v = cat.getValue(t)
    if (v !== undefined) counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => cat.compare(a.value, b.value))
}
