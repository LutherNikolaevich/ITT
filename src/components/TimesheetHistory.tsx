import { useMemo, useState } from 'react'
import type { TimeEntry } from '../types'
import { dateKey, entryMinutes, startOfWeek, totalRenderedMinutes } from '../lib/aggregate'
import { formatHours } from '../lib/time'
import { Button } from './Button'
import { Chip } from './Chip'
import { Icon } from './Icon'
import { IconButton } from './IconButton'
import { AttachmentViewer } from './AttachmentViewer'
import { SegmentedButton } from './SegmentedButton'

type HistoryFilter = 'all' | 'week' | 'month'

interface TimesheetHistoryProps {
  entries: TimeEntry[]
  hasRequirements: boolean
  onSetUp: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

function formatDate(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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
        <h2 className="md-headline">Your entries</h2>
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
          <div className="md-card md-empty">
            <div className="md-empty__badge">
              <Icon name="list_alt" filled />
            </div>
            <h3 className="md-empty__title">
              {filter === 'all' ? 'No entries yet' : 'No entries in this period'}
            </h3>
            <p className="md-empty__body">
              Use the Add entry button to start tracking OJT hours.
            </p>
          </div>
        ) : (
          <div className="md-card md-empty">
            <div className="md-empty__badge">
              <Icon name="hourglass_top" filled />
            </div>
            <h3 className="md-empty__title">Set up your OJT requirements</h3>
            <p className="md-empty__body">
              Enter the required hours and your training period to start tracking progress.
            </p>
            <Button variant="filled" icon="add" onClick={onSetUp}>
              Add requirements
            </Button>
          </div>
        )
      ) : (
        <ul className="md-entry-list">
          {visible.map((entry) => {
            const attachmentCount = entry.attachments?.length ?? 0
            return (
              <li className="md-entry" key={entry.id}>
                <div className="md-entry__main">
                  <div className="md-entry__line">
                    <span className="md-entry__date">{formatDate(entry.date)}</span>
                    {attachmentCount > 0 && (
                      <Chip
                        icon="attach_file"
                        onClick={() => setViewerId(entry.id)}
                        title="View attachments"
                      >
                        {attachmentCount}
                      </Chip>
                    )}
                  </div>
                  <div className="md-entry__meta">
                    {entry.timeIn} – {entry.timeOut}
                    {entry.breakMinutes > 0 && <> · {entry.breakMinutes} min break</>}
                  </div>
                  {(entry.task || entry.notes) && (
                    <div className="md-entry__notes">
                      {entry.task}
                      {entry.task && entry.notes ? ' — ' : ''}
                      {entry.notes}
                    </div>
                  )}
                </div>
                <div className="md-entry__side">
                  <span className="md-entry__total">{formatHours(entryMinutes(entry))}</span>
                  <div className="md-entry__actions">
                    <IconButton icon="edit" label="Edit entry" onClick={() => onEdit(entry.id)} />
                    <IconButton icon="delete" label="Delete entry" onClick={() => onDelete(entry.id)} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <AttachmentViewer
        entry={viewerId ? (entries.find((entry) => entry.id === viewerId) ?? null) : null}
        onClose={() => setViewerId(null)}
      />
    </div>
  )
}
