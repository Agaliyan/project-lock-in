import { SupabaseClient } from "@supabase/supabase-js";
import type { TaskInsert } from "../types/database";

/**
 * Materializes recurring task instances for a given week.
 * This is the on-page-load safety net (the main guarantee is the pg_cron job).
 */
export async function materializeWeekInstances(
  supabase: SupabaseClient,
  userId: string,
  weekStart: string, // YYYY-MM-DD
  weekEnd: string    // YYYY-MM-DD
) {
  // 1. Fetch all recurring templates for the user
  const { data: templates } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("is_recurring", true)
    .not("recurrence_rule", "is", null);

  if (!templates || templates.length === 0) {
    return 0;
  }

  let createdCount = 0;

  for (const template of templates) {
    // Parse rule, e.g. "weekly:mon:18:00"
    const ruleParts = template.recurrence_rule.split(":");
    if (ruleParts.length < 4 || ruleParts[0] !== "weekly") continue;

    const dayName = ruleParts[1].toLowerCase();
    const timeStr = `${ruleParts[2]}:${ruleParts[3]}`;

    // Map day to offset from Monday (weekStart is always Monday in our setup)
    const dayOffsets: Record<string, number> = {
      mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6
    };
    const offset = dayOffsets[dayName];
    if (offset === undefined) continue;

    // Calculate target date (YYYY-MM-DD)
    const startDate = new Date(weekStart);
    const targetDateObj = new Date(startDate);
    targetDateObj.setDate(targetDateObj.getDate() + offset);
    const targetDate = targetDateObj.toISOString().split("T")[0];

    // 2. Dedup check: does an instance exist for this template in this week?
    const { data: existing } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", userId)
      .eq("recurrence_parent_id", template.id)
      .gte("scheduled_date", weekStart)
      .lte("scheduled_date", weekEnd)
      .limit(1);

    if (existing && existing.length > 0) {
      continue; // Already materialized or moved within the week
    }

    // 3. Create instance
    const newInstance: TaskInsert = {
      user_id: userId,
      life_area_id: template.life_area_id,
      title: template.title,
      description: template.description,
      first_step: template.first_step,
      status: "todo",
      duration_minutes: template.duration_minutes,
      is_recurring: false,
      recurrence_parent_id: template.id,
      scheduled_date: targetDate,
      scheduled_time: timeStr,
      subtasks: template.subtasks || [],
    };

    const { error } = await supabase.from("tasks").insert(newInstance);
    if (!error) {
      createdCount++;
    } else {
      console.error("Failed to materialize task instance:", error);
    }
  }

  return createdCount;
}
