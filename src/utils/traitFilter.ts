import type { FormatType, Trait } from '../types/trait'

export type TraitStatus = 'active' | 'inactive'

export interface TraitFilters {
  query: string
  format: FormatType | ''
  growthStage: string
  status: TraitStatus | ''
}

export const EMPTY_FILTERS: TraitFilters = { query: '', format: '', growthStage: '', status: '' }

// "Active" mirrors Field Book: a trait is active when it is visible in the app
export function traitStatus(trait: Trait): TraitStatus {
  return trait.isVisible === false ? 'inactive' : 'active'
}

export function isFiltering(filters: TraitFilters) {
  return filters.query.trim() !== '' || filters.format !== '' || filters.growthStage !== '' || filters.status !== ''
}

function matchesQuery(trait: Trait, q: string) {
  return (
    trait.name.toLowerCase().includes(q) ||
    !!trait.alias?.toLowerCase().includes(q) ||
    !!trait.details?.toLowerCase().includes(q) ||
    !!trait.synonyms?.some((s) => s.toLowerCase().includes(q))
  )
}

export function filterTraits(traits: Trait[], filters: TraitFilters): Trait[] {
  const q = filters.query.toLowerCase().trim()
  return traits.filter(
    (t) =>
      (!filters.format || t.format === filters.format) &&
      (!filters.growthStage || t.growthStage === filters.growthStage) &&
      (!filters.status || traitStatus(t) === filters.status) &&
      (!q || matchesQuery(t, q)),
  )
}

export function countBy<K>(traits: Trait[], key: (t: Trait) => K | undefined): Map<K, number> {
  const counts = new Map<K, number>()
  for (const t of traits) {
    const k = key(t)
    if (k !== undefined) counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return counts
}
