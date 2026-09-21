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
  holidaySummary,
} from './aggregate'

const entry = (date: string, timeIn: string, timeOut: string, breakMinutes = 0): TimeEntry => ({
  id: `${date}-${timeIn}`,
  date,
  timeIn,
  timeOut,
  breakMinutes,
  task: '',
  notes: '',
  status: 'draft',
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

describe('holidaySummary', () => {
  it('banks daily excess and fills a selected unworked holiday', () => {
    const entries = [entry('2026-09-14', '08:00', '18:00')] // 10 h rendered, 2 h banked
    const result = holidaySummary(entries, settings({ holidays: ['2026-09-16'] }), ['2026-09-16'])
    expect(result.holidays).toEqual([
      { date: '2026-09-16', requiredMinutes: 480, filledMinutes: 120 },
    ])
    expect(result.filledCount).toBe(0)
    expect(result.remainingExcessMinutes).toBe(0)
    expect(result.completedMinutes).toBe(600) // 8 h regular + 2 h holiday credit
  })

  it('leaves holidays unfilled without a selection', () => {
    const entries = [entry('2026-09-14', '08:00', '18:00')] // 2 h banked
    const result = holidaySummary(entries, settings({ holidays: ['2026-09-16'] }))
    expect(result.holidays).toEqual([
      { date: '2026-09-16', requiredMinutes: 480, filledMinutes: 0 },
    ])
    expect(result.remainingExcessMinutes).toBe(120)
    expect(result.completedMinutes).toBe(480)
  })

  it('fills selected holidays fully and leaves leftover excess banked', () => {
    const entries = [
      entry('2026-09-14', '08:00', '18:00'), // 10 h → 2 h banked
      entry('2026-09-15', '08:00', '19:00'), // 11 h → 3 h banked
      entry('2026-09-16', '08:00', '17:00'), // 9 h → 1 h banked
      entry('2026-09-17', '08:00', '20:00'), // 12 h → 4 h banked
    ]
    const result = holidaySummary(entries, settings({ holidays: ['2026-09-21'] }), ['2026-09-21'])
    expect(result.holidays).toEqual([
      { date: '2026-09-21', requiredMinutes: 480, filledMinutes: 480 },
    ])
    expect(result.filledCount).toBe(1)
    expect(result.remainingExcessMinutes).toBe(120) // 10 h banked − 8 h used
    expect(result.completedMinutes).toBe(4 * 480 + 480)
  })

  it('fills selected holidays in date order, partially when the bank runs out, and lists unselected ones', () => {
    const entries = [
      entry('2026-09-14', '08:00', '18:00'), // 2 h banked
      entry('2026-09-15', '08:00', '18:00'), // 2 h banked
      entry('2026-09-16', '08:00', '18:00'), // 2 h banked
      entry('2026-09-17', '08:00', '18:00'), // 2 h banked
      entry('2026-09-18', '08:00', '19:00'), // 3 h banked
    ]
    const result = holidaySummary(
      entries,
      settings({ holidays: ['2026-09-22', '2026-09-21', '2026-09-23'] }),
      ['2026-09-22', '2026-09-21'],
    )
    expect(result.holidays).toEqual([
      { date: '2026-09-21', requiredMinutes: 480, filledMinutes: 480 },
      { date: '2026-09-22', requiredMinutes: 480, filledMinutes: 180 },
      { date: '2026-09-23', requiredMinutes: 480, filledMinutes: 0 },
    ])
    expect(result.filledCount).toBe(1)
    expect(result.remainingExcessMinutes).toBe(0)
    expect(result.completedMinutes).toBe(5 * 480 + 480 + 180)
  })

  it('skips holidays that already have rendered hours even when selected', () => {
    const entries = [
      entry('2026-09-14', '08:00', '18:00'), // 2 h banked
      entry('2026-09-15', '09:00', '13:00'), // holiday worked for 4 h
    ]
    const result = holidaySummary(
      entries,
      settings({ holidays: ['2026-09-15', '2026-09-16'] }),
      ['2026-09-15', '2026-09-16'],
    )
    expect(result.holidays).toEqual([
      { date: '2026-09-16', requiredMinutes: 480, filledMinutes: 120 },
    ])
  })

  it('short days count only their regular hours and never go into debt', () => {
    const entries = [
      entry('2026-09-14', '08:00', '18:00'), // 10 h → 2 h banked
      entry('2026-09-15', '09:00', '13:00'), // 4 h → regular 4 h
    ]
    const result = holidaySummary(entries, settings({ holidays: ['2026-09-16'] }), ['2026-09-16'])
    expect(result.remainingExcessMinutes).toBe(0)
    expect(result.completedMinutes).toBe(480 + 240 + 120)
  })

  it('does nothing without a daily schedule', () => {
    const entries = [entry('2026-09-14', '08:00', '18:00')]
    const result = holidaySummary(
      entries,
      settings({ holidays: ['2026-09-16'], defaultDailyHours: null }),
      ['2026-09-16'],
    )
    expect(result.holidays).toEqual([
      { date: '2026-09-16', requiredMinutes: 0, filledMinutes: 0 },
    ])
    expect(result.filledCount).toBe(0)
    expect(result.remainingExcessMinutes).toBe(0)
    expect(result.completedMinutes).toBe(600)
  })

  it('returns an empty summary with nothing rendered', () => {
    const result = holidaySummary([], settings({ holidays: ['2026-09-16'] }), ['2026-09-16'])
    expect(result).toEqual({
      holidays: [{ date: '2026-09-16', requiredMinutes: 480, filledMinutes: 0 }],
      filledCount: 0,
      remainingExcessMinutes: 0,
      completedMinutes: 0,
    })
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
