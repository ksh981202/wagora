import { useLanguageContext } from '@/contexts/LanguageContext'
import { supabase } from '@/shared/api/supabaseClient'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function getAuthErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown Error'
}

export default function ClientUpdatePasswordPage() {
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (newPassword.length < 6) {
      setErrorMsg(isEnglish ? 'Password must be at least 6 characters.' : '비밀번호는 6자리 이상 입력해 주세요.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(isEnglish ? 'Passwords do not match.' : '비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      alert(isEnglish ? 'Password has been changed.' : '비밀번호가 변경되었습니다.')
      navigate('/my', { replace: true })
    } catch (error) {
      const message = getAuthErrorMessage(error)
      setErrorMsg(message || (isEnglish ? 'Failed to change password.' : '비밀번호 변경에 실패했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 font-sans tracking-tight">
      <div className="absolute left-4 top-4 w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="rounded-full p-2 text-gray-600 transition-colors hover:text-gray-900"
          aria-label={isEnglish ? 'Go to login' : '로그인으로 이동'}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="mb-12 flex justify-center">
          <div className="relative">
            <div className="absolute -right-4 -top-4 z-0 h-40 w-40 rounded-full bg-[#F5EBE4] sm:h-48 sm:w-48" />
            <div className="relative z-10 h-40 w-40 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg sm:h-48 sm:w-48">
              <img
                src="/quiz/intro-main.jpg"
                alt={isEnglish ? 'Nail thumbnail' : '네일 썸네일'}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = 'https://via.placeholder.com/200?text=Gelia'
                }}
              />
            </div>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h2 className="mb-2 text-[24px] font-bold text-gray-900">
            {isEnglish ? 'Set a New Password' : '새 비밀번호 설정'}
          </h2>
          <p className="text-[14px] text-gray-500">
            {isEnglish ? 'Enter a new password for your Gelia account.' : '젤리아 계정에 사용할 새 비밀번호를 입력해 주세요.'}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-8 shadow-sm sm:px-8">
          <div className="min-h-[72px] w-full">
            {errorMsg ? (
              <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-center text-[13px] font-medium text-red-600">
                {errorMsg}
              </div>
            ) : null}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                {isEnglish ? 'New Password' : '새 비밀번호'}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value)
                  if (errorMsg) setErrorMsg('')
                }}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] outline-none transition-colors focus:border-[#FF6B00] focus:bg-white focus:ring-1 focus:ring-[#FF6B00] disabled:bg-gray-50"
                placeholder={isEnglish ? 'Enter at least 6 characters' : '6자리 이상 입력해주세요'}
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                {isEnglish ? 'Confirm New Password' : '새 비밀번호 확인'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  if (errorMsg) setErrorMsg('')
                }}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] outline-none transition-colors focus:border-[#FF6B00] focus:bg-white focus:ring-1 focus:ring-[#FF6B00] disabled:bg-gray-50"
                placeholder={isEnglish ? 'Re-enter your new password' : '새 비밀번호를 한 번 더 입력해주세요'}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#FF6B00] px-4 py-3.5 text-[15px] font-bold text-white shadow-md transition-colors hover:bg-[#E66000] disabled:bg-gray-300"
            >
              {loading ? (isEnglish ? 'Changing...' : '변경 중...') : (isEnglish ? 'Change Password' : '변경하기')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
