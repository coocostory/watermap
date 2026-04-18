'use client'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { StationWithLevel } from '@/types'

function getMarkerColor(sw: number | null, wrz: number | null): string {
  if (sw === null || wrz === null) return '#9e9e9e'
  if (sw >= wrz) return '#f44336'   // 红色: 超警戒
  if (sw >= 0) return '#ff9800'     // 橙色: 接近警戒
  return '#4caf50'                   // 绿色: 正常
}

export default function MapView({
  stations,
  onMarkerClick,
}: {
  stations: StationWithLevel[]
  onMarkerClick: (station: StationWithLevel) => void
}) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const lat = parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '29.56')
    const lng = parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '106.55')
    const zoom = parseInt(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM || '8', 10)

    // 重庆边界限制（宽松）
    const chongqingBounds = L.latLngBounds(
      [27.0, 104.0],  // 西南
      [33.0, 111.0]   // 东北
    )

    mapRef.current = L.map(containerRef.current, {
      center: [lat, lng],
      zoom,
      minZoom: 6,
      maxZoom: 16,
      maxBounds: chongqingBounds,
      maxBoundsViscosity: 1.0, // 完全禁止拖出边界
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapRef.current)
    // Fix Leaflet not rendering when container was initially hidden
    setTimeout(() => mapRef.current?.invalidateSize(), 100)
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Update markers when stations change
  useEffect(() => {
    if (!mapRef.current) return

    // Remove old markers
    markersRef.current.forEach(m => mapRef.current?.removeLayer(m))
    markersRef.current = []

    // Add markers for stations with coordinates
    stations.forEach((station) => {
      if (station.latitude === null || station.longitude === null) return
      const color = getMarkerColor(station.latest_sw, station.wrz)
      const levelText = station.latest_z !== null ? `${station.latest_z}m` : '--'
      const icon = L.divIcon({
        className: '',
        html: `<div style="display:flex;flex-direction:column;align-items:center;">
          <div style="background:${color};width:16px;height:16px;border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>
          <div style="background:rgba(255,255,255,0.9);border-radius:3px;padding:1px 3px;font-size:9px;font-weight:bold;color:#333;margin-top:2px;white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,0.15);">${levelText}</div>
          <div style="background:rgba(255,255,255,0.85);border-radius:3px;padding:0px 3px;font-size:16px;color:${color};margin-top:1px;white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis;text-align:center;">${station.stnm || ''}</div>
        </div>`,
        iconSize: [120, 52],
        iconAnchor: [60, 8],
      })
      const marker = L.marker([station.latitude, station.longitude], { icon })
      marker.on('click', () => onMarkerClick(station))
      marker.addTo(mapRef.current!)
      markersRef.current.push(marker)
    })
  }, [stations, onMarkerClick])

  return <div ref={containerRef} className="w-full h-full" />
}