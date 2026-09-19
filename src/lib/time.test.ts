import { describe, expect, it } from 'vitest'
import { formatHours, minutesToHHMM, overlaps, parseMinutes, spanMinutes, totalMinutes } from './time'

describe('parseMinutes', () => {
  it('parses HH:mm into minutes', () => {
    expect(parseMinutes('09:30')).toBe(570)
    expect(parseMinutes('00:00')).toBe(0)
    expect(parseMinutes('17:05')).toBe(1025)
  })
})

describe('spanMinutes', () => {
  it('returns the difference between two times', () => {
    expect(spanMinutes('09:00', '17:00')).toBe(480)
  })

  it('returns a negative value when reversed', () => {
    expect(spanMinutes('17:00', '09:00')).toBe(-480)
  })
})

describe('totalMinutes', () => {
  it('subtracts break from span', () => {
    expect(totalMinutes('09:00', '17:00', 30)).toBe(450)
  })

  it('clamps at zero when break exceeds span', () => {
    expect(totalMinutes('09:00', '10:00', 90)).toBe(0)
  })
})

describe('overlaps', () => {
  it('detects intersecting ranges on the same date', () => {
    const a = { date: '2026-09-16', timeIn: '09:00', timeOut: '17:00' }
    const b = { date: '2026-09-16', timeIn: '16:30', timeOut: '18:00' }
    expect(overlaps(a, b)).toBe(true)
  })

  it('does not flag touching boundaries', () => {
    const a = { date: '2026-09-16', timeIn: '09:00', timeOut: '17:00' }
    const b = { date: '2026-09-16', timeIn: '17:00', timeOut: '18:00' }
    expect(overlaps(a, b)).toBe(false)
  })

  it('does not flag different dates', () => {
    const a = { date: '2026-09-16', timeIn: '09:00', timeOut: '17:00' }
    const b = { date: '2026-09-17', timeIn: '09:00', timeOut: '17:00' }
    expect(overlaps(a, b)).toBe(false)
  })

  it('does not flag incomplete times', () => {
    const a = { date: '2026-09-16', timeIn: '09:00', timeOut: '17:00' }
    const b = { date: '2026-09-16', timeIn: '', timeOut: '' }
    expect(overlaps(a, b)).toBe(false)
  })
})

describe('formatHours', () => {
  it('formats whole and fractional hours', () => {
    expect(formatHours(480)).toBe('8 h')
    expect(formatHours(450)).toBe('7.5 h')
    expect(formatHours(455)).toBe('7.58 h')
  })
})

describe('minutesToHHMM', () => {
  it('formats minutes as HH:mm', () => {
    expect(minutesToHHMM(570)).toBe('09:30')
    expect(minutesToHHMM(1080)).toBe('18:00')
  })
})
