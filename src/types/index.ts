export interface Station {
  stcd: string       // 站点代码（主键）
  stnm: string       // 站名
  rvnm: string       // 河流名
  addvcd: string     // 行政区
  latitude: number | null  // 纬度
  longitude: number | null // 经度
  wrz: number | null      // 警戒水位
  grz: number | null       // 保证水位
  updated_at: string
}

export interface WaterLevel {
  id: number
  stcd: string
  tm: string          // 格式: YYYY-MM-DD HH:mm:ss
  z: number           // 水位值
  sw: number          // 超警戒值
  q: number            // 流量
}

export interface StationWithLevel extends Station {
  latest_z: number | null   // 最新水位
  latest_tm: string | null  // 最新观测时间
  latest_sw: number | null  // 最新超警戒值
}

export type WaterLevelStatus = 'normal' | 'warning' | 'critical'
