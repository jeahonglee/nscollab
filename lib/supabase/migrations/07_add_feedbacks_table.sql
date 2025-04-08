-- Create feedbacks table for the memo board feature
-- This allows users to leave general feedback on the dashboard

-- Create feedbacks table
CREATE TABLE IF NOT EXISTS "feedbacks" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID REFERENCES "profiles"("id") ON DELETE SET NULL,
  "message" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Create policies for the feedbacks table

-- Anyone signed in can view all feedbacks
CREATE POLICY "Anyone can view feedbacks"
  ON feedbacks FOR SELECT
  USING (auth.role() = 'authenticated');

-- Any authenticated user can create feedbacks
CREATE POLICY "Users can create feedbacks"
  ON feedbacks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Users can only update their own feedbacks
CREATE POLICY "Users can update own feedbacks"
  ON feedbacks FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own feedbacks
CREATE POLICY "Users can delete own feedbacks"
  ON feedbacks FOR DELETE
  USING (auth.uid() = user_id);

-- Function to handle updating profiles reference when a user is deleted
CREATE OR REPLACE FUNCTION handle_deleted_user() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE feedbacks
  SET user_id = NULL
  WHERE user_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set user_id to NULL when a user is deleted
CREATE TRIGGER on_profile_delete
BEFORE DELETE ON profiles
FOR EACH ROW
EXECUTE FUNCTION handle_deleted_user();
