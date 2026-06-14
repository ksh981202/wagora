import { supabase } from "@/shared/api/supabaseClient";

/** 브라우저 Supabase 싱글톤 (관리자 업로드·스토리지용) */
export function getSupabaseBrowserClient() {
  return supabase;
}
