-- Run this in the Supabase SQL Editor

-- Table for Timeline Events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    author TEXT DEFAULT 'el',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Jar Notes
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    author TEXT DEFAULT 'el',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Daily Commitments
CREATE TABLE commitments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    author TEXT DEFAULT 'el',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Tracking Daily Progress
CREATE TABLE daily_tracking (
    date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    completed_count INTEGER DEFAULT 0
);

-- Table for Small Victories
CREATE TABLE victories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    author TEXT DEFAULT 'el',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Audio Track Configuration
CREATE TABLE audio_track (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    artist TEXT,
    spotify_url TEXT,
    display_order INT DEFAULT 0,
    added_by TEXT DEFAULT 'el',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Audio Comments
CREATE TABLE audio_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID REFERENCES audio_track(id) ON DELETE CASCADE,
    author TEXT,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for App Global Settings (like Connection Date)
CREATE TABLE app_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Single row table
    connection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_profile TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Persistent Listening
CREATE TABLE IF NOT EXISTS persistent_listening (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic TEXT NOT NULL,
    reflection TEXT NOT NULL,
    date DATE NOT NULL,
    author TEXT DEFAULT 'el',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Mahjong Scores
CREATE TABLE IF NOT EXISTS mahjong_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile TEXT CHECK (profile IN ('el', 'ella')),
    time_seconds INTEGER NOT NULL,
    layout TEXT NOT NULL,
    tile_count INTEGER DEFAULT 144,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert an initial row for app_settings
INSERT INTO app_settings (id, connection_date, last_update) VALUES (1, NOW(), NOW()) ON CONFLICT DO NOTHING;
-- Insert initial row for audio track
INSERT INTO audio_track (title, artist, spotify_url) VALUES ('Fix You', 'Coldplay', 'https://open.spotify.com/track/47BBI51FKFwOMlCCXKXUU9') ON CONFLICT DO NOTHING;

-- SECURITY: Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE victories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_track ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE persistent_listening ENABLE ROW LEVEL SECURITY;
ALTER TABLE mahjong_scores ENABLE ROW LEVEL SECURITY;

-- Create secure policies for authenticated users.
CREATE POLICY "Auth Full Access Events" ON events FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app')) WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));
CREATE POLICY "Auth Full Access Notes" ON notes FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app')) WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));
CREATE POLICY "Auth Full Access Commitments" ON commitments FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app')) WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));
CREATE POLICY "Auth Full Access Tracking" ON daily_tracking FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app')) WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));
CREATE POLICY "Auth Full Access Victories" ON victories FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app')) WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));
CREATE POLICY "Auth Full Access AudioTrack" ON audio_track FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app')) WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));
CREATE POLICY "Auth Full Access AudioComments" ON audio_comments FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app')) WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));
CREATE POLICY "Auth Full Access Settings" ON app_settings FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app')) WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));
CREATE POLICY "Auth Full Access Notifications" ON notifications FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app')) WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));
CREATE POLICY "Auth Full Access Persistent" ON persistent_listening FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app')) WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));
CREATE POLICY "Auth Full Access Mahjong" ON mahjong_scores FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app')) WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));

-- Productivity Dashboard Additions
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  assignee text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth Full Access Tasks" ON tasks FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app')) WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));

