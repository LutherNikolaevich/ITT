import { useMemo, useState } from 'react'
import type { TimeEntry } from '../types'
import { dateKey, startOfWeek, totalRenderedMinutes } from '../lib/aggregate'
import { formatHours } from '../lib/time'
import { Button } from './Button'
import { AttachmentViewer } from './AttachmentViewer'
import { EntryCard } from './EntryCard'
import { SegmentedButton } from './SegmentedButton'

type HistoryFilter = 'all' | 'week' | 'month'

interface TimesheetHistoryProps {
  entries: TimeEntry[]
  hasRequirements: boolean
  onSetUp: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function TimesheetHistory({
  entries,
  hasRequirements,
  onSetUp,
  onEdit,
  onDelete,
}: TimesheetHistoryProps) {
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [viewerId, setViewerId] = useState<string | null>(null)

  const visible = useMemo(() => {
    const now = new Date()
    const sorted = [...entries].sort((a, b) =>
      a.date === b.date ? b.timeIn.localeCompare(a.timeIn) : b.date.localeCompare(a.date),
    )
    if (filter === 'all') return sorted
    let from: string
    let to: string
    if (filter === 'week') {
      const start = startOfWeek(now)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      from = dateKey(start)
      to = dateKey(end)
    } else {
      from = dateKey(new Date(now.getFullYear(), now.getMonth(), 1))
      to = dateKey(new Date(now.getFullYear(), now.getMonth() + 1, 1))
    }
    return sorted.filter((entry) => entry.date >= from && entry.date < to)
  }, [entries, filter])

  return (
    <div className="md-page">
      <div className="md-page__header">
        <h2 className="md-headline">Entries</h2>
        <span className="md-page__sub">Review or edit your logged hours</span>
      </div>

      <div className="md-history-toolbar">
        <SegmentedButton<HistoryFilter>
          options={[
            { value: 'all', label: 'All' },
            { value: 'week', label: 'This week' },
            { value: 'month', label: 'This month' },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <span className="md-history-summary">
          {visible.length} {visible.length === 1 ? 'entry' : 'entries'} ·{' '}
          {formatHours(totalRenderedMinutes(visible))}
        </span>
      </div>

      {visible.length === 0 ? (
        hasRequirements ? (
          <div className="md-empty">
            <h3 className="md-empty__title">
              {filter === 'all' ? 'No entries yet' : 'No entries in this period'}
            </h3>
            <p className="md-empty__body">
              Tap Add entry to log your first day.
            </p>
          </div>
        ) : (
          <div className="md-empty">
            <h3 className="md-empty__title">Set up your OJT requirements</h3>
            <p className="md-empty__body">
              Enter your required hours and training period to start tracking.
            </p>
            <Button variant="filled" icon="add" onClick={onSetUp}>
              Add requirements
            </Button>
          </div>
        )
      ) : (
        <ul className="md-entry-list">
          {visible.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={() => onEdit(entry.id)}
              onDelete={() => onDelete(entry.id)}
              onViewAttachments={() => setViewerId(entry.id)}
            />
          ))}
        </ul>
      )}

      <AttachmentViewer
        entry={viewerId ? (entries.find((entry) => entry.id === viewerId) ?? null) : null}
        onClose={() => setViewerId(null)}
      />
    </div>
  )
}
