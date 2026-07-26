-- ============================================================
-- PLANES MODULE MIGRATION
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. ALTER wishlist table: add new columns
ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'DISCOVERED';
ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS saved_amount NUMERIC DEFAULT 0;
ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS goal_category TEXT DEFAULT 'Experiences';
ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS external_link TEXT;
ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS shared BOOLEAN DEFAULT false;

-- 2. Migrate existing data
-- Map old status to new state
UPDATE wishlist SET state = 'COMPLETED' WHERE status = 'visited' AND state = 'DISCOVERED';
UPDATE wishlist SET state = 'DISCOVERED' WHERE status = 'to-visit' AND state = 'DISCOVERED';

-- Copy location_url to external_link if not already set
UPDATE wishlist SET external_link = location_url WHERE external_link IS NULL AND location_url IS NOT NULL;

-- Map old categories to new goal_category
UPDATE wishlist SET goal_category = 'Food' WHERE category = 'antojo' AND goal_category = 'Experiences';
UPDATE wishlist SET goal_category = 'Travel' WHERE category = 'plan' AND goal_category = 'Experiences';
-- 'gusto' stays as 'Experiences' (default)

-- 3. CREATE wishlist_contributions table
CREATE TABLE IF NOT EXISTS wishlist_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wishlist_item_id UUID NOT NULL REFERENCES wishlist(id) ON DELETE CASCADE,
    contributor TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE wishlist_reactions table
CREATE TABLE IF NOT EXISTS wishlist_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wishlist_item_id UUID NOT NULL REFERENCES wishlist(id) ON DELETE CASCADE,
    reactor TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wishlist_item_id, reactor, type)
);

-- 5. CREATE wishlist_activity table
CREATE TABLE IF NOT EXISTS wishlist_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wishlist_item_id UUID REFERENCES wishlist(id) ON DELETE CASCADE,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS
ALTER TABLE wishlist_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_activity ENABLE ROW LEVEL SECURITY;

-- 7. Create permissive policies (matching existing pattern)
CREATE POLICY "Anon Full Access Contributions" ON wishlist_contributions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon Full Access Reactions" ON wishlist_reactions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon Full Access Activity" ON wishlist_activity FOR ALL TO anon USING (true) WITH CHECK (true);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contributions_item ON wishlist_contributions(wishlist_item_id);
CREATE INDEX IF NOT EXISTS idx_reactions_item ON wishlist_reactions(wishlist_item_id);
CREATE INDEX IF NOT EXISTS idx_activity_item ON wishlist_activity(wishlist_item_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON wishlist_activity(created_at DESC);
