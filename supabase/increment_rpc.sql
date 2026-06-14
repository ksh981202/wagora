-- GELIA: popularity / saves 안전 증감 (Supabase SQL Editor에서 실행)
-- increment_value: +1 (증가) 또는 -1 (감소). 결과는 0 미만으로 내려가지 않음.

create or replace function public.increment_popularity(
  nail_id uuid,
  increment_value int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.nail_designs
  set popularity = greatest(0, popularity + increment_value)
  where id = nail_id;
end;
$$;

create or replace function public.increment_saves(
  nail_id uuid,
  increment_value int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.nail_designs
  set saves = greatest(0, saves + increment_value)
  where id = nail_id;
end;
$$;

revoke all on function public.increment_popularity(uuid, int) from public;
revoke all on function public.increment_saves(uuid, int) from public;

grant execute on function public.increment_popularity(uuid, int) to anon, authenticated;
grant execute on function public.increment_saves(uuid, int) to anon, authenticated;
