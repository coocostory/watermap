'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import type { WaterLevel } from '@/types'

interface Props {
  data: WaterLevel[]
  height?: number
  showLegend?: boolean
  warnLine?: number | null
}

export default function TrendChart({ data, height = 160, showLegend = true, warnLine = null }: Props) {
  const formatted = data.map(d => ({
    ...d,
    time: d.tm.slice(11, 16), // HH:mm
  }))

  if (data.length === 0) {
    return <div className="h-40 flex items-center justify-center text-gray-400">暂无数据</div>
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10 }} width={45} />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(value: number) => [`${value.toFixed(2)}m`, '水位']}
          labelFormatter={(label) => `时间: ${label}`}
        />
        {warnLine !== null && (
          <ReferenceLine
            y={warnLine}
            stroke="#ff9800"
            strokeDasharray="4 2"
            label={{ value: '警戒', fontSize: 10, fill: '#ff9800' }}
          />
        )}
        <Line type="monotone" dataKey="z" stroke="#1976d2" strokeWidth={2} dot={false} name="水位" />
      </LineChart>
    </ResponsiveContainer>
  )
}