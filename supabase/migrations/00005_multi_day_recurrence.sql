-- ============================================================
-- Slice 3 Follow-up — Multi-day Recurrence
-- Adds recurrence_generated_date for robust deduping, and 
-- rewrites the materialization function to handle comma-separated days.
-- ============================================================

-- 1. Add immutable column to track the rule slot this instance fills
ALTER TABLE tasks ADD COLUMN recurrence_generated_date DATE;

-- 2. Backfill existing instances 
UPDATE tasks 
SET recurrence_generated_date = scheduled_date 
WHERE recurrence_parent_id IS NOT NULL AND recurrence_generated_date IS NULL;

-- 3. Rewrite the materialization function
CREATE OR REPLACE FUNCTION materialize_recurring_instances(p_week_start date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template RECORD;
  v_target_date date;
  v_days_list text;
  v_time_str text;
  v_day_name text;
  v_day_offset int;
  v_existing_id uuid;
BEGIN
  -- Iterate through all recurring templates that have a valid rule
  FOR v_template IN 
    SELECT * FROM tasks 
    WHERE is_recurring = true 
      AND recurrence_rule IS NOT NULL
  LOOP
    -- Expected rule format: 'weekly:mon,wed,fri:18:00'
    
    IF v_template.recurrence_rule LIKE 'weekly:%:%' THEN
      v_days_list := split_part(v_template.recurrence_rule, ':', 2);
      v_time_str := split_part(v_template.recurrence_rule, ':', 3) || ':' || split_part(v_template.recurrence_rule, ':', 4);
      
      -- Loop over each day in the comma-separated list
      FOR v_day_name IN SELECT unnest(string_to_array(v_days_list, ','))
      LOOP
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

          -- Dedup check against the immutable recurrence_generated_date
          SELECT id INTO v_existing_id
          FROM tasks
          WHERE recurrence_parent_id = v_template.id
            AND recurrence_generated_date = v_target_date
          LIMIT 1;

          IF v_existing_id IS NULL THEN
            -- Materialize the instance
            INSERT INTO tasks (
              user_id, life_area_id, title, description, first_step, 
              status, duration_minutes,
              is_recurring, recurrence_rule, recurrence_parent_id,
              scheduled_date, scheduled_time, recurrence_generated_date
            ) VALUES (
              v_template.user_id, v_template.life_area_id, v_template.title, v_template.description, v_template.first_step,
              'todo', v_template.duration_minutes,
              false, NULL, v_template.id,
              v_target_date, v_time_str, v_target_date
            );
          END IF;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;
