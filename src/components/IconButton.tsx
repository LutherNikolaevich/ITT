import { Icon } from './Icon'

interface IconButtonProps {
  icon: string
  label: string
  onClick?: () => void
}

export function IconButton({ icon, label, onClick }: IconButtonProps) {
  return (
    <button type="button" className="md-icon-btn" aria-label={label} title={label} onClick={onClick}>
      <Icon name={icon} />
    </button>
  )
}
