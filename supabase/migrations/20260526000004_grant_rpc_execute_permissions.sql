-- 1. 좋아요 점수 증감 함수(increment_likes) 권한 부여
GRANT EXECUTE ON FUNCTION public.increment_likes(uuid, integer) TO anon, authenticated;

-- 2. 저장(북마크) 점수 증감 함수(increment_saves) 권한 부여
GRANT EXECUTE ON FUNCTION public.increment_saves(uuid, integer) TO anon, authenticated;
