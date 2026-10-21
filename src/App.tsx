import { useEffect, useMemo, useRef, useState } from 'react'
import type { Trait } from './types/trait'
import { Header } from './components/Header'
import { TraitList } from './components/TraitList'
import { TraitFilter } from './components/TraitFilter'
import type { TraitFilters } from './utils/traitFilter'
import { EMPTY_FILTERS, filterTraits, isFiltering } from './utils/traitFilter'
import { TraitFormModal } from './components/TraitFormModal'
import { BrapiModal } from './components/BrapiModal'
import { parseTrt } from './utils/trtParser'
import { downloadTrt } from './utils/trtExporter'
import { parseCO } from './utils/coImporter'

let idSeq = 0
function newId() {
  return `t-${++idSeq}`
}

export function App() {
  const [traits, setTraits] = useState<Trait[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTrait, setEditingTrait] = useState<Trait | null>(null)
  const [brapiModalOpen, setBrapiModalOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [filters, setFilters] = useState<TraitFilters>(EMPTY_FILTERS)
  // The list as last loaded or exported; any edit produces a new array, so identity tells us if work is unsaved
  const [savedTraits, setSavedTraits] = useState<Trait[]>(traits)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const hasUnsavedChanges = traits.length > 0 && traits !== savedTraits

  useEffect(() => {
    if (!hasUnsavedChanges) return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = '' // still required by some browsers to show the prompt
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const visibleTraits = useMemo(() => filterTraits(traits, filters), [traits, filters])

  // Selection only applies to what is shown, so a trait edited out of view can't be bulk-deleted unseen
  const visibleSelectedIds = useMemo(
    () => new Set(visibleTraits.filter((t) => selectedIds.has(t.id)).map((t) => t.id)),
    [visibleTraits, selectedIds],
  )

  function showToast(msg: string) {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  function handleExport() {
    downloadTrt(traits)
    setSavedTraits(traits)
  }

  function handleFiltersChange(next: TraitFilters) {
    setFilters(next)
    setSelectedIds(new Set())
  }

  function clearFilter() {
    setFilters(EMPTY_FILTERS)
    setSelectedIds(new Set())
  }

  function handleLoad(content: string, filename: string) {
    try {
      const loaded = parseTrt(content)
      if (loaded.length === 0) {
        showToast('No valid traits found in file.')
        return
      }
      if (
        traits.length > 0 &&
        !window.confirm(`Replace the current ${traits.length} trait(s) with the ${loaded.length} trait(s) from "${filename}"?`)
      ) {
        return
      }
      setTraits(loaded)
      setSavedTraits(loaded)
      clearFilter()
      showToast(`Loaded ${loaded.length} trait(s) from ${filename}`)
    } catch {
      showToast('Failed to parse file. Make sure it is a valid .trt (JSON or CSV) file.')
    }
  }

  function handleLoadCO(file: File) {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const loaded = await parseCO(reader.result as ArrayBuffer)
        if (loaded.length === 0) {
          showToast('No valid traits found in CO file.')
          return
        }
        if (
          traits.length > 0 &&
          !window.confirm(
            `Replace the current ${traits.length} trait(s) with the ${loaded.length} trait(s) from "${file.name}"?`,
          )
        ) {
          return
        }
        setTraits(loaded)
        setSavedTraits(loaded)
        clearFilter()
        showToast(`Imported ${loaded.length} trait(s) from ${file.name}`)
      } catch {
        showToast('Failed to parse CO file. Make sure it is a valid Crop Ontology Excel file.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function handleBrapiImport(imported: Trait[]) {
    // Skip names already in the list and repeats within the import itself
    const seenLower = new Set(traits.map((t) => t.name.toLowerCase()))
    const newTraits = imported.filter((t) => {
      const key = t.name.toLowerCase()
      if (seenLower.has(key)) return false
      seenLower.add(key)
      return true
    })
    if (newTraits.length === 0) {
      showToast('All selected traits already exist.')
    } else {
      setTraits((prev) => [...prev, ...newTraits])
      const skipped = imported.length - newTraits.length
      showToast(
        skipped > 0
          ? `Imported ${newTraits.length} trait(s). ${skipped} skipped (duplicates).`
          : `Imported ${newTraits.length} trait(s) from BrAPI server.`,
      )
    }
    setBrapiModalOpen(false)
  }

  function handleNew() {
    if (traits.length === 0) return
    if (!window.confirm('Clear all traits and start fresh?')) return
    setTraits([])
    clearFilter()
  }

  function handleAddTrait() {
    setEditingTrait(null)
    setModalOpen(true)
  }

  function handleEdit(trait: Trait) {
    setEditingTrait(trait)
    setModalOpen(true)
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSelectAll() {
    if (visibleTraits.length > 0 && visibleSelectedIds.size === visibleTraits.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visibleTraits.map((t) => t.id)))
    }
  }

  function handleDuplicate(id: string) {
    const trait = traits.find((t) => t.id === id)
    if (!trait) return
    const existingNames = traits.map((t) => t.name)
    const base = trait.name.replace(/ \(\d+\)$/, '')
    let candidate = ''
    for (let i = 1; ; i++) {
      candidate = `${base} (${i})`
      if (!existingNames.includes(candidate)) break
    }
    const duplicate: Trait = { ...trait, id: newId(), name: candidate }
    setTraits((prev) => {
      const idx = prev.findIndex((t) => t.id === id)
      const next = [...prev]
      next.splice(idx + 1, 0, duplicate)
      return next
    })
  }

  function handleDelete(id: string) {
    const trait = traits.find((t) => t.id === id)
    if (!trait) return
    if (!window.confirm(`Delete trait "${trait.name}"?`)) return
    setTraits((prev) => prev.filter((t) => t.id !== id))
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next })
  }

  function handleBulkDelete() {
    const count = visibleSelectedIds.size
    if (count === 0) return
    if (!window.confirm(`Delete ${count} selected trait${count !== 1 ? 's' : ''}?`)) return
    setTraits((prev) => prev.filter((t) => !visibleSelectedIds.has(t.id)))
    setSelectedIds(new Set())
  }

  function handleSave(data: Omit<Trait, 'id'>) {
    if (editingTrait) {
      setTraits((prev) =>
        prev.map((t) => (t.id === editingTrait.id ? { ...data, id: t.id } : t)),
      )
    } else {
      setTraits((prev) => [...prev, { ...data, id: newId() }])
    }
    setModalOpen(false)
    setEditingTrait(null)
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingTrait(null)
  }

  const existingNames = traits.map((t) => t.name)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        traitCount={traits.length}
        onLoad={handleLoad}
        onLoadCO={handleLoadCO}
        onOpenBrapi={() => setBrapiModalOpen(true)}
        onExport={handleExport}
        onNew={handleNew}
        onAddTrait={handleAddTrait}
      />

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500">
            {traits.length === 0
              ? 'Traits'
              : isFiltering(filters)
                ? `Showing ${visibleTraits.length} of ${traits.length} trait${traits.length !== 1 ? 's' : ''}`
                : `${traits.length} trait${traits.length !== 1 ? 's' : ''}`}
          </h2>
          {traits.length > 0 && (
            <p className="text-xs text-gray-400">Drag rows to reorder</p>
          )}
        </div>

        {traits.length > 0 && (
          <TraitFilter
            traits={traits}
            filters={filters}
            onChange={handleFiltersChange}
            onClear={clearFilter}
          />
        )}

        <TraitList
          traits={traits}
          visibleTraits={visibleTraits}
          selectedIds={visibleSelectedIds}
          onReorder={setTraits}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onBulkDelete={handleBulkDelete}
          onClearFilter={clearFilter}
        />
      </main>

      {brapiModalOpen && (
        <BrapiModal
          existingTraitNames={traits.map((t) => t.name)}
          onImport={handleBrapiImport}
          onClose={() => setBrapiModalOpen(false)}
        />
      )}

      {modalOpen && (
        <TraitFormModal
          trait={editingTrait}
          existingNames={existingNames}
          onSave={handleSave}
          onClose={handleCloseModal}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
