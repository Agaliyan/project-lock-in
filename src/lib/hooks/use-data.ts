import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { TaskWithArea, LifeArea, Settings } from "@/lib/types/database";

const supabase = createClient();

const fetcher = async (query: any) => {
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// 1. Tasks
export function useTasks() {
  const query = supabase
    .from("tasks")
    .select("*, life_areas(id, name, color_hex)")
    .order("created_at", { ascending: false });

  // We use a stable key for the swr cache
  const { data, error, mutate, isLoading } = useSWR<TaskWithArea[]>("tasks", () => fetcher(query));
  
  return {
    tasks: data || [],
    isLoading,
    isError: error,
    mutateTasks: mutate,
  };
}

// 2. Life Areas
export function useLifeAreas() {
  const query = supabase
    .from("life_areas")
    .select("*")
    .is("archived_at", null)
    .order("position", { ascending: true });

  const { data, error, mutate, isLoading } = useSWR<LifeArea[]>("life_areas", () => fetcher(query));

  return {
    lifeAreas: data || [],
    isLoading,
    isError: error,
    mutateLifeAreas: mutate,
  };
}

// 3. Settings
export function useSettings() {
  const query = supabase
    .from("settings")
    .select("*")
    .single(); // assuming 1 row per user is handled by RLS

  const { data, error, mutate, isLoading } = useSWR<Settings>("settings", () => fetcher(query));

  return {
    settings: data,
    isLoading,
    isError: error,
    mutateSettings: mutate,
  };
}
