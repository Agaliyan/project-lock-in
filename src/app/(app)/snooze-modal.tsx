"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { snoozeTask } from "./right-now-actions";

interface SnoozeModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
}

export function SnoozeModal({ open, onClose, taskId }: SnoozeModalProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [newTime, setNewTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit() {
    if (!reason.trim()) {
      setError("Please explain what's stopping you.");
      return;
    }

    setSaving(true);
    setError(null);
    const result = await snoozeTask(taskId, reason.trim(), newTime || null);
    setSaving(false);

    if (result?.error) {
      setError(result.error);
    } else {
      setReason("");
      setNewTime("");
      onClose();
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border-default bg-card p-6 shadow-xl">
        <h3 className="font-display text-lg font-semibold text-text-primary mb-1">
          Snooze Reflection
        </h3>
        <p className="text-sm text-text-muted mb-5">
          Be honest with yourself — what&apos;s actually in the way?
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="snooze-reason"
              className="mb-1.5 block text-sm font-medium text-text-secondary"
            >
              What&apos;s actually stopping you right now? *
            </label>
            <textarea
              id="snooze-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="hover-border focus-ring w-full resize-none bg-app-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              placeholder="e.g. I'm tired and can't focus, waiting on a reply..."
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="snooze-time"
              className="mb-1.5 block text-sm font-medium text-text-secondary"
            >
              Reschedule to (optional)
            </label>
            <input
              id="snooze-time"
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="hover-border focus-ring w-40 bg-app-bg px-3 py-2 text-sm text-text-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !reason.trim()}
            className="hover-border bg-card-alt px-5 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-card disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Snooze"}
          </button>
        </div>
      </div>
    </div>
  );
}
