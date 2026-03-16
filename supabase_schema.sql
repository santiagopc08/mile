-- Run this in the Supabase SQL Editor

-- Table for Timeline Events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Jar Notes
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Daily Commitments
CREATE TABLE commitments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Audio Track Configuration
CREATE TABLE audio_track (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    artist TEXT,
    spotify_url TEXT,
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

-- Insert an initial row for app_settings
INSERT INTO app_settings (id, connection_date, last_update) VALUES (1, NOW(), NOW());
-- Insert initial row for audio track
INSERT INTO audio_track (title, artist, spotify_url) VALUES ('Fix You', 'Coldplay', 'https://open.spotify.com/track/47BBI51FKFwOMlCCXKXUU9');

-- MIGRATIONS PHASE 4
-- 1. Add author to victories
ALTER TABLE victories ADD COLUMN IF NOT EXISTS author TEXT DEFAULT 'el';

-- 2. Add playlist columns to audio_track
ALTER TABLE audio_track ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE audio_track ADD COLUMN IF NOT EXISTS added_by TEXT DEFAULT 'el';

-- 3. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_profile TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
