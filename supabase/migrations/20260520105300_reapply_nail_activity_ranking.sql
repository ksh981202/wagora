-- 교정 재적용: nail_designs 메타데이터 미변경, 활동 로그 + 랭킹 RPC 멱등 생성

-- 1. 활동 로그 테이블 생성 (오타 교정 완료)
CREATE TABLE IF NOT EXISTS public.nail_activity_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nail_id UUID REFERENCES public.nail_designs(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'detail_view', 'save', 'share', 'click'
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. 0.001초 속도 사수용 복합 인덱스 생성
CREATE INDEX IF NOT EXISTS nail_activity_events_perf_idx 
ON public.nail_activity_events (nail_id, action, created_at DESC);

-- 3. 4대 지표 기간별 가중치 합산 랭킹 RPC 함수 생성
CREATE OR REPLACE FUNCTION public.get_ranking_nails(
    p_period TEXT,
    p_limit INT
)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    title TEXT,
    title_en TEXT,
    image_url TEXT,
    category TEXT,
    tags TEXT[],
    tags_en TEXT[],
    popularity INT,
    saves INT,
    situations TEXT[],
    styles TEXT[],
    nail_length TEXT,
    ranking_score BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH windowed_stats AS (
        SELECT 
            nae.nail_id,
            COUNT(*) FILTER (WHERE nae.action = 'detail_view') as detail_views_count,
            COUNT(*) FILTER (WHERE nae.action = 'save') as saves_count,
            COUNT(*) FILTER (WHERE nae.action = 'share') as shares_count,
            COUNT(*) FILTER (WHERE nae.action = 'click') as clicks_count
        FROM public.nail_activity_events nae
        WHERE 
            CASE 
                WHEN p_period = 'realtime' THEN nae.created_at >= NOW() - INTERVAL '24 hours'
                WHEN p_period = 'weekly' THEN nae.created_at >= NOW() - INTERVAL '7 days'
                WHEN p_period = 'monthly' THEN nae.created_at >= NOW() - INTERVAL '30 days'
                ELSE TRUE -- 'alltime'은 전체 기간
            END
        GROUP BY nae.nail_id
    )
    SELECT 
        nd.id,
        nd.created_at,
        nd.title,
        nd.title_en,
        nd.image_url,
        nd.category,
        nd.tags,
        nd.tags_en,
        nd.popularity,
        nd.saves,
        nd.situations,
        nd.styles,
        nd.nail_length,
        COALESCE(
            CASE 
                WHEN p_period = 'realtime' THEN (ws.detail_views_count * 2) + (ws.saves_count * 3) + (ws.shares_count * 5)
                WHEN p_period = 'weekly' THEN (ws.saves_count * 5) + (ws.shares_count * 3)
                WHEN p_period = 'monthly' THEN (ws.detail_views_count * 1) + (ws.saves_count * 4) + (ws.shares_count * 2)
                ELSE (ws.detail_views_count * 1) + (ws.saves_count * 1) + (ws.shares_count * 1)
            END, 
            0
        )::BIGINT as ranking_score
    FROM public.nail_designs nd
    LEFT JOIN windowed_stats ws ON nd.id = ws.nail_id
    ORDER BY ranking_score DESC, nd.id DESC
    LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_ranking_nails(text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ranking_nails(text, int) TO anon, authenticated;
