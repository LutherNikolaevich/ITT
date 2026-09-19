import { Icon } from './Icon'

interface StatCardProps {
  label: string
  value: string
  icon?: string
  sub?: string
}

export function StatCard({ label, value, icon, sub }: StatCardProps) {
  return (
    <div className="md-card md-stat">
      <div className="md-stat__header">
        <span className="md-stat__label">{label}</span>
        {icon && <Icon name={icon} />}
      </div>
      <div className="md-stat__value">{value}</div>
      {sub && <div className="md-stat__sub">{sub}</div>}
    </div>
  )
}
