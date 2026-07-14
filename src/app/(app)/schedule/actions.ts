"use server";

import { revalidateAll } from "../revalidate";
import { createClient } from "@/lib/supabase/server";

export async function updateTaskSchedule(taskId: string, date: string, time: string, durationMinutes: number | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("tasks")
    .update({
      scheduled_date: date,
      scheduled_time: time,
      duration_minutes: durationMinutes,
    })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAll();
  return { error: null };
}

export async function resizeTaskDuration(taskId: string, durationMinutes: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("tasks")
    .update({ duration_minutes: durationMinutes })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAll();
  return { error: null };
}


export async function clearWeek(weekStart: string, weekEnd: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("tasks")
    .update({
      scheduled_date: null,
      scheduled_time: null,
    })
    .eq("user_id", user.id)
    .gte("scheduled_date", weekStart)
    .lte("scheduled_date", weekEnd);

  if (error) return { error: error.message };

  revalidateAll();
  return { error: null };
}
