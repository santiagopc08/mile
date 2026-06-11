-- Run this in the Supabase SQL Editor

-- 1. Add tags and reactions to the events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- 2. Create the event_comments table
CREATE TABLE IF NOT EXISTS event_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    author TEXT NOT NULL CHECK (author IN ('el', 'ella')),
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on event_comments
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;

-- 4. Create Security Policies for event_comments
CREATE POLICY "Auth Full Access EventComments" ON event_comments FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'))
WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));

-- 5. Drop old scrapbook tables if they exist
DROP TABLE IF EXISTS scrapbook_comments CASCADE;
DROP TABLE IF EXISTS scrapbook_memories CASCADE;
