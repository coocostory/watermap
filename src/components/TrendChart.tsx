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

  // 计算 Y 轴上下限，让趋势更清晰
  const values = data.map(d => d.z).filter((v): v is number => v != null)
  let yMin: number | 'auto' = 'auto'
  let yMax: number | 'auto' = 'auto'
  if (values.length > 0) {
    const dataMin = Math.min(...values)
    const dataMax = Math.max(...values)
    const range = dataMax - dataMin
    // 最小范围 0.5m，避免数据太平导致看不出趋势
    const padding = Math.max(range * 0.3, 0.25)
    let lower = dataMin - padding
    let upper = dataMax + padding
    // 如果有警戒线，确保 Y 轴范围包含警戒线
    if (warnLine != null) {
      if (warnLine < lower) lower = warnLine - padding * 0.5
      if (warnLine > upper) upper = warnLine + padding * 0.5
    }
    // 保留两位小数
    yMin = Math.floor(lower * 100) / 100
    yMax = Math.ceil(upper * 100) / 100
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10 }} width={50} domain={[yMin, yMax]} />
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