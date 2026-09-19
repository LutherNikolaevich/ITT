import { Icon } from './Icon'

interface SegmentOption<T extends string> {
  value: T
  label: string
}

interface SegmentedButtonProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedButton<T extends string>({
  options,
  value,
  onChange,
}: SegmentedButtonProps<T>) {
  return (
    <div className="md-segmented" role="radiogroup">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`md-segmented__item${selected ? ' md-segmented__item--selected' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {selected && <Icon name="check" />}
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
