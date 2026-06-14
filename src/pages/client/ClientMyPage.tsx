import { useLanguageContext } from '@/contexts/LanguageContext'
import { useCurrentUserId } from '@/features/my-page/useCurrentUserId'
import { supabase } from '@/shared/api/supabaseClient'
import type { NailDesignRow } from '@/shared/types/database.types'
import { useQuery } from '@tanstack/react-query'
import { Bell, Bookmark, Camera, Heart, X } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'

type ActiveTab = 'recent' | 'liked' | 'saved'
type UserActivityTable = 'user_recent_views' | 'user_likes' | 'user_saves'

const GALLERY_PREVIEW_LIMIT = 4

const tabLabels: Record<ActiveTab, { ko: string; en: string }> = {
  recent: { ko: '최근 본 디자인', en: 'Recently Viewed' },
  liked: { ko: '좋아요 한 네일', en: 'Liked Nails' },
  saved: { ko: '저장한 네일', en: 'Saved Nails' },
}

const ACTIVITY_TABLE_BY_TAB: Record<ActiveTab, { table: UserActivityTable; orderColumn: string }> = {
  recent: { table: 'user_recent_views', orderColumn: 'viewed_at' },
  liked: { table: 'user_likes', orderColumn: 'created_at' },
  saved: { table: 'user_saves', orderColumn: 'created_at' },
}

const MY_PAGE_NAIL_COLUMNS = 'id,title,title_en,image_url'

async function fetchActivityCount(table: UserActivityTable, userId: string | null): Promise<number> {
  if (!userId) return 0

  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) throw error
  return count ?? 0
}

async function fetchActivityPreview(tab: ActiveTab, userId: string | null): Promise<NailDesignRow[]> {
  if (!userId) return []

  const { table, orderColumn } = ACTIVITY_TABLE_BY_TAB[tab]
  const { data: activityRows, error: activityError } = await supabase
    .from(table)
    .select('nail_id')
    .eq('user_id', userId)
    .order(orderColumn, { ascending: false })
    .limit(GALLERY_PREVIEW_LIMIT)

  if (activityError) throw activityError

  const nailIds =
    activityRows
      ?.map((row) => String((row as { nail_id?: unknown }).nail_id ?? '').trim())
      .filter(Boolean) ?? []

  if (nailIds.length === 0) return []

  const { data: nailRows, error: nailError } = await supabase
    .from('wagora_lookbooks')
    .select(MY_PAGE_NAIL_COLUMNS)
    .in('id', nailIds)

  if (nailError) throw nailError

  const byId = new Map<string, NailDesignRow>()
  for (const row of nailRows ?? []) {
    const id = String(row.id ?? '').trim()
    if (id) byId.set(id, row as NailDesignRow)
  }

  return nailIds
    .map((id) => byId.get(id))
    .filter((row): row is NailDesignRow => Boolean(row))
}

export default function ClientMyPage() {
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'
  const navigate = useNavigate()
  const currentUserId = useCurrentUserId()
  const [activeTab, setActiveTab] = useState<ActiveTab>('recent')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [profileImg, setProfileImg] = useState('/avatar/default_profile_heart.png')
  const [tempImg, setTempImg] = useState('/avatar/default_profile_heart.png')
  const [nickname, setNickname] = useState("")
  const [tempNickname, setTempNickname] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const statBoxClass =
    'flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl px-1 sm:px-1.5 transition-[box-shadow,background-color]'
  const activeTabLabel = isEnglish ? tabLabels[activeTab].en : tabLabels[activeTab].ko
  const { data: recentCount = 0, isLoading: isRecentCountLoading } = useQuery({
    queryKey: ['my-page-count', 'recent', currentUserId],
    queryFn: () => fetchActivityCount('user_recent_views', currentUserId),
    enabled: Boolean(currentUserId),
    staleTime: 30_000,
  })
  const { data: likedCount = 0, isLoading: isLikedCountLoading } = useQuery({
    queryKey: ['my-page-count', 'liked', currentUserId],
    queryFn: () => fetchActivityCount('user_likes', currentUserId),
    enabled: Boolean(currentUserId),
    staleTime: 30_000,
  })
  const { data: savedCount = 0, isLoading: isSavedCountLoading } = useQuery({
    queryKey: ['my-page-count', 'saved', currentUserId],
    queryFn: () => fetchActivityCount('user_saves', currentUserId),
    enabled: Boolean(currentUserId),
    staleTime: 30_000,
  })

  useEffect(() => {
    let cancelled = false

    const initCheck = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!cancelled && !session) {
        navigate('/login', { replace: true })
      }
    }

    void initCheck()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login', { replace: true })
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [navigate])

  useEffect(() => {
    let cancelled = false

    const loadUserProfile = async () => {
      const { data } = await supabase.auth.getUser()
      const metadata = data.user?.user_metadata ?? {}
      const displayName = typeof metadata.display_name === 'string' ? metadata.display_name.trim() : ''
      const avatarUrl = typeof metadata.avatar_url === 'string' ? metadata.avatar_url.trim() : ''

      if (cancelled) return

      setNickname(displayName || '네일리버')
      if (avatarUrl) setProfileImg(avatarUrl)
    }

    void loadUserProfile()

    return () => {
      cancelled = true
    }
  }, [])

  const { data: galleryNails = [] } = useQuery({
    queryKey: ['my-page-gallery', activeTab, currentUserId],
    queryFn: () => fetchActivityPreview(activeTab, currentUserId),
    enabled: Boolean(currentUserId),
    staleTime: 30_000,
  })

  const openDetail = (nailId: string, title: string, imageUrl: string) => {
    navigate(`/detail/${nailId}`, {
      state: {
        initialNailData: {
          id: nailId,
          imageUrl,
          title,
          color: '',
          mood: '',
        },
      },
    })
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return
    if (!currentUserId) {
      alert('로그인 후 이용해 주세요.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('5MB 이하의 이미지만 업로드할 수 있습니다.')
      return
    }

    setIsUploading(true)
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${currentUserId}_${Date.now()}.${extension}`
      const { data, error } = await supabase.storage.from('avatars').upload(fileName, file)

      if (error) throw error

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
      setTempImg(publicUrlData.publicUrl)
    } catch (error) {
      const message = error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다.'
      alert(message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full flex flex-col min-h-screen bg-white">
      <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between bg-white px-5 border-b border-gray-50">
        <div className="w-8" />
        <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">
          {isEnglish ? 'My Page' : '마이페이지'}
        </h1>
        <button
          type="button"
          aria-label="알림"
          className="relative p-2 text-gray-600"
          onClick={() => navigate('/notification-list')}
        >
          <Bell className="h-6 w-6 text-current" strokeWidth={2} />
          <span className="absolute right-1.5 top-1.5 h-[9px] w-[9px] rounded-full border-[2px] border-white bg-red-500" />
        </button>
      </header>

      <main>
        <section className="flex flex-col items-center py-10 border-b border-gray-50">
          <div
            className="relative h-[100px] w-[100px] shrink-0 cursor-pointer overflow-hidden rounded-full bg-white shadow-sm ring-[3px] ring-rose-100/80 ring-offset-2 ring-offset-white"
            onClick={() => {
              setTempImg(profileImg)
              setTempNickname(nickname || '네일리버')
              setIsModalOpen(true)
            }}
          >
            <img
              src={profileImg}
              alt="프로필"
              className="h-full w-full overflow-hidden rounded-full bg-white object-cover"
            />
          </div>
          <div className="mt-4 text-xl font-bold text-gray-900">{nickname || "네일리버"}</div>
          <span className="mt-1.5 inline-flex items-center justify-center rounded-full bg-rose-50 px-3.5 py-1 text-center text-[13px] font-semibold text-rose-400">
            좋은 하루 보내세요 🌷
          </span>
        </section>

        <section className="grid grid-cols-3 gap-3 px-5 mt-8 mb-10">
          <button
            type="button"
            className={`${statBoxClass} ${activeTab === "recent" ? "ring-2 ring-gray-400 ring-offset-2 bg-gray-100" : "bg-gray-50 border border-gray-100"}`}
            onClick={() => setActiveTab("recent")}
          >
            <span className="flex h-8 w-8 items-center justify-center text-[22px]" aria-hidden>⏱️</span>
            <span className="text-[22px] font-extrabold tabular-nums leading-none text-gray-800">{isRecentCountLoading ? '...' : recentCount}</span>
            <span className="text-[13px] font-semibold text-gray-600">{isEnglish ? 'Recently Viewed' : '최근 본 디자인'}</span>
          </button>
          
          <button
            type="button"
            className={`${statBoxClass} ${activeTab === "liked" ? "ring-2 ring-rose-400 ring-offset-2 bg-rose-100" : "bg-rose-50 border border-rose-100"}`}
            onClick={() => setActiveTab("liked")}
          >
            <Heart className="h-7 w-7 fill-rose-500 text-rose-500" strokeWidth={1.5} aria-hidden />
            <span className="text-[22px] font-extrabold tabular-nums leading-none text-rose-500">{isLikedCountLoading ? '...' : likedCount}</span>
            <span className="text-[13px] font-semibold text-rose-500">{isEnglish ? 'Liked Nails' : '좋아요 한 네일'}</span>
          </button>

          <button
            type="button"
            className={`${statBoxClass} ${activeTab === "saved" ? "ring-2 ring-indigo-400 ring-offset-2 bg-indigo-100" : "bg-indigo-50 border border-indigo-100"}`}
            onClick={() => setActiveTab("saved")}
          >
            <Bookmark className="h-[26px] w-[26px] text-indigo-500" strokeWidth={2.5} aria-hidden />
            <span className="text-[22px] font-extrabold tabular-nums leading-none text-indigo-500">{isSavedCountLoading ? '...' : savedCount}</span>
            <span className="text-[13px] font-semibold text-indigo-500">{isEnglish ? 'Saved Nails' : '저장한 네일'}</span>
          </button>
        </section>

        <section className="mb-12">
          <div className="mb-5 flex items-center justify-between px-5">
            <h2 className="text-lg font-bold text-gray-900">
              {activeTabLabel}
            </h2>
            <button
              type="button"
              className="text-sm font-medium text-gray-500"
              onClick={() => navigate(`/my/list/${activeTab}`)}
            >
              {isEnglish ? 'View All >' : '전체보기 >'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 px-5">
            {galleryNails.map((item) => {
              const titleKo = String(item.title ?? '').trim()
              const titleEn = String(item.title_en ?? '').trim()
              const title = (isEnglish && titleEn ? titleEn : titleKo) || titleEn || (isEnglish ? 'Nail Design' : '네일 디자인')
              const imageUrl = String(item.image_url ?? '').trim()
              return (
                <article
                  key={item.id}
                  className="flex flex-col cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(item.id, title, imageUrl)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openDetail(item.id, title, imageUrl)
                    }
                  }}
                >
                  <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 border border-black/5 shadow-sm">
                    {imageUrl ? (
                      <img src={imageUrl} alt={title} className="h-full w-full object-cover transition-transform hover:scale-105" />
                    ) : null}
                  </div>
                  <div className="mt-2.5 flex w-full flex-col items-center justify-center">
                    <span className="w-full text-center text-sm font-medium tracking-tight text-gray-800 line-clamp-1">
                      {title}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="pt-4">
          <div className="mb-8">
            <div className="text-[13px] font-bold text-gray-400 mb-2 px-5">{isEnglish ? 'Preferences' : '맞춤 설정'}</div>
            <button
              type="button"
              className="w-full flex items-center justify-between py-4 px-5 bg-white border-b border-gray-50 active:bg-gray-50"
              onClick={() => navigate('/notifications')}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🔔</span>
                <span className="text-[15px] font-semibold text-gray-800">{isEnglish ? 'Notification Settings' : '알림 설정'}</span>
              </div>
              <span className="text-gray-300 font-bold">{">"}</span>
            </button>
          </div>
          
          <div className="mb-8">
            <div className="text-[13px] font-bold text-gray-400 mb-2 px-5">{isEnglish ? 'Account' : '계정'}</div>
            <button
              type="button"
              className="w-full flex items-center justify-between py-4 px-5 bg-white border-b border-gray-50 active:bg-gray-50"
              onClick={() => navigate('/account')}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚙️</span>
                <span className="text-[15px] font-semibold text-gray-800">{isEnglish ? 'Account Management' : '계정 관리'}</span>
              </div>
              <span className="text-gray-300 font-bold">{">"}</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center justify-between py-4 px-5 bg-white border-b border-gray-50 active:bg-gray-50"
              onClick={() => navigate('/support')}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🎧</span>
                <span className="text-[15px] font-semibold text-gray-800">{isEnglish ? 'Customer Service / Notice' : '고객센터 / 공지사항'}</span>
              </div>
              <span className="text-gray-300 font-bold">{">"}</span>
            </button>
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center items-end bg-black/60">
          <div className="w-full max-w-md bg-white rounded-t-[32px] p-6 pb-10 animate-in slide-in-from-bottom-4 duration-300">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-gray-900">프로필 사진 변경</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 text-gray-500"><X size={22} /></button>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-[13px] font-medium text-gray-500">기본 프로필 선택</p>
              <div className="flex items-center justify-between px-1">
                {['tulip', 'pearl', 'heart', 'drop'].map((type) => {
                  const isSelected = tempImg.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => setTempImg(`/avatar/default_profile_${type}.png`)}
                      className={`relative w-[68px] h-[68px] shrink-0 overflow-hidden rounded-full bg-white transition-all outline-none ${
                        isSelected
                          ? 'ring-[2.5px] ring-[#9baef3] ring-offset-[3px] ring-offset-white'
                          : 'border border-black/5'
                      }`}
                    >
                      <img
                        src={`/avatar/default_profile_${type}.png`}
                        alt={type}
                        className="w-full h-full object-cover rounded-full block bg-white"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 py-3.5 text-[14px] font-bold text-rose-500 transition-colors active:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Camera size={18} /> {isUploading ? '업로드 중...' : '내 앨범에서 사진 선택'}
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />

            <div className="mb-8">
              <p className="mb-2 text-[13px] font-medium text-gray-500">닉네임 변경</p>
              <input type="text" value={tempNickname} onChange={(e) => setTempNickname(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-[15px] outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </div>

            <button
              type="button"
              onClick={async () => {
                setProfileImg(tempImg);
                setNickname(tempNickname);
                setIsModalOpen(false);
                await supabase.auth.updateUser({ data: { display_name: tempNickname, avatar_url: tempImg } });
              }}
              className="w-full rounded-2xl bg-gray-900 py-4 text-[15px] font-bold text-white transition-transform active:scale-[0.98]"
            >
              닉네임 저장
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
