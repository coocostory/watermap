export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">页面未找到</h1>
        <p className="text-gray-500 mb-4">您访问的页面不存在</p>
        <a href="/" className="text-blue-600 hover:underline">返回首页</a>
      </div>
    </main>
  )
}
