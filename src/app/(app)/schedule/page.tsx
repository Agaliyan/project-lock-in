import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScheduleClient } from "./schedule-client";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 1. Determine week start (Monday)
  const resolvedParams = await searchParams;
  let weekStart = resolvedParams.week;
  if (!weekStart) {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    weekStart = d.toISOString().split("T")[0];
  }

  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const weekEnd = endDate.toISOString().split("T")[0];

  // 2. Fetch data in parallel
  const [
    { data: settings },
    { data: scheduledTasks },
    { data: unscheduledTasks },
    { data: lifeAreas }
  ] = await Promise.all([
    supabase
      .from("settings")
      .select("timezone")
      .eq("user_id", user.id)
      .single(),
    
    supabase
      .from("tasks")
      .select(`
        *,
        life_areas (id, name, color_hex)
      `)
      .eq("user_id", user.id)
      .gte("scheduled_date", weekStart)
      .lte("scheduled_date", weekEnd)
      .order("scheduled_time", { ascending: true }),
    
    supabase
      .from("tasks")
      .select(`
        *,
        life_areas (id, name, color_hex)
      `)
      .eq("user_id", user.id)
      .is("scheduled_date", null)
      .neq("status", "done")
      .order("created_at", { ascending: false }),
      
    supabase
      .from("life_areas")
      .select("id, name, color_hex")
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("position", { ascending: true })
  ]);

  const timezone = settings?.timezone || "Asia/Colombo";

  return (
    <ScheduleClient
      weekStart={weekStart}
      scheduledTasks={scheduledTasks || []}
      unscheduledTasks={unscheduledTasks || []}
      lifeAreas={lifeAreas || []}
      timezone={timezone}
    />
  );
}
