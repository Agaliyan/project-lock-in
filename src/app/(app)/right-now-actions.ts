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

export async function savePushSubscription(subscription: any) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const endpoint = subscription.endpoint;
  const p256dh_key = subscription.keys?.p256dh;
  const auth_key = subscription.keys?.auth;
  // Basic device label based on user agent (optional)
  // In a server action we don't have direct access to userAgent cleanly, 
  // we could pass it from the client but let's just default to 'Web Browser'
  const device_label = "Web Browser";

  if (!endpoint || !p256dh_key || !auth_key) {
    return { error: "Invalid subscription payload" };
  }

  // Check if it exists
  const { data: existing } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("endpoint", endpoint)
    .single();

  if (existing) {
    // Already subscribed with this endpoint
    return { error: null };
  }

  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: user.id,
    endpoint,
    p256dh_key,
    auth_key,
    device_label,
  });

  if (error) return { error: error.message };

  return { error: null };
}
