import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Task, LifeArea, SnoozeLog } from "@/lib/types/database";
import { TaskDetailForm } from "./task-detail-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the task
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single() as { data: Task | null };

  if (!task) notFound();

  // Fetch all non-archived life areas for the picker
  const { data: lifeAreas } = await supabase
    .from("life_areas")
    .select("id, name, color_hex")
    .is("archived_at", null)
    .order("position", { ascending: true }) as { data: Pick<LifeArea, "id" | "name" | "color_hex">[] | null };

  // Fetch snooze history for this task
  const { data: snoozeLogs } = await supabase
    .from("snooze_logs")
    .select("*")
    .eq("task_id", id)
    .order("created_at", { ascending: false }) as { data: SnoozeLog[] | null };

  return (
    <TaskDetailForm
      task={task}
      lifeAreas={lifeAreas ?? []}
      snoozeLogs={snoozeLogs ?? []}
    />
  );
}
