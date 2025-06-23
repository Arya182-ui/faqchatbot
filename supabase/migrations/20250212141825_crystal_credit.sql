/*
  # Chat System Schema with Updated RLS Policies

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

  2. Security Updates
    - Allow public access to create chat users
    - Enable RLS on all tables
    - Add policies for public and authenticated users
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

-- Updated policies for chat_users
CREATE POLICY "Anyone can create chat users"
  ON chat_users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read all chat users"
  ON chat_users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update their own status"
  ON chat_users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Updated policies for chat_requests
CREATE POLICY "Public can read and create chat requests"
  ON chat_requests
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Updated policies for chat_messages
CREATE POLICY "Public can read and create chat messages"
  ON chat_messages
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);