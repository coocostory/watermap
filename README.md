# WaterMap 水位监测系统

[English](./README_EN.md) | [中文](./README.md)

---

WaterMap 是一个移动端优先的实时水位监测应用。从开放 API 获取数据，在交互式地图上展示监测站点，并提供历史趋势图表。

## 功能

- 实时水位监测（OpenStreetMap 地图）
- 历史趋势图表（24小时 / 7天 / 30天）
- 按站名或河流名搜索
- 预警状态指示（正常 / 预警 / 超警）
- 管理员模式管理站点位置
- CSV 导入/导出数据管理

## 技术栈

Next.js 15 (App Router) · SQLite · Leaflet · Recharts · Tailwind CSS · node-cron

## 快速开始

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run start
```

## 环境变量

```env
ADMIN_MODE=false          # 开启管理员面板
CRAWL_INTERVAL=30         # 爬虫间隔（分钟）
DATA_SOURCE_URL=...       # 外部 API 地址
NEXT_PUBLIC_MAP_CENTER_LAT=29.56
NEXT_PUBLIC_MAP_CENTER_LNG=106.55
```
