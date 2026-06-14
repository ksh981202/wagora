-- CSV 원본 파일명 (예: GL-0000401.jpg) — 관리자 목록 표시용
alter table public.nail_designs
  add column if not exists source_filename text;

comment on column public.nail_designs.source_filename is '업로드 시 CSV 파일명 컬럼 값 (R2 키와 별도)';
