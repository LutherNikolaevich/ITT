import { Icon } from './Icon'

interface StatCardProps {
  label: string
  value: string
  icon?: string
  sub?: string
  hero?: boolean
}

export function StatCard({ label, value, icon, sub, hero }: StatCardProps) {
  return (
    <div className={`md-card md-stat${hero ? ' md-stat--hero' : ''}`}>
      <div className="md-stat__header">
        <span className="md-stat__label">{label}</span>
        {icon && <Icon name={icon} />}
      </div>
      <div className="md-stat__value">{value}</div>
      {sub && <div className="md-stat__sub">{sub}</div>}
    </div>
  )
}
