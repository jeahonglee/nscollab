-- Add delete policy for ideas table
-- Only idea owners (team members with role 'Owner') can delete their ideas

CREATE POLICY "Owners can delete ideas"
  ON ideas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM idea_members
      WHERE idea_members.idea_id = ideas.id
      AND idea_members.user_id = auth.uid()
      AND idea_members.role = 'Owner'
    )
  ); 