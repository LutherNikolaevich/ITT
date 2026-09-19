import { useRef, useState } from 'react'
import type { RequirementsDraft, Settings, TimeEntry } from '../types'
import { validateRequirements } from '../lib/validate'
import { downloadBlob, exportBackup, exportFilename, parseBackup } from '../lib/export'
import { saveFile } from '../lib/files'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { RequirementsFields } from './RequirementsFields'

interface SettingsFormProps {
  settings: Settings
  entries: TimeEntry[]
  onSave: (settings: Settings) => void
  onImport: (settings: Settings, entries: TimeEntry[]) => void
  onNotify: (message: string) => void
}

export function SettingsForm({ settings, entries, onSave, onImport, onNotify }: SettingsFormProps) {
  const [form, setForm] = useState<RequirementsDraft>({
    requiredHours: settings.requiredHours > 0 ? String(settings.requiredHours) : '',
    startDate: settings.startDate,
    holidays: settings.holidays ?? [],
    defaultDailyHours:
      settings.defaultDailyHours != null ? String(settings.defaultDailyHours) : '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof parseBackup> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setExporting(true)
    try {
      const { bytes, missing } = await exportBackup(settings, entries)
      downloadBlob(bytes, exportFilename(), 'application/zip')
      onNotify(
        missing.length > 0
          ? `Data exported, but ${missing.length} attachment file${missing.length === 1 ? '' : 's'} couldn't be included`
          : 'Data exported',
      )
    } catch {
      onNotify('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return
    try {
      setPendingImport(parseBackup(new Uint8Array(await file.arrayBuffer())))
    } catch {
      onNotify('Not a valid backup file')
    }
  }

  const confirmImport = async () => {
    if (!pendingImport) return
    setImporting(true)
    try {
      for (const { meta, bytes } of pendingImport.files) {
        await saveFile(meta.id, new Blob([bytes], { type: meta.type }))
      }
      onImport(pendingImport.data.settings, pendingImport.data.entries)
      setPendingImport(null)
      onNotify('Data imported')
    } catch {
      onNotify('Import failed')
    } finally {
      setImporting(false)
    }
  }

  const set = <K extends keyof RequirementsDraft>(key: K, value: RequirementsDraft[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const submit = () => {
    const errs = validateRequirements(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    onSave({
      requiredHours: Number(form.requiredHours),
      startDate: form.startDate,
      holidays: form.holidays,
      defaultDailyHours: form.defaultDailyHours === '' ? null : Number(form.defaultDailyHours),
    })
  }

  return (
    <div className="md-page">
      <div className="md-page__header">
        <h2 className="md-headline">Settings</h2>
        <span className="md-page__sub">Set your OJT requirements</span>
      </div>

      <form
        className="md-card md-settings-form"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div>
          <h3 className="md-section-title">OJT Requirements</h3>
          <RequirementsFields form={form} set={set} errors={errors} />
        </div>

        <div className="md-settings-actions">
          <Button type="submit" icon="check">
            Save settings
          </Button>
        </div>
      </form>

      <section className="md-card md-settings-form">
        <div>
          <h3 className="md-section-title">Data</h3>
          <span className="md-page__sub">
            Import/Export your data
          </span>
        </div>
        <div className="md-settings-actions">
          <Button
            variant="tonal"
            icon="upload"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            Import data
          </Button>
          <Button variant="outlined" icon="download" disabled={exporting} onClick={handleExport}>
            Export data
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip"
          hidden
          onChange={(e) => {
            void handleImportFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </section>

      <Dialog
        open={pendingImport !== null}
        title="Import backup?"
        onClose={() => setPendingImport(null)}
        actions={
          <>
            <Button variant="text" onClick={() => setPendingImport(null)}>
              Cancel
            </Button>
            <Button disabled={importing} onClick={() => void confirmImport()}>
              Import
            </Button>
          </>
        }
      >
        <p className="md-dialog__text">
          Your current settings and all entries will be replaced with the backup's data. This
          cannot be undone.
        </p>
      </Dialog>
    </div>
  )
}
