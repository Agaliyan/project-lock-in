-- ============================================================
-- Slice 2 — Postgres function for atomic life area archival
-- Reassigns all tasks to Personal, then archives the area
-- Runs as SECURITY INVOKER so RLS still applies
-- ============================================================

CREATE OR REPLACE FUNCTION archive_life_area(p_area_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_personal_id uuid;
  v_user_id uuid;
BEGIN
  -- Get the calling user's ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Find the user's Personal (default) life area
  SELECT id INTO v_personal_id
  FROM life_areas
  WHERE user_id = v_user_id
    AND is_default = true
  LIMIT 1;

  IF v_personal_id IS NULL THEN
    RAISE EXCEPTION 'Personal life area not found';
  END IF;

  -- Don't allow archiving Personal itself
  IF p_area_id = v_personal_id THEN
    RAISE EXCEPTION 'Cannot archive the Personal life area';
  END IF;

  -- Reassign all tasks from this area to Personal
  UPDATE tasks
  SET life_area_id = v_personal_id
  WHERE life_area_id = p_area_id
    AND user_id = v_user_id;

  -- Archive the life area
  UPDATE life_areas
  SET archived_at = now()
  WHERE id = p_area_id
    AND user_id = v_user_id;
END;
$$;
