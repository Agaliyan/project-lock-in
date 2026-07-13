"use client";

import { useState } from "react";
import Link from "next/link";
import type { LifeAreaWithCount } from "@/lib/types/database";
import { AddLifeAreaModal } from "./add-life-area-modal";

interface LifeAreasGridProps {
  areas: LifeAreaWithCount[];
}

export function LifeAreasGrid({ areas }: LifeAreasGridProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {areas.map((area) => (
          <Link
            key={area.id}
            href={`/life-areas/${area.id}`}
            className="hover-border flex items-center gap-3 bg-card px-4 py-4 transition-colors"
          >
            {/* Color dot */}
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: area.color_hex }}
            />
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-text-primary">
                {area.name}
              </span>
              {area.is_default && (
                <span className="ml-2 font-data text-[10px] uppercase tracking-wider text-text-muted">
                  Default
                </span>
              )}
            </div>
            <span className="font-data text-xs text-text-muted">
              {area.task_count} {area.task_count === 1 ? "task" : "tasks"}
            </span>
          </Link>
        ))}

        {/* Add Life Area button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="hover-border flex items-center justify-center gap-2 bg-card px-4 py-4 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add Life Area
        </button>
      </div>

      <AddLifeAreaModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </>
  );
}
