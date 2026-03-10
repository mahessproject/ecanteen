"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function generateTodayReport() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Pastikan admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single<{ role: string }>();
  if (profile?.role !== "admin") return { success: false, error: "Unauthorized" };

  const { error } = await supabase.rpc("generate_today_report");
  if (error) return { success: false, error: error.message };

  revalidatePath("/daily-reports");
  return { success: true };
}
