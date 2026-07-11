-- ============================================================
-- Lock In — Slice 1 Migration
-- Creates all 6 tables from SPEC.md §7 with RLS policies
-- ============================================================

-- Enable RLS on all tables by default
-- Each table gets 4 policies: SELECT, INSERT, UPDATE, DELETE
-- All scoped to auth.uid() = user_id

-- ============================================================
-- 1. life_areas
-- ============================================================
CREATE TABLE life_areas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color_hex   text NOT NULL,
  position    integer NOT NULL DEFAULT 0,
  is_default  boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE life_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "life_areas_select" ON life_areas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "life_areas_insert" ON life_areas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "life_areas_update" ON life_areas
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "life_areas_delete" ON life_areas
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 2. tasks
-- ============================================================
CREATE TABLE tasks (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  life_area_id         uuid NOT NULL REFERENCES life_areas(id) ON DELETE CASCADE,
  title                text NOT NULL,
  description          text,
  first_step           text,
  status               text NOT NULL DEFAULT 'todo'
                       CHECK (status IN ('todo', 'doing', 'done')),
  scheduled_date       date,
  scheduled_time       time,
  duration_minutes     integer,
  is_recurring         boolean NOT NULL DEFAULT false,
  recurrence_rule      text,
  recurrence_parent_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  confirmed_at         timestamptz,
  completed_at         timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 3. snooze_logs
-- ============================================================
CREATE TABLE snooze_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason          text NOT NULL,
  snoozed_to_time timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE snooze_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snooze_logs_select" ON snooze_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "snooze_logs_insert" ON snooze_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "snooze_logs_update" ON snooze_logs
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "snooze_logs_delete" ON snooze_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4. daily_logs
-- ============================================================
CREATE TABLE daily_logs (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date     date NOT NULL,
  task_id  uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status   text NOT NULL
           CHECK (status IN ('done', 'avoided', 'not_reached')),
  note     text
);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_logs_select" ON daily_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_logs_insert" ON daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_logs_update" ON daily_logs
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_logs_delete" ON daily_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 5. push_subscriptions
-- ============================================================
CREATE TABLE push_subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint     text NOT NULL,
  p256dh_key   text NOT NULL,
  auth_key     text NOT NULL,
  device_label text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_select" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_insert" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_update" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_delete" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 6. settings
-- ============================================================
CREATE TABLE settings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_log_time time,
  timezone       text NOT NULL DEFAULT 'Asia/Colombo',
  paused_until   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT settings_one_per_user UNIQUE (user_id)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_select" ON settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "settings_insert" ON settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "settings_update" ON settings
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "settings_delete" ON settings
  FOR DELETE USING (auth.uid() = user_id);
