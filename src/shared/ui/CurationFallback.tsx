type CurationFallbackProps = {
  isEnglish: boolean
}

export function CurationFallback({ isEnglish }: CurationFallbackProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl border border-gray-100 bg-gray-50 p-6 text-center">
      <span className="mb-2 text-2xl">💅</span>
      <p className="text-sm font-medium text-gray-500">
        {isEnglish ? 'Preparing new nail designs!' : '새로운 네일을 준비 중이에요!'}
      </p>
      <p className="mt-1 text-xs text-gray-400">
        {isEnglish ? 'Check out the BEST styles below' : '아래에서 인기 BEST 네일을 확인해보세요'}
      </p>
    </div>
  )
}
