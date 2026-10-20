import type { FormatType } from '../types/trait'
import { FORMAT_LABELS, FORMAT_TYPES } from '../types/trait'
import type { TraitFilters, TraitStatus } from '../utils/traitFilter'
import { isFiltering } from '../utils/traitFilter'

interface Props {
  filters: TraitFilters
  formatCounts: Map<FormatType, number>
  growthStageCounts: Map<string, number>
  statusCounts: Map<TraitStatus, number>
  onChange: (patch: Partial<TraitFilters>) => void
  onClear: () => void
}

const SELECT_CLASS =
  'rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

export function TraitFilter({ filters, formatCounts, growthStageCounts, statusCounts, onChange, onClear }: Props) {
  // Only offer values present in the list, but keep the active one so a select never shows a stale value
  const formats = FORMAT_TYPES.filter((f) => formatCounts.has(f) || f === filters.format)
  const growthStages = [...growthStageCounts.keys()].sort((a, b) => a.localeCompare(b))
  if (filters.growthStage && !growthStageCounts.has(filters.growthStage)) growthStages.push(filters.growthStage)

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <input
        type="search"
        placeholder="Filter by name, alias, or details…"
        className="flex-1 min-w-[12rem] rounded border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={filters.query}
        onChange={(e) => onChange({ query: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onChange({ query: '' })
        }}
        aria-label="Filter traits"
      />
      <select
        value={filters.format}
        onChange={(e) => onChange({ format: e.target.value as FormatType | '' })}
        className={SELECT_CLASS}
        aria-label="Filter by format"
      >
        <option value="">All formats</option>
        {formats.map((f) => (
          <option key={f} value={f}>
            {FORMAT_LABELS[f]} ({formatCounts.get(f) ?? 0})
          </option>
        ))}
      </select>
      {growthStages.length > 0 && (
        <select
          value={filters.growthStage}
          onChange={(e) => onChange({ growthStage: e.target.value })}
          className={SELECT_CLASS}
          aria-label="Filter by growth stage"
        >
          <option value="">All growth stages</option>
          {growthStages.map((s) => (
            <option key={s} value={s}>
              {s} ({growthStageCounts.get(s) ?? 0})
            </option>
          ))}
        </select>
      )}
      <select
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value as TraitStatus | '' })}
        className={SELECT_CLASS}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        <option value="active">Active ({statusCounts.get('active') ?? 0})</option>
        <option value="inactive">Inactive ({statusCounts.get('inactive') ?? 0})</option>
      </select>
      {isFiltering(filters) && (
        <button
          onClick={onClear}
          className="rounded px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          Clear
        </button>
      )}
    </div>
  )
}
