import {
  DEFAULT_GALLERY_TAB,
  normalizeGallerySort,
  useGalleryCountQuery,
  useGalleryInfiniteQuery,
} from '@/entities/nail-design/api/useGalleryInfiniteQuery';
import { useLanguageContext } from '@/contexts/LanguageContext';
import type { NailDesignRow } from '@/shared/types/database.types';
import { ChevronDown, ChevronLeft, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useNavigationType, useSearchParams } from 'react-router-dom';

const TEXTURE_LIST_TABS = ['전체', '💧 시럽', '☁️ 무광', '✨ 글리터', '🧲 자석', '🪞 미러파우더'] as const;
const SORT_OPTIONS = ['인기순', '최신순', '저장 많은 순'] as const;
const TEXTURE_LIST_SCROLL_Y_KEY = 'gelia_texture_list_scroll_y';
const TEXTURE_LIST_SCROLL_ITEMS_KEY = 'gelia_texture_list_scroll_items';
type SortValue = (typeof SORT_OPTIONS)[number];

const TEXTURE_TAB_LABEL_EN: Record<(typeof TEXTURE_LIST_TABS)[number], string> = {
  전체: 'All',
  '💧 시럽': '💧 Syrup',
  '☁️ 무광': '☁️ Matte',
  '✨ 글리터': '✨ Glitter',
  '🧲 자석': '🧲 Magnetic',
  '🪞 미러파우더': '🪞 Mirror Powder',
};

const SORT_LABEL_EN: Record<SortValue, string> = {
  인기순: 'Popular',
  최신순: 'Newest',
  '저장 많은 순': 'Most Saved',
};

function extractPureTextureKeyword(raw: string): string {
  return String(raw ?? '')
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveActiveTextureTab(rawTab: string | null): (typeof TEXTURE_LIST_TABS)[number] {
  const trimmed = rawTab?.trim();
  if (!trimmed || trimmed === DEFAULT_GALLERY_TAB) return '전체';
  const pure = extractPureTextureKeyword(trimmed);
  return TEXTURE_LIST_TABS.find((tab) => tab === trimmed || extractPureTextureKeyword(tab) === pure) ?? '전체';
}

function textureTabKeywordForQuery(tab: (typeof TEXTURE_LIST_TABS)[number]): string {
  if (tab === '전체') return DEFAULT_GALLERY_TAB;
  return extractPureTextureKeyword(tab);
}

function displayTextureTabLabel(tab: (typeof TEXTURE_LIST_TABS)[number], isEnglish: boolean): string {
  return isEnglish ? TEXTURE_TAB_LABEL_EN[tab] : tab;
}

function displaySortLabel(sort: SortValue, isEnglish: boolean): string {
  return isEnglish ? SORT_LABEL_EN[sort] : sort;
}

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? '').trim();
  const en = String(item.title_en ?? '').trim();
  if (isEnglish && en) return en;
  return ko || en || (isEnglish ? 'Nail Design' : '네일 디자인');
}

function isSortValue(value: string): value is SortValue {
  return (SORT_OPTIONS as readonly string[]).includes(value);
}

export default function TextureListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const { language } = useLanguageContext();
  const isEnglish = language === 'en';
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSortOpen, setIsSortOpen] = useState(false);
  const activeTabButtonRef = useRef<HTMLButtonElement | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const activeTab = useMemo(() => resolveActiveTextureTab(searchParams.get('tab')), [searchParams]);
  const customTitle = searchParams.get('title');
  const activeTabKeyword = textureTabKeywordForQuery(activeTab);
  const normalizedSort = normalizeGallerySort(searchParams.get('sort'));
  const sortType: SortValue = isSortValue(normalizedSort) ? normalizedSort : '인기순';

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGalleryInfiniteQuery(activeTabKeyword, sortType);

  const galleryItems = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data],
  );
  const { data: totalCount } = useGalleryCountQuery(activeTabKeyword);
  const totalCountLabel = totalCount == null ? '-' : totalCount.toLocaleString();

  const setActiveTab = useCallback(
    (tab: (typeof TEXTURE_LIST_TABS)[number]) => {
      const next = new URLSearchParams(searchParams);
      if (tab === '전체') {
        next.delete('tab');
      } else {
        next.set('tab', extractPureTextureKeyword(tab));
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setGallerySort = useCallback(
    (sort: SortValue) => {
      const next = new URLSearchParams(searchParams);
      if (sort === '인기순') {
        next.delete('sort');
      } else {
        next.set('sort', sort);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const saveListScrollPosition = useCallback(() => {
    try {
      sessionStorage.setItem(TEXTURE_LIST_SCROLL_Y_KEY, window.scrollY.toString());
      sessionStorage.setItem(TEXTURE_LIST_SCROLL_ITEMS_KEY, galleryItems.length.toString());
    } catch {
      // sessionStorage may be unavailable in private or restricted contexts.
    }
  }, [galleryItems.length]);

  useEffect(() => {
    const el = activeTabButtonRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeTab]);

  useEffect(() => {
    if (!isSortOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = sortMenuRef.current;
      if (!root || root.contains(event.target as Node)) return;
      setIsSortOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSortOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isSortOpen]);

  useEffect(() => {
    const target = observerRef.current;
    if (!target || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || isFetchingNextPage) return;
        void fetchNextPage();
      },
      { root: null, rootMargin: '200px', threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [activeTabKeyword, fetchNextPage, hasNextPage, isFetchingNextPage, sortType]);

  useEffect(() => {
    if (navigationType !== 'POP') return;

    const savedY = sessionStorage.getItem(TEXTURE_LIST_SCROLL_Y_KEY);
    if (!savedY) return;

    const savedItemsRaw = sessionStorage.getItem(TEXTURE_LIST_SCROLL_ITEMS_KEY);
    const savedItems = savedItemsRaw ? Number.parseInt(savedItemsRaw, 10) : 0;
    const hasEnoughItems =
      galleryItems.length > 0 &&
      (Number.isNaN(savedItems) || savedItems <= 0 || galleryItems.length >= savedItems);

    if (!hasEnoughItems && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
      return;
    }

    if (!hasEnoughItems) return;

    const y = Number.parseInt(savedY, 10);
    if (Number.isNaN(y)) return;

    const timer = window.setTimeout(() => {
      window.scrollTo(0, y);
      sessionStorage.removeItem(TEXTURE_LIST_SCROLL_Y_KEY);
      sessionStorage.removeItem(TEXTURE_LIST_SCROLL_ITEMS_KEY);
    }, 100);

    return () => window.clearTimeout(timer);
  }, [
    fetchNextPage,
    galleryItems.length,
    hasNextPage,
    isFetchingNextPage,
    location.pathname,
    location.search,
    navigationType,
  ]);

  return (
    <div className="relative min-h-screen w-full bg-white text-slate-900">
      {/* 상단 고정 영역 (헤더 + 탭 + 정렬) */}
      <div className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white shadow-sm">
        
        {/* 헤더 */}
        <header className="relative flex h-14 w-full items-center justify-between bg-white px-5">
          <button type="button" onClick={() => navigate(-1)} className="z-10 p-2 -ml-2">
            <ChevronLeft className="h-6 w-6 text-gray-900" />
          </button>
          <h1 className="absolute left-1/2 top-1/2 max-w-[72%] -translate-x-1/2 -translate-y-1/2 truncate text-center text-lg font-bold text-gray-900 whitespace-nowrap">
            {customTitle
              ? isEnglish && customTitle === '추천 갤러리'
                ? 'Recommended Gallery'
                : customTitle
              : isEnglish
                ? 'View by Texture'
                : '텍스처별 모아보기'}
          </h1>
          <button type="button" className="z-10 p-2 -mr-2" onClick={() => navigate('/search')}>
            <Search className="h-6 w-6 text-gray-900" />
          </button>
        </header>

        {/* 텍스처 서브 탭 (가로 스크롤) */}
        <section className="min-w-0 flex w-full overflow-x-auto whitespace-nowrap scrollbar-hide px-4 pb-2 pt-1 [&::-webkit-scrollbar]:hidden">
          {TEXTURE_LIST_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
            <button
              ref={isActive ? activeTabButtonRef : undefined}
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                isActive
                  ? "shrink-0 whitespace-nowrap rounded-full bg-[#FF7E67] px-4 py-1.5 text-sm font-medium text-white mr-2"
                  : "shrink-0 whitespace-nowrap rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600 mr-2"
              }
            >
              {displayTextureTabLabel(tab, isEnglish)}
            </button>
            );
          })}
          <div className="w-4 shrink-0" />
        </section>

        {/* 갯수 및 정렬 */}
        <div className="relative flex items-center justify-between px-4 pb-3 pt-2">
          <span className="text-sm text-gray-500">
            {isEnglish ? (
              <>Total <span className="font-bold text-pink-500">{totalCountLabel}</span> designs</>
            ) : (
              <>총 <span className="font-bold text-pink-500">{totalCountLabel}</span>개의 디자인</>
            )}
          </span>
          <div ref={sortMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors active:bg-gray-100"
              aria-haspopup="menu"
              aria-expanded={isSortOpen}
              aria-label="정렬"
            >
              <span>{displaySortLabel(sortType, isEnglish)}</span>
              <ChevronDown size={14} className="text-gray-500" />
            </button>
            {isSortOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-[60] min-w-[120px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setGallerySort(option);
                      setIsSortOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm ${
                      sortType === option
                        ? 'bg-gray-100 font-medium text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {displaySortLabel(option, isEnglish)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 메인 2열 그리드 리스트 */}
      <main className="grid grid-cols-2 gap-4 px-5 pb-8 pt-4">
        {isLoading ? (
          Array.from({ length: 8 }, (_, index) => (
            <article key={`texture-list-skel-${index}`} className="flex flex-col gap-2" aria-hidden>
              <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-black/5 animate-pulse" />
              <div className="mt-2 flex w-full flex-col gap-1 px-1">
                <div className="h-3.5 w-full rounded bg-gray-200 animate-pulse" />
                <div className="h-3.5 w-2/3 rounded bg-gray-200 animate-pulse" />
              </div>
            </article>
          ))
        ) : isError ? (
          <p className="col-span-2 py-12 text-center text-sm text-gray-500">
            {isEnglish ? 'Failed to load designs.' : '디자인을 불러오지 못했습니다.'}
          </p>
        ) : galleryItems.length === 0 ? (
          <p className="col-span-2 py-12 text-center text-sm text-gray-500">
            {isEnglish ? 'No nails registered yet.' : '등록된 네일이 없어요.'}
          </p>
        ) : (
          <>
        {galleryItems.map((item, index) => (
          <article key={item.id} className="flex flex-col gap-2 cursor-pointer">
            <Link
              to={`/detail/${item.id}`}
              state={{ initialNailData: { ...item, imageUrl: item.image_url, title: displayItemTitle(item, isEnglish) } }}
              onClick={saveListScrollPosition}
            >
            <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-black/5">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={displayItemTitle(item, isEnglish)}
                  className="h-full w-full object-cover object-center"
                  loading={index < 4 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={index < 4 ? 'high' : undefined}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('animate-pulse', 'bg-gray-100');
                  }}
                />
              ) : null}
            </div>
            <div className="mt-2 flex w-full flex-col items-center justify-center px-1">
              <p className="line-clamp-2 w-full text-center text-sm font-medium tracking-tight text-gray-800">
                {displayItemTitle(item, isEnglish)}
              </p>
            </div>
            </Link>
          </article>
        ))}
        {isFetchingNextPage
          ? [0, 1].map((index) => (
              <article key={`texture-list-next-skel-${index}`} className="flex flex-col gap-2" aria-hidden>
                <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-black/5 animate-pulse" />
                <div className="mt-2 flex w-full flex-col gap-1 px-1">
                  <div className="h-3.5 w-full rounded bg-gray-200 animate-pulse" />
                  <div className="h-3.5 w-2/3 rounded bg-gray-200 animate-pulse" />
                </div>
              </article>
            ))
          : null}
          </>
        )}
      </main>
      <div ref={observerRef} className="h-10 px-4 pb-4" aria-hidden />
    </div>
  );
}
