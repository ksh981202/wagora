/**
 * Supabase `public` 스키마와 동기화되는 타입 정의.
 * `wagora_lookbooks` 테이블은 기존 룩북/피드 컬럼과 1:1로 대응합니다.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/** V1 CSV 22컬럼 상세 필드 (파일명·이미지 제외) */
export type NailDesignDetailFields = {
  description: string
  description_en: string
  color: string
  color_en: string
  nail_length: string
  length_en: string
  hand_type: string
  hand_type_en: string
  mood: string
  mood_en: string
  /** Postgres text[] */
  situations: string[]
  /** 상황(EN) · Postgres text[] */
  occasion_en: string[]
  /** Postgres text[] */
  styles: string[]
  /** Postgres text[] */
  styles_en: string[]
  design_technique: string
  technique_en: string
  design_elements: string
  design_point_en: string
  procedure_guide: string
  guide_en: string
}

/** `public.wagora_lookbooks` 한 행 (DB 스네이크 케이스) */
export type NailDesignRow = {
  id: string
  created_at: string
  title: string
  title_en: string
  image_url: string
  image_r2_key: string
  source_filename?: string | null
  /** 레거시·클라이언트 필터용 (V1 상세는 mood 등 개별 컬럼 사용) */
  category: string
  tags: string[]
  tags_en: string[]
  popularity: number
  views: number
  likes: number
  saves: number
} & NailDesignDetailFields

/** INSERT (기본값·생성 컬럼은 선택) */
export type NailDesignInsert = {
  id?: string
  created_at?: string
  title: string
  title_en?: string
  image_url: string
  image_r2_key: string
  source_filename?: string | null
  category?: string
  tags?: string[]
  tags_en?: string[]
  popularity?: number
  saves?: number
} & Partial<NailDesignDetailFields>

/** UPDATE (부분 갱신) */
export type NailDesignUpdate = Partial<NailDesignInsert>

export type Database = {
  public: {
    Tables: {
      nail_designs: {
        Row: NailDesignRow
        Insert: NailDesignInsert
        Update: NailDesignUpdate
        Relationships: []
      }
      wagora_lookbooks: {
        Row: NailDesignRow
        Insert: NailDesignInsert
        Update: NailDesignUpdate
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
