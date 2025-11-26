/*
  # Add Folders and Sharing Features

  1. New Tables
    - `folders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable - for future auth)
      - `name` (text)
      - `parent_id` (uuid, nullable - for nested folders)
      - `created_at` (timestamptz)
      
    - `shared_chats`
      - `id` (uuid, primary key)
      - `pdf_file_id` (uuid, foreign key)
      - `share_token` (text, unique)
      - `is_public` (boolean)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz, nullable)
      
    - `usage_limits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `session_id` (text) - for tracking anonymous users
      - `pdfs_uploaded_today` (integer)
      - `messages_sent_today` (integer)
      - `last_reset_date` (date)
      - `created_at` (timestamptz)
  
  2. Changes to Existing Tables
    - Add `folder_id` to `pdf_files`
    - Add `thumbnail_url` to `pdf_files`
    - Add `is_deleted` to `pdf_files`
  
  3. Security
    - Enable RLS on all new tables
    - Add policies for public access (temporary)
  
  4. Indexes
    - Add index on share_token for fast lookups
    - Add index on session_id for usage tracking
*/

CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shared_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_file_id uuid NOT NULL REFERENCES pdf_files(id) ON DELETE CASCADE,
  share_token text UNIQUE NOT NULL,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text NOT NULL,
  pdfs_uploaded_today integer DEFAULT 0,
  messages_sent_today integer DEFAULT 0,
  last_reset_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pdf_files' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE pdf_files ADD COLUMN folder_id uuid REFERENCES folders(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pdf_files' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE pdf_files ADD COLUMN thumbnail_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pdf_files' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE pdf_files ADD COLUMN is_deleted boolean DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_shared_chats_token ON shared_chats(share_token);
CREATE INDEX IF NOT EXISTS idx_usage_limits_session ON usage_limits(session_id);
CREATE INDEX IF NOT EXISTS idx_pdf_files_folder ON pdf_files(folder_id);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to folders"
  ON folders FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to folders"
  ON folders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to folders"
  ON folders FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from folders"
  ON folders FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to shared_chats"
  ON shared_chats FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to shared_chats"
  ON shared_chats FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to usage_limits"
  ON usage_limits FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to usage_limits"
  ON usage_limits FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to usage_limits"
  ON usage_limits FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
