'use client'

type Range = '24h' | '7d' | '30d' | 'custom'

interface Props {
  value: Range
  onChange: (range: Range) => void
}

const presets = [
  { label: '24h', value: '24h' as Range },
  { label: '7天', value: '7d' as Range },
  { label: '30天', value: '30d' as Range },
  { label: '自定义', value: 'custom' as Range },
]

export default function TimeRangeSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 p-3 bg-gray-50">
      {presets.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
            value === p.value
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}