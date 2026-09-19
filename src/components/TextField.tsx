import { useId, type ChangeEvent } from 'react'

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'date' | 'time'
  error?: string
  hint?: string
  placeholder?: string
  min?: string
  max?: string
  step?: string
  multiline?: boolean
  autoFocus?: boolean
  className?: string
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  error,
  hint,
  placeholder,
  min,
  max,
  step,
  multiline,
  autoFocus,
  className,
}: TextFieldProps) {
  const id = useId()
  const shared = {
    id,
    value,
    'aria-invalid': !!error,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
  }

  return (
    <div className={`md-field${className ? ` ${className}` : ''}`}>
      <label className="md-field__label" htmlFor={id}>
        {label}
        {hint ? <span className="md-field__label-hint">{hint}</span> : null}
      </label>
      {multiline ? (
        <textarea
          className="md-field__input md-field__input--textarea"
          rows={3}
          placeholder={placeholder}
          {...shared}
        />
      ) : (
        <input
          className="md-field__input"
          type={type}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          autoFocus={autoFocus}
          {...shared}
        />
      )}
      <div className={`md-field__supporting${error ? ' md-field__supporting--error' : ''}`}>
        {error ?? ''}
      </div>
    </div>
  )
}
