import { useEffect, useState } from 'react'
import type { RequirementsDraft, Settings } from '../types'
import { validateRequirements } from '../lib/validate'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { RequirementsFields } from './RequirementsFields'

interface SetupDialogProps {
  open: boolean
  settings: Settings
  onClose: () => void
  onSave: (settings: Settings) => void
}

const emptyForm = (): RequirementsDraft => ({
  requiredHours: '',
  startDate: '',
  holidays: [],
  defaultDailyHours: '',
})

export function SetupDialog({ open, settings, onClose, onSave }: SetupDialogProps) {
  const [form, setForm] = useState<RequirementsDraft>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setErrors({})
    setForm({
      requiredHours: settings.requiredHours > 0 ? String(settings.requiredHours) : '',
      startDate: settings.startDate,
      holidays: settings.holidays ?? [],
      defaultDailyHours:
        settings.defaultDailyHours != null ? String(settings.defaultDailyHours) : '',
    })
  }, [open, settings])

  const set = <K extends keyof RequirementsDraft>(key: K, value: RequirementsDraft[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const submit = () => {
    const errs = validateRequirements(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    onSave({
      ...settings,
      requiredHours: Number(form.requiredHours),
      startDate: form.startDate,
      holidays: form.holidays,
      defaultDailyHours: form.defaultDailyHours === '' ? null : Number(form.defaultDailyHours),
    })
  }

  return (
    <Dialog
      open={open}
      title="Set up your OJT"
      onClose={onClose}
      wide
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button icon="check" onClick={submit}>
            Save requirements
          </Button>
        </>
      }
    >
      <p className="md-dialog__text">
        Enter your required hours and daily schedule — tap holidays on the calendar to exclude
        them.
      </p>
      <RequirementsFields form={form} set={set} errors={errors} />
    </Dialog>
  )
}
