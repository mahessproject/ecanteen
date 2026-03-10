"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: "Email atau password salah" };
  }

  // Check role for redirect
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();

    if (profile?.role === "admin") {
      redirect("/admin-dashboard");
    }
    if (profile?.role === "kantin") {
      redirect("/kantin-dashboard");
    }
  }

  redirect("/menu");
}

export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const nama = formData.get("nama") as string;

  if (!email || !password || !nama) {
    return { success: false, error: "Semua field wajib diisi" };
  }

  if (password.length < 6) {
    return { success: false, error: "Password minimal 6 karakter" };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nama },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message: "Akun dibuat! Cek email kamu untuk verifikasi (atau langsung login jika email verify dimatikan).",
  };
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forceLogoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return { success: true };
}
