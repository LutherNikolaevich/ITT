import { describe, expect, it } from 'vitest'
import type { TimeEntry } from '../types'
import {
  dateKey,
  entryMinutes,
  minutesInRange,
  startOfWeek,
  thisMonthMinutes,
  thisWeekMinutes,
  totalRenderedMinutes,
  headerTitle,
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

describe('headerTitle', () => {
  it('nudges setup before a goal is set', () => {
    expect(headerTitle(0, [entry('2026-09-14', '09:00', '17:00', 60)])).toBe(
      'Set your goal to start tracking',
    )
  })

  it('reports progress toward the goal', () => {
    expect(headerTitle(240, [entry('2026-09-14', '09:00', '17:00', 60)])).toBe('7 h of 240 h logged')
  })

  it('announces a reached goal', () => {
    expect(headerTitle(7, [entry('2026-09-14', '09:00', '17:00', 60)])).toBe('Goal reached')
  })
})
