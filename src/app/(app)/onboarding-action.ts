"use server";

import { createClient } from "@/lib/supabase/server";
import type { LifeAreaInsert, SettingsInsert } from "@/lib/types/database";

// Default life areas with curated colors — visually distinct on dark bg
const DEFAULT_LIFE_AREAS: Array<{ name: string; color_hex: string; position: number; is_default: boolean }> = [
  { name: "Personal",          color_hex: "#8B8B8B", position: 0, is_default: true },
  { name: "Web Design Agency", color_hex: "#6C9BCF", position: 1, is_default: false },
  { name: "Phone Reselling",   color_hex: "#C084FC", position: 2, is_default: false },
  { name: "FYP",               color_hex: "#F59E42", position: 3, is_default: false },
  { name: "Job Hunt",          color_hex: "#4ADE80", position: 4, is_default: false },
  { name: "Gym",               color_hex: "#F87171", position: 5, is_default: false },
  { name: "Sports",            color_hex: "#38BDF8", position: 6, is_default: false },
  { name: "University",        color_hex: "#FBBF24", position: 7, is_default: false },
];

/**
 * Seeds default life areas and settings for a first-time user.
 * Idempotent — skips if life areas already exist for this user.
 */
export async function seedLifeAreas() {
  const supabase = await createClient();

  // Always derive user from session — never trust client-supplied user_id
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if life areas already exist (idempotent)
  const { data: existing, error: checkError } = await supabase
    .from("life_areas")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (checkError) {
    throw new Error(`Failed to check existing life areas: ${checkError.message}`);
  }

  if (existing && existing.length > 0) {
    // Already seeded — nothing to do
    return;
  }

  // Insert all default life areas
  const lifeAreaRows: LifeAreaInsert[] = DEFAULT_LIFE_AREAS.map((area) => ({
    user_id: user.id,
    name: area.name,
    color_hex: area.color_hex,
    position: area.position,
    is_default: area.is_default,
  }));

  const { error: insertError } = await supabase
    .from("life_areas")
    .insert(lifeAreaRows);

  if (insertError) {
    throw new Error(`Failed to seed life areas: ${insertError.message}`);
  }

  // Create default settings row
  const settingsRow: SettingsInsert = {
    user_id: user.id,
    timezone: "Asia/Colombo",
  };

  const { error: settingsError } = await supabase
    .from("settings")
    .insert(settingsRow);

  if (settingsError) {
    // Settings might already exist (UNIQUE constraint) — that's fine
    if (!settingsError.message.includes("duplicate key")) {
      throw new Error(`Failed to create settings: ${settingsError.message}`);
    }
  }
}
