import { BookOpen, Compass, Home, PawPrint, Search, Settings, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useNavigationType,
} from 'react-router-dom'
import { LanguageProvider, useLanguageContext } from '@/contexts/LanguageContext'
import LanguageToggle from '@/components/LanguageToggle'
import { supabase } from '@/shared/api/supabaseClient'
import { localizePath, stripLanguagePrefix } from '@/shared/language/localizedRouting'

const bottomNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'm-0 flex h-full w-full min-w-0 cursor-pointer appearance-none flex-col items-center justify-center gap-0.5 border-0 bg-transparent px-1 pt-1 pb-1.5 [-webkit-tap-highlight-color:transparent]',
    isActive ? 'text-[#9b6d45]' : 'text-gray-400',
  ].join(' ')

const centerBottomNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'm-0 flex h-full w-full min-w-0 cursor-pointer appearance-none flex-col items-center justify-center gap-0.5 border-0 bg-transparent px-1 pb-1.5 pt-0 [-webkit-tap-highlight-color:transparent]',
    isActive ? 'text-[#9b6d45]' : 'text-gray-500',
  ].join(' ')

export default function ClientLayout() {
  return (
    <LanguageProvider>
      <ClientLayoutContent />
    </LanguageProvider>
  )
}

function ClientLayoutContent() {
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const [isAdminUser, setIsAdminUser] = useState(false)
  const routePathname = stripLanguagePrefix(pathname)
  const toLocalizedPath = (path: string) => localizePath(path, language)

  useEffect(() => {
    if (navigationType === 'POP') return
    window.scrollTo(0, 0)
  }, [pathname, navigationType])

  useEffect(() => {
    let cancelled = false

    const applyAdminEmail = (email: string | undefined) => {
      if (!cancelled) setIsAdminUser(email?.trim().toLowerCase() === 'k981202@naver.com')
    }

    void supabase.auth.getUser().then(({ data }) => {
      applyAdminEmail(data.user?.email)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applyAdminEmail(session?.user?.email)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const hideTopHeader =
    routePathname.startsWith('/test') ||
    routePathname.includes('/detail/') ||
    routePathname === '/category' ||
    routePathname === '/search' ||
    routePathname.startsWith('/gallery') ||
    routePathname === '/my' ||
    routePathname.startsWith('/my/list') ||
    routePathname === '/notifications' ||
    routePathname === '/notification-list' ||
    routePathname === '/support' ||
    routePathname === '/faq' ||
    routePathname === '/terms' ||
    routePathname === '/privacy' ||
    routePathname === '/notice' ||
    routePathname === '/account' ||
    routePathname === '/recommend' ||
    routePathname === '/color-curation' ||
    routePathname === '/color-list' ||
    routePathname === '/color-theme-list' ||
    routePathname === '/color-popular-list' ||
    routePathname === '/theme' ||
    routePathname === '/season-curation' ||
    routePathname === '/season-list' ||
    routePathname === '/vacation-list' ||
    routePathname === '/season-popular-list' ||
    routePathname === '/style-curation' ||
    routePathname === '/style-list' ||
    routePathname === '/style-best-list' ||
    routePathname === '/style-gallery-list' ||
    routePathname === '/theme-list' ||
    routePathname === '/situation-list' ||
    routePathname === '/today-special' ||
    routePathname === '/popular-design' ||
    routePathname === '/period-best-list' ||
    routePathname === '/reaction-best-list' ||
    routePathname === '/shape-best-list' ||
    routePathname === '/search-trend-list' ||
    routePathname === '/trend' ||
    routePathname === '/magazine' ||
    routePathname.startsWith('/magazine/') ||
    routePathname === '/texture' ||
    routePathname === '/texture-list' ||
    routePathname === '/syrup-best' ||
    routePathname === '/parts' ||
    routePathname === '/parts-list' ||
    routePathname === '/stone-best-list' ||
    routePathname === '/marble-best-list' ||
    routePathname === '/popular-art-list' ||
    routePathname === '/chic-best-list' ||
    routePathname === '/full-parts-list' ||
    routePathname === '/art' ||
    routePathname === '/pattern' ||
    routePathname === '/pattern-list' ||
    routePathname === '/mood-list' ||
    routePathname === '/popular-mood-list' ||
    routePathname === '/mood'

  const hideBottomNav = false

  const mainPbClass = hideBottomNav
    ? 'pb-[env(safe-area-inset-bottom,0px)]'
    : 'pb-[calc(4rem+env(safe-area-inset-bottom,0px))]'

  return (
    <div className="min-h-[100dvh] overflow-clip bg-white">
      <div className="relative mx-auto min-h-[100dvh] w-full max-w-md">
        {!hideTopHeader && (
        <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between bg-white/85 px-5 backdrop-blur-xl">
          <h1
            className="shrink-0 cursor-pointer whitespace-nowrap font-serif text-[27px] font-semibold tracking-[0.18em] text-gray-950 sm:text-[29px]"
            style={{ fontFamily: "'Playfair Display', 'Times New Roman', serif" }}
            onClick={() => navigate(toLocalizedPath('/'))}
          >
            WAGORA
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageToggle compact />
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary sm:h-10 sm:w-10"
              onClick={() => navigate(toLocalizedPath('/search'))}
              aria-label="검색"
            >
              <Search size={18} className="text-foreground" />
            </button>
            {isAdminUser && import.meta.env.DEV ? (
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition-opacity hover:opacity-90 sm:h-10 sm:w-10"
                onClick={() => navigate('/admin')}
                aria-label="관리자 페이지"
              >
                <Settings size={18} className="text-foreground" strokeWidth={2} />
              </button>
            ) : null}
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary sm:h-10 sm:w-10"
              onClick={() => navigate(toLocalizedPath('/my'))}
              aria-label="마이페이지"
            >
              <User size={18} className="text-foreground" />
            </button>
          </div>
        </header>
        )}

        <main className={`flex min-h-0 flex-1 flex-col ${mainPbClass}`}>
          <Outlet />
        </main>

        {!hideBottomNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 mx-auto grid h-[60px] w-full max-w-md grid-cols-5 border-t border-gray-100 bg-white pb-safe"
          aria-label="하단 탭"
        >
          <NavLink
            to={toLocalizedPath('/')}
            end
            className={bottomNavLinkClass}
            aria-label={isEnglish ? 'Home tab' : '홈 탭'}
          >
            <Home
              className="h-6 w-6 shrink-0"
              strokeWidth={2.5}
              aria-hidden
            />
            <span className="text-[9px] font-medium leading-none sm:text-[10px]">{isEnglish ? 'Home' : '홈'}</span>
          </NavLink>
          <NavLink
            to={toLocalizedPath('/gallery')}
            className={bottomNavLinkClass}
            aria-label={isEnglish ? 'Discover tab' : '디스커버 탭'}
          >
            <Compass
              className="h-6 w-6 shrink-0"
              strokeWidth={2.5}
              aria-hidden
            />
            <span className="text-[9px] font-medium leading-none sm:text-[10px]">{isEnglish ? 'Discover' : '디스커버'}</span>
          </NavLink>
          <NavLink
            to={toLocalizedPath('/test-intro')}
            className={centerBottomNavLinkClass}
            aria-label={isEnglish ? 'Fit Finder tab' : '핏 파인더 탭'}
          >
            <span className="-mt-5 mb-0.5 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white bg-[#17130f] text-white shadow-[0_10px_24px_rgba(23,19,15,0.28)]">
              <PawPrint className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="text-[9px] font-bold leading-none sm:text-[10px]">{isEnglish ? 'Fit Finder' : '핏 파인더'}</span>
          </NavLink>
          <NavLink
            to={toLocalizedPath('/magazine')}
            className={bottomNavLinkClass}
            aria-label={isEnglish ? 'Magazine tab' : '매거진 탭'}
          >
            <BookOpen
              className="h-6 w-6 shrink-0"
              strokeWidth={2.5}
              aria-hidden
            />
            <span className="text-[9px] font-medium leading-none sm:text-[10px]">{isEnglish ? 'Magazine' : '매거진'}</span>
          </NavLink>
          <NavLink
            to={toLocalizedPath('/my')}
            className={bottomNavLinkClass}
            aria-label={isEnglish ? 'My tab' : '마이 탭'}
          >
            <User
              className="h-6 w-6 shrink-0"
              strokeWidth={2.5}
              aria-hidden
            />
            <span className="text-[9px] font-medium leading-none sm:text-[10px]">{isEnglish ? 'My' : '마이'}</span>
          </NavLink>
        </nav>
        )}
      </div>
    </div>
  )
}
