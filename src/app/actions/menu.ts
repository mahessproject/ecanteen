"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function createMenu(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const nama = formData.get("nama") as string;
  const harga = Number(formData.get("harga"));
  const foto_url = (formData.get("foto_url") as string) || null;
  const stock = Number(formData.get("stock")) || 0;
  const status = stock > 0 ? "available" : "sold_out";

  if (!nama || !harga) return { success: false, error: "Nama dan harga wajib diisi" };

  const { error } = await supabase.from("menus").insert({ nama, harga, foto_url, status, stock });

  if (error) return { success: false, error: error.message };

  revalidatePath("/menu-management");
  revalidatePath("/kantin-menu");
  revalidatePath("/menu");
  return { success: true };
}

export async function updateMenu(id: number, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const nama = formData.get("nama") as string;
  const harga = Number(formData.get("harga"));
  const foto_url = (formData.get("foto_url") as string) || null;
  const stock = Number(formData.get("stock")) || 0;
  const status = stock > 0 ? "available" : "sold_out";

  const { error } = await supabase.from("menus").update({ nama, harga, foto_url, status, stock }).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/menu-management");
  revalidatePath("/kantin-menu");
  revalidatePath("/menu");
  return { success: true };
}

export async function deleteMenu(id: number) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { error } = await supabase.from("menus").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/menu-management");
  revalidatePath("/kantin-menu");
  revalidatePath("/menu");
  return { success: true };
}

export async function toggleMenuStatus(id: number, currentStock: number) {
  const supabase = await createSupabaseServerClient();
  // If stock is 0, we can't toggle to available without adding stock
  // This is kept for backward compatibility but stock-based system handles status automatically
  const newStatus = currentStock > 0 ? "available" : "sold_out";
  const { error } = await supabase.from("menus").update({ status: newStatus }).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/menu-management");
  revalidatePath("/kantin-menu");
  revalidatePath("/menu");
  return { success: true };
}
