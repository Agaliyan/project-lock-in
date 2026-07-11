// ============================================================
// Lock In — Database Types (hand-written, mirrors migration)
// Replace with `supabase gen types` output once DB is live
// ============================================================

export type TaskStatus = 'todo' | 'doing' | 'done';
export type DailyLogStatus = 'done' | 'avoided' | 'not_reached';

// ---- Row types (what you get back from a SELECT) ----

export interface LifeArea {
  id: string;
  user_id: string;
  name: string;
  color_hex: string;
  position: number;
  is_default: boolean;
  archived_at: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  life_area_id: string;
  title: string;
  description: string | null;
  first_step: string | null;
  status: TaskStatus;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  recurrence_parent_id: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface SnoozeLog {
  id: string;
  task_id: string;
  user_id: string;
  reason: string;
  snoozed_to_time: string | null;
  created_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  task_id: string;
  status: DailyLogStatus;
  note: string | null;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  device_label: string | null;
  created_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  daily_log_time: string | null;
  timezone: string;
  paused_until: string | null;
  created_at: string;
}

// ---- Insert types (what you pass to an INSERT) ----

export interface LifeAreaInsert {
  id?: string;
  user_id: string;
  name: string;
  color_hex: string;
  position?: number;
  is_default?: boolean;
  archived_at?: string | null;
}

export interface SettingsInsert {
  id?: string;
  user_id: string;
  daily_log_time?: string | null;
  timezone?: string;
  paused_until?: string | null;
}
