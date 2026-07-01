-- Migration: Create mahjong_drawings table
CREATE TABLE IF NOT EXISTS mahjong_drawings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender TEXT NOT NULL CHECK (sender IN ('el', 'ella')),
    drawing_data TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mahjong_drawings ENABLE ROW LEVEL SECURITY;

-- Security Policy
CREATE POLICY "Auth Full Access Drawings" ON mahjong_drawings FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app')) 
    WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));
