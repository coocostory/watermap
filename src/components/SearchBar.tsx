'use client'
import { useState } from 'react'

export default function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => { setValue(e.target.value); onSearch(e.target.value) }}
      placeholder="🔍 搜索站点..."
      className="w-full bg-white/95 backdrop-blur rounded-full px-4 py-2.5 text-sm shadow-md outline-none focus:ring-2 focus:ring-blue-400"
    />
  )
}