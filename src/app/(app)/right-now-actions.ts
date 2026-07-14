"use server";

import { revalidateAll } from "./revalidate";
import { createClient } from "@/lib/supabase/server";

import { getTodayStr } from "@/lib/time";

export async function snoozeTask(
  taskId: string,
  reason: string,
  snoozedToTime: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!reason.trim()) return { error: "A reason is required" };

  let fullTimestamp = null;
  if (snoozedToTime) {
    const { data: settings } = await supabase
      .from("settings")
      .select("timezone")
      .eq("user_id", user.id)
      .single();
    
    const tz = settings?.timezone || "Asia/Colombo";
    const today = getTodayStr(tz);
    // Postgres can parse this directly into a timestamptz
    fullTimestamp = `${today} ${snoozedToTime}:00 ${tz}`;
  }

  // Insert snooze log
  const { error: logError } = await supabase.from("snooze_logs").insert({
    task_id: taskId,
    user_id: user.id,
    reason: reason.trim(),
    snoozed_to_time: fullTimestamp,
  });

  if (logError) return { error: logError.message };

  // Update the task's schedule
  if (snoozedToTime) {
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ scheduled_time: snoozedToTime })
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (updateError) return { error: updateError.message };
  } else {
    // If snoozed without a new time, remove it from the schedule 
    // so it moves to the Unscheduled Tray and leaves Right Now
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ scheduled_date: null, scheduled_time: null })
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (updateError) return { error: updateError.message };
  }

  revalidateAll();
  return { error: null };
}

export async function resumeNow() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("settings")
    .update({ paused_until: null })
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAll();
  return { error: null };
}
