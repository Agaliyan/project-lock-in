-- ============================================================
-- Slice 2 — Add subtasks JSONB column to tasks
-- Stores [{id, text, done}], scoped to one task, never queried independently
-- ============================================================

ALTER TABLE tasks ADD COLUMN subtasks jsonb NOT NULL DEFAULT '[]';
