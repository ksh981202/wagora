import fs from 'fs'

const content = `import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type ToggleProps = {
  enabled: boolean
  onChange: (next: boolean) => void
  label: string
}

function NotificationToggle({ enabled, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={\`relative h-[28px] w-[48px] shrink-0 rounded-full transition-colors duration-200 ease-out \${
        enabled ? 'bg-[#FF7D66]' : 'bg-gray-200'
      }\`}
    >
      <span
        className={\`pointer-events-none absolute top-[2px] left-[2px] h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] transition-transform duration-200 ease-out \${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }\`}
      />
    </button>
  )
}

type NotificationRowProps = {
  title: string
  description: string
  enabled: boolean
  onChange: (next: boolean) => void
}

function NotificationRow({ title, description, enabled, onChange }: NotificationRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 bg-white px-5 py-4">
      <div className="min-w-0 flex-1 pr-4">
        <p className="text-[15px] font-medium text-gray-900">{title}</p>
        <p className="mt-1 text-[12px] text-gray-500">{description}</p>
      </motionless>
      <NotificationToggle enabled={enabled} onChange={onChange} label={title} />
    </motionless>
  )
}

export default function ClientNotificationSettingsPage() {
  const navigate = useNavigate()

  const [customRecommend, setCustomRecommend] = useState(true)
  const [weeklyTrend, setWeeklyTrend] = useState(true)
  const [eventPromo, setEventPromo] = useState(false)
  const [nightQuiet, setNightQuiet] = useState(true)

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
          &lt; 알림 설정
        </h1>
      </header>

      <main className="w-full pb-10 pt-14">
        <section className="w-full">
          <h2 className="w-full bg-gray-50 px-5 py-2.5 text-[12px] font-medium text-gray-500">
            서비스 알림
          </h2>
          <NotificationRow
            title="맞춤 네일 추천 알림"
            description="내 취향에 맞는 새로운 네일 디자인이 올라오면 알려드려요"
            enabled={customRecommend}
            onChange={setCustomRecommend}
          />
          <NotificationRow
            title="주간 트렌드 업데이트"
            description="매주 핫한 트렌드 네일 결산 알림"
            enabled={weeklyTrend}
            onChange={setWeeklyTrend}
          />
        </section>

        <section className="w-full">
          <h2 className="w-full bg-gray-50 px-5 py-2.5 text-[12px] font-medium text-gray-500">
            혜택 및 이벤트 알림
          </h2>
          <NotificationRow
            title="이벤트 및 프로모션 알림"
            description="다양한 이벤트와 혜택 소식을 전해드려요"
            enabled={eventPromo}
            onChange={setEventPromo}
          />
          <NotificationRow
            title="야간 방해 금지"
            description="21:00 ~ 08:00 동안에는 마케팅 알림을 받지 않아요"
            enabled={nightQuiet}
            onChange={setNightQuiet}
          />
        </section>
      </main>
    </motionless>
  )
}
`

fs.writeFileSync(
  'src/pages/client/ClientNotificationSettingsPage.tsx',
  content.replace(/motionless/g, 'motionless').replace(/motionless/g, 'div'),
  'utf8',
)
