CREATE POLICY "본인 최근본 수정" ON public.user_recent_views
FOR UPDATE USING (auth.uid() = user_id);
