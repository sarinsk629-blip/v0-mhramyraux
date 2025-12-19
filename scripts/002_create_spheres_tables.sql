-- Create messages table for chat functionality
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  sender_soul_id TEXT NOT NULL,
  content TEXT NOT NULL,
  sphere TEXT NOT NULL CHECK (sphere IN ('void', 'pulse', 'zenith')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create presence table for realtime tracking
CREATE TABLE IF NOT EXISTS presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soul_id TEXT UNIQUE NOT NULL,
  soul_name TEXT NOT NULL,
  sphere TEXT NOT NULL CHECK (sphere IN ('void', 'pulse', 'zenith', 'portal')),
  vibe_frequency NUMERIC DEFAULT 0.5,
  country_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'seeking', 'connected')),
  last_ping TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create impact_points table for gamification
CREATE TABLE IF NOT EXISTS impact_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soul_id TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  total_connections INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  kindness_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create collisions table for tracking matches
CREATE TABLE IF NOT EXISTS collisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soul_a TEXT NOT NULL,
  soul_b TEXT NOT NULL,
  room_id TEXT UNIQUE NOT NULL,
  sphere TEXT NOT NULL CHECK (sphere IN ('void', 'pulse', 'zenith')),
  total_characters INTEGER DEFAULT 0,
  transparency_level NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Create moderation_flags table for AI Guardian
CREATE TABLE IF NOT EXISTS moderation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id),
  soul_id TEXT NOT NULL,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('aggression', 'harassment', 'spam', 'inappropriate')),
  severity INTEGER DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  action_taken TEXT CHECK (action_taken IN ('warning', 'shadow_ban', 'none')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shadow_bans table
CREATE TABLE IF NOT EXISTS shadow_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soul_id TEXT UNIQUE NOT NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE collisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadow_bans ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Allow public read on messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on messages" ON messages FOR INSERT WITH CHECK (true);

-- Policies for presence
CREATE POLICY "Allow public read on presence" ON presence FOR SELECT USING (true);
CREATE POLICY "Allow public insert on presence" ON presence FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on presence" ON presence FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on presence" ON presence FOR DELETE USING (true);

-- Policies for impact_points
CREATE POLICY "Allow public read on impact_points" ON impact_points FOR SELECT USING (true);
CREATE POLICY "Allow public insert on impact_points" ON impact_points FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on impact_points" ON impact_points FOR UPDATE USING (true);

-- Policies for collisions
CREATE POLICY "Allow public read on collisions" ON collisions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on collisions" ON collisions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on collisions" ON collisions FOR UPDATE USING (true);

-- Policies for moderation (read-only for users, write for system)
CREATE POLICY "Allow public read on moderation_flags" ON moderation_flags FOR SELECT USING (true);
CREATE POLICY "Allow public insert on moderation_flags" ON moderation_flags FOR INSERT WITH CHECK (true);

-- Policies for shadow_bans
CREATE POLICY "Allow public read on shadow_bans" ON shadow_bans FOR SELECT USING (true);
CREATE POLICY "Allow public insert on shadow_bans" ON shadow_bans FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sphere ON messages(sphere);
CREATE INDEX IF NOT EXISTS idx_presence_sphere ON presence(sphere);
CREATE INDEX IF NOT EXISTS idx_presence_status ON presence(status);
CREATE INDEX IF NOT EXISTS idx_presence_vibe ON presence(vibe_frequency);
CREATE INDEX IF NOT EXISTS idx_collisions_souls ON collisions(soul_a, soul_b);
CREATE INDEX IF NOT EXISTS idx_shadow_bans_soul ON shadow_bans(soul_id);

-- Enable realtime for presence and messages
ALTER PUBLICATION supabase_realtime ADD TABLE presence;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE collisions;
