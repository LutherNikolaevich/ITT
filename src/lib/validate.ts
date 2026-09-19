import type { EntryDraft, RequirementsDraft, TimeEntry } from '../types'
import { overlaps, spanMinutes } from './time'

const TIME_RE = /^\d{2}:\d{2}$/

export function validateEntry(
  draft: EntryDraft,
  entries: TimeEntry[],
  editingId?: string,
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!draft.date) errors.date = 'Date is required.'
  if (!draft.timeIn) errors.timeIn = 'Time in is required.'
  if (!draft.timeOut) errors.timeOut = 'Time out is required.'

  const bothTimesValid = TIME_RE.test(draft.timeIn) && TIME_RE.test(draft.timeOut)
  if (bothTimesValid && spanMinutes(draft.timeIn, draft.timeOut) <= 0) {
    errors.timeOut = 'Time out must be after time in.'
  }

  if (draft.breakMinutes !== '') {
    const breakMinutes = Number(draft.breakMinutes)
    if (!Number.isFinite(breakMinutes) || breakMinutes < 0) {
      errors.breakMinutes = 'Break must be a positive number of minutes.'
    } else if (bothTimesValid && breakMinutes >= spanMinutes(draft.timeIn, draft.timeOut)) {
      errors.breakMinutes = 'Break must be shorter than the total time spent.'
    }
  }

  if (bothTimesValid && spanMinutes(draft.timeIn, draft.timeOut) > 0 && draft.date) {
    const candidate = { date: draft.date, timeIn: draft.timeIn, timeOut: draft.timeOut }
    const clash = entries.some((entry) => entry.id !== editingId && overlaps(entry, candidate))
    if (clash) errors.timeIn = 'Overlaps with an existing entry on this date.'
  }

  return errors
}

export function validateRequirements(draft: RequirementsDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  const requiredHours = Number(draft.requiredHours)
  const defaultDailyHours = draft.defaultDailyHours === '' ? null : Number(draft.defaultDailyHours)

  if (!draft.requiredHours || !Number.isFinite(requiredHours) || requiredHours < 1) {
    errors.requiredHours = 'Enter the required hours (at least 1).'
  }
  if (!draft.startDate) errors.startDate = 'Start date is required.'
  if (draft.holidays.some((date) => date < draft.startDate)) {
    errors.holidays = 'Holidays cannot be before the start date.'
  }
  if (
    defaultDailyHours != null &&
    (!Number.isFinite(defaultDailyHours) || defaultDailyHours <= 0 || defaultDailyHours > 24)
  ) {
    errors.defaultDailyHours = 'Enter a value between 1 and 24.'
  }

  return errors
}
