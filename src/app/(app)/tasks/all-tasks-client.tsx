"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteTasks } from "./actions";
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
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)));
    } else {
      setSelectedTaskIds(new Set());
    }
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedTaskIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedTaskIds.size === 0) return;
    const confirm = window.confirm(`Are you sure you want to delete ${selectedTaskIds.size} selected tasks?`);
    if (!confirm) return;

    setIsDeleting(true);
    const result = await deleteTasks(Array.from(selectedTaskIds));
    setIsDeleting(false);
    
    if (!result?.error) {
      setIsSelectionMode(false);
      setSelectedTaskIds(new Set());
    }
  };

  // Group tasks by date
  const tasksByDate = filteredTasks.reduce((acc, task) => {
    const key = task.scheduled_date || "unscheduled";
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {} as Record<string, typeof filteredTasks>);

  // Sort dates chronologically, putting unscheduled at the end
  const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
    if (a === "unscheduled") return 1;
    if (b === "unscheduled") return -1;
    return a.localeCompare(b);
  });

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === "unscheduled") return "Unscheduled";
    // Parse "YYYY-MM-DD" as local date to prevent timezone shift
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
            All Tasks
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
            {activeFilters > 0 && ` (filtered)`}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
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
        
        {!isSelectionMode && filteredTasks.length > 0 && (
          <button
            onClick={() => setIsSelectionMode(true)}
            className="hover-border bg-card px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Select
          </button>
        )}
      </div>

      {/* Bulk actions (Selection Mode) */}
      {isSelectionMode && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-border-default bg-card px-4 py-2">
          <label className="flex items-center gap-2 text-sm font-medium text-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={filteredTasks.length > 0 && selectedTaskIds.size === filteredTasks.length}
              onChange={handleSelectAll}
              className="rounded border-border-default bg-app-bg text-text-secondary focus:ring-0"
            />
            Select All
          </label>
          
          <div className="flex items-center gap-3">
            {selectedTaskIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:text-red-300 disabled:opacity-50 border border-red-500/30 bg-red-500/10 rounded"
              >
                {isDeleting ? "Deleting..." : `Delete selected (${selectedTaskIds.size})`}
              </button>
            )}
            <button
              onClick={handleCancelSelection}
              disabled={isDeleting}
              className="text-xs text-text-muted hover:text-text-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task list grouped by date */}
      {filteredTasks.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm text-text-muted">
            {tasks.length === 0
              ? "No tasks yet. Create one from a Life Area page."
              : "No tasks match the current filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(dateKey => {
            const dateTasks = tasksByDate[dateKey];
            return (
              <div key={dateKey}>
                <h3 className="mb-2 text-sm font-semibold text-text-secondary">
                  {formatDateLabel(dateKey)}
                </h3>
                <div className="space-y-2">
                  {dateTasks.map((task) => (
                    <div
                      key={task.id}
                      className="hover-border flex items-center bg-card transition-colors"
                    >
                      {isSelectionMode && (
                        <div className="pl-4 pr-1 py-3 flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.has(task.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedTaskIds);
                              if (e.target.checked) newSet.add(task.id);
                              else newSet.delete(task.id);
                              setSelectedTaskIds(newSet);
                            }}
                            className="rounded border-border-default bg-app-bg text-text-secondary focus:ring-0"
                          />
                        </div>
                      )}
                      <Link
                        href={`/tasks/${task.id}`}
                        className={`flex flex-1 items-center gap-3 py-3 pr-4 min-w-0 ${isSelectionMode ? "pl-2" : "pl-4"}`}
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
                        {task.scheduled_time && (
                          <span className="font-data text-[11px] text-text-muted">
                            {task.scheduled_time.slice(0, 5)}
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
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
