'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import SearchBar from '@/components/SearchBar'
import StationPopup from '@/components/StationPopup'
import type { StationWithLevel } from '@/types'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

export default function HomePage() {
  const [stations, setStations] = useState<StationWithLevel[]>([])
  const [filtered, setFiltered] = useState<StationWithLevel[]>([])
  const [selected, setSelected] = useState<StationWithLevel | null>(null)
  const [lastUpdate, setLastUpdate] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchStations = useCallback(async () => {
    try {
      const res = await fetch('/api/stations')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.code === '1001') {
        const data = json.data as StationWithLevel[]
        setStations(data)
        setFiltered(data)
        // 取所有站点中最新的一条观测时间
        const latest = data
          .filter(s => s.latest_tm)
          .sort((a, b) => b.latest_tm!.localeCompare(a.latest_tm!))[0]
        if (latest?.latest_tm) {
          setLastUpdate(latest.latest_tm.slice(11, 16))
        }
      }
    } catch (error) {
      console.error('[home] fetch stations error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStations()
    const interval = setInterval(fetchStations, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchStations])

  const handleSearch = (query: string) => {
    if (!query) { setFiltered(stations); return }
    const q = query.toLowerCase()
    const next = stations.filter(s =>
      s.stnm.toLowerCase().includes(q) || s.rvnm.toLowerCase().includes(q)
    )
    setFiltered(next)
    // Close popup if selected station is no longer visible
    if (selected && !next.find(s => s.stcd === selected.stcd)) {
      setSelected(null)
    }
  }

  return (
    <main className="h-screen w-full relative">
      {/* 标题栏 */}
      <div className="absolute top-0 left-0 right-0 z-[1001] bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-base font-semibold">🌊 重庆水位监测</h1>
        {lastUpdate && <span className="text-xs opacity-80">更新 {lastUpdate}</span>}
      </div>
      {/* 搜索栏 */}
      <div className="absolute top-14 left-3 right-3 z-[1000]">
        <SearchBar onSearch={handleSearch} />
      </div>
      {/* 地图 */}
      <div className="absolute inset-0 pt-14 pb-14">
        {loading
          ? <div className="h-full flex items-center justify-center text-gray-400">加载中...</div>
          : <MapView stations={filtered} onMarkerClick={setSelected} />
        }
      </div>
      {/* 浮层 */}
      {selected && <StationPopup station={selected} onClose={() => setSelected(null)} />}
    </main>
  )
}