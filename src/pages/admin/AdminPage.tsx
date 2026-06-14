import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageContainer } from '../../shared/ui/PageContainer'

type DashboardRow = {
  id: string
  title: string
  tags: string[]
  category: string
  created_at: string
}

const DUMMY_DASHBOARD_LIST: DashboardRow[] = [
  {
    id: '1',
    title: '로맨틱 핑크 글리터',
    tags: ['핑크', '글리터', '데이트'],
    category: '트렌드',
    created_at: '2026-05-16T10:30:00Z',
  },
  {
    id: '2',
    title: '마블 베이지 오로라',
    tags: ['베이지', '마블', '오피스'],
    category: '시즌',
    created_at: '2026-05-15T14:20:00Z',
  },
  {
    id: '3',
    title: '체리 레드 프렌치',
    tags: ['레드', '프렌치', '파티'],
    category: '인기',
    created_at: '2026-05-14T09:15:00Z',
  },
  {
    id: '4',
    title: '누드 그라데이션',
    tags: ['누드', '그라데이션'],
    category: '데일리',
    created_at: '2026-05-12T18:45:00Z',
  },
]

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export default function AdminPage() {
  return (
    <PageContainer className="max-w-6xl">
      <div className="flex flex-col gap-6 pb-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">대시보드</h1>
            <p className="mt-1 text-sm text-neutral-600">
              등록된 네일 디자인을 확인하고 관리하는 관리자 UI 템플릿입니다. 서버·스토리지 연동은
              비활성화되어 있습니다.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/admin/upload"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              업로드로 이동
            </Link>
            <button
              type="button"
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-50"
            >
              새로고침
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">썸네일</th>
                  <th className="px-4 py-3">제목</th>
                  <th className="px-4 py-3">카테고리</th>
                  <th className="px-4 py-3">등록일</th>
                  <th className="w-24 px-4 py-3 text-right">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {DUMMY_DASHBOARD_LIST.map((row) => (
                  <tr key={row.id} className="bg-white hover:bg-neutral-50/80">
                    <td className="px-4 py-2">
                      <div
                        className="h-14 w-14 shrink-0 rounded-md border border-neutral-200 bg-neutral-200"
                        aria-hidden
                      />
                    </td>
                    <td className="max-w-[220px] px-4 py-2">
                      <p className="truncate font-medium text-neutral-900">{row.title}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {row.tags.slice(0, 3).join(' · ')}
                        {row.tags.length > 3 ? ' …' : ''}
                      </p>
                    </td>
                    <td className="max-w-[120px] truncate px-4 py-2 text-neutral-700">
                      {row.category}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-neutral-600">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white p-2 text-red-600 hover:bg-red-50"
                        aria-label="삭제"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
