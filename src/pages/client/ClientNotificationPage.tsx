import { Bell, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ClientNotificationPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen w-full bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 mx-auto flex h-14 w-full max-w-md items-center border-b border-gray-100 bg-white px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-800 transition-colors hover:bg-gray-50"
          aria-label="뒤로 가기"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </button>
        <h1 className="min-w-0 flex-1 text-center text-[17px] font-bold text-gray-900 pr-10">
          알림
        </h1>
      </header>

      <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-8 pb-10 pt-14">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <Bell className="h-9 w-9 text-gray-400" strokeWidth={1.8} aria-hidden />
        </div>
        <h2 className="mt-6 text-center text-[17px] font-bold text-gray-900">
          아직 도착한 알림이 없어요
        </h2>
        <p className="mt-2 max-w-[260px] text-center text-[14px] leading-relaxed text-gray-500">
          새로운 소식이나 맞춤 네일 추천이 도착하면 여기에서 확인할 수 있어요.
        </p>
      </main>
    </div>
  )
}
