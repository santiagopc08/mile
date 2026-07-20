-- ============================================================
-- WISHLIST POLICIES MIGRATION FOR AUTHENTICATED USERS
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Create policy for wishlist table
CREATE POLICY "Auth Full Access Wishlist" 
ON wishlist 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 2. Create policy for wishlist_contributions table
CREATE POLICY "Auth Full Access Contributions" 
ON wishlist_contributions 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 3. Create policy for wishlist_reactions table
CREATE POLICY "Auth Full Access Reactions" 
ON wishlist_reactions 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Create policy for wishlist_activity table
CREATE POLICY "Auth Full Access Activity" 
ON wishlist_activity 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
