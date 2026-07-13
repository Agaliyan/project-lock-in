"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Subtask, TaskStatus } from "@/lib/types/database";

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title = formData.get("title") as string;
  const life_area_id = formData.get("life_area_id") as string;
  const description = (formData.get("description") as string) || null;
  const first_step = (formData.get("first_step") as string) || null;
  const scheduled_date = (formData.get("scheduled_date") as string) || null;
  const scheduled_time = (formData.get("scheduled_time") as string) || null;
  const duration_str = formData.get("duration_minutes") as string;
  const duration_minutes = duration_str ? parseInt(duration_str, 10) : null;

  if (!title || !life_area_id) {
    return { error: "Title and life area are required" };
  }

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title,
    life_area_id,
    description,
    first_step,
    scheduled_date: scheduled_date || null,
    scheduled_time: scheduled_time || null,
    duration_minutes: duration_minutes && !isNaN(duration_minutes) ? duration_minutes : null,
    status: "todo" as TaskStatus,
    subtasks: [],
  });

  if (error) return { error: error.message };

  revalidatePath("/life-areas");
  revalidatePath(`/life-areas/${life_area_id}`);
  revalidatePath("/tasks");
  return { error: null };
}

export async function updateTask(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const id = formData.get("id") as string;
  if (!id) return { error: "Task ID is required" };

  const title = formData.get("title") as string | null;
  const life_area_id = formData.get("life_area_id") as string | null;
  const description = formData.get("description") as string | null;
  const first_step = formData.get("first_step") as string | null;
  const status = formData.get("status") as TaskStatus | null;
  const scheduled_date = formData.get("scheduled_date") as string | null;
  const scheduled_time = formData.get("scheduled_time") as string | null;
  const duration_str = formData.get("duration_minutes") as string | null;
  const subtasks_json = formData.get("subtasks") as string | null;

  // Build update object — only include fields that were provided
  const updates: Record<string, unknown> = {};

  if (title !== null) updates.title = title;
  if (life_area_id !== null) updates.life_area_id = life_area_id;
  if (formData.has("description")) updates.description = description || null;
  if (formData.has("first_step")) updates.first_step = first_step || null;
  if (formData.has("scheduled_date")) updates.scheduled_date = scheduled_date || null;
  if (formData.has("scheduled_time")) updates.scheduled_time = scheduled_time || null;
  if (formData.has("duration_minutes")) {
    const d = duration_str ? parseInt(duration_str, 10) : null;
    updates.duration_minutes = d && !isNaN(d) ? d : null;
  }
  if (status !== null) {
    updates.status = status;
    if (status === "done") {
      updates.completed_at = new Date().toISOString();
    }
    if (status === "doing") {
      updates.confirmed_at = new Date().toISOString();
    }
  }
  if (subtasks_json !== null) {
    try {
      updates.subtasks = JSON.parse(subtasks_json) as Subtask[];
    } catch {
      return { error: "Invalid subtasks format" };
    }
  }

  if (Object.keys(updates).length === 0) {
    return { error: "No fields to update" };
  }

  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/life-areas");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  return { error: null };
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/life-areas");
  revalidatePath("/tasks");
  return { error: null };
}
