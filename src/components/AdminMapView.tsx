'use client'
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

interface Props {
  stcd: string
  stnm: string
  onLocated: () => void
  onCancel: () => void
}

export default function AdminMapView({ stcd, stnm, onLocated, onCancel }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const lat_ = parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '29.56')
    const lng_ = parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '106.55')
    mapRef.current = L.map(containerRef.current).setView([lat_, lng_], 9)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(mapRef.current)
    mapRef.current.on('click', (e) => {
      setLat(e.latlng.lat)
      setLng(e.latlng.lng)
      if (markerRef.current) markerRef.current.setLatLng(e.latlng)
      else {
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:20px;height:20px;background:#d32f2f;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })
        markerRef.current = L.marker(e.latlng, { icon, draggable: true }).addTo(mapRef.current!)
        markerRef.current.on('dragend', (ev) => {
          const p = ev.target.getLatLng()
          setLat(p.lat)
          setLng(p.lng)
        })
      }
    })
    return () => { mapRef.current?.remove(); mapRef.current = null }
  }, [])

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = async () => {
    if (lat === null || lng === null) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/admin/stations/${stcd}/locate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json()
      if (json.code !== '1001') throw new Error(json.message)
      onLocated()
    } catch (err) {
      setSaveError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-white flex flex-col">
      <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
        <span className="font-semibold">🔧 定位: {stnm}</span>
        <button onClick={onCancel} className="text-sm opacity-80">✕ 取消</button>
      </div>
      <div className="bg-blue-50 px-4 py-2 text-sm text-blue-700">
        👆 点击地图设定站点位置，支持拖拽调整
      </div>
      <div ref={containerRef} className="flex-1" />
      <div className="p-4 bg-white border-t">
        {lat !== null && (
          <div className="bg-gray-100 rounded-lg p-3 mb-3 text-sm">
            <div className="text-gray-500">选中坐标</div>
            <div className="font-mono font-semibold">{lat!.toFixed(6)}°N, {lng!.toFixed(6)}°E</div>
          </div>
        )}
        {saveError && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg p-2 mb-3">{saveError}</div>
        )}
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={lat === null || saving}
            className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50">
            {saving ? '保存中...' : '✓ 确认保存'}
          </button>
          <button onClick={() => { setLat(null); setLng(null); markerRef.current?.remove(); markerRef.current = null }}
            className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl">
            ↩ 重选
          </button>
        </div>
      </div>
    </div>
  )
}