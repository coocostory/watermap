import { NextResponse } from 'next/server'
import { getAllStations } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function GET() {
  if (process.env.ADMIN_MODE !== 'true') {
    logger.warn({ module: 'admin:export:stations' }, 'Export request denied - ADMIN_MODE not enabled')
    return NextResponse.json({ code: '403', message: 'Forbidden' }, { status: 403 })
  }

  try {
    const stations = getAllStations()
    const now = new Date()
    const date = now.toISOString().slice(0, 10).replace(/-/g, '')
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '')
    const filename = `stations_${date}_${time}.csv`

    logger.info({ module: 'admin:export:stations', stationCount: stations.length, filename }, 'Exporting station locations')

    // Build CSV content
    const header = '站点代码,站点名,河流,行政区,纬度,经度\n'
    const rows = stations.map(s => {
      const lat = s.latitude !== null && s.latitude !== undefined ? s.latitude : ''
      const lng = s.longitude !== null && s.longitude !== undefined ? s.longitude : ''
      return `${s.stcd},${s.stnm},${s.rvnm},${s.addvcd},${lat},${lng}`
    }).join('\n')

    const csv = header + rows

    logger.info({ module: 'admin:export:stations', filename, stationCount: stations.length }, 'Station locations exported successfully')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    logger.error({ module: 'admin:export:stations', error: (error as Error).message }, 'Export failed')
    return NextResponse.json(
      { code: '500', message: (error as Error).message },
      { status: 500 }
    )
  }
}
