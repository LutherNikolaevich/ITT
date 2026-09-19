import { describe, expect, it } from 'vitest'
import type { EntryDraft, RequirementsDraft, TimeEntry } from '../types'
import { validateEntry, validateRequirements } from './validate'

const draft = (over: Partial<EntryDraft> = {}): EntryDraft => ({
  date: '2026-09-16',
  timeIn: '09:00',
  timeOut: '17:00',
  breakMinutes: '',
  task: '',
  notes: '',
  attachments: [],
  ...over,
})

const entry = (id: string, date: string, timeIn: string, timeOut: string): TimeEntry => ({
  id,
  date,
  timeIn,
  timeOut,
  breakMinutes: 0,
  task: '',
  notes: '',
  status: 'draft',
})

describe('validateEntry', () => {
  it('accepts a complete valid draft', () => {
    expect(validateEntry(draft(), [])).toEqual({})
  })

  it('requires date and times', () => {
    const errors = validateEntry(draft({ date: '', timeIn: '', timeOut: '' }), [])
    expect(errors.date).toBeTruthy()
    expect(errors.timeIn).toBeTruthy()
    expect(errors.timeOut).toBeTruthy()
  })

  it('rejects time out before time in', () => {
    expect(validateEntry(draft({ timeIn: '17:00', timeOut: '09:00' }), []).timeOut).toBeTruthy()
  })

  it('rejects a break not shorter than the span', () => {
    expect(validateEntry(draft({ breakMinutes: '480' }), []).breakMinutes).toBeTruthy()
    expect(validateEntry(draft({ breakMinutes: '60' }), [])).toEqual({})
  })

  it('rejects negative break minutes', () => {
    expect(validateEntry(draft({ breakMinutes: '-5' }), []).breakMinutes).toBeTruthy()
  })

  it('rejects overlapping entries on the same date', () => {
    const entries = [entry('a', '2026-09-16', '13:00', '14:00')]
    expect(validateEntry(draft({ timeIn: '13:30', timeOut: '15:00' }), entries).timeIn).toBeTruthy()
  })

  it('ignores the entry being edited when checking overlap', () => {
    const entries = [entry('a', '2026-09-16', '13:00', '14:00')]
    expect(validateEntry(draft({ timeIn: '13:30', timeOut: '15:00' }), entries, 'a')).toEqual({})
  })
})

const req = (over: Partial<RequirementsDraft> = {}): RequirementsDraft => ({
  requiredHours: '240',
  startDate: '2026-09-01',
  holidays: [],
  defaultDailyHours: '',
  ...over,
})

describe('validateRequirements', () => {
  it('accepts valid requirements', () => {
    expect(validateRequirements(req())).toEqual({})
  })

  it('requires required hours and start date', () => {
    const errors = validateRequirements(req({ requiredHours: '', startDate: '' }))
    expect(errors.requiredHours).toBeTruthy()
    expect(errors.startDate).toBeTruthy()
  })

  it('rejects required hours below 1', () => {
    expect(validateRequirements(req({ requiredHours: '0' })).requiredHours).toBeTruthy()
    expect(validateRequirements(req({ requiredHours: 'abc' })).requiredHours).toBeTruthy()
  })

  it('rejects holidays before the start date', () => {
    expect(validateRequirements(req({ holidays: ['2026-08-01'] })).holidays).toBeTruthy()
  })

  it('rejects default daily hours outside 1-24', () => {
    expect(validateRequirements(req({ defaultDailyHours: '0' })).defaultDailyHours).toBeTruthy()
    expect(validateRequirements(req({ defaultDailyHours: '25' })).defaultDailyHours).toBeTruthy()
    expect(validateRequirements(req({ defaultDailyHours: '8' }))).toEqual({})
  })
})
