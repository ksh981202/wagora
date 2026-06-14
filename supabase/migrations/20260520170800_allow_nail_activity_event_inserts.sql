-- GELIA V2: 브라우저/로그인 사용자의 활동 로그 적재 허용
-- nail_designs 및 CSV 메타데이터는 변경하지 않는다.

alter table public.nail_activity_events enable row level security;

grant insert on table public.nail_activity_events to anon, authenticated;

drop policy if exists "nail_activity_events_insert_anon_authenticated" on public.nail_activity_events;

create policy "nail_activity_events_insert_anon_authenticated"
  on public.nail_activity_events
  for insert
  to anon, authenticated
  with check (
    nail_id is not null
    and action in ('detail_view', 'save', 'unsave', 'share', 'click')
  );
