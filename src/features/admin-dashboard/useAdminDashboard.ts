import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { deleteFromR2 } from '../admin-upload/api/uploadService'
import { supabase } from '../../shared/api/supabaseClient'
import type { NailDesignRow } from '../../shared/types/database.types'

const NAIL_DESIGN_COLUMNS = [
  'id',
  'created_at',
  'title',
  'title_en',
  'image_url',
  'image_r2_key',
  'source_filename',
  'description',
  'description_en',
  'color',
  'color_en',
  'nail_length',
  'length_en',
  'hand_type',
  'hand_type_en',
  'mood',
  'mood_en',
  'situations',
  'occasion_en',
  'styles',
  'styles_en',
  'design_technique',
  'technique_en',
  'design_elements',
  'design_point_en',
  'procedure_guide',
  'guide_en',
  'category',
  'tags',
  'tags_en',
  'popularity',
  'saves',
].join(',')

export function useAdminDashboard() {
  const queryClient = useQueryClient()
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: ['admin', 'nail-designs', 'list'],
    queryFn: async (): Promise<NailDesignRow[]> => {
      const { data, error } = await supabase
        .from('wagora_lookbooks')
        .select(NAIL_DESIGN_COLUMNS)
        .order('source_filename', { ascending: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []) as unknown as NailDesignRow[]
    },
  })

  const handleDelete = useCallback(
    async (id: string, imageR2Key: string, options: { invalidate?: boolean } = {}) => {
      const shouldInvalidate = options.invalidate ?? true
      setDeleteError(null)
      setDeletingId(id)
      try {
        await deleteFromR2(imageR2Key)
        const { error } = await supabase.from('wagora_lookbooks').delete().eq('id', id)
        if (error) throw new Error(error.message)
        if (shouldInvalidate) {
          await queryClient.invalidateQueries({ queryKey: ['admin', 'nail-designs', 'list'] })
          await queryClient.invalidateQueries({ queryKey: ['nail-designs'] })
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : '삭제 중 알 수 없는 오류가 발생했습니다.'
        setDeleteError(message)
        throw e
      } finally {
        setDeletingId(null)
      }
    },
    [queryClient],
  )

  const clearDeleteError = useCallback(() => {
    setDeleteError(null)
  }, [])

  return {
    ...listQuery,
    handleDelete,
    deleteError,
    deletingId,
    clearDeleteError,
  }
}
