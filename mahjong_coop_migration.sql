-- ============================================================
-- MAHJONG CO-OP AND MESSAGE IN A BOTTLE SQL MIGRATION
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Table for Asynchronous Co-op Games
CREATE TABLE IF NOT EXISTS coop_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layout TEXT NOT NULL,
    tiles JSONB NOT NULL,
    dock_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    active_turn TEXT NOT NULL CHECK (active_turn IN ('el', 'ella')),
    last_matched_by TEXT CHECK (last_matched_by IN ('el', 'ella')),
    last_matched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Table for Message in a Bottle
CREATE TABLE IF NOT EXISTS bottle_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender TEXT NOT NULL CHECK (sender IN ('el', 'ella')),
    message TEXT NOT NULL,
    revealed_by TEXT CHECK (revealed_by IN ('el', 'ella')),
    revealed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE coop_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottle_messages ENABLE ROW LEVEL SECURITY;

-- 4. Create permissive policies (matching existing pattern)
CREATE POLICY "Anon Full Access Coop Games" ON c    oop_games FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Auth Full Access Coop Games" ON coop_games FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anon Full Access Bottle Messages" ON bottle_messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Auth Full Access Bottle Messages" ON bottle_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_coop_games_active ON coop_games(completed_at) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bottle_messages_unrevealed ON bottle_messages(revealed_by) WHERE revealed_by IS NULL;
