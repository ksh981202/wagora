import { useCallback, useMemo, useState } from 'react'
import Papa from 'papaparse'
import {
  buildNailInsertFromCsv,
  insertToSupabase,
  uploadToR2,
} from './api/uploadService'
import { emptyCsvDesignRow, type CsvDesignRow, type MatchedRow } from './csvTypes'
import { mapV1CsvRowToDesignRow } from './mapV1CsvRow'

export type { CsvDesignRow, MatchedRow } from './csvTypes'

export type UploadPhase = 'idle' | 'uploading' | 'complete' | 'error'

export type CsvParseState = 'idle' | 'parsing' | 'done' | 'error'

export function useAdminUpload() {
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [csvRows, setCsvRows] = useState<CsvDesignRow[]>([])
  const [csvError, setCsvError] = useState<string | null>(null)
  const [csvParseState, setCsvParseState] = useState<CsvParseState>('idle')
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<UploadPhase>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)

  const imageByName = useMemo(() => {
    const m = new Map<string, File>()
    for (const f of imageFiles) {
      m.set(f.name.trim(), f)
    }
    return m
  }, [imageFiles])

  const matchedRows: MatchedRow[] = useMemo(() => {
    return csvRows.map((row) => {
      const key = row.image_filename.trim()
      const imageFile = key ? (imageByName.get(key) ?? null) : null
      return {
        csv: row,
        imageFile,
        matched: imageFile != null,
      }
    })
  }, [csvRows, imageByName])

  const matchedCount = useMemo(
    () => matchedRows.filter((r) => r.matched).length,
    [matchedRows],
  )

  const eligibleRows = useMemo(
    () => matchedRows.filter((r) => r.matched && r.imageFile),
    [matchedRows],
  )

  const addImageFiles = useCallback((files: FileList | File[]) => {
    setImageFiles((prev) => {
      const map = new Map(prev.map((f) => [f.name, f]))
      for (const f of Array.from(files)) {
        if (f.type.startsWith('image/')) {
          map.set(f.name, f)
        }
      }
      return [...map.values()]
    })
  }, [])

  const removeImageFile = useCallback((name: string) => {
    setImageFiles((prev) => prev.filter((f) => f.name !== name))
  }, [])

  const clearImageFiles = useCallback(() => {
    setImageFiles([])
  }, [])

  const parseCsvFile = useCallback((file: File) => {
    setCsvError(null)
    setCsvParseState('parsing')
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: CsvDesignRow[] = []
        for (const raw of results.data) {
          const mapped = mapV1CsvRowToDesignRow(raw)
          if (mapped) rows.push(mapped)
          else {
            const image_filename = String(
              raw.image_filename ?? raw.Image_filename ?? '',
            ).trim()
            if (!image_filename) continue
            rows.push({
              ...emptyCsvDesignRow(image_filename),
              title: String(raw.title ?? '').trim(),
              title_en: String(raw.title_en ?? '').trim(),
              mood: String(raw.category ?? raw.mood ?? '').trim(),
            })
          }
        }
        if (rows.length === 0) {
          setCsvError(
            '유효한 CSV 행이 없습니다. V1 헤더(파일명) 또는 image_filename 컬럼을 확인하세요.',
          )
          setCsvRows([])
          setCsvParseState('error')
          return
        }
        setCsvRows(rows)
        setCsvParseState('done')
      },
      error: (err) => {
        setCsvError(err.message)
        setCsvRows([])
        setCsvParseState('error')
      },
    })
  }, [])

  const clearCsv = useCallback(() => {
    setCsvRows([])
    setCsvError(null)
    setCsvParseState('idle')
  }, [])

  /** V1 업로드 UI 등 외부 CSV 파서 결과를 nail_designs 업로드 파이프라인에 주입 */
  const importDesignRows = useCallback((rows: CsvDesignRow[]) => {
    setCsvRows(rows)
    setCsvError(null)
    setCsvParseState(rows.length > 0 ? 'done' : 'error')
  }, [])

  const resetUpload = useCallback(() => {
    setPhase('idle')
    setProgress(0)
    setUploadError(null)
  }, [])

  const startUpload = useCallback(async () => {
    const jobs = eligibleRows
    if (jobs.length === 0) return false

    setUploadError(null)
    setPhase('uploading')
    setProgress(0)

    try {
      for (let i = 0; i < jobs.length; i++) {
        const row = jobs[i]!
        const file = row.imageFile!
        const { image_r2_key, image_url } = await uploadToR2(file)
        const payload = buildNailInsertFromCsv(row.csv, image_url, image_r2_key)
        await insertToSupabase(payload)
        setProgress(Math.round(((i + 1) / jobs.length) * 100))
      }
      setPhase('complete')
      return true
    } catch (e) {
      const message =
        e instanceof Error ? e.message : '알 수 없는 오류로 업로드에 실패했습니다.'
      setUploadError(message)
      setPhase('error')
      return false
    }
  }, [eligibleRows])

  return {
    imageFiles,
    csvRows,
    csvError,
    csvParseState,
    matchedRows,
    matchedCount,
    eligibleCount: eligibleRows.length,
    progress,
    phase,
    uploadError,
    addImageFiles,
    removeImageFile,
    clearImageFiles,
    parseCsvFile,
    clearCsv,
    importDesignRows,
    startUpload,
    resetUpload,
  }
}
