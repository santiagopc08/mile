-- ============================================================
-- ALLOCATIONS MODULE SQL MIGRATION
-- Run this in the Supabase SQL Editor to enable syncing
-- ============================================================

-- Create the allocations table
CREATE TABLE IF NOT EXISTS allocations (
    id TEXT PRIMARY KEY,
    amount NUMERIC NOT NULL,
    description TEXT,
    category TEXT,
    date TEXT NOT NULL,
    profile TEXT NOT NULL CHECK (profile IN ('el', 'ella')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (full access)
CREATE POLICY "Auth Full Access Allocations" 
ON allocations 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create policy for anonymous users (if needed to match other modules)
CREATE POLICY "Anon Full Access Allocations" 
ON allocations 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_allocations_profile ON allocations(profile);
CREATE INDEX IF NOT EXISTS idx_allocations_date ON allocations(date);
