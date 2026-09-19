import { useCallback, useState } from 'react'
import { flushSync } from 'react-dom'
import type { EntryDraft, FileMeta, Settings, TimeEntry, View } from './types'
import { deleteFiles, saveFile, type StagedFile } from './lib/files'
import { useLocalStorage } from './hooks/useLocalStorage'
import { AppBar } from './components/AppBar'
import { BottomNav } from './components/BottomNav'
import { Button } from './components/Button'
import { Dashboard } from './components/Dashboard'
import { Dialog } from './components/Dialog'
import { EntryForm } from './components/EntryForm'
import { Icon } from './components/Icon'
import { headerTitle } from './lib/aggregate'
import { NavigationRail } from './components/NavigationRail'
import { SettingsForm } from './components/SettingsForm'
import { SetupDialog } from './components/SetupDialog'
import { Snackbar } from './components/Snackbar'
import { TimesheetHistory } from './components/TimesheetHistory'

const DEFAULT_SETTINGS: Settings = {
  requiredHours: 0,
  startDate: '',
  holidays: [],
  defaultDailyHours: null,
}

export default function App() {
  const [storedSettings, setStoredSettings] = useLocalStorage<Settings>(
    'ojt-settings',
    DEFAULT_SETTINGS,
  )
  const settings: Settings = { ...DEFAULT_SETTINGS, ...storedSettings, holidays: storedSettings.holidays ?? [] }
  const setSettings = setStoredSettings
  const [entries, setEntries] = useLocalStorage<TimeEntry[]>('ojt-entries', [])
  const [view, setView] = useState<View>('dashboard')
  const [entryOpen, setEntryOpen] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<string | null>(null)

  const notify = useCallback((message: string) => setSnackbar(message), [])
  const dismissSnackbar = useCallback(() => setSnackbar(null), [])

  const withViewTransition = (apply: () => void) => {
    const doc = document as Document & { startViewTransition?: (update: () => void) => unknown }
    if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply()
      return
    }
    doc.startViewTransition(() => flushSync(apply))
  }

  const changeView = (next: View) => {
    if (next === view) return
    withViewTransition(() => setView(next))
  }

  const openAdd = () => {
    setEditingId(null)
    withViewTransition(() => setEntryOpen(true))
  }

  const openEdit = (id: string) => {
    setEditingId(id)
    setEntryOpen(true)
  }

  const closeEntry = () => {
    withViewTransition(() => {
      setEntryOpen(false)
      setEditingId(null)
    })
  }

  const editing = editingId ? (entries.find((entry) => entry.id === editingId) ?? null) : null

  const handleSaveEntry = async (draft: EntryDraft, id: string | null, staged: StagedFile[]) => {
    const breakMinutes = Math.max(0, Math.round(Number(draft.breakMinutes) || 0))

    const savedIds = new Set<string>()
    let saveFailed = false
    for (const { meta, file } of staged) {
      try {
        await saveFile(meta.id, file)
        savedIds.add(meta.id)
      } catch {
        saveFailed = true
      }
    }
    const stagedIds = new Set(staged.map((s) => s.meta.id))
    const attachments: FileMeta[] = draft.attachments.filter(
      (meta) => savedIds.has(meta.id) || !stagedIds.has(meta.id),
    )

    if (id) {
      const old = entries.find((entry) => entry.id === id)
      const keepIds = new Set(attachments.map((meta) => meta.id))
      const removedIds = (old?.attachments ?? [])
        .filter((meta) => !keepIds.has(meta.id))
        .map((meta) => meta.id)
      if (removedIds.length > 0) void deleteFiles(removedIds)
      setEntries((list) =>
        list.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                date: draft.date,
                timeIn: draft.timeIn,
                timeOut: draft.timeOut,
                breakMinutes,
                task: draft.task.trim(),
                notes: draft.notes.trim(),
                attachments,
              }
            : entry,
        ),
      )
      notify(saveFailed ? 'Entry updated, but some attachments failed to save' : 'Entry updated')
    } else {
      const entry: TimeEntry = {
        id: crypto.randomUUID(),
        date: draft.date,
        timeIn: draft.timeIn,
        timeOut: draft.timeOut,
        breakMinutes,
        task: draft.task.trim(),
        notes: draft.notes.trim(),
        status: 'draft',
        attachments,
      }
      setEntries((list) => [...list, entry])
      notify(saveFailed ? 'Entry added, but some attachments failed to save' : 'Entry added')
    }
    closeEntry()
  }

  const handleDelete = (id: string) => {
    const entry = entries.find((item) => item.id === id)
    if (entry?.attachments?.length) void deleteFiles(entry.attachments.map((meta) => meta.id))
    setEntries((list) => list.filter((entry) => entry.id !== id))
    setDeleteId(null)
    notify('Entry deleted')
  }

  const toggleStatus = (id: string) => {
    setEntries((list) =>
      list.map((entry) =>
        entry.id === id
          ? { ...entry, status: entry.status === 'draft' ? 'submitted' : 'draft' }
          : entry,
      ),
    )
  }

  const saveSettings = (next: Settings) => {
    setSettings(next)
    notify('Settings saved')
  }

  const saveRequirements = (next: Settings) => {
    setSettings(next)
    setSetupOpen(false)
    notify('Requirements saved')
  }

  return (
    <div className="md-shell">
      <NavigationRail view={view} onChange={changeView} />
      <BottomNav view={view} onChange={changeView} />

      <div className="md-shell__main">
        <AppBar title={headerTitle(settings.requiredHours, entries)} />

        <main className="md-content">
          {view === 'dashboard' && (
            <Dashboard
              entries={entries}
              settings={settings}
              onSetUp={() => setSetupOpen(true)}
            />
          )}
          {view === 'timesheet' && (
            <TimesheetHistory
              entries={entries}
              hasRequirements={settings.requiredHours > 0}
              onSetUp={() => setSetupOpen(true)}
              onEdit={openEdit}
              onDelete={setDeleteId}
              onToggleStatus={toggleStatus}
            />
          )}
          {view === 'settings' && <SettingsForm settings={settings} onSave={saveSettings} />}
        </main>
      </div>

      {view !== 'settings' && settings.requiredHours > 0 && !entryOpen && (
        <button type="button" className="md-fab" onClick={openAdd}>
          <Icon name="add" />
          Add entry
        </button>
      )}

      <SetupDialog
        open={setupOpen}
        settings={settings}
        onClose={() => setSetupOpen(false)}
        onSave={saveRequirements}
      />

      <EntryForm
        open={entryOpen}
        editing={editing}
        entries={entries}
        settings={settings}
        onClose={closeEntry}
        onSave={handleSaveEntry}
      />

      <Dialog
        open={deleteId !== null}
        title="Delete entry?"
        onClose={() => setDeleteId(null)}
        actions={
          <>
            <Button variant="text" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="text"
              className="md-btn--error"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="md-dialog__text">
          This entry will be permanently removed. This cannot be undone.
        </p>
      </Dialog>

      <Snackbar message={snackbar} onDismiss={dismissSnackbar} />
    </div>
  )
}
