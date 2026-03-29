'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()
  const isAdmin = process.env.NEXT_PUBLIC_ADMIN_MODE === 'true'

  const navItems = [
    { href: '/', label: '地图', icon: '🗺️' },
    { href: '/settings', label: '设置', icon: '⚙️' },
    ...(isAdmin ? [{ href: '/admin', label: '管理', icon: '🔧' }] : []),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full text-xs transition-colors ${
              pathname === item.href ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
