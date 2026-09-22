import { useState } from 'react'
import type { RequirementsDraft } from '../types'
import { Button } from './Button'
import { OjtCalendar } from './OjtCalendar'
import { TextField } from './TextField'

interface RequirementsFieldsProps {
  form: RequirementsDraft
  set: <K extends keyof RequirementsDraft>(key: K, value: RequirementsDraft[K]) => void
  errors: Record<string, string>
}

export function RequirementsFields({ form, set, errors }: RequirementsFieldsProps) {
  const [showCalendar, setShowCalendar] = useState(false)
  const count = form.holidays.length

  return (
    <>
      <div className="md-form-grid">
        <TextField
          label="Total hours"
          type="number"
          min="1"
          className="md-field--example"
          placeholder="e.g. 240"
          value={form.requiredHours}
          onChange={(v) => set('requiredHours', v)}
          error={errors.requiredHours}
        />
        <TextField
          label="Hrs/Day"
          type="number"
          min="1"
          max="24"
          step="0.5"
          className="md-field--example"
          placeholder="e.g. 8"
          value={form.defaultDailyHours}
          onChange={(v) => set('defaultDailyHours', v)}
          error={errors.defaultDailyHours}
        />
        <TextField
          label="Start date"
          type="date"
          value={form.startDate}
          onChange={(v) => set('startDate', v)}
          error={errors.startDate}
        />
      </div>
      <div className="md-field">
        <span className="md-field__label">Exclude holidays</span>
        {showCalendar || errors.holidays ? (
          <>
            <OjtCalendar
              startDate={form.startDate}
              excluded={form.holidays}
              onChange={(dates) => set('holidays', dates)}
            />
            {!errors.holidays && (
              <Button variant="tonal" icon="calendar_month" onClick={() => setShowCalendar(false)}>
                Hide calendar
              </Button>
            )}
          </>
        ) : (
          <Button variant="tonal" icon="calendar_month" onClick={() => setShowCalendar(true)}>
            Show calendar
          </Button>
        )}
        <div className={`md-field__supporting${errors.holidays ? ' md-field__supporting--error' : ''}`}>
          {errors.holidays ??
            (count === 0
              ? 'Tap dates on the calendar to exclude them'
              : `${count} ${count === 1 ? 'holiday' : 'holidays'} excluded`)}
        </div>
      </div>
    </>
  )
}
