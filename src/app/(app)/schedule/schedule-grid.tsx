"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { TaskWithArea, LifeArea } from "@/lib/types/database";
import { QuickAddModal } from "@/components/quick-add-modal";
import { clearWeek, resizeTaskDuration } from "./actions";
import { getTodayStr, getNowHourMinute } from "@/lib/time";

interface ScheduleGridProps {
  weekStart: string;
  scheduledTasks: TaskWithArea[];
  lifeAreas: Pick<LifeArea, "id" | "name" | "color_hex">[];
  timezone: string;
}

// 60px = 1 hour
const PIXELS_PER_HOUR = 60;
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;

function TaskBlock({ task, router }: { task: TaskWithArea, router: any }) {
  const [isResizing, setIsResizing] = useState(false);
  const [localDuration, setLocalDuration] = useState(task.duration_minutes || 30);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { type: "GridTask", task },
  });

  const hour = parseInt(task.scheduled_time?.split(":")[0] || "0", 10);
  const min = parseInt(task.scheduled_time?.split(":")[1] || "0", 10);
  const topOffset = (hour * 60 + min) * PIXELS_PER_MINUTE;
  const height = localDuration * PIXELS_PER_MINUTE;

  const style: React.CSSProperties = {
    position: "absolute",
    top: `${topOffset}px`,
    height: `${height}px`,
    left: "4px",
    right: "4px",
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : (task.status === "done" ? 0.4 : 1),
    textDecoration: task.status === "done" ? "line-through" : "none",
    zIndex: isDragging ? 40 : 10,
    backgroundColor: task.life_areas?.color_hex || "#8B8B8B",
    borderRadius: "6px",
    padding: "4px 8px",
    overflow: "hidden",
    cursor: "grab",
    userSelect: "none",
  };

  // Resize handler
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    
    const startY = e.clientY;
    const startDuration = localDuration;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaMins = Math.round(deltaY / PIXELS_PER_MINUTE);
      let newDur = startDuration + deltaMins;
      // Snap to 15 min
      newDur = Math.round(newDur / 15) * 15;
      if (newDur < 15) newDur = 15;
      setLocalDuration(newDur);
    };

    const handleMouseUp = async () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      
      // Update DB if changed
      if (localDuration !== startDuration) {
        // We use functional state to get the latest localDuration? 
        // Actually, localDuration might be stale in this closure.
        // Let's rely on the final state value.
        // Or better, we calculate it again or use a ref.
      }
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };
  
  // To avoid stale closure on mouseup, we can just use a ref for the latest duration
  const durationRef = useRef(localDuration);
  useEffect(() => {
    durationRef.current = localDuration;
  }, [localDuration]);
  
  // Let's re-attach mouseup differently to have access to the latest duration
  useEffect(() => {
    if (!isResizing) {
      if (durationRef.current !== (task.duration_minutes || 30)) {
        resizeTaskDuration(task.id, durationRef.current);
      }
    }
  }, [isResizing, task.id, task.duration_minutes]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`text-xs text-white shadow-sm ${isDragging ? "shadow-md" : ""} transition-colors hover:brightness-110 active:cursor-grabbing cursor-pointer`}
      onClick={() => {
        if (!isDragging) {
          router.push(`/tasks/${task.id}`);
        }
      }}
    >
      <div className={`font-semibold leading-tight line-clamp-1 ${task.status === "done" ? "text-white/60" : ""}`}>{task.title}</div>
      <div className={`flex items-center gap-1 mt-0.5 opacity-80 ${task.status === "done" ? "text-white/60" : ""}`}>
        <span className="font-data text-[9px] uppercase tracking-wider">{localDuration}m</span>
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize"
        onMouseDown={handleResizeStart}
        // Prevents dnd-kit drag from starting when dragging the resize handle
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-1 h-0.5 w-6 rounded-full bg-white/30" />
      </div>
    </div>
  );
}

function DayColumn({ date, label, tasks, onClickSlot, router, timezone }: { date: string, label: string, tasks: TaskWithArea[], onClickSlot: (date: string, hour: number) => void, router: any, timezone: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${date}`,
  });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger if clicking on the background, not a task
    if (e.target === e.currentTarget) {
      // Calculate clicked hour
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const hour = Math.floor(y / PIXELS_PER_HOUR);
      onClickSlot(date, hour);
    }
  };

  return (
    <div className="flex flex-col border-r border-border-default min-w-[120px]">
      <div className="sticky top-0 z-20 h-10 flex items-center justify-center border-b border-border-default bg-app-bg text-center text-sm font-medium text-text-secondary">
        {label}
      </div>
      <div 
        ref={setNodeRef}
        onClick={handleClick}
        className={`relative flex-1 ${isOver ? "bg-border-default/10" : ""}`}
        style={{ height: `${24 * PIXELS_PER_HOUR}px` }}
      >
        {/* Hour lines */}
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-border-default/30 pointer-events-none"
            style={{ top: `${i * PIXELS_PER_HOUR}px`, height: '1px' }}
          />
        ))}

        {tasks.map(t => <TaskBlock key={t.id} task={t} router={router} />)}

        {getTodayStr(timezone) === date && (
          <CurrentTimeLine timezone={timezone} />
        )}
      </div>
    </div>
  );
}

function CurrentTimeLine({ timezone }: { timezone: string }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { hour, minute } = getNowHourMinute(timezone, now);
  const top = (hour * 60 + minute) * PIXELS_PER_MINUTE;

  return (
    <div 
      className="absolute z-30 pointer-events-none flex items-center left-0 right-0"
      style={{ 
        top: `${top}px`, 
        marginTop: '-4px' 
      }}
    >
      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shadow-sm shadow-red-500/50" />
      <div className="flex-1 border-t-2 border-red-500 shadow-sm shadow-red-500/50" />
    </div>
  );
}

export function ScheduleGrid({ weekStart, scheduledTasks, lifeAreas, timezone }: ScheduleGridProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Quick-Add state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [qaDate, setQaDate] = useState("");
  const [qaTime, setQaTime] = useState("");

  const startDate = new Date(weekStart);
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("en-US", { weekday: 'short', month: 'numeric', day: 'numeric' }),
    };
  });

  const endDateStr = days[6].date;

  // Scroll to current hour on mount
  useEffect(() => {
    if (scrollRef.current) {
      const { hour } = getNowHourMinute(timezone, new Date());
      // Scroll to a bit above current hour, capped at 0
      const targetScroll = Math.max(0, (hour - 1) * PIXELS_PER_HOUR);
      scrollRef.current.scrollTop = targetScroll;
    }
  }, [weekStart, timezone]);

  const handleNav = (offsetDays: number) => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + offsetDays);
    router.push(`/schedule?week=${newStart.toISOString().split("T")[0]}`);
  };

  const handleClearWeek = async () => {
    const confirm = window.confirm("Are you sure you want to unschedule all tasks for this week? They will be moved to the unscheduled tray.");
    if (!confirm) return;
    await clearWeek(weekStart, endDateStr);
  };

  const handleSlotClick = (date: string, hour: number) => {
    setQaDate(date);
    setQaTime(`${hour.toString().padStart(2, "0")}:00`);
    setQuickAddOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
        <div className="flex items-center gap-4">
          <h2 className="font-display text-xl font-semibold tracking-tight text-text-primary">
            Schedule
          </h2>
          <div className="flex items-center gap-2 rounded-lg bg-card p-1">
            <button
              onClick={() => handleNav(-7)}
              className="rounded p-1 text-text-muted hover:bg-card-alt hover:text-text-primary"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button
              onClick={() => {
                // Get nearest Monday
                const d = new Date();
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                d.setDate(diff);
                router.push(`/schedule?week=${d.toISOString().split("T")[0]}`);
              }}
              className="px-2 py-1 text-xs font-medium text-text-secondary hover:text-text-primary"
            >
              Today
            </button>
            <button
              onClick={() => handleNav(7)}
              className="rounded p-1 text-text-muted hover:bg-card-alt hover:text-text-primary"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <span className="font-data text-xs text-text-muted">
            {days[0].label} – {days[6].label}
          </span>
        </div>
        <button
          onClick={handleClearWeek}
          className="hover-border bg-card px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          Clear Week
        </button>
      </div>

      {/* Grid container */}
      <div ref={scrollRef} className="flex-1 overflow-auto custom-scrollbar relative">
        <div className="flex min-w-[900px]">
          {/* Time axis */}
          <div className="w-[60px] flex-shrink-0 border-r border-border-default pt-9">
            {Array.from({ length: 24 }).map((_, i) => (
              <div 
                key={i} 
                className="relative text-right pr-2 font-data text-[10px] text-text-muted"
                style={{ height: `${PIXELS_PER_HOUR}px` }}
              >
                <span className="absolute -top-2.5 right-2 bg-app-bg px-1">
                  {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex flex-1 relative">
            {days.map(day => (
              <DayColumn 
                key={day.date} 
                date={day.date} 
                label={day.label} 
                tasks={scheduledTasks.filter(t => t.scheduled_date === day.date)}
                onClickSlot={handleSlotClick}
                router={router}
                timezone={timezone}
              />
            ))}
          </div>
        </div>
      </div>

      <QuickAddModal 
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        lifeAreas={lifeAreas}
        defaultDate={qaDate}
        defaultTime={qaTime}
      />
    </div>
  );
}
