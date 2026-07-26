-- Create push_subscriptions table to store browser push registration tokens
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile TEXT NOT NULL CHECK (profile IN ('el', 'ella')),
    subscription JSONB NOT NULL,
    endpoint TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy to grant full access (select, insert, update, delete) to authenticated users (el and ella)
CREATE POLICY "Auth Full Access Push Subscriptions" 
ON push_subscriptions FOR ALL TO authenticated 
USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app')) 
WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));
