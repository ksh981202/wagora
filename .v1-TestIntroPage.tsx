import { useNavigate } from 'react-router-dom'

export default function TestIntroPage() {
  const navigate = useNavigate()

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 py-12">
      <h1 className="text-[22px] font-bold text-gray-900">Test Intro</h1>
      <button
        type="button"
        onClick={() => navigate('/client/test-step1')}
        className="mt-8 rounded-xl bg-[#FF826E] px-8 py-3 font-bold text-white"
      >
        다음
      </button>
    </main>
  )
}
