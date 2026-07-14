"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateTask } from "./tasks/actions";
import { resumeNow } from "./right-now-actions";
import { SnoozeModal } from "./snooze-modal";
import type { TaskWithArea } from "@/lib/types/database";

interface RightNowClientProps {
  doingTasks: TaskWithArea[];
  currentTask: TaskWithArea | null;
  backlogCount: number;
  nextUpcomingTask: TaskWithArea | null;
  upNextTasks: TaskWithArea[];
  streakDays: number;
  pausedUntil: string | null;
}

function LiveTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const start = new Date(startTime).getTime();
    
    const update = () => {
      const now = Date.now();
      const diffMs = Math.max(0, now - start);
      
      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      const pad = (n: number) => n.toString().padStart(2, "0");
      
      if (hours > 0) {
        setElapsed(`${hours}:${pad(minutes)}:${pad(seconds)}`);
      } else {
        setElapsed(`${pad(minutes)}:${pad(seconds)}`);
      }
    };
    
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <span className="font-data text-sm text-text-primary tracking-wider">{elapsed}</span>;
}

export function RightNowClient({
  doingTasks,
  currentTask,
  backlogCount,
  nextUpcomingTask,
  upNextTasks,
  streakDays,
  pausedUntil,
}: RightNowClientProps) {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedUpNext, setExpandedUpNext] = useState<Set<string>>(new Set());

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        router.refresh();
      }, 60_000);
    };
    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        startPolling();
      } else {
        stopPolling();
      }
    };
    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [router]);

  const handleConfirm = useCallback(async () => {
    if (!currentTask || !isDesktop) return;
    setActionLoading("confirm");
    const fd = new FormData();
    fd.set("id", currentTask.id);
    fd.set("status", "doing");
    await updateTask(fd);
    setActionLoading(null);
  }, [currentTask, isDesktop]);

  const handleDone = useCallback(async (taskToComplete: TaskWithArea) => {
    setActionLoading(`done-${taskToComplete.id}`);
    const fd = new FormData();
    fd.set("id", taskToComplete.id);
    fd.set("status", "done");
    await updateTask(fd);
    setActionLoading(null);
  }, []);

  const handleResume = useCallback(async () => {
    setActionLoading("resume");
    await resumeNow();
    setActionLoading(null);
  }, []);

  const toggleUpNext = (id: string) => {
    setExpandedUpNext((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isPaused = pausedUntil && new Date(pausedUntil) > new Date();

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-text-primary mb-6">
        Right Now
      </h2>

      {/* ─── Pause banner ─── */}
      {isPaused && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-400/90">Reminders paused</p>
              <p className="mt-0.5 font-data text-xs text-text-muted">
                Resumes {new Date(pausedUntil!).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <button
              onClick={handleResume}
              disabled={actionLoading === "resume"}
              className="hover-border bg-card px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary disabled:opacity-50"
            >
              {actionLoading === "resume" ? "Resuming…" : "Resume now"}
            </button>
          </div>
        </div>
      )}

      {/* ─── Doing Panel ─── */}
      {doingTasks.length > 0 && (
        <div className="mb-6 space-y-3">
          {doingTasks.map((doingTask) => (
            <div key={doingTask.id} className="rounded-xl border border-border-strong bg-card-alt p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 items-center justify-center">
                  <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full opacity-75" style={{ backgroundColor: doingTask.life_areas?.color_hex || "#4ADE80" }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: doingTask.life_areas?.color_hex || "#4ADE80" }} />
                </span>
                <span className="text-xs font-medium text-text-primary uppercase tracking-wide">Doing Now</span>
                {doingTask.confirmed_at && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider">Elapsed</span>
                    <LiveTimer startTime={doingTask.confirmed_at} />
                  </div>
                )}
              </div>
              <h3 className="font-display text-lg font-semibold text-text-primary leading-tight mb-4">
                {doingTask.title}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDone(doingTask)}
                  disabled={actionLoading === `done-${doingTask.id}`}
                  className="hover-border bg-card px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:brightness-110 disabled:opacity-50"
                >
                  {actionLoading === `done-${doingTask.id}` ? "Saving…" : "Mark Done"}
                </button>
                <button
                  onClick={() => router.push(`/tasks/${doingTask.id}`)}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Current Task Card ─── */}
      {currentTask ? (
        <div className="mb-6">
          <div
            className="hover-border bg-card p-6 cursor-pointer transition-colors"
            onClick={() => router.push(`/tasks/${currentTask.id}`)}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: currentTask.life_areas?.color_hex || "#8B8B8B" }}
              />
              <span className="text-xs text-text-muted">{currentTask.life_areas?.name || "Unknown"}</span>
              <span className="font-data text-[11px] text-text-muted ml-auto">
                {currentTask.scheduled_time?.slice(0, 5)}
                {currentTask.scheduled_date && (
                  <span className="ml-1.5 opacity-70">{currentTask.scheduled_date}</span>
                )}
              </span>
            </div>
            <h3 className="font-display text-xl font-semibold text-text-primary leading-tight mb-2">
              {currentTask.title}
            </h3>
            {currentTask.first_step && (
              <p className="text-sm text-text-secondary">
                <span className="text-text-muted text-xs mr-1.5">First step:</span>
                {currentTask.first_step}
              </p>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="relative group">
              <button
                onClick={handleConfirm}
                disabled={!isDesktop || actionLoading === "confirm"}
                className="hover-border bg-card-alt px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-card disabled:cursor-not-allowed disabled:opacity-40"
              >
                {actionLoading === "confirm" ? "Confirming…" : "Working on this now"}
              </button>
              {!isDesktop && (
                <div className="absolute top-full mt-2 w-full text-center">
                  <p className="text-[10px] text-text-muted">Open on desktop to confirm</p>
                </div>
              )}
            </div>
            <button
              onClick={() => handleDone(currentTask)}
              disabled={actionLoading === `done-${currentTask.id}`}
              className="hover-border bg-card px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary disabled:opacity-50"
            >
              {actionLoading === `done-${currentTask.id}` ? "Saving…" : "Mark done"}
            </button>
            <button
              onClick={() => setSnoozeOpen(true)}
              className="hover-border bg-card px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Snooze
            </button>
          </div>
          {backlogCount > 0 && (
            <p className="mt-3 font-data text-xs text-text-muted">+{backlogCount} waiting</p>
          )}
        </div>
      ) : nextUpcomingTask ? (
        <div className="mb-6">
          <div className="hover-border bg-card p-6">
            <p className="text-sm text-text-muted mb-3">Nothing due right now. Next up:</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: nextUpcomingTask.life_areas?.color_hex || "#8B8B8B" }} />
              <span className="text-xs text-text-muted">{nextUpcomingTask.life_areas?.name || "Unknown"}</span>
            </div>
            <h3 className="font-display text-lg font-semibold text-text-primary leading-tight">
              {nextUpcomingTask.title}
            </h3>
            <p className="mt-2 font-data text-sm text-text-muted">Starts at {nextUpcomingTask.scheduled_time?.slice(0, 5)}</p>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="hover-border bg-card p-6 text-center">
            <p className="text-sm text-text-secondary">Nothing scheduled for the rest of today. Plan your next day on the Schedule.</p>
          </div>
        </div>
      )}

      {/* ─── Up Next ─── */}
      {upNextTasks.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-text-secondary mb-3">Up Next</h4>
          <div className="space-y-2">
            {upNextTasks.map((task) => {
              const isExpanded = expandedUpNext.has(task.id);
              return (
                <div key={task.id} className="hover-border bg-card transition-colors cursor-pointer" onClick={() => toggleUpNext(task.id)}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: task.life_areas?.color_hex || "#8B8B8B" }} />
                    <span className="text-sm text-text-primary flex-1 truncate">{task.title}</span>
                    <span className="font-data text-[11px] text-text-muted shrink-0">{task.scheduled_time?.slice(0, 5)}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-3 border-t border-border-default mx-4 pt-3">
                      {task.first_step && (
                        <p className="text-sm text-text-secondary mb-1.5"><span className="text-text-muted text-xs mr-1.5">First step:</span>{task.first_step}</p>
                      )}
                      {task.description && (
                        <p className="text-sm text-text-muted">{task.description}</p>
                      )}
                      {task.duration_minutes && (
                        <p className="font-data text-[11px] text-text-muted mt-1.5">{task.duration_minutes}min</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Streak line ─── */}
      <div className="mt-8 pt-5 border-t border-border-default">
        <p className="font-data text-sm text-text-muted">{streakDays > 0 ? `${streakDays} day streak` : "No streak yet"}</p>
      </div>

      {/* ─── Snooze modal ─── */}
      {currentTask && (
        <SnoozeModal open={snoozeOpen} onClose={() => setSnoozeOpen(false)} taskId={currentTask.id} />
      )}
    </div>
  );
}
