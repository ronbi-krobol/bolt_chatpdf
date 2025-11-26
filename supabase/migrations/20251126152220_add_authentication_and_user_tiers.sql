/*
  # Add Authentication and User Tiers

  1. Changes to Existing Tables
    - Update `pdf_files` to add `user_id` column
    - Update `folders` to add `user_id` column
    - Update `usage_limits` to add `user_tier` column
  
  2. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text, nullable)
      - `avatar_url` (text, nullable)
      - `tier` (text, default 'free') - 'free' or 'plus'
      - `subscription_end_date` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  3. Security
    - Enable RLS on user_profiles
    - Add policies for authenticated users
    - Update policies for pdf_files and folders
  
  4. Important Notes
    - Free tier: 10 PDFs/month, 120 messages/day
    - Plus tier: unlimited
    - Anonymous users keep existing limits: 3 PDFs/day, 50 messages/day
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  tier text DEFAULT 'free' CHECK (tier IN ('free', 'plus')),
  subscription_end_date timestamptz,
  preferred_language text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pdf_files' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE pdf_files ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'folders' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE folders ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usage_limits' AND column_name = 'user_tier'
  ) THEN
    ALTER TABLE usage_limits ADD COLUMN user_tier text DEFAULT 'free';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pdf_files_user ON pdf_files(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow public read access to pdf_files" ON pdf_files;
CREATE POLICY "Users can view own PDFs"
  ON pdf_files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public insert to pdf_files" ON pdf_files;
CREATE POLICY "Users can insert own PDFs"
  ON pdf_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public update to pdf_files" ON pdf_files;
CREATE POLICY "Users can update own PDFs"
  ON pdf_files FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public delete from pdf_files" ON pdf_files;
CREATE POLICY "Users can delete own PDFs"
  ON pdf_files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow anonymous read pdf_files"
  ON pdf_files FOR SELECT
  TO public
  USING (user_id IS NULL);

CREATE POLICY "Allow anonymous insert pdf_files"
  ON pdf_files FOR INSERT
  TO public
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Allow anonymous update pdf_files"
  ON pdf_files FOR UPDATE
  TO public
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Allow anonymous delete pdf_files"
  ON pdf_files FOR DELETE
  TO public
  USING (user_id IS NULL);

DROP POLICY IF EXISTS "Allow public read access to folders" ON folders;
CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public insert to folders" ON folders;
CREATE POLICY "Users can insert own folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public update to folders" ON folders;
CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public delete from folders" ON folders;
CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow anonymous read folders"
  ON folders FOR SELECT
  TO public
  USING (user_id IS NULL);

CREATE POLICY "Allow anonymous insert folders"
  ON folders FOR INSERT
  TO public
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Allow anonymous update folders"
  ON folders FOR UPDATE
  TO public
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Allow anonymous delete folders"
  ON folders FOR DELETE
  TO public
  USING (user_id IS NULL);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
