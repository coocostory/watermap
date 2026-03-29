'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import TrendChart from '@/components/TrendChart'
import TimeRangeSelector from '@/components/TimeRangeSelector'
import type { StationWithLevel, WaterLevel } from '@/types'

type Range = '24h' | '7d' | '30d' | 'custom'

/** Format date as YYYY-MM-DD for date input */
function formatDateForInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Format date as YYYY-MM-DD HH:mm:ss for API */
function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function TrendPage() {
  const params = useParams()
  const stcd = params.stcd as string
  const [range, setRange] = useState<Range>('24h')
  const [station, setStation] = useState<StationWithLevel | null>(null)
  const [history, setHistory] = useState<WaterLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Custom date range state
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)
  const [customStart, setCustomStart] = useState(formatDateForInput(sevenDaysAgo))
  const [customEnd, setCustomEnd] = useState(formatDateForInput(today))

  useEffect(() => {
    fetch('/api/stations')
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() })
      .then(j => {
        if (j.code === '1001') {
          const found = (j.data as StationWithLevel[]).find((s: StationWithLevel) => s.stcd === stcd)
          setStation(found || null)
        }
      })
      .catch(() => setError('加载站点信息失败'))
  }, [stcd])

  useEffect(() => {
    setLoading(true)
    setError(null)

    let url: string
    if (range === 'custom') {
      const startDateTime = `${customStart} 00:00:00`
      const endDateTime = `${customEnd} 23:59:59`
      url = `/api/stations/${stcd}/history?start=${encodeURIComponent(startDateTime)}&end=${encodeURIComponent(endDateTime)}`
    } else {
      url = `/api/stations/${stcd}/history?range=${range}`
    }

    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() })
      .then(j => {
        if (j.code === '1001') setHistory(j.data)
        else throw new Error(j.message)
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [stcd, range, customStart, customEnd])

  const validHistory = history.filter(h => h.z !== null && h.z !== undefined)
  const stats = {
    max: validHistory.length > 0 ? Math.max(...validHistory.map(h => h.z!)) : null,
    min: validHistory.length > 0 ? Math.min(...validHistory.map(h => h.z!)) : null,
    current: validHistory.length > 0 ? validHistory[validHistory.length - 1].z! : null,
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-14">
      <div className="bg-blue-600 text-white px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <a href="/" className="text-sm opacity-80">← 地图</a>
        </div>
        <h1 className="text-lg font-bold">
          📈 {station?.stnm || stcd} 趋势分析
        </h1>
        {station && <p className="text-xs opacity-80">{station.rvnm} · {station.addvcd}</p>}
      </div>

      <TimeRangeSelector value={range} onChange={setRange} />

      {range === 'custom' && (
        <div className="flex gap-3 px-3 py-2 bg-gray-100 items-center">
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500">开始:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="text-sm border border-gray-200 rounded px-2 py-1"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500">结束:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="text-sm border border-gray-200 rounded px-2 py-1"
            />
          </div>
        </div>
      )}

      <div className="p-4 bg-white m-3 rounded-xl shadow-sm">
        {loading ? (
          <div className="h-40 flex items-center justify-center text-gray-400">加载中...</div>
        ) : error ? (
          <div className="h-40 flex items-center justify-center text-red-400 text-sm">{error}</div>
        ) : (
          <TrendChart data={history} height={200} warnLine={station?.wrz ?? null} />
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 px-3">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500">最高</div>
          <div className="text-lg font-bold text-blue-600">{stats.max !== null ? `${stats.max.toFixed(2)}m` : '--'}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500">最低</div>
          <div className="text-lg font-bold text-green-600">{stats.min !== null ? `${stats.min.toFixed(2)}m` : '--'}</div>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500">当前</div>
          <div className="text-lg font-bold text-orange-600">{stats.current !== null ? `${stats.current.toFixed(2)}m` : '--'}</div>
        </div>
      </div>

      {/* 原始数据 */}
      {!loading && !error && history.length > 0 && (
        <div className="mx-3 mt-4 mb-14">
          <div className="text-sm font-semibold text-gray-700 mb-2">原始数据</div>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">时间</th>
                    <th className="text-right px-3 py-2 font-medium">水位 (m)</th>
                    <th className="text-right px-3 py-2 font-medium">超警戒 (m)</th>
                    <th className="text-right px-3 py-2 font-medium">流量 (m³/s)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...history].reverse().slice(0, 20).map((h, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{h.tm}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">{h.z?.toFixed(2) ?? '--'}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{h.sw?.toFixed(2) ?? '--'}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{h.q?.toFixed(2) ?? '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {history.length > 20 && (
              <div className="px-3 py-2 text-center text-xs text-gray-400 bg-gray-50">
                显示最近 20 条，共 {history.length} 条
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
