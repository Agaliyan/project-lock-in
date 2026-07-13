-- ============================================================
-- Slice 3 — Recurring Task Materialization
-- Creates real 'tasks' rows for recurring templates for a given week.
-- Uses SECURITY DEFINER to run across all users when called via pg_cron.
-- ============================================================

CREATE OR REPLACE FUNCTION materialize_recurring_instances(p_week_start date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template RECORD;
  v_target_date date;
  v_day_name text;
  v_time_str text;
  v_day_offset int;
  v_existing_id uuid;
BEGIN
  -- Iterate through all recurring templates that have a valid rule
  FOR v_template IN 
    SELECT * FROM tasks 
    WHERE is_recurring = true 
      AND recurrence_rule IS NOT NULL
  LOOP
    -- Expected rule format: 'weekly:day_of_week:HH:MM'
    -- e.g., 'weekly:mon:18:00'
    
    -- Extract parts (very basic parsing)
    IF v_template.recurrence_rule LIKE 'weekly:%:%' THEN
      v_day_name := split_part(v_template.recurrence_rule, ':', 2);
      v_time_str := split_part(v_template.recurrence_rule, ':', 3) || ':' || split_part(v_template.recurrence_rule, ':', 4);
      
      -- Map day name to offset from Monday (0 to 6)
      CASE lower(v_day_name)
        WHEN 'mon' THEN v_day_offset := 0;
        WHEN 'tue' THEN v_day_offset := 1;
        WHEN 'wed' THEN v_day_offset := 2;
        WHEN 'thu' THEN v_day_offset := 3;
        WHEN 'fri' THEN v_day_offset := 4;
        WHEN 'sat' THEN v_day_offset := 5;
        WHEN 'sun' THEN v_day_offset := 6;
        ELSE v_day_offset := -1;
      END CASE;

      IF v_day_offset >= 0 THEN
        -- Calculate target date within the given week
        v_target_date := p_week_start + (v_day_offset || ' days')::interval;

        -- Dedup check: Does an instance already exist for this template in this week's range?
        -- (Mon to Sun of the target week)
        SELECT id INTO v_existing_id
        FROM tasks
        WHERE recurrence_parent_id = v_template.id
          AND scheduled_date >= p_week_start
          AND scheduled_date <= (p_week_start + interval '6 days')::date
        LIMIT 1;

        IF v_existing_id IS NULL THEN
          -- Materialize the instance as a real row
          INSERT INTO tasks (
            user_id, life_area_id, title, description, first_step, 
            status, duration_minutes,
            is_recurring, recurrence_rule, recurrence_parent_id,
            scheduled_date, scheduled_time
          ) VALUES (
            v_template.user_id, v_template.life_area_id, v_template.title, v_template.description, v_template.first_step,
            'todo', v_template.duration_minutes,
            false, NULL, v_template.id,
            v_target_date, v_time_str
          );
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Note: In a real Supabase project, you would enable pg_cron extension 
-- and schedule the job like this:
-- 
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule(
--   'materialize-recurring-weekly',
--   '0 0 * * 0',  -- every Sunday at midnight UTC
--   $$SELECT materialize_recurring_instances((date_trunc('week', now() + interval '1 day'))::date)$$
-- );
