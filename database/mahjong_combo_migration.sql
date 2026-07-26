-- Migration: Add highest_combo to mahjong_scores
ALTER TABLE mahjong_scores ADD COLUMN IF NOT EXISTS highest_combo INTEGER DEFAULT 0;
