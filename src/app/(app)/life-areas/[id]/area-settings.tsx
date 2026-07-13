"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColorPicker } from "@/components/color-picker";
import { updateLifeArea, archiveLifeArea } from "../actions";
import type { LifeArea } from "@/lib/types/database";

interface AreaSettingsProps {
  area: LifeArea;
  onClose: () => void;
}

export function AreaSettings({ area, onClose }: AreaSettingsProps) {
  const router = useRouter();
  const [name, setName] = useState(area.name);
  const [color, setColor] = useState(area.color_hex);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("id", area.id);
    fd.set("name", name);
    fd.set("color_hex", color);
    const result = await updateLifeArea(fd);
    if (result?.error) {
      setError(result.error);
    } else {
      onClose();
      router.refresh();
    }
    setSaving(false);
  }

  async function handleArchive() {
    setArchiving(true);
    setError(null);
    const result = await archiveLifeArea(area.id);
    if (result?.error) {
      setError(result.error);
      setArchiving(false);
    } else {
      router.push("/life-areas");
      router.refresh();
    }
  }

  return (
    <div className="mb-6 space-y-4 rounded-[10px] border border-border-default bg-card-alt p-5">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="as-name" className="mb-1.5 block text-sm font-medium text-text-secondary">
          Name
        </label>
        <input
          id="as-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="hover-border focus-ring w-full bg-card px-3 py-2 text-sm text-text-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          Color
        </label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="hover-border bg-card px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-card-alt disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm text-text-muted transition-colors hover:text-text-secondary"
          >
            Cancel
          </button>
        </div>

        {!confirmArchive ? (
          <button
            onClick={() => setConfirmArchive(true)}
            className="px-3 py-2 text-sm text-red-400/70 transition-colors hover:text-red-400"
          >
            Archive area
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Tasks move to Personal.</span>
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
            >
              {archiving ? "Archiving…" : "Confirm archive"}
            </button>
            <button
              onClick={() => setConfirmArchive(false)}
              className="px-2 py-1.5 text-xs text-text-muted hover:text-text-secondary"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
