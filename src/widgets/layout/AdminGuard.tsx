import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/api/supabaseClient'

const ADMIN_EMAIL = 'k981202@naver.com'

export default function AdminGuard() {
  const navigate = useNavigate()
  const [isAllowed, setIsAllowed] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    const checkAdminSession = async () => {
      const { data } = await supabase.auth.getSession()
      const email = data.session?.user?.email?.trim().toLowerCase()

      if (cancelled) return

      if (email !== ADMIN_EMAIL) {
        alert('최고 관리자만 접근할 수 있습니다.')
        navigate('/', { replace: true })
        return
      }

      setIsAllowed(true)
      setIsChecking(false)
    }

    void checkAdminSession()

    return () => {
      cancelled = true
    }
  }, [navigate])

  if (isChecking || !isAllowed) return null

  return <Outlet />
}
