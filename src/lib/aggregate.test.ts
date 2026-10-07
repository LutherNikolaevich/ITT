import { describe, expect, it } from 'vitest'
import type { Settings, TimeEntry } from '../types'
import {
  dateKey,
  entryMinutes,
  minutesInRange,
  startOfWeek,
  thisMonthMinutes,
  thisWeekMinutes,
  totalRenderedMinutes,
  headerTitle,
  fillSummary,
} from './aggregate'

const entry = (date: string, timeIn: string, timeOut: string, breakMinutes = 0): TimeEntry => ({
  id: `${date}-${timeIn}`,
  date,
  timeIn,
  timeOut,
  breakMinutes,
  task: '',
  notes: '',
})

const settings = (overrides: Partial<Settings> = {}): Settings => ({
  requiredHours: 0,
  startDate: '2026-09-01',
  holidays: [],
  defaultDailyHours: 8,
  ...overrides,
})

describe('startOfWeek', () => {
  it('returns Monday of the given week', () => {
    expect(dateKey(startOfWeek(new Date(2026, 8, 16)))).toBe('2026-09-14')
    expect(dateKey(startOfWeek(new Date(2026, 8, 14)))).toBe('2026-09-14')
    expect(dateKey(startOfWeek(new Date(2026, 8, 20)))).toBe('2026-09-14')
  })
})

describe('entryMinutes', () => {
  it('computes span minus break', () => {
    expect(entryMinutes(entry('2026-09-16', '09:00', '17:00', 60))).toBe(420)
  })
})

describe('minutesInRange', () => {
  const entries = [
    entry('2026-09-13', '09:00', '10:00'),
    entry('2026-09-14', '09:00', '10:00'),
    entry('2026-09-20', '09:00', '10:00'),
  ]

  it('includes the from date and excludes the to date', () => {
    expect(minutesInRange(entries, '2026-09-14', '2026-09-21')).toBe(120)
  })
})

describe('thisWeekMinutes', () => {
  it('sums entries in the current Monday-based week', () => {
    const now = new Date(2026, 8, 16)
    const entries = [
      entry('2026-09-14', '09:00', '10:00'),
      entry('2026-09-15', '09:00', '10:30'),
      entry('2026-09-21', '09:00', '10:00'),
    ]
    expect(thisWeekMinutes(entries, now)).toBe(150)
  })
})

describe('thisMonthMinutes', () => {
  it('sums entries in the current calendar month', () => {
    const now = new Date(2026, 8, 16)
    const entries = [
      entry('2026-08-31', '09:00', '10:00'),
      entry('2026-09-01', '09:00', '10:00'),
      entry('2026-09-30', '09:00', '10:00'),
      entry('2026-10-01', '09:00', '10:00'),
    ]
    expect(thisMonthMinutes(entries, now)).toBe(120)
  })
})

describe('totalRenderedMinutes', () => {
  it('sums all entries', () => {
    const entries = [
      entry('2026-09-14', '09:00', '17:00', 60),
      entry('2026-09-15', '09:00', '12:30'),
    ]
    expect(totalRenderedMinutes(entries)).toBe(420 + 210)
  })
})

describe('fillSummary', () => {
  it('banks daily excess and fills a selected unworked holiday', () => {
    const entries = [entry('2026-09-14', '08:00', '18:00')]
    const result = fillSummary(entries, settings({ holidays: ['2026-09-16'] }), ['2026-09-16'])
    expect(result.holidays).toEqual([
      { date: '2026-09-16', kind: 'holiday', requiredMinutes: 480, filledMinutes: 120 },
    ])
    expect(result.filledCount).toBe(0)
    expect(result.remainingExcessMinutes).toBe(0)
    expect(result.completedMinutes).toBe(600)
  })

  it('leaves holidays unfilled without a selection', () => {
    const entries = [entry('2026-09-14', '08:00', '18:00')]
    const result = fillSummary(entries, settings({ holidays: ['2026-09-16'] }))
    expect(result.holidays).toEqual([
      { date: '2026-09-16', kind: 'holiday', requiredMinutes: 480, filledMinutes: 0 },
    ])
    expect(result.remainingExcessMinutes).toBe(120)
    expect(result.completedMinutes).toBe(480)
  })

  it('fills selected holidays fully and leaves leftover excess banked', () => {
    const entries = [
      entry('2026-09-14', '08:00', '18:00'),
      entry('2026-09-15', '08:00', '19:00'),
      entry('2026-09-16', '08:00', '17:00'),
      entry('2026-09-17', '08:00', '20:00'),
    ]
    const result = fillSummary(entries, settings({ holidays: ['2026-09-21'] }), ['2026-09-21'])
    expect(result.holidays).toEqual([
      { date: '2026-09-21', kind: 'holiday', requiredMinutes: 480, filledMinutes: 480 },
    ])
    expect(result.filledCount).toBe(1)
    expect(result.remainingExcessMinutes).toBe(120)
    expect(result.completedMinutes).toBe(4 * 480 + 480)
  })

  it('fills selected holidays in date order, partially when the bank runs out, and lists unselected ones', () => {
    const entries = [
      entry('2026-09-14', '08:00', '18:00'),
      entry('2026-09-15', '08:00', '18:00'),
      entry('2026-09-16', '08:00', '18:00'),
      entry('2026-09-17', '08:00', '18:00'),
      entry('2026-09-18', '08:00', '19:00'),
    ]
    const result = fillSummary(
      entries,
      settings({ holidays: ['2026-09-22', '2026-09-21', '2026-09-23'] }),
      ['2026-09-22', '2026-09-21'],
    )
    expect(result.holidays).toEqual([
      { date: '2026-09-21', kind: 'holiday', requiredMinutes: 480, filledMinutes: 480 },
      { date: '2026-09-22', kind: 'holiday', requiredMinutes: 480, filledMinutes: 180 },
      { date: '2026-09-23', kind: 'holiday', requiredMinutes: 480, filledMinutes: 0 },
    ])
    expect(result.filledCount).toBe(1)
    expect(result.remainingExcessMinutes).toBe(0)
    expect(result.completedMinutes).toBe(5 * 480 + 480 + 180)
  })

  it('skips holidays that already have rendered hours even when selected', () => {
    const entries = [
      entry('2026-09-14', '08:00', '18:00'),
      entry('2026-09-15', '09:00', '13:00'),
    ]
    const result = fillSummary(
      entries,
      settings({ holidays: ['2026-09-15', '2026-09-16'] }),
      ['2026-09-15', '2026-09-16'],
    )
    expect(result.holidays).toEqual([
      { date: '2026-09-16', kind: 'holiday', requiredMinutes: 480, filledMinutes: 120 },
    ])
  })

  it('short days count only their regular hours and never go into debt', () => {
    const entries = [
      entry('2026-09-14', '08:00', '18:00'),
      entry('2026-09-15', '09:00', '13:00'),
    ]
    const result = fillSummary(entries, settings({ holidays: ['2026-09-16'] }), ['2026-09-16'])
    expect(result.remainingExcessMinutes).toBe(0)
    expect(result.completedMinutes).toBe(480 + 240 + 120)
  })

  it('does nothing without a daily schedule', () => {
    const entries = [entry('2026-09-14', '08:00', '18:00')]
    const result = fillSummary(
      entries,
      settings({ holidays: ['2026-09-16'], defaultDailyHours: null }),
      ['2026-09-16'],
    )
    expect(result.holidays).toEqual([
      { date: '2026-09-16', kind: 'holiday', requiredMinutes: 0, filledMinutes: 0 },
    ])
    expect(result.filledCount).toBe(0)
    expect(result.remainingExcessMinutes).toBe(0)
    expect(result.completedMinutes).toBe(600)
  })

  it('returns holiday and absence candidates with nothing rendered', () => {
    const result = fillSummary(
      [],
      settings({ holidays: ['2026-09-16'] }),
      ['2026-09-16'],
      [],
      [],
      new Date(2026, 8, 2),
    )
    expect(result).toEqual({
      holidays: [{ date: '2026-09-16', kind: 'holiday', requiredMinutes: 480, filledMinutes: 0 }],
      undertime: [],
      absences: [{ date: '2026-09-01', kind: 'absence', requiredMinutes: 480, filledMinutes: 0 }],
      filledCount: 0,
      filledUndertimeCount: 0,
      filledAbsenceCount: 0,
      remainingExcessMinutes: 0,
      completedMinutes: 0,
    })
  })

  it('banks excess and tops up a selected undertime day', () => {
    const entries = [
      entry('2026-09-14', '09:00', '14:00'),
      entry('2026-09-15', '08:00', '18:00'),
    ]
    const result = fillSummary(entries, settings(), [], ['2026-09-14'])
    expect(result.undertime).toEqual([
      { date: '2026-09-14', kind: 'undertime', requiredMinutes: 180, filledMinutes: 120 },
    ])
    expect(result.filledUndertimeCount).toBe(0)
    expect(result.remainingExcessMinutes).toBe(0)
    expect(result.completedMinutes).toBe(300 + 480 + 120)
  })

  it('fills undertime days fully and partially when the bank runs out', () => {
    const entries = [
      entry('2026-09-14', '09:00', '13:00'),
      entry('2026-09-15', '09:00', '15:00'),
      entry('2026-09-16', '07:00', '20:00'),
    ]
    const result = fillSummary(entries, settings(), [], ['2026-09-14', '2026-09-15'])
    expect(result.undertime).toEqual([
      { date: '2026-09-14', kind: 'undertime', requiredMinutes: 240, filledMinutes: 240 },
      { date: '2026-09-15', kind: 'undertime', requiredMinutes: 120, filledMinutes: 60 },
    ])
    expect(result.filledUndertimeCount).toBe(1)
    expect(result.remainingExcessMinutes).toBe(0)
    expect(result.completedMinutes).toBe(240 + 360 + 480 + 240 + 60)
  })

  it('holidays and undertime days share the bank in date order', () => {
    const entries = [
      entry('2026-09-14', '09:00', '13:00'),
      entry('2026-09-16', '07:00', '20:00'),
    ]
    const result = fillSummary(
      entries,
      settings({ holidays: ['2026-09-18'] }),
      ['2026-09-18'],
      ['2026-09-14'],
    )
    expect(result.undertime).toEqual([
      { date: '2026-09-14', kind: 'undertime', requiredMinutes: 240, filledMinutes: 240 },
    ])
    expect(result.holidays).toEqual([
      { date: '2026-09-18', kind: 'holiday', requiredMinutes: 480, filledMinutes: 60 },
    ])
    expect(result.filledCount).toBe(0)
    expect(result.filledUndertimeCount).toBe(1)
    expect(result.remainingExcessMinutes).toBe(0)
    expect(result.completedMinutes).toBe(240 + 480 + 240 + 60)
  })

  it('never tops up undertime without a daily schedule', () => {
    const entries = [entry('2026-09-14', '09:00', '13:00')]
    const result = fillSummary(entries, settings({ defaultDailyHours: null }), [], ['2026-09-14'])
    expect(result.undertime).toEqual([])
    expect(result.filledUndertimeCount).toBe(0)
    expect(result.completedMinutes).toBe(240)
  })

  it('lists past unworked weekdays as absence candidates', () => {
    const now = new Date(2026, 8, 18)
    const entries = [entry('2026-09-14', '09:00', '17:00')]
    const result = fillSummary(entries, settings(), [], [], [], now)
    expect(result.absences.map((d) => d.date)).toEqual([
      '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-07',
      '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-15',
      '2026-09-16', '2026-09-17',
    ])
    expect(result.absences[0]).toEqual({
      date: '2026-09-01',
      kind: 'absence',
      requiredMinutes: 480,
      filledMinutes: 0,
    })
    expect(result.filledAbsenceCount).toBe(0)
  })

  it('excludes weekends, today, declared holidays, and days with entries from absences', () => {
    const now = new Date(2026, 8, 16)
    const entries = [entry('2026-09-15', '09:00', '17:00')]
    const result = fillSummary(entries, settings({ holidays: ['2026-09-14'] }), [], [], [], now)
    expect(result.absences.map((d) => d.date)).toEqual([
      '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-07',
      '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11',
    ])
  })

  it('fills a selected absent day from the bank', () => {
    const now = new Date(2026, 8, 16)
    const entries = [entry('2026-09-14', '08:00', '18:00')]
    const result = fillSummary(entries, settings(), [], [], ['2026-09-11'], now)
    expect(result.absences.find((d) => d.date === '2026-09-11')).toEqual({
      date: '2026-09-11',
      kind: 'absence',
      requiredMinutes: 480,
      filledMinutes: 120,
    })
    expect(result.filledAbsenceCount).toBe(0)
    expect(result.remainingExcessMinutes).toBe(0)
    expect(result.completedMinutes).toBe(600)
  })

  it('fills selected absences in date order and counts full fills', () => {
    const now = new Date(2026, 8, 16)
    const entries = [
      entry('2026-09-09', '08:00', '19:00'),
      entry('2026-09-10', '08:00', '21:00'),
    ]
    const result = fillSummary(entries, settings(), [], [], ['2026-09-02', '2026-09-03'], now)
    expect(result.absences.slice(0, 3)).toEqual([
      { date: '2026-09-01', kind: 'absence', requiredMinutes: 480, filledMinutes: 0 },
      { date: '2026-09-02', kind: 'absence', requiredMinutes: 480, filledMinutes: 480 },
      { date: '2026-09-03', kind: 'absence', requiredMinutes: 480, filledMinutes: 0 },
    ])
    expect(result.filledAbsenceCount).toBe(1)
    expect(result.remainingExcessMinutes).toBe(0)
    expect(result.completedMinutes).toBe(2 * 480 + 480)
  })

  it('lists no absences without a daily schedule', () => {
    const result = fillSummary(
      [],
      settings({ defaultDailyHours: null }),
      [],
      [],
      [],
      new Date(2026, 8, 18),
    )
    expect(result.absences).toEqual([])
  })
})

describe('headerTitle', () => {
  it('nudges setup before a goal is set', () => {
    expect(headerTitle(0, 420)).toBe('Set your goal to start tracking')
  })

  it('reports progress toward the goal', () => {
    expect(headerTitle(240, 420)).toBe('7 h of 240 h logged')
  })

  it('announces a reached goal', () => {
    expect(headerTitle(7, 420)).toBe('Goal reached')
  })
})
