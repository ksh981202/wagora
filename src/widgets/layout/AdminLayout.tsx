import { Database, FileText, LayoutDashboard } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const sidebarLink = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-violet-600 text-white shadow-sm'
      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
  ].join(' ')

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50 md:flex-row">
      <aside className="border-b border-neutral-200 bg-white md:w-56 md:shrink-0 md:border-b-0 md:border-r md:border-neutral-200 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between px-4 py-4 md:flex-col md:items-stretch md:gap-6">
          <div className="text-sm font-semibold tracking-wide text-neutral-500 dark:text-neutral-400">
            GELIA Admin
          </div>
          <nav
            className="flex gap-1 md:flex-col md:gap-1"
            aria-label="관리자 메뉴"
          >
            <NavLink to="/admin/upload" end className={sidebarLink}>
              <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
              대시보드
            </NavLink>
            <NavLink to="/admin/manage" className={sidebarLink}>
              <Database className="h-4 w-4 shrink-0" aria-hidden />
              데이터 관리
            </NavLink>
            <NavLink to="/admin/board" className={sidebarLink}>
              <FileText className="h-4 w-4 shrink-0" aria-hidden />
              고객센터
            </NavLink>
          </nav>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
