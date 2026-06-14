export const SUPPORTED_LANGUAGES = ['ko', 'en', 'ja', 'zh'] as const

export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = 'ko'

export function isSupportedLanguage(value: string | undefined | null): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language)
}

export function normalizeLanguage(value: string | undefined | null): Language {
  return isSupportedLanguage(value) ? value : DEFAULT_LANGUAGE
}

export function stripLanguagePrefix(pathname: string): string {
  const parts = pathname.split('/')
  if (isSupportedLanguage(parts[1])) {
    const rest = `/${parts.slice(2).join('/')}`.replace(/\/+$/, '')
    return rest || '/'
  }
  return pathname || '/'
}

export function localizePath(path: string, language: Language): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const cleanPath = stripLanguagePrefix(normalizedPath)
  return cleanPath === '/' ? `/${language}` : `/${language}${cleanPath}`
}
