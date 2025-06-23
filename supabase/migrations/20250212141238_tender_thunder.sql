/*
  # Chat System Schema

  1. New Tables
    - `chat_users`
      - `id` (uuid, primary key)
      - `user_type` (text) - either 'user' or 'agent'
      - `name` (text)
      - `status` (text) - 'online', 'offline', or 'busy'
      - `created_at` (timestamp)
    
    - `chat_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references chat_users)
      - `status` (text) - 'waiting', 'active', 'completed'
      - `issue` (text)
      - `created_at` (timestamp)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `request_id` (uuid, references chat_requests)
      - `sender_id` (uuid, references chat_users)
      - `content` (text)
      - `image_url` (text, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

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

-- Policies for chat_users
CREATE POLICY "Users can read all chat users"
  ON chat_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own status"
  ON chat_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policies for chat_requests
CREATE POLICY "Users can read their own requests and agents can read all"
  ON chat_requests
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM chat_users 
      WHERE id = auth.uid() AND user_type = 'agent'
    )
  );

CREATE POLICY "Users can create their own requests"
  ON chat_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policies for chat_messages
CREATE POLICY "Users can read messages in their conversations"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_requests
      WHERE chat_requests.id = chat_messages.request_id
      AND (
        chat_requests.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM chat_users
          WHERE id = auth.uid() AND user_type = 'agent'
        )
      )
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_requests
      WHERE chat_requests.id = chat_messages.request_id
      AND (
        chat_requests.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM chat_users
          WHERE id = auth.uid() AND user_type = 'agent'
        )
      )
    )
  );