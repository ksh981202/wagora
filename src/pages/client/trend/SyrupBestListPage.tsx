import {
  DEFAULT_GALLERY_SORT,
  normalizeGallerySort,
  useGalleryCountQuery,
  useGalleryInfiniteQuery,
} from '@/entities/nail-design/api/useGalleryInfiniteQuery';
import { useLanguageContext } from '@/contexts/LanguageContext';
import type { NailDesignRow } from '@/shared/types/database.types';
import { ChevronDown, ChevronLeft, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SYRUP_BEST_TABS = ['전체', '🤍 누드/여리', '🍑 과즙/생기', '🧊 얼음/물방울', '✨ 시럽그라데이션', '💎 포인트/파츠'] as const;
const SORT_OPTIONS = ['인기순', '최신순', '저장 많은 순'] as const;
type SortValue = (typeof SORT_OPTIONS)[number];

const SYRUP_BEST_TAB_LABEL_EN: Record<(typeof SYRUP_BEST_TABS)[number], string> = {
  전체: 'All',
  '🤍 누드/여리': '🤍 Nude/Delicate',
  '🍑 과즙/생기': '🍑 Juicy/Lively',
  '🧊 얼음/물방울': '🧊 Ice/Waterdrop',
  '✨ 시럽그라데이션': '✨ Syrup Gradient',
  '💎 포인트/파츠': '💎 Point/Parts',
};

const SORT_LABEL_EN: Record<SortValue, string> = {
  인기순: 'Popular',
  최신순: 'Newest',
  '저장 많은 순': 'Most Saved',
};

const SYRUP_KEYWORD_MAPPING: Record<string, string> = {
  전체: '시럽',
  '누드/여리': '누드 여리 여리여리 시럽 청순 베이지 스킨',
  '과즙/생기': '과즙 생기 피치 코랄 핑크 젤리 상큼',
  '얼음/물방울': '얼음 물방울 투명 물광 클리어 맑은',
  시럽그라데이션: '시럽 그라데이션 옴브레 치크 투톤 번짐',
  '포인트/파츠': '포인트 파츠 스와로브스키 스톤 큐빅 덩어리 생화',
};

function extractPureSyrupKeyword(raw: string): string {
  return String(raw ?? '')
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSyrupMappingKey(raw: string): string {
  return String(raw ?? '')
    .replace(/^[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9]+/, '')
    .trim();
}

function resolveActiveSyrupTab(rawTab: string | null): (typeof SYRUP_BEST_TABS)[number] {
  const trimmed = rawTab?.trim();
  if (!trimmed || trimmed === '전체') return '전체';
  const pure = extractPureSyrupKeyword(trimmed);
  return SYRUP_BEST_TABS.find((tab) => tab === trimmed || extractPureSyrupKeyword(tab) === pure) ?? '전체';
}

function syrupTabKeywordForQuery(tab: (typeof SYRUP_BEST_TABS)[number]): string {
  const mappingKey = extractSyrupMappingKey(tab);
  return SYRUP_KEYWORD_MAPPING[mappingKey] ?? extractPureSyrupKeyword(tab);
}

function displaySyrupBestTabLabel(tab: (typeof SYRUP_BEST_TABS)[number], isEnglish: boolean): string {
  return isEnglish ? SYRUP_BEST_TAB_LABEL_EN[tab] : tab;
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

export default function SyrupBestListPage() {
  const navigate = useNavigate();
  const { language } = useLanguageContext();
  const isEnglish = language === 'en';
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSortOpen, setIsSortOpen] = useState(false);
  const activeTabButtonRef = useRef<HTMLButtonElement | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const activeTab = useMemo(() => resolveActiveSyrupTab(searchParams.get('tab')), [searchParams]);
  const activeTabKeyword = syrupTabKeywordForQuery(activeTab);
  const normalizedSort = normalizeGallerySort(searchParams.get('sort'));
  const sortType: SortValue = isSortValue(normalizedSort) ? normalizedSort : DEFAULT_GALLERY_SORT;

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGalleryInfiniteQuery(activeTabKeyword, sortType);
  const { data: totalCount } = useGalleryCountQuery(activeTabKeyword);

  const galleryItems = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data],
  );
  const totalCountLabel = totalCount == null ? '-' : totalCount.toLocaleString();

  const setActiveTab = useCallback(
    (tab: (typeof SYRUP_BEST_TABS)[number]) => {
      const next = new URLSearchParams(searchParams);
      if (tab === '전체') {
        next.delete('tab');
      } else {
        next.set('tab', extractPureSyrupKeyword(tab));
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setGallerySort = useCallback(
    (sort: SortValue) => {
      const next = new URLSearchParams(searchParams);
      if (sort === DEFAULT_GALLERY_SORT) {
        next.delete('sort');
      } else {
        next.set('sort', sort);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

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

  const openDetail = useCallback(
    (item: NailDesignRow) => {
      navigate(`/detail/${item.id}`, {
        state: { initialNailData: { ...item, imageUrl: item.image_url, title: displayItemTitle(item, isEnglish) } },
      });
    },
    [isEnglish, navigate],
  );

  return (
    <div className="relative min-h-screen w-full bg-white text-slate-900">
      {/* 상단 고정 영역 */}
      <div className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white shadow-sm">
        {/* 헤더 */}
        <header className="relative flex h-14 w-full items-center justify-between bg-white px-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="z-10 p-2 -ml-2 transition-colors hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="h-6 w-6 text-gray-900" />
          </button>
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-gray-900 whitespace-nowrap">
            {isEnglish ? 'Hottest Syrup BEST' : '지금 가장 핫한 시럽 BEST'}
          </h1>
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="z-10 p-2 -mr-2 transition-colors hover:bg-gray-100 rounded-full"
          >
            <Search className="h-6 w-6 text-gray-900" />
          </button>
        </header>

        {/* 시럽 BEST 서브 탭 (가로 스크롤) */}
        <section className="min-w-0 flex w-full overflow-x-auto whitespace-nowrap scrollbar-hide px-4 pb-2 pt-1 [&::-webkit-scrollbar]:hidden">
          {SYRUP_BEST_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                ref={isActive ? activeTabButtonRef : undefined}
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={
                  isActive
                    ? 'mr-2 shrink-0 whitespace-nowrap rounded-full bg-[#ff765e] px-4 py-1.5 text-sm font-medium text-white'
                    : 'mr-2 shrink-0 whitespace-nowrap rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600'
                }
              >
                {displaySyrupBestTabLabel(tab, isEnglish)}
              </button>
            );
          })}
          <div className="w-4 shrink-0" />
        </section>

        {/* 갯수 및 정렬 바 */}
        <div className="relative flex items-center justify-between px-4 pb-3 pt-2">
          <span className="text-sm text-gray-500">
            {isEnglish ? (
              <>Total <span className="font-bold text-[#ff765e]">{totalCountLabel}</span> designs</>
            ) : (
              <>총 <span className="font-bold text-[#ff765e]">{totalCountLabel}</span>개의 디자인</>
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

      {/* 메인 2열 그리드 */}
      <main className="grid grid-cols-2 gap-4 px-5 pb-8 pt-4">
        {isLoading ? (
          Array.from({ length: 8 }, (_, index) => (
            <article key={`syrup-best-skel-${index}`} className="flex flex-col gap-2" aria-hidden>
              <div className="aspect-[3/4] w-full animate-pulse overflow-hidden rounded-xl border border-black/5 bg-gray-100 shadow-sm" />
              <div className="mx-auto h-4 w-3/4 animate-pulse rounded bg-gray-100" />
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
              <article key={item.id} className="flex cursor-pointer flex-col gap-2">
                <button type="button" onClick={() => openDetail(item)} className="w-full text-left">
                  <div className="aspect-[3/4] w-full overflow-hidden rounded-xl border border-black/5 bg-gray-100 shadow-sm">
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
                </button>
              </article>
            ))}
            {isFetchingNextPage
              ? [0, 1].map((index) => (
                  <article key={`syrup-best-next-skel-${index}`} className="flex flex-col gap-2" aria-hidden>
                    <div className="aspect-[3/4] w-full animate-pulse overflow-hidden rounded-xl border border-black/5 bg-gray-100 shadow-sm" />
                    <div className="mx-auto h-4 w-3/4 animate-pulse rounded bg-gray-100" />
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
