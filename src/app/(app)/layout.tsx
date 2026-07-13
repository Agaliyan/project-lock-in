import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { seedLifeAreas } from "./onboarding-action";
import { AppShell } from "./app-shell";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  // Defense-in-depth: middleware already checks auth, but verify here too
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if onboarding is needed (no life areas yet)
  const { data: lifeAreas } = await supabase
    .from("life_areas")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (!lifeAreas || lifeAreas.length === 0) {
    await seedLifeAreas();
  }

  return <AppShell userEmail={user.email ?? ""}>{children}</AppShell>;
}
