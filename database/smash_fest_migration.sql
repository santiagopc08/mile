CREATE TABLE IF NOT EXISTS smash_fest_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level_id TEXT UNIQUE NOT NULL,
    palette JSONB NOT NULL,
    projectile_limit INTEGER NOT NULL,
    nodes JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE smash_fest_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth Full Access Smash Fest" ON smash_fest_levels FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app')) WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));

INSERT INTO smash_fest_levels (level_id, palette, projectile_limit, nodes)
VALUES (
    'level_1',
    '{"background": "#1e293b", "projectile": "#ef4444", "ground": "#334155"}',
    10,
    '[
        {"id": "base1", "type": "box", "dimensions": [2, 1, 2], "position": [0, 0.5, 0], "mass": 50, "friction": 0.5, "material": "stone"},
        {"id": "pillar1", "type": "cylinder", "dimensions": [0.5, 0.5, 2], "position": [-0.5, 2, 0], "mass": 10, "friction": 0.5, "material": "wood"},
        {"id": "pillar2", "type": "cylinder", "dimensions": [0.5, 0.5, 2], "position": [0.5, 2, 0], "mass": 10, "friction": 0.5, "material": "wood"},
        {"id": "top1", "type": "box", "dimensions": [2, 0.5, 1], "position": [0, 3.25, 0], "mass": 15, "friction": 0.5, "material": "wood"},
        {"id": "mem1", "type": "box", "dimensions": [0.8, 0.8, 0.8], "position": [0, 4, 0], "mass": 5, "friction": 0.8, "material": "special", "isMemoryBlock": true}
    ]'
) ON CONFLICT (level_id) DO NOTHING;
