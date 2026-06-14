import { useLanguageContext } from '@/contexts/LanguageContext'

export default function BrandPickTab() {
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'

  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center px-5 text-center text-gray-500">
      <p className="text-sm font-medium leading-7">
        {isEnglish
          ? "GELIA's curated premium brand collection will be revealed soon ✨"
          : 'GELIA가 엄선한 프리미엄 브랜드 컬렉션이 곧 공개됩니다 ✨'}
      </p>
    </section>
  )
}
