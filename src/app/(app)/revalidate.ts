import { revalidatePath } from "next/cache";

export function revalidateAll() {
  // Invalidates the router cache for the entire (app) route group,
  // ensuring Right Now, Schedule, All Tasks, and Life Areas are in sync.
  revalidatePath("/", "layout");
}
