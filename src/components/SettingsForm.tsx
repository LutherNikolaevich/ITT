import { useState } from 'react'
import type { RequirementsDraft, Settings } from '../types'
import { validateRequirements } from '../lib/validate'
import { Button } from './Button'
import { RequirementsFields } from './RequirementsFields'

interface SettingsFormProps {
  settings: Settings
  onSave: (settings: Settings) => void
}

export function SettingsForm({ settings, onSave }: SettingsFormProps) {
  const [form, setForm] = useState<RequirementsDraft>({
    requiredHours: settings.requiredHours > 0 ? String(settings.requiredHours) : '',
    startDate: settings.startDate,
    holidays: settings.holidays ?? [],
    defaultDailyHours:
      settings.defaultDailyHours != null ? String(settings.defaultDailyHours) : '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    </div>
  )
}
