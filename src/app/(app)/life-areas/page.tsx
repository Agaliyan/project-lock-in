import { createClient } from "@/lib/supabase/server";
import type { LifeArea } from "@/lib/types/database";
import { LifeAreasGrid } from "./life-areas-grid";

export default async function LifeAreasPage() {
  const supabase = await createClient();

  // Fetch non-archived life areas with task counts
  const { data: lifeAreas } = await supabase
    .from("life_areas")
    .select("*")
    .is("archived_at", null)
    .order("position", { ascending: true }) as { data: LifeArea[] | null };

  // Fetch task counts per area (only non-done tasks)
  const areas = lifeAreas ?? [];
  const areaIds = areas.map((a) => a.id);

  let taskCounts: Record<string, number> = {};
  if (areaIds.length > 0) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("life_area_id")
      .in("life_area_id", areaIds)
      .neq("status", "done");

    if (tasks) {
      taskCounts = tasks.reduce<Record<string, number>>((acc, t) => {
        const areaId = t.life_area_id as string;
        acc[areaId] = (acc[areaId] || 0) + 1;
        return acc;
      }, {});
    }
  }

  const areasWithCounts = areas.map((area) => ({
    ...area,
    task_count: taskCounts[area.id] || 0,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
          Life Areas
        </h2>
      </div>
      <LifeAreasGrid areas={areasWithCounts} />
    </div>
  );
}
