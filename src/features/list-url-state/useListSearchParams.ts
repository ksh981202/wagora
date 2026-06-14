import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export const DEFAULT_LIST_TAB = '전체'
export const DEFAULT_LIST_SORT = '인기순'

export function useListSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = searchParams.get('tab') ?? DEFAULT_LIST_TAB
  const sort = searchParams.get('sort') ?? DEFAULT_LIST_SORT

  const setTab = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams)
      if (value === DEFAULT_LIST_TAB) {
        next.delete('tab')
      } else {
        next.set('tab', value)
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const setSort = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams)
      if (value === DEFAULT_LIST_SORT) {
        next.delete('sort')
      } else {
        next.set('sort', value)
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  return useMemo(
    () => ({ tab, sort, setTab, setSort }),
    [tab, sort, setTab, setSort],
  )
}
