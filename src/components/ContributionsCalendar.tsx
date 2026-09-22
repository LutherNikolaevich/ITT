import type { CalendarWeek } from '../lib/contributions'
import { formatHours } from '../lib/time'

interface ContributionsCalendarProps {
  weeks: CalendarWeek[]
  totalMinutes: number
}

const CELL = 12
const GAP = 3
const STEP = CELL + GAP

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

interface MonthLabel {
  left: number
  label: string
}

function monthLabels(weeks: CalendarWeek[]): MonthLabel[] {
  const labels: MonthLabel[] = []
  weeks.forEach((week, index) => {
    const first = week.days.find((day) => day !== null && Number(day.date.slice(-2)) === 1)
    if (!first) return
    labels.push({
      left: index * STEP,
      label: new Date(`${first.date}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
      }),
    })
  })
  return labels
}

export function ContributionsCalendar({ weeks, totalMinutes }: ContributionsCalendarProps) {
  return (
    <div className="md-card md-contrib">
      <div className="md-contrib__grid" aria-hidden="true">
        <div className="md-contrib__weekdays">
          <span />
          <span>Mon</span>
          <span />
          <span>Wed</span>
          <span />
          <span>Fri</span>
          <span />
        </div>
        <div className="md-contrib__scroll">
          <div className="md-contrib__months">
            {monthLabels(weeks).map((month) => (
              <span key={month.left} style={{ left: month.left }}>
                {month.label}
              </span>
            ))}
          </div>
          <div className="md-contrib__days">
            {weeks.flatMap((week, weekIndex) =>
              week.days.map((day, dayIndex) => {
                const key = day?.date ?? `${weekIndex}-${dayIndex}`
                const title = day
                  ? `${formatHours(day.minutes)} · ${formatDay(day.date)}`
                  : undefined
                return (
                  <span
                    key={key}
                    title={title}
                    className={`md-contrib__day${day ? ` md-contrib__day--${day.level}` : ''}`}
                  />
                )
              }),
            )}
          </div>
        </div>
      </div>
      <div className="md-contrib__footer">
        <span className="md-contrib__summary">
          {formatHours(totalMinutes)} logged in the last 12 months
        </span>
        <span className="md-contrib__legend" aria-hidden="true">
          Less
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} className={`md-contrib__day md-contrib__day--${level}`} />
          ))}
          More
        </span>
      </div>
    </div>
  )
}
