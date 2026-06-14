-- 1. nail_designs 테이블에 likes(좋아요 수) 컬럼 추가 (기본값 0)
ALTER TABLE public.nail_designs 
ADD COLUMN IF NOT EXISTS likes integer NOT NULL DEFAULT 0;

-- 2. nail_designs 테이블에 updated_at(수정 시간) 컬럼 추가 (기본값 현재 시간)
ALTER TABLE public.nail_designs 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());
