import { useEffect, useState } from 'react'
import { dateKey } from '../lib/aggregate'
import { Icon } from './Icon'

interface OjtCalendarProps {
  startDate: string
  excluded: string[]
  onChange: (dates: string[]) => void
}

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function OjtCalendar({ startDate, excluded, onChange }: OjtCalendarProps) {
  const anchor = startDate || dateKey(new Date())
  const [view, setView] = useState(() => {
    const d = new Date(`${anchor}T00:00:00`)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  useEffect(() => {
    const d = new Date(`${anchor}T00:00:00`)
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }, [anchor])

  const toggle = (key: string) => {
    if (excluded.includes(key)) {
      onChange(excluded.filter((d) => d !== key))
    } else {
      onChange([...excluded, key].sort())
    }
  }

  const shift = (delta: number) =>
    setView((v) => {
      const next = new Date(v.year, v.month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })

  const first = new Date(view.year, view.month, 1)
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const leading = (first.getDay() + 6) % 7
  const excludedSet = new Set(excluded)

  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      dateKey(new Date(view.year, view.month, i + 1)),
    ),
  ]

  return (
    <div className="md-cal">
      <div className="md-cal__header">
        <button
          type="button"
          className="md-cal__nav"
          aria-label="Previous month"
          onClick={() => shift(-1)}
        >
          <Icon name="chevron_left" />
        </button>
        <span className="md-cal__title" aria-live="polite">
          {monthLabel(view.year, view.month)}
        </span>
        <button
          type="button"
          className="md-cal__nav"
          aria-label="Next month"
          onClick={() => shift(1)}
        >
          <Icon name="chevron_right" />
        </button>
      </div>
      <div className="md-cal__grid" role="grid" aria-label="Holidays">
        {DOW.map((d) => (
          <span key={d} className="md-cal__dow" role="columnheader">
            {d}
          </span>
        ))}
        {cells.map((key, i) => {
          if (!key) return <span key={`blank-${i}`} />
          const d = new Date(`${key}T00:00:00`)
          const isExcluded = excludedSet.has(key)
          const disabled = key < startDate || d.getDay() === 0 || d.getDay() === 6
          const isToday = key === dateKey(new Date())
          const label = d.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              aria-pressed={isExcluded}
              aria-label={`${isExcluded ? 'Include' : 'Exclude'} ${label}`}
              className={`md-cal__day${isExcluded ? ' md-cal__day--excluded' : ''}${
                disabled ? ' md-cal__day--disabled' : ''
              }${isToday && !isExcluded ? ' md-cal__day--today' : ''}`}
              disabled={disabled}
              onClick={() => toggle(key)}
            >
              {Number(key.slice(8))}
            </button>
          )
        })}
      </div>
    </div>
  )
}
