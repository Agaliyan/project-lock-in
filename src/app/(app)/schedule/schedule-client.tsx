"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { TaskWithArea, LifeArea } from "@/lib/types/database";
import { UnscheduledTray } from "./unscheduled-tray";
import { ScheduleGrid } from "./schedule-grid";
import { updateTaskSchedule, detachRecurrence } from "./actions";

interface ScheduleClientProps {
  scheduledTasks: TaskWithArea[];
  unscheduledTasks: TaskWithArea[];
  lifeAreas: Pick<LifeArea, "id" | "name" | "color_hex">[];
  weekStart: string; // YYYY-MM-DD
}

export function ScheduleClient({
  scheduledTasks,
  unscheduledTasks,
  lifeAreas,
  weekStart,
}: ScheduleClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Prevent firing on simple clicks (important for resize/quick-add)
      },
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id.toString().replace("tray-task-", "").replace("task-", "");
    const targetDate = over.id.toString().replace("day-", "");
    
    // Calculate time based on vertical drop position relative to the column
    // The active.rect contains information about the dragged item's position
    // over.rect contains information about the drop target
    // We can compute the drop Y relative to the column top.
    
    // dnd-kit gives us translated coordinates.
    // 60px = 1 hour. 15px = 15 minutes.
    
    // A simpler approach for the time calculation with dnd-kit is to pass the top offset
    // but dnd-kit's active.rect is in viewport coordinates.
    const dropY = active.rect.current.translated?.top ?? 0;
    const colY = over.rect.top;
    
    let relativeY = dropY - colY;
    if (relativeY < 0) relativeY = 0;
    if (relativeY > 1440) relativeY = 1440; // 24h * 60px
    
    // Snap to 15 min (15px)
    relativeY = Math.round(relativeY / 15) * 15;
    
    const hours = Math.floor(relativeY / 60);
    const minutes = relativeY % 60;
    
    const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;

    // Overlap detection
    const taskDuration = active.data.current?.task?.duration_minutes || 30; // default 30
    
    const overlap = scheduledTasks.find(t => {
      if (t.id === taskId) return false;
      if (t.scheduled_date !== targetDate) return false;
      if (!t.scheduled_time) return false;
      
      const tHour = parseInt(t.scheduled_time.split(":")[0], 10);
      const tMin = parseInt(t.scheduled_time.split(":")[1], 10);
      const tDur = t.duration_minutes || 30;
      
      const tStartMins = tHour * 60 + tMin;
      const tEndMins = tStartMins + tDur;
      
      const newStartMins = hours * 60 + minutes;
      const newEndMins = newStartMins + taskDuration;
      
      // Check overlap
      return newStartMins < tEndMins && newEndMins > tStartMins;
    });

    if (overlap) {
      const confirm = window.confirm("This time slot overlaps with another task. Schedule anyway?");
      if (!confirm) return;
    }

    // Is it a recurring instance being dragged?
    const draggedTask = active.data.current?.task as TaskWithArea | undefined;
    
    let result;
    if (draggedTask?.recurrence_parent_id && draggedTask.recurrence_parent_id !== draggedTask.id) {
      result = await detachRecurrence(taskId, targetDate, timeString);
    } else {
      result = await updateTaskSchedule(taskId, targetDate, timeString, taskDuration);
    }

    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="flex h-[calc(100vh-73px)] w-full overflow-hidden">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <UnscheduledTray tasks={unscheduledTasks} />
        <div className="flex-1 overflow-auto bg-app-bg relative">
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded bg-red-500 px-4 py-2 text-sm text-white shadow-lg">
              {error}
              <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
            </div>
          )}
          <ScheduleGrid 
            weekStart={weekStart} 
            scheduledTasks={scheduledTasks}
            lifeAreas={lifeAreas}
          />
        </div>
      </DndContext>
    </div>
  );
}
