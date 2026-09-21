import type { Settings, TimeEntry } from '../types'
import { formatHours } from '../lib/time'
import { holidaySummary, thisMonthMinutes, thisWeekMinutes } from '../lib/aggregate'
import { Button } from './Button'
import { Icon } from './Icon'
import { ProgressIndicator } from './ProgressIndicator'
import { StatCard } from './StatCard'

interface DashboardProps {
  entries: TimeEntry[]
  settings: Settings
  filledHolidays: string[]
  onToggleHolidayFill: (date: string) => void
  onSetUp: () => void
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function Dashboard({
  entries,
  settings,
  filledHolidays,
  onToggleHolidayFill,
  onSetUp,
}: DashboardProps) {
  const summary = holidaySummary(entries, settings, filledHolidays)
  const total = summary.completedMinutes
  const required = settings.requiredHours * 60
  const remaining = Math.max(0, required - total)
  const pct = required > 0 ? Math.round((total / required) * 100) : 0
  const week = thisWeekMinutes(entries)
  const month = thisMonthMinutes(entries)
  const holidayRequired = summary.holidays.reduce((sum, h) => sum + h.requiredMinutes, 0)
  const holidayFilled = summary.holidays.reduce((sum, h) => sum + h.filledMinutes, 0)
  const holidayPct = holidayRequired > 0 ? Math.round((holidayFilled / holidayRequired) * 100) : 0

  return (
    <div className="md-page">
      <div className="md-page__header">
        <h2 className="md-headline">OJT Progress</h2>
        <span className="md-page__sub">
          {settings.requiredHours > 0
            ? 'Keep logging daily hours to reach your goal'
            : 'Add your OJT requirements to start logging hours'}
        </span>
      </div>

      {settings.requiredHours <= 0 ? (
        <div className="md-card md-empty">
          <div className="md-empty__badge">
            <Icon name="tune" filled />
          </div>
          <h3 className="md-empty__title">Set up your OJT requirements</h3>
          <p className="md-empty__body">
            Enter the required hours and your daily schedule to start tracking progress. Your
            progress and weekly totals will appear here.
          </p>
          <Button variant="filled" icon="add" onClick={onSetUp}>
            Add requirements
          </Button>
        </div>
      ) : (
        <>
          <div className="md-grid">
            <StatCard label="Total completed" value={formatHours(total)} icon="task_alt" />
            <StatCard label="Required" value={formatHours(required)} icon="flag" />
            <StatCard label="This week" value={formatHours(week)} icon="today" />
            <StatCard label="This month" value={formatHours(month)} icon="calendar_month" />
            <StatCard
              label="Remaining excess"
              value={formatHours(summary.remainingExcessMinutes)}
              icon="trending_up"
            />
            <StatCard
              label="Holidays filled"
              value={`${summary.filledCount} / ${summary.holidays.length}`}
              icon="event_available"
            />
          </div>

          <div className="md-card md-progress-card">
            <div className="md-progress-card__header">
              <span className="md-progress-card__label">Overall progress</span>
              <span className="md-progress-card__pct">{pct}%</span>
            </div>
            <ProgressIndicator value={pct} />
            <p className="md-progress-card__body">
              {remaining === 0
                ? `Requirement met${total > required ? ` — ${formatHours(total - required)} over` : ''}.`
                : `${formatHours(remaining)} to go.`}
            </p>

            {summary.holidays.length > 0 && (
              <div className="md-progress-card__section">
                <div className="md-progress-card__header">
                  <span className="md-progress-card__label">Holidays filled</span>
                  <span className="md-progress-card__pct">{holidayPct}%</span>
                </div>
                <ProgressIndicator value={holidayPct} />
                <div className="md-holiday-list">
                  {summary.holidays.map((holiday) => {
                    const selected = filledHolidays.includes(holiday.date)
                    return (
                      <button
                        key={holiday.date}
                        type="button"
                        aria-pressed={selected}
                        className={`md-holiday-row${selected ? ' md-holiday-row--selected' : ''}`}
                        onClick={() => onToggleHolidayFill(holiday.date)}
                      >
                        <span className="md-holiday-row__header">
                          <span className="md-holiday-row__date">{formatDate(holiday.date)}</span>
                          {selected && <Icon name="check_circle" filled />}
                        </span>
                        <span className="md-holiday-row__sub">
                          {holiday.filledMinutes > 0
                            ? `${formatHours(holiday.filledMinutes)} of ${formatHours(holiday.requiredMinutes)}`
                            : 'Not filled'}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="md-progress-card__body">
                  {summary.filledCount} of {summary.holidays.length} holidays filled ·{' '}
                  {formatHours(summary.remainingExcessMinutes)} excess banked
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
