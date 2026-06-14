import { useLanguageContext } from '@/contexts/LanguageContext'
import { ChevronLeft, ChevronRight, Mail } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

function ActionRow({
  label,
  onClick,
  trailing,
}: {
  label: string
  onClick?: () => void
  trailing?: ReactNode
}) {
  const className =
    'flex w-full items-center justify-between border-b border-gray-50 px-5 py-4 text-left last:border-b-0 active:bg-gray-50'

  if (!onClick) {
    return (
      <div className={className}>
        <span className="text-[15px] font-medium text-gray-900">{label}</span>
        {trailing}
      </div>
    )
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <span className="text-[15px] font-medium text-gray-900">{label}</span>
      {trailing ?? <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" strokeWidth={2} aria-hidden />}
    </button>
  )
}

export default function ClientSupportPage() {
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'
  const navigate = useNavigate()
  const [showToast, setShowToast] = useState(false)

  const handleEmailCopy = async () => {
    try {
      await navigator.clipboard.writeText("k981202@naver.com")
      setShowToast(true)
      setTimeout(() => {
        setShowToast(false)
      }, 2500)
    } catch (error) {
      console.error("클립보드 복사 실패:", error)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
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
          {isEnglish ? 'Customer Service' : '고객센터'}
        </h1>
      </header>

      <main className="w-full pb-10 pt-14">
        <section className="px-5 pb-8 pt-6">
          <h2 className="text-[20px] font-bold text-gray-900">
            {isEnglish ? 'How can we help you?' : '무엇을 도와드릴까요?'}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-gray-500">
            {isEnglish
              ? 'Please email us your inquiries and we will respond quickly.'
              : '문의 사항은 이메일로 보내주시면 빠르게 답변드릴게요.'}
          </p>
          <button
            type="button"
            onClick={handleEmailCopy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] font-semibold text-gray-800 shadow-sm transition-colors active:bg-gray-50"
          >
            <Mail className="h-5 w-5 text-[#FF7D66]" strokeWidth={2} aria-hidden />
            <span>{isEnglish ? 'Contact via Email' : '이메일로 문의하기'}</span>
          </button>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white mx-5">
          <ActionRow label={isEnglish ? 'Notice' : '공지사항'} onClick={() => navigate('/notice')} />
          <ActionRow label={isEnglish ? 'FAQ' : '자주 묻는 질문 (FAQ)'} onClick={() => navigate('/faq')} />
          <ActionRow label={isEnglish ? 'Terms of Service' : '서비스 이용약관'} onClick={() => navigate('/terms')} />
          <ActionRow label={isEnglish ? 'Privacy Policy' : '개인정보 처리방침'} onClick={() => navigate('/privacy')} />
          <ActionRow
            label={isEnglish ? 'App Version' : '앱 버전'}
            trailing={
              <span className="text-[14px] font-semibold text-rose-500">
                1.0.0 {isEnglish ? '(Latest)' : '(최신)'}
              </span>
            }
          />
        </section>
      </main>

      {showToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-xl bg-gray-800/95 px-5 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-sm">
          {isEnglish ? "Email address copied." : "이메일 주소가 복사되었습니다."}
        </div>
      )}
    </div>
  )
}
