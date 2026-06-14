-- GELIA V2: nail_designs (Supabase / Postgres)
-- Run in SQL Editor or via `supabase db push` after linking project.

create table if not exists public.nail_designs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  title_en text not null default '',
  image_url text not null,
  image_r2_key text not null,
  source_filename text,
  description text not null default '',
  description_en text not null default '',
  color text not null default '',
  color_en text not null default '',
  nail_length text not null default '',
  length_en text not null default '',
  hand_type text not null default '',
  hand_type_en text not null default '',
  mood text not null default '',
  mood_en text not null default '',
  situations text[] not null default '{}',
  occasion_en text[] not null default '{}',
  styles text[] not null default '{}',
  styles_en text[] not null default '{}',
  design_technique text not null default '',
  technique_en text not null default '',
  design_elements text not null default '',
  design_point_en text not null default '',
  procedure_guide text not null default '',
  guide_en text not null default '',
  category text not null default '미분류',
  tags text[] not null default '{}',
  tags_en text[] not null default '{}',
  popularity integer not null default 0,
  saves integer not null default 0
);

comment on table public.nail_designs is '네일 디자인 마스터 (R2 이미지 + V1 CSV 22컬럼 메타)';

create index if not exists nail_designs_category_idx on public.nail_designs (category);

create index if not exists nail_designs_created_at_idx on public.nail_designs (created_at desc);

alter table public.nail_designs enable row level security;

drop policy if exists "nail_designs_select_anon_authenticated" on public.nail_designs;

-- 익명·로그인 사용자 모두 SELECT 허용 (공개 읽기)
create policy "nail_designs_select_anon_authenticated"
  on public.nail_designs
  for select
  to anon, authenticated
  using (true);

grant select on table public.nail_designs to anon;

grant select on table public.nail_designs to authenticated;
