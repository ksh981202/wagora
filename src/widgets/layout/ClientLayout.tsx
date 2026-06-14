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
    pathname.startsWith('/test') ||
    pathname.includes('/detail/') ||
    pathname === '/category' ||
    pathname === '/search' ||
    pathname.startsWith('/gallery') ||
    pathname === '/my' ||
    pathname.startsWith('/my/list') ||
    pathname === '/notifications' ||
    pathname === '/notification-list' ||
    pathname === '/support' ||
    pathname === '/faq' ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname === '/notice' ||
    pathname === '/account' ||
    pathname === '/recommend' ||
    pathname === '/color-curation' ||
    pathname === '/color-list' ||
    pathname === '/color-theme-list' ||
    pathname === '/color-popular-list' ||
    pathname === '/theme' ||
    pathname === '/season-curation' ||
    pathname === '/season-list' ||
    pathname === '/vacation-list' ||
    pathname === '/season-popular-list' ||
    pathname === '/style-curation' ||
    pathname === '/style-list' ||
    pathname === '/style-best-list' ||
    pathname === '/style-gallery-list' ||
    pathname === '/theme-list' ||
    pathname === '/situation-list' ||
    pathname === '/today-special' ||
    pathname === '/popular-design' ||
    pathname === '/period-best-list' ||
    pathname === '/reaction-best-list' ||
    pathname === '/shape-best-list' ||
    pathname === '/search-trend-list' ||
    pathname === '/trend' ||
    pathname === '/magazine' ||
    pathname.startsWith('/magazine/') ||
    pathname === '/texture' ||
    pathname === '/texture-list' ||
    pathname === '/syrup-best' ||
    pathname === '/parts' ||
    pathname === '/parts-list' ||
    pathname === '/stone-best-list' ||
    pathname === '/marble-best-list' ||
    pathname === '/popular-art-list' ||
    pathname === '/chic-best-list' ||
    pathname === '/full-parts-list' ||
    pathname === '/art' ||
    pathname === '/pattern' ||
    pathname === '/pattern-list' ||
    pathname === '/mood-list' ||
    pathname === '/popular-mood-list' ||
    pathname === '/mood'

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
            onClick={() => navigate('/')}
          >
            WAGORA
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageToggle compact />
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary sm:h-10 sm:w-10"
              onClick={() => navigate('/search')}
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
              onClick={() => navigate('/my')}
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
            to="/"
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
            to="/gallery"
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
            to="/test-intro"
            className={centerBottomNavLinkClass}
            aria-label={isEnglish ? 'Fit Finder tab' : '핏 파인더 탭'}
          >
            <span className="-mt-5 mb-0.5 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white bg-[#17130f] text-white shadow-[0_10px_24px_rgba(23,19,15,0.28)]">
              <PawPrint className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="text-[9px] font-bold leading-none sm:text-[10px]">{isEnglish ? 'Fit Finder' : '핏 파인더'}</span>
          </NavLink>
          <NavLink
            to="/magazine"
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
            to="/my"
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
