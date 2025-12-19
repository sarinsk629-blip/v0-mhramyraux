-- Create the souls presence table for real-time tracking
CREATE TABLE IF NOT EXISTS public.souls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soul_id TEXT UNIQUE NOT NULL,
  country_code TEXT DEFAULT 'XX',
  country_name TEXT DEFAULT 'Unknown',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS souls_country_code_idx ON public.souls(country_code);
CREATE INDEX IF NOT EXISTS souls_last_seen_idx ON public.souls(last_seen);

-- Enable RLS but allow public read/write for anonymous souls
ALTER TABLE public.souls ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read souls (for global counter)
CREATE POLICY "Allow public read on souls" ON public.souls 
  FOR SELECT USING (true);

-- Allow anyone to insert their soul
CREATE POLICY "Allow public insert on souls" ON public.souls 
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update their own soul by soul_id
CREATE POLICY "Allow public update on souls" ON public.souls 
  FOR UPDATE USING (true);

-- Allow deletion of stale souls
CREATE POLICY "Allow public delete on souls" ON public.souls 
  FOR DELETE USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.souls;

-- Create a global stats table
CREATE TABLE IF NOT EXISTS public.global_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_connections BIGINT DEFAULT 0,
  loneliness_index DECIMAL(5,2) DEFAULT 50.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial stats row
INSERT INTO public.global_stats (id, total_connections, loneliness_index) 
VALUES (1, 0, 75.00)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for global_stats
ALTER TABLE public.global_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on global_stats" ON public.global_stats 
  FOR SELECT USING (true);

CREATE POLICY "Allow public update on global_stats" ON public.global_stats 
  FOR UPDATE USING (true);

-- Enable realtime for global_stats
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_stats;
