-- 1. 검색어 통계 테이블 생성
CREATE TABLE IF NOT EXISTS public.search_stats (
    keyword text PRIMARY KEY,
    search_count integer NOT NULL DEFAULT 1,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. RLS(보안) 정책 설정 (누구나 조회 가능, 쓰기는 RPC 함수로만 우회)
ALTER TABLE public.search_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "누구나 검색어 통계 조회 가능" ON public.search_stats FOR SELECT USING (true);

-- 3. 검색어 카운트 증가 함수 (RPC) 생성 (SECURITY DEFINER로 RLS 우회 기록)
CREATE OR REPLACE FUNCTION public.log_search_keyword(search_term text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.search_stats (keyword, search_count, updated_at)
    VALUES (search_term, 1, now())
    ON CONFLICT (keyword)
    DO UPDATE SET 
        search_count = search_stats.search_count + 1,
        updated_at = now();
END;

$$;
