import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from './ui/select'

const stratifiers = [
  { value: 'total', label: 'Total' },
  { value: 'sexo', label: 'Sexo' },
]

interface StratifierSelectorProps {
  value?: string
  onValueChange?: (value: string) => void
}

export const StratifierSelector = ({
  value,
  onValueChange,
}: StratifierSelectorProps = {}) => {
  const selectProps =
    value === undefined
      ? { defaultValue: 'total', onValueChange }
      : { value, onValueChange }

  return (
    <div>
      <Select {...selectProps}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {stratifiers.map((stratifier) => (
              <SelectItem key={stratifier.value} value={stratifier.value}>
                {stratifier.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
