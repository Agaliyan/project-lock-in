"use client";

import { useState } from "react";
import Link from "next/link";
import type { LifeArea, Task } from "@/lib/types/database";
import { QuickAddModal } from "@/components/quick-add-modal";
import { AreaSettings } from "./area-settings";

interface AreaPageClientProps {
  area: LifeArea;
  tasks: Task[];
  allAreas: Pick<LifeArea, "id" | "name" | "color_hex">[];
}

const STATUS_LABELS: Record<string, string> = {
  todo: "To do",
  doing: "In progress",
  done: "Done",
};

export function AreaPageClient({ area, tasks, allAreas }: AreaPageClientProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const filteredTasks = showCompleted
    ? tasks
    : tasks.filter((t) => t.status !== "done");

  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Area header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/life-areas"
            className="text-text-muted transition-colors hover:text-text-primary"
            aria-label="Back to life areas"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 4L7 10l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span
            className="inline-block h-3.5 w-3.5 shrink-0 rounded-full"
            style={{ backgroundColor: area.color_hex }}
          />
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
            {area.name}
          </h2>
          {area.is_default && (
            <span className="font-data text-[10px] uppercase tracking-wider text-text-muted">
              Protected
            </span>
          )}
        </div>
        {!area.is_default && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="hover-border bg-card px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Settings
          </button>
        )}
      </div>

      {/* Area settings panel */}
      {showSettings && !area.is_default && (
        <AreaSettings area={area} onClose={() => setShowSettings(false)} />
      )}

      {/* Controls bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQuickAdd(true)}
            className="hover-border flex items-center gap-1.5 bg-card px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add Task
          </button>
        </div>

        {doneCount > 0 && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-xs text-text-muted transition-colors hover:text-text-secondary"
          >
            {showCompleted ? "Hide completed" : `Show completed (${doneCount})`}
          </button>
        )}
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm text-text-muted">
            {tasks.length === 0
              ? "No tasks yet. Add one to get started."
              : "All tasks completed. Nice work."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="hover-border flex items-center gap-3 bg-card px-4 py-3 transition-colors"
            >
              {/* Status dot */}
              <span
                className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                  task.status === "done"
                    ? "bg-green-500/60"
                    : task.status === "doing"
                      ? "bg-amber-400/60"
                      : "bg-text-muted/40"
                }`}
              />
              <div className="min-w-0 flex-1">
                <span
                  className={`text-sm font-medium ${
                    task.status === "done"
                      ? "text-text-muted line-through"
                      : "text-text-primary"
                  }`}
                >
                  {task.title}
                </span>
              </div>
              {task.scheduled_date && (
                <span className="font-data text-[11px] text-text-muted">
                  {task.scheduled_date}
                  {task.scheduled_time && ` · ${task.scheduled_time.slice(0, 5)}`}
                </span>
              )}
              <span className="font-data text-[10px] uppercase tracking-wider text-text-muted">
                {STATUS_LABELS[task.status]}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Quick-Add modal */}
      <QuickAddModal
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        lifeAreas={allAreas}
        defaultAreaId={area.id}
      />
    </div>
  );
}
