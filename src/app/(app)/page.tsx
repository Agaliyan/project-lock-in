import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTodayStr, getNowTimeStr } from "@/lib/time";
import { RightNowClient } from "./right-now-client";

export default async function RightNowPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── 1. Settings ──
  const { data: settings } = await supabase
    .from("settings")
    .select("timezone, paused_until")
    .eq("user_id", user.id)
    .single();

  const timezone = settings?.timezone || "Asia/Colombo";
  const pausedUntil = settings?.paused_until || null;

  // ── 2. Compute "today" and "now" in the user's timezone ──
  const now = new Date();
  const todayStr = getTodayStr(timezone, now);
  const nowTimeStr = getNowTimeStr(timezone, now);

  // ── 3. Parallelize remaining task queries ──
  const [
    { data: currentTaskData },
    { count: totalOverdue },
    { data: laterTodayData },
    { data: confirmedTasks },
    { data: doingTasksData }
  ] = await Promise.all([
    // Current task
    supabase
      .from("tasks")
      .select("*, life_areas(id, name, color_hex)")
      .eq("user_id", user.id)
      .eq("status", "todo")
      .not("scheduled_date", "is", null)
      .not("scheduled_time", "is", null)
      .or(`scheduled_date.lt.${todayStr},and(scheduled_date.eq.${todayStr},scheduled_time.lte.${nowTimeStr})`)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true })
      .limit(1),

    // Backlog count
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "todo")
      .not("scheduled_date", "is", null)
      .not("scheduled_time", "is", null)
      .or(`scheduled_date.lt.${todayStr},and(scheduled_date.eq.${todayStr},scheduled_time.lte.${nowTimeStr})`),

    // Later today
    supabase
      .from("tasks")
      .select("*, life_areas(id, name, color_hex)")
      .eq("user_id", user.id)
      .eq("status", "todo")
      .eq("scheduled_date", todayStr)
      .gt("scheduled_time", nowTimeStr)
      .order("scheduled_time", { ascending: true })
      .limit(4),

    // Confirmed tasks (for streak)
    supabase
      .from("tasks")
      .select("confirmed_at")
      .eq("user_id", user.id)
      .not("confirmed_at", "is", null),

    // Doing tasks
    supabase
      .from("tasks")
      .select("*, life_areas(id, name, color_hex)")
      .eq("user_id", user.id)
      .eq("status", "doing")
      .order("confirmed_at", { ascending: true })
  ]);

  const currentTask = currentTaskData?.[0] || null;
  const backlogCount = Math.max(0, (totalOverdue || 0) - (currentTask ? 1 : 0));
  const laterToday = laterTodayData || [];

  let nextUpcomingTask = null;
  let upNextTasks;

  if (currentTask) {
    upNextTasks = laterToday.slice(0, 3);
  } else {
    nextUpcomingTask = laterToday[0] || null;
    upNextTasks = laterToday.slice(1, 4);
  }

  let streakDays = 0;
  if (confirmedTasks && confirmedTasks.length > 0) {
    const confirmedDates = new Set(
      confirmedTasks.map((t) => {
        const d = new Date(t.confirmed_at!);
        return new Intl.DateTimeFormat("en-CA", {
          timeZone: timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(d);
      })
    );

    const addDays = (dateStr: string, days: number): string => {
      const [y, m, d] = dateStr.split("-").map(Number);
      const date = new Date(y, m - 1, d + days);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    };

    let checkDate = todayStr;
    while (confirmedDates.has(checkDate)) {
      streakDays++;
      checkDate = addDays(checkDate, -1);
    }
  }

  const doingTasks = doingTasksData || [];

  return (
    <RightNowClient
      doingTasks={doingTasks}
      currentTask={currentTask}
      backlogCount={backlogCount}
      nextUpcomingTask={currentTask ? null : nextUpcomingTask}
      upNextTasks={upNextTasks}
      streakDays={streakDays}
      pausedUntil={pausedUntil}
    />
  );
}
