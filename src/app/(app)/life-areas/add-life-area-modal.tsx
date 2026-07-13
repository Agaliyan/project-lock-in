"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { ColorPicker } from "@/components/color-picker";
import { AREA_COLOR_PALETTE } from "@/lib/types/database";
import { createLifeArea } from "./actions";

interface AddLifeAreaModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddLifeAreaModal({ open, onClose }: AddLifeAreaModalProps) {
  const router = useRouter();
  const [color, setColor] = useState<string>(AREA_COLOR_PALETTE[1]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    formData.set("color_hex", color);
    const result = await createLifeArea(formData);
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
    <Modal open={open} onClose={onClose} title="New Life Area">
      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="ala-name" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Name
          </label>
          <input
            id="ala-name"
            name="name"
            type="text"
            required
            autoFocus
            className="hover-border focus-ring w-full bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            placeholder="e.g. Side Project"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Color
          </label>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="hover-border w-full bg-card px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-card-alt disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create Life Area"}
        </button>
      </form>
    </Modal>
  );
}
