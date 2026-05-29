-- Drop old policies
DROP POLICY IF EXISTS "Anon Full Access Events" ON events;
-- Create new ones
CREATE POLICY "Auth Access Events" ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);
