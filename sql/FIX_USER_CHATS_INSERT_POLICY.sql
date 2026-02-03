-- Fix missing INSERT RLS policy on user_chats table
-- This allows the auto-create trigger to insert user_chat entries when conversations are created

DROP POLICY IF EXISTS "Users can create their chat settings" ON public.user_chats;

CREATE POLICY "Users can create their chat settings"
  ON public.user_chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verify policy was created
SELECT 
  policyname,
  tablename,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_chats'
ORDER BY policyname;
