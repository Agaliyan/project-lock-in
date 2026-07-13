"use client";

import { useState } from "react";
import Link from "next/link";
import type { Task, LifeArea, TaskStatus } from "@/lib/types/database";

interface TaskWithJoinedArea extends Task {
  life_areas: Pick<LifeArea, "id" | "name" | "color_hex"> | null;
}

interface AllTasksClientProps {
  tasks: TaskWithJoinedArea[];
  lifeAreas: Pick<LifeArea, "id" | "name" | "color_hex">[];
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "todo", label: "To do" },
  { value: "doing", label: "In progress" },
  { value: "done", label: "Done" },
];

export function AllTasksClient({ tasks, lifeAreas }: AllTasksClientProps) {
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredTasks = tasks.filter((t) => {
    if (areaFilter !== "all" && t.life_area_id !== areaFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (dateFrom && t.scheduled_date && t.scheduled_date < dateFrom) return false;
    if (dateTo && t.scheduled_date && t.scheduled_date > dateTo) return false;
    // Include unscheduled tasks unless a date filter is active
    if ((dateFrom || dateTo) && !t.scheduled_date) return false;
    return true;
  });

  const activeFilters = [
    areaFilter !== "all",
    statusFilter !== "all",
    dateFrom !== "",
    dateTo !== "",
  ].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
          All Tasks
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
          {activeFilters > 0 && ` (filtered)`}
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {/* Life area filter */}
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="hover-border bg-card px-3 py-1.5 text-xs text-text-primary focus:outline-none"
        >
          <option value="all">All areas</option>
          {lifeAreas.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="hover-border bg-card px-3 py-1.5 text-xs text-text-primary focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="hover-border bg-card px-2 py-1.5 text-xs text-text-primary focus:outline-none"
            aria-label="From date"
          />
          <span className="text-xs text-text-muted">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="hover-border bg-card px-2 py-1.5 text-xs text-text-primary focus:outline-none"
            aria-label="To date"
          />
        </div>

        {activeFilters > 0 && (
          <button
            onClick={() => {
              setAreaFilter("all");
              setStatusFilter("all");
              setDateFrom("");
              setDateTo("");
            }}
            className="text-xs text-text-muted transition-colors hover:text-text-secondary"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm text-text-muted">
            {tasks.length === 0
              ? "No tasks yet. Create one from a Life Area page."
              : "No tasks match the current filters."}
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
              {/* Life area color dot */}
              {task.life_areas && (
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: task.life_areas.color_hex }}
                />
              )}
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
                {task.life_areas && (
                  <span className="ml-2 text-xs text-text-muted">
                    {task.life_areas.name}
                  </span>
                )}
              </div>
              {task.scheduled_date && (
                <span className="font-data text-[11px] text-text-muted">
                  {task.scheduled_date}
                  {task.scheduled_time && ` · ${task.scheduled_time.slice(0, 5)}`}
                </span>
              )}
              <span
                className={`font-data text-[10px] uppercase tracking-wider ${
                  task.status === "done"
                    ? "text-green-500/60"
                    : task.status === "doing"
                      ? "text-amber-400/60"
                      : "text-text-muted"
                }`}
              >
                {task.status === "todo" ? "To do" : task.status === "doing" ? "Doing" : "Done"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
