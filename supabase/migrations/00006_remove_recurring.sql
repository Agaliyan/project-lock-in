-- ============================================================
-- Slice 3 Teardown — Remove Recurring Tasks
-- ============================================================

-- Drop the materialization function entirely
DROP FUNCTION IF EXISTS materialize_recurring_instances(date);

-- Drop recurring columns from tasks table
ALTER TABLE tasks 
  DROP COLUMN IF EXISTS is_recurring,
  DROP COLUMN IF EXISTS recurrence_rule,
  DROP COLUMN IF EXISTS recurrence_parent_id,
  DROP COLUMN IF EXISTS recurrence_generated_date;
