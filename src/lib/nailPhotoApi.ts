export type AdminNailListRow = {
  id: string;
  filename: string;
  title: string;
  title_en: string | null;
  image_url: string;
  created_at?: string;
};

type NailPhotoRecord = Record<string, unknown>;

/** Supabase nail_photo_uploads 등 레코드를 관리 목록 행으로 변환 */
export function mapRecordToAdminNailListRow(record: NailPhotoRecord): AdminNailListRow {
  return {
    id: String(record.id ?? ""),
    filename: String(record.source_filename ?? record.filename ?? ""),
    title: String(record.title ?? ""),
    title_en: record.title_en != null ? String(record.title_en) : null,
    image_url: String(record.image_url ?? ""),
    created_at: record.created_at != null ? String(record.created_at) : undefined,
  };
}
