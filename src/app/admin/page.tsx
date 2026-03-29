'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { StationWithLevel } from '@/types'

const AdminMapView = dynamic(() => import('@/components/AdminMapView'), { ssr: false })

export default function AdminPage() {
  const [stations, setStations] = useState<StationWithLevel[]>([])
  const [filtered, setFiltered] = useState<StationWithLevel[]>([])
  const [locating, setLocating] = useState<StationWithLevel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [exportHistory, setExportHistory] = useState(true)
  const [exportStations, setExportStations] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)

  const fetchStations = async () => {
    try {
      const res = await fetch('/api/stations')
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json()
      if (json.code === '1001') {
        setStations(json.data)
        setFiltered(json.data)
      } else {
        throw new Error(json.message)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStations() }, [])

  const handleSearch = (query: string) => {
    setSearch(query)
    if (!query) {
      setFiltered(stations)
      return
    }
    const q = query.toLowerCase()
    setFiltered(stations.filter(s =>
      s.stnm.toLowerCase().includes(q) || s.rvnm.toLowerCase().includes(q)
    ))
  }

  const handleExport = async () => {
    if (exportHistory) {
      window.open('/api/admin/export/history', '_blank')
    }
    if (exportStations) {
      window.open('/api/admin/export/stations', '_blank')
    }
  }

  const handleImportHistory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportMessage(null)

    try {
      const text = await file.text()
      const lines = text.trim().split('\n')
      if (lines.length < 2) {
        setImportMessage('文件内容为空或格式错误')
        return
      }

      // Skip header
      let successCount = 0
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',')
        if (parts.length >= 6) {
          const [stcd, , tm, z, sw, q] = parts
          const res = await fetch(`/api/admin/import/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stcd: stcd.trim(),
              tm: tm.trim(),
              z: parseFloat(z),
              sw: parseFloat(sw) || 0,
              q: parseFloat(q) || 0
            })
          })
          if (res.ok) successCount++
        }
      }
      setImportMessage(`成功导入 ${successCount} 条历史数据`)
    } catch (err) {
      setImportMessage('导入失败: ' + (err as Error).message)
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const handleImportStations = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportMessage(null)

    try {
      const text = await file.text()
      const lines = text.trim().split('\n')
      if (lines.length < 2) {
        setImportMessage('文件内容为空或格式错误')
        return
      }

      // Skip header
      let successCount = 0
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',')
        if (parts.length >= 6) {
          const [stcd, , , , lat, lng] = parts
          const latitude = parseFloat(lat.trim())
          const longitude = parseFloat(lng.trim())
          if (!isNaN(latitude) && !isNaN(longitude)) {
            const res = await fetch(`/api/admin/import/stations`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stcd: stcd.trim(), latitude, longitude })
            })
            if (res.ok) successCount++
          }
        }
      }
      setImportMessage(`成功导入 ${successCount} 条站点位置`)
      fetchStations()
    } catch (err) {
      setImportMessage('导入失败: ' + (err as Error).message)
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-14">
      <div className="bg-red-600 text-white px-4 py-3">
        <h1 className="text-lg font-bold">🔧 管理员模式</h1>
      </div>
      <div className="bg-orange-50 px-4 py-2 text-sm text-orange-700">
        ⚠️ 未定位的站点需要设定坐标后才能在地图上显示
      </div>
      {/* 搜索栏 */}
      <div className="p-3">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="🔍 搜索站点或河流..."
          className="w-full bg-white rounded-lg px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-orange-300 border border-gray-200"
        />
      </div>

      {/* 导入导出区域 */}
      <div className="mx-3 mb-3 bg-white rounded-lg p-3 border border-gray-200">
        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">导入导出</div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="exportHistory"
              checked={exportHistory}
              onChange={(e) => setExportHistory(e.target.checked)}
              className="w-4 h-4 accent-red-600"
            />
            <label htmlFor="exportHistory" className="text-sm text-gray-700">导出历史数据</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="exportStations"
              checked={exportStations}
              onChange={(e) => setExportStations(e.target.checked)}
              className="w-4 h-4 accent-red-600"
            />
            <label htmlFor="exportStations" className="text-sm text-gray-700">导出站点位置</label>
          </div>
          <button
            onClick={handleExport}
            disabled={!exportHistory && !exportStations}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            批量导出
          </button>
        </div>
        <div className="flex flex-wrap gap-3 mt-3 items-center">
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer">
            <span>📥 导入历史</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportHistory}
              disabled={importing}
              className="hidden"
            />
          </label>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer">
            <span>📥 导入站点</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportStations}
              disabled={importing}
              className="hidden"
            />
          </label>
          {importMessage && (
            <span className="text-sm text-green-600">{importMessage}</span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 text-center text-red-500 text-sm">加载失败: {error}</div>
      )}
      {loading ? (
        <div className="p-8 text-center text-gray-400">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-gray-400">未找到匹配的站点</div>
      ) : (
        <div className="p-3 space-y-4">
          {/* 未定位 */}
          {filtered.filter(s => s.latitude === null || s.longitude === null).length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">
                未定位 ({filtered.filter(s => !s.latitude || !s.longitude).length})
              </div>
              <div className="space-y-2">
                {filtered.filter(s => !s.latitude || !s.longitude).map(s => (
                  <div key={s.stcd} className="bg-orange-50 rounded-xl p-3 flex items-center gap-3 border-2 border-dashed border-orange-300">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 bg-orange-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 truncate">{s.stnm}</div>
                      <div className="text-xs text-gray-500">{s.rvnm}</div>
                    </div>
                    <button onClick={() => setLocating(s)}
                      className="text-sm text-orange-600 font-medium whitespace-nowrap">
                      📌 点击定位
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* 已定位 */}
          {filtered.filter(s => s.latitude !== null && s.longitude !== null).length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">
                已定位 ({filtered.filter(s => s.latitude && s.longitude).length})
              </div>
              <div className="space-y-2">
                {filtered.filter(s => s.latitude && s.longitude).map(s => (
                  <div key={s.stcd} className="bg-white rounded-xl p-3 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 bg-green-500" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 truncate">{s.stnm}</div>
                      <div className="text-xs text-gray-500">
                        {s.rvnm} · <span className="text-green-600">📍 {s.latitude!.toFixed(4)}°N {s.longitude!.toFixed(4)}°E</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {locating && (
        <AdminMapView
          stcd={locating.stcd}
          stnm={locating.stnm}
          onLocated={() => { setLocating(null); fetchStations() }}
          onCancel={() => setLocating(null)}
        />
      )}
    </main>
  )
}
