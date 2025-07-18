/*
  # Chat System Schema with Updated RLS Policies

  1. Tables
    - `chat_users`: Store user and agent information
    - `chat_requests`: Track chat requests and their status
    - `chat_messages`: Store chat messages with support for text and images

  2. Security
    - Drop existing policies
    - Create new policies for public access
    - Enable RLS on all tables
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can read all chat users" ON chat_users;
    DROP POLICY IF EXISTS "Users can update their own status" ON chat_users;
    DROP POLICY IF EXISTS "Anyone can create chat users" ON chat_users;
    DROP POLICY IF EXISTS "Public can read and create chat requests" ON chat_requests;
    DROP POLICY IF EXISTS "Public can read and create chat messages" ON chat_messages;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Create chat_users table
CREATE TABLE IF NOT EXISTS chat_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type text NOT NULL CHECK (user_type IN ('user', 'agent')),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
  created_at timestamptz DEFAULT now()
);

-- Create chat_requests table
CREATE TABLE IF NOT EXISTS chat_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES chat_users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
  issue text,
  created_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES chat_requests(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES chat_users(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create new policies for chat_users
CREATE POLICY "chat_users_insert_policy"
  ON chat_users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "chat_users_select_policy"
  ON chat_users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "chat_users_update_policy"
  ON chat_users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create new policies for chat_requests
CREATE POLICY "chat_requests_policy"
  ON chat_requests
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create new policies for chat_messages
CREATE POLICY "chat_messages_policy"
  ON chat_messages
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);