'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { StationWithLevel, WaterLevel } from '@/types'
import TrendChart from './TrendChart'

export default function StationPopup({
  station,
  onClose,
}: {
  station: StationWithLevel
  onClose: () => void
}) {
  const [miniHistory, setMiniHistory] = useState<WaterLevel[]>([])
  const [miniLoading, setMiniLoading] = useState(true)

  useEffect(() => {
    setMiniLoading(true)
    fetch(`/api/stations/${station.stcd}/history?range=24h`)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() })
      .then(j => { if (j.code === '1001') setMiniHistory(j.data) })
      .catch(() => {})
      .finally(() => setMiniLoading(false))
  }, [station.stcd])

  const getStatusColor = (sw: number | null, wrz: number | null) => {
    if (sw === null || wrz === null) return 'text-gray-500'
    if (sw >= wrz) return 'text-red-600'
    if (sw >= 0) return 'text-orange-500'
    return 'text-green-600'
  }

  const getStatusText = (sw: number | null, wrz: number | null) => {
    if (sw === null || wrz === null) return '未知'
    if (sw >= wrz) return '超警戒'
    if (sw >= 0) return '接近警戒'
    return '正常'
  }

  const sw = station.latest_sw
  const wrz = station.wrz

  return (
    <div className="fixed bottom-14 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[1002] max-h-[70vh] overflow-y-auto">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{station.stnm}</h2>
            <p className="text-sm text-gray-500">{station.rvnm} · {station.addvcd}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">✕</button>
        </div>

        <div className="flex justify-between items-end mb-3">
          <div>
            <div className={`text-3xl font-bold ${getStatusColor(sw, wrz)}`}>
              {station.latest_z !== null ? `${station.latest_z}m` : '--'}
            </div>
            <div className={`text-sm ${getStatusColor(sw, wrz)}`}>
              {sw !== null ? `${sw > 0 ? '↑' : '↓'} ${Math.abs(sw).toFixed(2)}m` : ''} {getStatusText(sw, wrz)}
            </div>
          </div>
          <Link href={`/trend/${station.stcd}`} className="text-sm text-blue-600 hover:underline">
            查看更多 →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-500">警戒水位</div>
            <div className="font-semibold text-orange-500">{station.wrz !== null ? `${station.wrz}m` : '--'}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-500">保证水位</div>
            <div className="font-semibold text-red-500">{station.grz !== null ? `${station.grz}m` : '--'}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-500">流量</div>
            <div className="font-semibold text-gray-700">--</div>
          </div>
        </div>

        {miniLoading ? (
          <div className="bg-gray-50 rounded-lg p-2 h-16 flex items-center justify-center text-gray-400 text-xs">加载趋势...</div>
        ) : miniHistory.length > 0 ? (
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-xs text-gray-500 mb-1">📈 近24小时趋势</div>
            <TrendChart data={miniHistory} height={60} warnLine={station.wrz ?? null} />
          </div>
        ) : null}

        <div className="text-xs text-gray-400 mt-2 text-center">
          更新时间: {station.latest_tm || '--'}
        </div>
      </div>
    </div>
  )
}