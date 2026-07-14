// ============================================================
// Lock In — Database Types (hand-written, mirrors migration)
// Replace with `supabase gen types` output once DB is live
// ============================================================

export type TaskStatus = 'todo' | 'doing' | 'done';
export type DailyLogStatus = 'done' | 'avoided' | 'not_reached';

// ---- Subtask type (stored as JSONB in tasks.subtasks) ----

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

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
  actual_duration_minutes: number | null;
  subtasks: Subtask[];
  confirmed_at: string | null;
  completed_at: string | null;
  created_at: string;
}

/** Task with its life area joined */
export interface TaskWithArea extends Task {
  life_areas: Pick<LifeArea, 'id' | 'name' | 'color_hex'>;
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

// ---- Insert / Update types ----

export interface LifeAreaInsert {
  id?: string;
  user_id: string;
  name: string;
  color_hex: string;
  position?: number;
  is_default?: boolean;
  archived_at?: string | null;
}

export interface LifeAreaUpdate {
  name?: string;
  color_hex?: string;
  position?: number;
  archived_at?: string | null;
}

export interface TaskInsert {
  user_id: string;
  life_area_id: string;
  title: string;
  description?: string | null;
  first_step?: string | null;
  status?: TaskStatus;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  duration_minutes?: number | null;
  subtasks?: Subtask[];
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  first_step?: string | null;
  life_area_id?: string;
  status?: TaskStatus;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  duration_minutes?: number | null;
  actual_duration_minutes?: number | null;
  subtasks?: Subtask[];
  confirmed_at?: string | null;
  completed_at?: string | null;
}

export interface SettingsInsert {
  id?: string;
  user_id: string;
  daily_log_time?: string | null;
  timezone?: string;
  paused_until?: string | null;
}

// ---- Life area with task count (for list page) ----

export interface LifeAreaWithCount extends LifeArea {
  task_count: number;
}

// ---- Preset color palette for life area picker ----

export const AREA_COLOR_PALETTE = [
  '#8B8B8B', // gray
  '#6C9BCF', // blue
  '#C084FC', // purple
  '#F59E42', // orange
  '#4ADE80', // green
  '#F87171', // red
  '#38BDF8', // sky
  '#FBBF24', // amber
  '#A78BFA', // violet
  '#FB923C', // tangerine
  '#34D399', // emerald
  '#F472B6', // pink
] as const;
