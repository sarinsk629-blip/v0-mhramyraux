-- Strike 3: Soul Infrastructure Migration
-- Enhances the souls table and adds economy/viral systems

-- Add new columns to souls table for mood, impact_points, last_collision
ALTER TABLE public.souls 
ADD COLUMN IF NOT EXISTS current_mood TEXT DEFAULT 'neutral' CHECK (current_mood IN ('radiant', 'calm', 'seeking', 'healing', 'electric', 'neutral')),
ADD COLUMN IF NOT EXISTS impact_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_collision TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS aura_type TEXT DEFAULT 'basic' CHECK (aura_type IN ('basic', 'ethereal', 'cosmic', 'phoenix', 'void_master', 'zenith_legend')),
ADD COLUMN IF NOT EXISTS frequency_boost_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_shadow_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

-- Create sync_drops table for viral scarcity events
CREATE TABLE IF NOT EXISTS public.sync_drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 5,
  total_souls_visible INTEGER DEFAULT 0,
  total_collisions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create essence_transactions for economy tracking
CREATE TABLE IF NOT EXISTS public.essence_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soul_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'bonus')),
  amount INTEGER NOT NULL,
  item_type TEXT CHECK (item_type IN ('aura', 'frequency_boost', 'collision_bonus', 'kindness_bonus', NULL)),
  item_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create premium_auras catalog
CREATE TABLE IF NOT EXISTS public.premium_auras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  cost INTEGER NOT NULL,
  glow_color TEXT NOT NULL,
  particle_effect TEXT,
  description TEXT,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert premium auras
INSERT INTO public.premium_auras (name, cost, glow_color, particle_effect, description, rarity) VALUES
  ('Ethereal Mist', 100, '#a78bfa', 'mist', 'Soft violet glow with floating mist particles', 'common'),
  ('Cosmic Pulse', 250, '#60a5fa', 'pulse', 'Electric blue with pulsing rings', 'rare'),
  ('Phoenix Flame', 500, '#f97316', 'fire', 'Burning orange with rising ember particles', 'epic'),
  ('Void Master', 1000, '#1f2937', 'void', 'Dark abyss with swirling darkness', 'epic'),
  ('Zenith Legend', 2500, '#fcd34d', 'sunburst', 'Golden radiance with sunburst rays', 'legendary')
ON CONFLICT (name) DO NOTHING;

-- Create frequency_boosts for visibility
CREATE TABLE IF NOT EXISTS public.frequency_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soul_id TEXT NOT NULL,
  boost_multiplier NUMERIC DEFAULT 2.0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create guardian_reports for AI safety
CREATE TABLE IF NOT EXISTS public.guardian_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_soul_id TEXT,
  reported_soul_id TEXT NOT NULL,
  message_id UUID REFERENCES messages(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('aggression', 'harassment', 'spam', 'inappropriate', 'underage_concern', 'self_harm')),
  ai_analysis TEXT,
  ai_confidence NUMERIC,
  action_taken TEXT CHECK (action_taken IN ('none', 'warning', 'temp_mute', 'shadow_ban', 'permanent_ban')),
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create device_fingerprints for human verification
CREATE TABLE IF NOT EXISTS public.device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soul_id TEXT NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  hardware_concurrency INTEGER,
  platform TEXT,
  trust_score NUMERIC DEFAULT 0.5,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.sync_drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.essence_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_auras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequency_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;

-- Policies for sync_drops (read-only for users)
CREATE POLICY "Allow public read on sync_drops" ON public.sync_drops FOR SELECT USING (true);

-- Policies for essence_transactions
CREATE POLICY "Allow public read on essence_transactions" ON public.essence_transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on essence_transactions" ON public.essence_transactions FOR INSERT WITH CHECK (true);

-- Policies for premium_auras
CREATE POLICY "Allow public read on premium_auras" ON public.premium_auras FOR SELECT USING (true);

-- Policies for frequency_boosts
CREATE POLICY "Allow public read on frequency_boosts" ON public.frequency_boosts FOR SELECT USING (true);
CREATE POLICY "Allow public insert on frequency_boosts" ON public.frequency_boosts FOR INSERT WITH CHECK (true);

-- Policies for guardian_reports
CREATE POLICY "Allow public insert on guardian_reports" ON public.guardian_reports FOR INSERT WITH CHECK (true);

-- Policies for device_fingerprints
CREATE POLICY "Allow public read own fingerprint" ON public.device_fingerprints FOR SELECT USING (true);
CREATE POLICY "Allow public insert fingerprint" ON public.device_fingerprints FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update fingerprint" ON public.device_fingerprints FOR UPDATE USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_souls_mood ON public.souls(current_mood);
CREATE INDEX IF NOT EXISTS idx_souls_aura ON public.souls(aura_type);
CREATE INDEX IF NOT EXISTS idx_souls_shadow_banned ON public.souls(is_shadow_banned);
CREATE INDEX IF NOT EXISTS idx_essence_soul ON public.essence_transactions(soul_id);
CREATE INDEX IF NOT EXISTS idx_fingerprint_soul ON public.device_fingerprints(soul_id);
CREATE INDEX IF NOT EXISTS idx_fingerprint_hash ON public.device_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_sync_drops_status ON public.sync_drops(status);
CREATE INDEX IF NOT EXISTS idx_boosts_expires ON public.frequency_boosts(expires_at);

-- Enable realtime for sync_drops (for viral notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_drops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.frequency_boosts;
