import fs from 'fs'

const content = `import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/api/supabaseClient'

function InfoRow({
  label,
  value,
  valueClassName = 'text-[14px] text-gray-500',
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4 last:border-b-0">
      <span className="text-[15px] font-medium text-gray-900">{label}</span>
      <span className={\`max-w-[58%] truncate text-right \${valueClassName}\`}>{value}</span>
    </div>
  )
}

function ActionRow({
  label,
  labelClassName = 'text-[15px] font-medium text-gray-900',
  onClick,
}: {
  label: string
  labelClassName?: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-gray-50 px-5 py-4 text-left last:border-b-0 active:bg-gray-50"
    >
      <span className={labelClassName}>{label}</span>
      <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" strokeWidth={2} aria-hidden />
    </button>
  )
}

export default function ClientAccountSettingsPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (cancelled) return
        if (error) return
        setEmail(data.user?.email?.trim() ?? '')
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      /* ignore */
    }
    navigate('/client', { replace: true })
  }, [navigate])

  return (
    <motionless className="min-h-screen w-full bg-gray-50">
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
          계정 관리
        </h1>
      </header>

      <main className="w-full px-5 pb-10 pt-14">
        <section className="mb-6">
          <h2 className="mb-2 text-[12px] font-medium text-gray-500">로그인 정보</h2>
          <motionless className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <InfoRow label="연결된 계정" value="이메일" />
            <InfoRow
              label="이메일"
              value={email || '로그인된 이메일이 없어요'}
              valueClassName="text-[14px] font-medium text-gray-800"
            />
          </motionless>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-[12px] font-medium text-gray-500">계정 정보</h2>
          <motionless className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <ActionRow label="로그아웃" onClick={() => void handleLogout()} />
            <ActionRow label="회원탈퇴" labelClassName="text-[15px] font-medium text-rose-500" />
          </motionless>
        </section>

        <section>
          <h2 className="mb-2 text-[12px] font-medium text-gray-500">보안</h2>
          <motionless className="rounded-2xl border border-gray-100 bg-white p-4">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] font-semibold text-gray-800 transition-colors active:bg-gray-50"
            >
              <span aria-hidden>🔒</span>
              <span>비밀번호 변경</span>
            </button>
          </motionless>
        </section>
      </main>
    </motionless>
  )
}
`

fs.writeFileSync(
  'src/pages/client/ClientAccountSettingsPage.tsx',
  content.replace(/motionless/g, 'div'),
  'utf8',
)
