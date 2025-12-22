-- Badges Table for Achievement System
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Soul Badges (Many-to-Many)
CREATE TABLE IF NOT EXISTS soul_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soul_id TEXT NOT NULL,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(soul_id, badge_id)
);

-- Streaks Table for Daily Engagement
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soul_id TEXT NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_type TEXT DEFAULT 'daily',
  multiplier NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard Snapshots for Performance
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  soul_id TEXT NOT NULL,
  rank INTEGER NOT NULL,
  points INTEGER NOT NULL,
  category TEXT DEFAULT 'global',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Challenges
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  goal_value INTEGER NOT NULL,
  reward_points INTEGER NOT NULL,
  reward_badge_id UUID REFERENCES badges(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Soul Challenge Progress
CREATE TABLE IF NOT EXISTS soul_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soul_id TEXT NOT NULL,
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(soul_id, challenge_id)
);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul_challenge_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read on badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Allow public read on soul_badges" ON soul_badges FOR SELECT USING (true);
CREATE POLICY "Allow public insert on soul_badges" ON soul_badges FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on streaks" ON streaks FOR SELECT USING (true);
CREATE POLICY "Allow public insert on streaks" ON streaks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on streaks" ON streaks FOR UPDATE USING (true);
CREATE POLICY "Allow public read on leaderboard_snapshots" ON leaderboard_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow public insert on leaderboard_snapshots" ON leaderboard_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on daily_challenges" ON daily_challenges FOR SELECT USING (true);
CREATE POLICY "Allow public read on soul_challenge_progress" ON soul_challenge_progress FOR SELECT USING (true);
CREATE POLICY "Allow public insert on soul_challenge_progress" ON soul_challenge_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on soul_challenge_progress" ON soul_challenge_progress FOR UPDATE USING (true);

-- Seed Initial Badges
INSERT INTO badges (name, description, icon, rarity, requirement_type, requirement_value, points_reward) VALUES
  ('First Collision', 'Complete your first soul collision', 'sparkles', 'common', 'collisions', 1, 10),
  ('Soul Connector', 'Complete 10 soul collisions', 'link', 'common', 'collisions', 10, 50),
  ('Cosmic Bridge', 'Complete 50 soul collisions', 'bridge', 'rare', 'collisions', 50, 200),
  ('Nebula Navigator', 'Complete 100 soul collisions', 'compass', 'epic', 'collisions', 100, 500),
  ('Kindness Initiate', 'Send 100 messages of kindness', 'heart', 'common', 'messages', 100, 25),
  ('Kindness Ambassador', 'Send 500 messages of kindness', 'heart-handshake', 'rare', 'messages', 500, 150),
  ('Kindness Legend', 'Send 2000 messages of kindness', 'crown', 'legendary', 'messages', 2000, 1000),
  ('Week Warrior', 'Maintain a 7-day streak', 'flame', 'common', 'streak', 7, 70),
  ('Month Master', 'Maintain a 30-day streak', 'fire', 'rare', 'streak', 30, 300),
  ('Century Soul', 'Maintain a 100-day streak', 'infinity', 'legendary', 'streak', 100, 1000),
  ('Void Walker', 'Spend 10 hours in The Void', 'moon', 'rare', 'void_time', 600, 200),
  ('Pulse Pioneer', 'Complete 25 Pulse interactions', 'activity', 'common', 'pulse_interactions', 25, 100),
  ('Zenith Seeker', 'Find 5 matches in The Zenith', 'sun', 'rare', 'zenith_matches', 5, 250),
  ('Global Syncer', 'Participate in 10 Sync Drops', 'globe', 'epic', 'sync_drops', 10, 500),
  ('Mythic Soul', 'Reach 10,000 Impact Points', 'star', 'mythic', 'impact_points', 10000, 2500)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_soul_badges_soul_id ON soul_badges(soul_id);
CREATE INDEX IF NOT EXISTS idx_streaks_soul_id ON streaks(soul_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_date ON leaderboard_snapshots(snapshot_date, category);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_soul ON soul_challenge_progress(soul_id);
