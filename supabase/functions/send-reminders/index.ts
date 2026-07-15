import * as webPush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getTodayStr, getNowHourMinute } from "../_shared/time.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const VAPID_PUBLIC_KEY = Deno.env.get("NEXT_PUBLIC_VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    "mailto:admin@lockin.local",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
} else {
  console.warn("VAPID keys missing. Push notifications won't work.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  try {
    // 1. Fetch tasks that are 'todo' and scheduled
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "todo")
      .not("scheduled_date", "is", null)
      .not("scheduled_time", "is", null);

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      return new Response("Error fetching tasks", { status: 500 });
    }

    if (!tasks || tasks.length === 0) {
      return new Response("No tasks to process", { status: 200 });
    }

    const userIds = [...new Set(tasks.map(t => t.user_id))];

    // 2. Fetch settings for these users
    const { data: settings } = await supabase
      .from("settings")
      .select("*")
      .in("user_id", userIds);

    const settingsByUserId = new Map((settings || []).map(s => [s.user_id, s]));

    // 3. Fetch push subscriptions for these users
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    const subsByUserId = new Map();
    for (const sub of (subscriptions || [])) {
      if (!subsByUserId.has(sub.user_id)) subsByUserId.set(sub.user_id, []);
      subsByUserId.get(sub.user_id).push(sub);
    }

    const nowUTC = new Date();
    const notificationsToSend = [];

    // 4. Process each task
    for (const task of tasks) {
      const userSettings = settingsByUserId.get(task.user_id);
      if (!userSettings) continue;

      if (userSettings.paused_until && new Date(userSettings.paused_until) > nowUTC) {
        continue; // Reminders paused for this user
      }

      const tz = userSettings.timezone || "Asia/Colombo";
      const today = getTodayStr(tz, nowUTC);
      const { hour, minute } = getNowHourMinute(tz, nowUTC);

      const taskDate = task.scheduled_date;
      const taskTimeParts = task.scheduled_time.split(":");
      const taskHour = parseInt(taskTimeParts[0], 10);
      const taskMinute = parseInt(taskTimeParts[1], 10);

      // Ensure exact minute match
      if (taskDate === today && taskHour === hour && taskMinute === minute) {
        const userSubs = subsByUserId.get(task.user_id) || [];
        for (const sub of userSubs) {
          if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) continue;
          
          notificationsToSend.push(
            webPush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh_key,
                  auth: sub.auth_key,
                },
              },
              JSON.stringify({
                title: task.title,
                taskId: task.id,
              })
            ).catch(err => {
              console.error(`Error sending push to ${sub.endpoint}:`, err);
            })
          );
        }
      }
    }

    await Promise.all(notificationsToSend);
    return new Response(`Processed tasks, sent ${notificationsToSend.length} notifications`, { status: 200 });

  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
