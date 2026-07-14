"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTask, deleteTask, duplicateTask } from "../actions";
import type { Task, LifeArea, SnoozeLog, Subtask, TaskStatus } from "@/lib/types/database";

interface TaskDetailFormProps {
  task: Task;
  lifeAreas: Pick<LifeArea, "id" | "name" | "color_hex">[];
  snoozeLogs: SnoozeLog[];
}


export function TaskDetailForm({ task, lifeAreas, snoozeLogs }: TaskDetailFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [firstStep, setFirstStep] = useState(task.first_step ?? "");
  const [areaId, setAreaId] = useState(task.life_area_id);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [date, setDate] = useState(task.scheduled_date ?? "");
  const [time, setTime] = useState(task.scheduled_time?.slice(0, 5) ?? "");
  const [duration, setDuration] = useState(task.duration_minutes?.toString() ?? "");
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState("");
  

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentArea = lifeAreas.find((a) => a.id === areaId);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("id", task.id);
    fd.set("title", title);
    fd.set("description", description);
    fd.set("first_step", firstStep);
    fd.set("life_area_id", areaId);
    fd.set("status", status);
    fd.set("scheduled_date", date);
    fd.set("scheduled_time", time);
    fd.set("duration_minutes", duration);
    fd.set("subtasks", JSON.stringify(subtasks));
    

    const result = await updateTask(fd);
    if (result?.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteTask(task.id);
    if (result?.error) {
      setError(result.error);
      setDeleting(false);
    } else {
      router.push(`/life-areas/${task.life_area_id}`);
      router.refresh();
    }
  }

  function addSubtask() {
    if (!newSubtask.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: crypto.randomUUID(), text: newSubtask.trim(), done: false },
    ]);
    setNewSubtask("");
  }

  function toggleSubtask(id: string) {
    setSubtasks(subtasks.map((s) =>
      s.id === id ? { ...s, done: !s.done } : s
    ));
  }

  function removeSubtask(id: string) {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  }
  


  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-text-muted transition-colors hover:text-text-primary"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4L7 10l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {currentArea && (
          <>
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: currentArea.color_hex }}
            />
            <span className="text-sm text-text-muted">{currentArea.name}</span>
          </>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent font-display text-2xl font-semibold tracking-tight text-text-primary placeholder:text-text-muted focus:outline-none"
          placeholder="Task title"
        />

        {/* Status */}
        <div className="flex items-center gap-2">
          {(["todo", "doing", "done"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`hover-border px-3 py-1.5 text-xs font-medium transition-colors ${
                status === s
                  ? "bg-card-alt text-text-primary"
                  : "bg-card text-text-muted hover:text-text-secondary"
              }`}
            >
              {s === "todo" ? "To do" : s === "doing" ? "In progress" : "Done"}
            </button>
          ))}
        </div>

        {/* Life area reassignment */}
        <div>
          <label htmlFor="td-area" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Life Area
          </label>
          <select
            id="td-area"
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
            className="hover-border focus-ring w-full bg-card px-3 py-2 text-sm text-text-primary focus:outline-none"
          >
            {lifeAreas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* Date / Time / Duration */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="td-date" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Date
            </label>
            <input
              id="td-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="hover-border focus-ring w-full bg-card px-3 py-2 text-sm text-text-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="td-time" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Time
            </label>
            <input
              id="td-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="hover-border focus-ring w-full bg-card px-3 py-2 text-sm text-text-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="td-dur" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Duration (min)
            </label>
            <input
              id="td-dur"
              type="number"
              min="1"
              max="480"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="hover-border focus-ring w-full bg-card px-3 py-2 text-sm text-text-primary focus:outline-none"
              placeholder="30"
            />
          </div>
        </div>


        {/* Description */}
        <div>
          <label htmlFor="td-desc" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Description
          </label>
          <textarea
            id="td-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="hover-border focus-ring w-full resize-none bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            placeholder="What needs to happen…"
          />
        </div>

        {/* First step */}
        <div>
          <label htmlFor="td-step" className="mb-1.5 block text-sm font-medium text-text-secondary">
            First 2-minute step
          </label>
          <input
            id="td-step"
            type="text"
            value={firstStep}
            onChange={(e) => setFirstStep(e.target.value)}
            className="hover-border focus-ring w-full bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            placeholder="e.g. Open the spreadsheet and find row 42"
          />
        </div>

        {/* Subtasks */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Subtasks
          </label>
          <div className="space-y-1.5">
            {subtasks.map((st) => (
              <div key={st.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleSubtask(st.id)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                    st.done
                      ? "border-green-500/40 bg-green-500/10"
                      : "border-border-default hover:border-border-hover"
                  }`}
                >
                  {st.done && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6l2.5 2.5L9.5 4" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className={`flex-1 text-sm ${st.done ? "text-text-muted line-through" : "text-text-primary"}`}>
                  {st.text}
                </span>
                <button
                  type="button"
                  onClick={() => removeSubtask(st.id)}
                  className="text-text-muted transition-colors hover:text-red-400"
                  aria-label="Remove subtask"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M10.5 3.5l-7 7M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }}
              className="hover-border focus-ring flex-1 bg-card px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              placeholder="Add a subtask…"
            />
            <button
              type="button"
              onClick={addSubtask}
              className="hover-border bg-card px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Add
            </button>
          </div>
        </div>

        {/* Snooze history */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Snooze History
          </label>
          {snoozeLogs.length === 0 ? (
            <p className="text-xs text-text-muted">
              No snooze history for this task.
            </p>
          ) : (
            <div className="space-y-1.5">
              {snoozeLogs.map((log) => (
                <div key={log.id} className="rounded-lg border border-border-default bg-card px-3 py-2">
                  <p className="text-sm text-text-primary">{log.reason}</p>
                  <p className="mt-1 font-data text-[11px] text-text-muted">
                    {new Date(log.created_at).toLocaleString()}
                    {log.snoozed_to_time && ` → ${new Date(log.snoozed_to_time).toLocaleString()}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between border-t border-border-default pt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="hover-border bg-card-alt px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-card disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>

          {!confirmDelete ? (
            <div className="flex items-center gap-4">
              <button
                onClick={async () => {
                  setSaving(true);
                  const res = await duplicateTask(task.id);
                  setSaving(false);
                  if (res?.error) setError(res.error);
                  else router.push("/schedule");
                }}
                disabled={saving}
                className="px-3 py-2 text-sm text-text-muted transition-colors hover:text-text-primary disabled:opacity-50"
              >
                Duplicate
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2 text-sm text-red-400/70 transition-colors hover:text-red-400"
              >
                Delete task
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Confirm delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1.5 text-xs text-text-muted hover:text-text-secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
