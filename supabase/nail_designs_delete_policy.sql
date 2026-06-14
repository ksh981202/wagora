-- nail_designs DELETE (관리자 대시보드)
-- INSERT 정책과 마찬가지로 anon 허용은 개발 편의용입니다. 운영에서는 Edge + service_role 또는 조건부 RLS로 교체하세요.

grant delete on table public.nail_designs to anon, authenticated;

drop policy if exists "nail_designs_delete_anon_authenticated" on public.nail_designs;

create policy "nail_designs_delete_anon_authenticated"
  on public.nail_designs
  for delete
  to anon, authenticated
  using (true);
