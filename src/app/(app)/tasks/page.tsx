import { createClient } from "@/lib/supabase/server";
import type { Task, LifeArea } from "@/lib/types/database";
import { AllTasksClient } from "./all-tasks-client";

export default async function AllTasksPage() {
  const supabase = await createClient();

  // Fetch all tasks with their life area info
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, life_areas(id, name, color_hex)")
    .order("scheduled_date", { ascending: true, nullsFirst: false })
    .order("scheduled_time", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  // Fetch non-archived life areas for filter dropdown
  const { data: lifeAreas } = await supabase
    .from("life_areas")
    .select("id, name, color_hex")
    .is("archived_at", null)
    .order("position", { ascending: true }) as { data: Pick<LifeArea, "id" | "name" | "color_hex">[] | null };

  // Type the joined result
  interface TaskWithJoinedArea extends Task {
    life_areas: Pick<LifeArea, "id" | "name" | "color_hex"> | null;
  }

  return (
    <AllTasksClient
      tasks={(tasks as TaskWithJoinedArea[] | null) ?? []}
      lifeAreas={lifeAreas ?? []}
    />
  );
}
