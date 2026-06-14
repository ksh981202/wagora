import { useEffect, useRef } from 'react'
import {
  DEFAULT_LIST_SORT,
  useListSearchParams,
} from '../../features/list-url-state/useListSearchParams'
import { NailListExplore } from '../../widgets/nail-list/NailListExplore'

const RANKING_SORT_TABS = ['인기순', '저장순'] as const

export default function ClientRankingPage() {
  const { sort, setSort, setTab } = useListSearchParams()
  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    setTab('전체')
    if (sort !== '인기순' && sort !== '저장순') {
      setSort(DEFAULT_LIST_SORT)
    }
  }, [setSort, setTab, sort])

  return (
    <NailListExplore
      tabs={RANKING_SORT_TABS}
      tabsSectionLabel="스타일 BEST"
      queryScope="ranking"
      rankingSortTabs
      showRankBadge
    />
  )
}
