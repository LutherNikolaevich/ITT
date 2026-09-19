interface ProgressIndicatorProps {
  value: number
}

export function ProgressIndicator({ value }: ProgressIndicatorProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className="md-progress"
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="md-progress__track">
        <div className="md-progress__indicator" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  )
}
