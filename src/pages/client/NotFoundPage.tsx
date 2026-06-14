import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <p className="text-6xl font-extrabold text-gray-300 mb-4">404</p>
      <h1 className="text-lg text-gray-600 mb-8">
        원하시는 페이지를 찾을 수 없습니다. (Page Not Found)
      </h1>
      <button
        type="button"
        onClick={() => navigate('/', { replace: true })}
        className="rounded-full bg-[#FF7D66] px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#ff684d] active:scale-95"
      >
        홈으로 돌아가기 (Go to Home)
      </button>
    </main>
  )
}
