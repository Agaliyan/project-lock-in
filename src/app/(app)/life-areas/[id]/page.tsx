import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LifeArea, Task } from "@/lib/types/database";
import { AreaPageClient } from "./area-page-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LifeAreaPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the life area
  const { data: area } = await supabase
    .from("life_areas")
    .select("*")
    .eq("id", id)
    .single() as { data: LifeArea | null };

  if (!area) notFound();

  // Fetch tasks for this area, sorted by scheduled_date (nulls last)
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("life_area_id", id)
    .order("scheduled_date", { ascending: true, nullsFirst: false })
    .order("scheduled_time", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false }) as { data: Task[] | null };

  // Fetch all non-archived areas for the Quick-Add picker
  const { data: allAreas } = await supabase
    .from("life_areas")
    .select("id, name, color_hex")
    .is("archived_at", null)
    .order("position", { ascending: true }) as { data: Pick<LifeArea, "id" | "name" | "color_hex">[] | null };

  return (
    <AreaPageClient
      area={area}
      tasks={tasks ?? []}
      allAreas={allAreas ?? []}
    />
  );
}
