-- nail_designs INSERT (관리자 업로드용)
-- SELECT 정책은 schema.sql 에 있습니다. 아래는 클라이언트(anon) 삽입용 타협안입니다.
-- 운영: Edge Function + service_role 또는 authenticated + RLS 조건으로 좁히세요.

grant insert on table public.nail_designs to anon, authenticated;

drop policy if exists "nail_designs_insert_anon_authenticated" on public.nail_designs;

create policy "nail_designs_insert_anon_authenticated"
  on public.nail_designs
  for insert
  to anon, authenticated
  with check (true);
