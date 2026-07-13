"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { ColorPicker } from "@/components/color-picker";
import { createTask } from "@/app/(app)/tasks/actions";
import type { LifeArea } from "@/lib/types/database";

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  lifeAreas: Pick<LifeArea, "id" | "name" | "color_hex">[];
  defaultAreaId?: string;
  defaultDate?: string;
  defaultTime?: string;
}

export function QuickAddModal({
  open,
  onClose,
  lifeAreas,
  defaultAreaId,
  defaultDate,
  defaultTime,
}: QuickAddModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await createTask(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setLoading(false);
      onClose();
      router.refresh();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Task">
      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Title — future AI parsing slot (slice 8) */}
        <div>
          <label htmlFor="qa-title" className="mb-1.5 block text-sm font-medium text-text-secondary">
            What do you need to do?
          </label>
          <input
            id="qa-title"
            name="title"
            type="text"
            required
            autoFocus
            className="hover-border focus-ring w-full bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            placeholder="e.g. Call supplier about packaging"
          />
        </div>

        {/* Life area picker */}
        <div>
          <label htmlFor="qa-area" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Life Area
          </label>
          <select
            id="qa-area"
            name="life_area_id"
            required
            defaultValue={defaultAreaId || ""}
            className="hover-border focus-ring w-full bg-card px-3 py-2.5 text-sm text-text-primary focus:outline-none"
          >
            <option value="" disabled>
              Select an area…
            </option>
            {lifeAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date + Time row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="qa-date" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Date
            </label>
            <input
              id="qa-date"
              name="scheduled_date"
              type="date"
              defaultValue={defaultDate || ""}
              className="hover-border focus-ring w-full bg-card px-3 py-2.5 text-sm text-text-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="qa-time" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Time
            </label>
            <input
              id="qa-time"
              name="scheduled_time"
              type="time"
              defaultValue={defaultTime || ""}
              className="hover-border focus-ring w-full bg-card px-3 py-2.5 text-sm text-text-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="qa-duration" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Duration (minutes)
          </label>
          <input
            id="qa-duration"
            name="duration_minutes"
            type="number"
            min="1"
            max="480"
            className="hover-border focus-ring w-full bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            placeholder="30"
          />
        </div>

        {/* Description (optional) */}
        <div>
          <label htmlFor="qa-desc" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Description <span className="text-text-muted">(optional)</span>
          </label>
          <textarea
            id="qa-desc"
            name="description"
            rows={2}
            className="hover-border focus-ring w-full resize-none bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            placeholder="Any extra details…"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="hover-border w-full bg-card px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-card-alt disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add Task"}
        </button>
      </form>
    </Modal>
  );
}
