-- ============================================================
-- MOVEMENT MODULE SQL MIGRATION
-- Run this in the Supabase SQL Editor to enable syncing
-- ============================================================

CREATE TABLE IF NOT EXISTS movement_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile TEXT NOT NULL CHECK (profile IN ('el', 'ella')),
    date DATE NOT NULL,
    session_type TEXT NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    difficulty TEXT NOT NULL CHECK (difficulty IN ('low', 'medium', 'high')),
    energy_level TEXT NOT NULL CHECK (energy_level IN ('low', 'medium', 'high')),
    notes TEXT,
    completion_status TEXT NOT NULL CHECK (completion_status IN ('active', 'recovery', 'rest_day', 'completed')),
    pain_before INTEGER CHECK (pain_before >= 0 AND pain_before <= 10),
    pain_after INTEGER CHECK (pain_after >= 0 AND pain_after <= 10),
    fatigue_level INTEGER CHECK (fatigue_level >= 1 AND fatigue_level <= 5),
    mobility_status TEXT CHECK (mobility_status IN ('good', 'normal', 'limited')),
    therapist_notes TEXT,
    reactions JSONB DEFAULT '[]'::jsonb, -- List of mutual reactions: [{reactor: 'el'|'ella', type: 'GOOD_JOB'|'KEEP_GOING'|'RECOVERY_DAY'|'PROUD_OF_YOU'}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE movement_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access to read, insert, update and delete logs
CREATE POLICY "Anon Full Access Movement Sessions" ON movement_sessions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Create indices for performant queries
CREATE INDEX IF NOT EXISTS idx_movement_sessions_profile ON movement_sessions(profile);
CREATE INDEX IF NOT EXISTS idx_movement_sessions_date ON movement_sessions(date);
