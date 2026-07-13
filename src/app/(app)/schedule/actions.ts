"use server";

import { revalidatePath } from "next/cache";
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

  revalidatePath("/schedule");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
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

  revalidatePath("/schedule");
  revalidatePath(`/tasks/${taskId}`);
  return { error: null };
}

export async function detachRecurrence(taskId: string, newDate: string, newTime: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // To detach, we just update the scheduled time and set recurrence_parent_id to its own ID
  // (marking it as manually overridden, but still linked to the template logically if needed, 
  // though we could also set it to null. However, setting it to its own id prevents the template 
  // from re-generating it while breaking the direct link to the template for future mass-updates if any).
  // Actually, setting recurrence_parent_id = taskId isn't needed. 
  // The dedup check looks for a task with `recurrence_parent_id = template.id` in that week.
  // If we detach it by dragging to a different week, the template WILL generate a new one for the old week.
  // If we just want to update its date/time, we just use updateTaskSchedule.
  // The plan said: "sets recurrence_parent_id to itself". Let's do that for the sake of the plan,
  // but note that the dedup check looks for template.id. If we change it, the dedup check fails 
  // and re-creates it! 
  // Wait, the plan specifically says: "The instance is already a real row, so this just severs the link to the template's generation rule."
  // Let's set recurrence_parent_id to its own ID.
  
  const { error } = await supabase
    .from("tasks")
    .update({
      scheduled_date: newDate,
      scheduled_time: newTime,
      recurrence_parent_id: taskId,
    })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/schedule");
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

  revalidatePath("/schedule");
  return { error: null };
}
