-- 1. 유저별 '좋아요' 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_likes (
    user_id uuid NOT NULL,
    nail_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, nail_id) -- 중복 방지
);

-- 2. 유저별 '저장(북마크)' 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_saves (
    user_id uuid NOT NULL,
    nail_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, nail_id) -- 중복 방지
);

-- 3. 유저별 '최근 본 디자인' 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_recent_views (
    user_id uuid NOT NULL,
    nail_id uuid NOT NULL,
    viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, nail_id) -- 중복 방지 (최근 본 시간만 업데이트용)
);

-- 4. RLS (Row Level Security) 설정 (본인 데이터만 조회/수정/삭제 가능)
ALTER TABLE public.user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recent_views ENABLE ROW LEVEL SECURITY;

-- user_likes 보안 정책
CREATE POLICY "본인 좋아요 조회" ON public.user_likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 좋아요 추가" ON public.user_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 좋아요 삭제" ON public.user_likes FOR DELETE USING (auth.uid() = user_id);

-- user_saves 보안 정책
CREATE POLICY "본인 저장 조회" ON public.user_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 저장 추가" ON public.user_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 저장 삭제" ON public.user_saves FOR DELETE USING (auth.uid() = user_id);

-- user_recent_views 보안 정책
CREATE POLICY "본인 최근본 조회" ON public.user_recent_views FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 최근본 추가/수정" ON public.user_recent_views FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 최근본 삭제" ON public.user_recent_views FOR DELETE USING (auth.uid() = user_id);
