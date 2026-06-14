import { useLanguageContext } from '@/contexts/LanguageContext'

export default function ShoppingTab() {
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'

  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center px-5 text-center text-gray-500">
      <p className="text-sm font-medium leading-7">
        {isEnglish
          ? 'Premium nail items verified by our senior editor, Coming Soon! 🛍️'
          : '수석 에디터가 깐깐하게 검증한 프리미엄 네일 아이템 스토어, Coming Soon! 🛍️'}
      </p>
    </section>
  )
}
