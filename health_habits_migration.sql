-- ============================================================
-- HEALTH HABITS MODULE MIGRATION
-- Run this in the Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS health_habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile TEXT NOT NULL,
    date DATE NOT NULL,
    habit_type TEXT NOT NULL,
    cost NUMERIC DEFAULT 0,
    severity TEXT NOT NULL DEFAULT 'medium',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE health_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon Full Access Health Habits" ON health_habits FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_health_habits_profile ON health_habits(profile);
CREATE INDEX IF NOT EXISTS idx_health_habits_date ON health_habits(date);
