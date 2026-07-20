-- ============================================================
-- MAHJONG DAILY PUZZLE ATTEMPTS SQL MIGRATION
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Create the daily puzzle plays table
CREATE TABLE IF NOT EXISTS daily_puzzle_plays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile TEXT NOT NULL CHECK (profile IN ('el', 'ella')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
    time_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (profile, date)
);

-- Enable Row Level Security (RLS)
ALTER TABLE daily_puzzle_plays ENABLE ROW LEVEL SECURITY;

-- Create policies for anon and authenticated users
CREATE POLICY "Anon Full Access Daily Puzzle Plays" ON daily_puzzle_plays FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Auth Full Access Daily Puzzle Plays" ON daily_puzzle_plays FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_daily_puzzle_plays_date ON daily_puzzle_plays(date);
