# WaterMap

WaterMap is a mobile-first real-time water level monitoring application. It fetches data from an Open Source API and displays monitoring stations on an interactive map with historical trend charts.

## Features

- Real-time water level monitoring on OpenStreetMap
- Historical trend charts (24h / 7d / 30d)
- Station search by name or river
- Alert status indicators (normal / warning / critical)
- Admin mode for station location management
- CSV import/export for data management

## Tech Stack

Next.js 15 (App Router) · SQLite · Leaflet · Recharts · Tailwind CSS · node-cron

## Quick Start

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run start
```

## Environment Variables

```env
ADMIN_MODE=false          # Enable admin panel
CRAWL_INTERVAL=30         # Crawler interval (minutes)
DATA_SOURCE_URL=...       # External API endpoint
NEXT_PUBLIC_MAP_CENTER_LAT=29.56
NEXT_PUBLIC_MAP_CENTER_LNG=106.55
```

---

[中文](./README_ZH.md)
