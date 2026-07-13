"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { TaskWithArea } from "@/lib/types/database";

interface UnscheduledTrayProps {
  tasks: TaskWithArea[];
}

function TrayTask({ task }: { task: TaskWithArea }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tray-task-${task.id}`,
    data: {
      type: "TrayTask",
      task,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`hover-border mb-2 cursor-grab bg-card p-3 text-sm transition-colors active:cursor-grabbing ${
        isDragging ? "shadow-lg z-50 relative" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {task.life_areas && (
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: task.life_areas.color_hex }}
          />
        )}
        <span className="font-medium text-text-primary line-clamp-1">
          {task.title}
        </span>
      </div>
      <span className="font-data text-[10px] uppercase text-text-muted">
        {task.duration_minutes ? `${task.duration_minutes}m` : "No duration"}
      </span>
    </div>
  );
}

export function UnscheduledTray({ tasks }: UnscheduledTrayProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r border-border-default bg-app-bg px-4 py-4">
      <h3 className="font-display text-lg font-semibold tracking-tight text-text-primary mb-4">
        Unscheduled
      </h3>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {tasks.length === 0 ? (
          <p className="text-xs text-text-muted text-center mt-8">
            No unscheduled tasks.
          </p>
        ) : (
          tasks.map((task) => <TrayTask key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
