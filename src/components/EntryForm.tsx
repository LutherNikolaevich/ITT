import { useEffect, useRef, useState } from 'react'
import type { EntryDraft, FileMeta, Settings, TimeEntry } from '../types'
import { formatBytes, isImageMeta, validateAttachment, type StagedFile } from '../lib/files'
import { formatHours, minutesToHHMM, spanMinutes, totalMinutes } from '../lib/time'
import { validateEntry } from '../lib/validate'
import { dateKey } from '../lib/aggregate'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { Icon } from './Icon'
import { TextField } from './TextField'

const TIME_RE = /^\d{2}:\d{2}$/

interface EntryFormProps {
  open: boolean
  editing: TimeEntry | null
  entries: TimeEntry[]
  settings: Settings
  onClose: () => void
  onSave: (draft: EntryDraft, editingId: string | null, staged: StagedFile[]) => void
}

const emptyDraft = (): EntryDraft => ({
  date: dateKey(new Date()),
  timeIn: '',
  timeOut: '',
  breakMinutes: '',
  task: '',
  notes: '',
  attachments: [],
})

function StagedThumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file.type.startsWith('image/')) return
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  if (url) {
    return <img className="md-attach__thumb" src={url} alt={file.name} />
  }
  return (
    <span className="md-attach__thumb md-attach__thumb--icon">
      <Icon name="picture_as_pdf" filled />
    </span>
  )
}

export function EntryForm({ open, editing, entries, settings, onClose, onSave }: EntryFormProps) {
  const [form, setForm] = useState<EntryDraft>(emptyDraft)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [existing, setExisting] = useState<FileMeta[]>([])
  const [staged, setStaged] = useState<StagedFile[]>([])
  const [attachError, setAttachError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setAttachError(null)
    setStaged([])
    setExisting(editing?.attachments ?? [])
    if (editing) {
      setForm({
        date: editing.date,
        timeIn: editing.timeIn,
        timeOut: editing.timeOut,
        breakMinutes: editing.breakMinutes > 0 ? String(editing.breakMinutes) : '',
        task: editing.task,
        notes: editing.notes,
        attachments: editing.attachments ?? [],
      })
      return
    }
    const draft = emptyDraft()
    if (settings.defaultDailyHours != null) {
      draft.timeIn = '09:00'
      draft.timeOut = minutesToHHMM(540 + settings.defaultDailyHours * 60)
    }
    setForm(draft)
  }, [open, editing, settings.defaultDailyHours])

  const set = <K extends keyof EntryDraft>(key: K, value: EntryDraft[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const pickFiles = (picked: FileList | null) => {
    if (!picked || picked.length === 0) return
    setAttachError(null)
    const accepted: StagedFile[] = []
    let firstError: string | null = null
    for (const file of picked) {
      const error = validateAttachment(file)
      if (error) {
        firstError ??= error
        continue
      }
      accepted.push({
        meta: { id: crypto.randomUUID(), name: file.name, type: file.type, size: file.size },
        file,
      })
    }
    if (firstError) setAttachError(firstError)
    setStaged((list) => [...list, ...accepted])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const timesValid =
    TIME_RE.test(form.timeIn) &&
    TIME_RE.test(form.timeOut) &&
    spanMinutes(form.timeIn, form.timeOut) > 0

  const previewMinutes = timesValid
    ? totalMinutes(form.timeIn, form.timeOut, Math.max(0, Number(form.breakMinutes) || 0))
    : null

  const submit = () => {
    const errs = validateEntry(form, entries, editing?.id)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    const attachments = [...existing, ...staged.map((s) => s.meta)]
    onSave({ ...form, attachments }, editing?.id ?? null, staged)
  }

  const hasAttachments = existing.length > 0 || staged.length > 0

  return (
    <Dialog
      open={open}
      title={editing ? 'Edit entry' : 'Add entry'}
      onClose={onClose}
      className={editing ? undefined : 'md-dialog--add-entry'}
      wide
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button icon="check" onClick={submit}>
            {editing ? 'Save changes' : 'Add entry'}
          </Button>
        </>
      }
    >
      <div className="md-form-grid">
        <TextField
          label="Date"
          type="date"
          autoFocus
          value={form.date}
          onChange={(v) => set('date', v)}
          error={errors.date}
        />
        <TextField
          label="Break"
          type="number"
          min="0"
          step="5"
          className="md-field--example"
          placeholder="e.g. 60"
          value={form.breakMinutes}
          onChange={(v) => set('breakMinutes', v)}
          error={errors.breakMinutes}
          hint="Optional"
        />
        <TextField
          label="Time in"
          type="time"
          lang="en-GB"
          value={form.timeIn}
          onChange={(v) => set('timeIn', v)}
          error={errors.timeIn}
        />
        <TextField
          label="Time out"
          type="time"
          lang="en-GB"
          value={form.timeOut}
          onChange={(v) => set('timeOut', v)}
          error={errors.timeOut}
        />
        <TextField
          label="Task or training activity"
          className="md-field--span md-field--example"
          placeholder="e.g. Orientation, Seminar"
          value={form.task}
          onChange={(v) => set('task', v)}
          hint="Optional"
        />
      </div>
      <div className="md-total-preview">
        <Icon name="schedule" />
        <span className="md-total-preview__value">
          {previewMinutes != null ? `Total: ${formatHours(previewMinutes)}` : 'Total: —'}
        </span>
        <span className="md-total-preview__hint">Calculated automatically</span>
      </div>
      <TextField
        label="Notes"
        multiline
        value={form.notes}
        onChange={(v) => set('notes', v)}
        hint="Optional"
      />
      <div className="md-attach">
        <div className="md-attach__header">
          <span className="md-attach__label">Attachments</span>
          <Button variant="outlined" icon="attach_file" onClick={() => fileInputRef.current?.click()}>
            Attach files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.heic,.heif,.avif,.svg"
            className="md-attach__input"
            aria-label="Attach images or PDFs"
            onChange={(e) => pickFiles(e.target.files)}
          />
        </div>
        {attachError && <p className="md-attach__error">{attachError}</p>}
        {hasAttachments && (
          <ul className="md-attach__list">
            {existing.map((meta) => (
              <li className="md-attach__item" key={meta.id}>
                <span className="md-attach__thumb md-attach__thumb--icon">
                  <Icon name={isImageMeta(meta) ? 'image' : 'picture_as_pdf'} filled />
                </span>
                <span className="md-attach__name" title={meta.name}>
                  {meta.name}
                </span>
                <span className="md-attach__size">{formatBytes(meta.size)}</span>
                <button
                  type="button"
                  className="md-icon-btn"
                  aria-label={`Remove ${meta.name}`}
                  title="Remove"
                  onClick={() => setExisting((list) => list.filter((m) => m.id !== meta.id))}
                >
                  <Icon name="close" />
                </button>
              </li>
            ))}
            {staged.map(({ meta, file }) => (
              <li className="md-attach__item" key={meta.id}>
                <StagedThumb file={file} />
                <span className="md-attach__name" title={meta.name}>
                  {meta.name}
                </span>
                <span className="md-attach__size">{formatBytes(meta.size)}</span>
                <button
                  type="button"
                  className="md-icon-btn"
                  aria-label={`Remove ${meta.name}`}
                  title="Remove"
                  onClick={() => setStaged((list) => list.filter((s) => s.meta.id !== meta.id))}
                >
                  <Icon name="close" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  )
}
