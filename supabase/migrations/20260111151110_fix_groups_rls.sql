-- Fix RLS policies for groups table
DROP POLICY IF EXISTS "Users can view their own group" ON groups;
DROP POLICY IF EXISTS "Users can insert groups" ON groups;

CREATE POLICY "Users can view groups"
  ON groups FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      id = public.user_group_id() OR
      public.user_group_id() IS NULL
    )
  );

CREATE POLICY "Users can insert groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
