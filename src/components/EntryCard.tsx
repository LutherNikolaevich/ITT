import type { TimeEntry } from '../types'
import { entryMinutes } from '../lib/aggregate'
import { formatHours } from '../lib/time'
import { Chip } from './Chip'
import { IconButton } from './IconButton'

interface EntryCardProps {
  entry: TimeEntry
  onEdit?: () => void
  onDelete?: () => void
  onViewAttachments?: () => void
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function EntryCard({ entry, onEdit, onDelete, onViewAttachments }: EntryCardProps) {
  const attachmentCount = entry.attachments?.length ?? 0
  return (
    <li className="md-entry">
      <div className="md-entry__date">{formatDate(entry.date)}</div>
      <div className="md-entry__main">
        {attachmentCount > 0 && onViewAttachments && (
          <div className="md-entry__line">
            <Chip icon="attach_file" onClick={onViewAttachments} title="View attachments">
              {attachmentCount} {attachmentCount === 1 ? 'file' : 'files'}
            </Chip>
          </div>
        )}
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
        {(onEdit || onDelete) && (
          <div className="md-entry__actions">
            {onEdit && <IconButton icon="edit" label="Edit entry" onClick={onEdit} />}
            {onDelete && <IconButton icon="delete" label="Delete entry" onClick={onDelete} />}
          </div>
        )}
      </div>
    </li>
  )
}
