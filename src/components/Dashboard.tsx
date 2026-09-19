import type { Settings, TimeEntry } from '../types'
import { formatHours } from '../lib/time'
import { excessMinutes, thisMonthMinutes, thisWeekMinutes, totalRenderedMinutes } from '../lib/aggregate'
import { Button } from './Button'
import { Icon } from './Icon'
import { ProgressIndicator } from './ProgressIndicator'
import { StatCard } from './StatCard'

interface DashboardProps {
  entries: TimeEntry[]
  settings: Settings
  onSetUp: () => void
}

export function Dashboard({ entries, settings, onSetUp }: DashboardProps) {
  const total = totalRenderedMinutes(entries)
  const required = settings.requiredHours * 60
  const remaining = Math.max(0, required - total)
  const pct = required > 0 ? Math.round((total / required) * 100) : 0
  const week = thisWeekMinutes(entries)
  const month = thisMonthMinutes(entries)
  const excess = excessMinutes(entries, settings.defaultDailyHours)

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
            <StatCard label="Total rendered" value={formatHours(total)} icon="schedule" />
            <StatCard label="Required" value={formatHours(required)} icon="flag" />
            <StatCard label="This week" value={formatHours(week)} icon="today" />
            <StatCard label="This month" value={formatHours(month)} icon="calendar_month" />
            <StatCard label="Excess time" value={formatHours(excess)} icon="trending_up" />
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
          </div>
        </>
      )}
    </div>
  )
}
