-- Add delete policy for idea_members table
-- This policy allows:
-- 1. Idea owners to remove any team member
-- 2. Members to remove themselves (leave the team)

CREATE POLICY "Idea owners can remove team members"
  ON idea_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM idea_members AS owners
      WHERE owners.idea_id = idea_members.idea_id
      AND owners.user_id = auth.uid()
      AND owners.role = 'Owner'
    )
    OR
    -- Allow users to remove themselves (leave the team)
    (user_id = auth.uid())
  );
