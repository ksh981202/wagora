-- 좋아요 수(likes) 증감을 위한 RPC 생성
CREATE OR REPLACE FUNCTION public.increment_likes(nail_id uuid, increment_value integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.nail_designs
  SET 
    likes = COALESCE(likes, 0) + increment_value,
    updated_at = now()
  WHERE id = nail_id;
END;

$$;
