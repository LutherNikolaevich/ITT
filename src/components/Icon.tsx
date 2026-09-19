interface IconProps {
  name: string
  filled?: boolean
  className?: string
}

export function Icon({ name, filled, className = '' }: IconProps) {
  return (
    <span
      className={`material-symbols-rounded${filled ? ' md-icon--filled' : ''} ${className}`.trim()}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}
