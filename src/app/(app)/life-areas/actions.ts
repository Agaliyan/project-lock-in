"use server";

import { revalidateAll } from "../revalidate";
import { createClient } from "@/lib/supabase/server";

export async function createLifeArea(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const color_hex = formData.get("color_hex") as string;

  if (!name || !color_hex) {
    return { error: "Name and color are required" };
  }

  // Auto-calculate position (append to end)
  const { count } = await supabase
    .from("life_areas")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("archived_at", null);

  const { error } = await supabase.from("life_areas").insert({
    user_id: user.id,
    name,
    color_hex,
    position: (count ?? 0),
    is_default: false,
  });

  if (error) return { error: error.message };

  revalidateAll();
  return { error: null };
}

export async function updateLifeArea(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const color_hex = formData.get("color_hex") as string;

  if (!id || !name || !color_hex) {
    return { error: "ID, name, and color are required" };
  }

  const { error } = await supabase
    .from("life_areas")
    .update({ name, color_hex })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAll();
  return { error: null };
}

export async function archiveLifeArea(areaId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Use the Postgres function for atomic archival
  // (reassigns tasks to Personal + sets archived_at in one transaction)
  const { error } = await supabase.rpc("archive_life_area", {
    p_area_id: areaId,
  });

  if (error) return { error: error.message };

  revalidateAll();
  return { error: null };
}
