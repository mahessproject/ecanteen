"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { WaktuPengambilan } from "@/lib/supabase";

function generateCheckoutId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

export async function createOrder(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const menu_id = Number(formData.get("menu_id"));
  const jumlah = Number(formData.get("jumlah"));
  const waktu = formData.get("waktu_pengambilan") as WaktuPengambilan;

  if (!menu_id || !jumlah || !waktu) {
    return { success: false, error: "Semua field wajib diisi" };
  }

  const checkoutId = generateCheckoutId();

  const { data, error } = await supabase.rpc("checkout_order", {
    p_menu_id: menu_id,
    p_jumlah: jumlah,
    p_waktu: waktu,
  });

  if (error) return { success: false, error: error.message };

  const result = data as { success: boolean; error?: string; order_id?: number };

  if (!result.success) return { success: false, error: result.error };

  if (result.order_id) {
    await supabase.from("orders").update({ checkout_id: checkoutId }).eq("id", result.order_id);
  }

  revalidatePath("/history");
  revalidatePath("/menu");
  return { success: true, order_id: result.order_id };
}

interface CartItem {
  menu_id: number;
  jumlah: number;
}

export async function createBulkOrder(
  cartItems: CartItem[],
  waktu: WaktuPengambilan,
): Promise<{ success: boolean; error?: string; order_ids?: number[] }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  if (!cartItems.length || !waktu) {
    return { success: false, error: "Keranjang kosong atau waktu belum dipilih" };
  }

  const checkoutId = generateCheckoutId();
  const orderIds: number[] = [];

  for (const item of cartItems) {
    const { data, error } = await supabase.rpc("checkout_order", {
      p_menu_id: item.menu_id,
      p_jumlah: item.jumlah,
      p_waktu: waktu,
    });

    if (error) return { success: false, error: error.message };

    const result = data as { success: boolean; error?: string; order_id?: number };
    if (!result.success) return { success: false, error: result.error };

    if (result.order_id) orderIds.push(result.order_id);
  }

  if (orderIds.length > 0) {
    await supabase.from("orders").update({ checkout_id: checkoutId }).in("id", orderIds);
  }

  revalidatePath("/history");
  revalidatePath("/menu");
  return { success: true, order_ids: orderIds };
}

export async function updateOrderStatus(orderId: number, newStatus: "preparing" | "ready") {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/orders-queue");
  revalidatePath("/kantin-orders");
  return { success: true };
}

export async function updateGroupOrderStatus(orderIds: number[], newStatus: "preparing" | "ready") {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("orders").update({ status: newStatus }).in("id", orderIds);

  if (error) return { success: false, error: error.message };

  revalidatePath("/orders-queue");
  revalidatePath("/kantin-orders");
  return { success: true };
}

export async function cancelOrder(orderId: number) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase.rpc("cancel_order", {
    p_order_id: orderId,
  });

  if (error) return { success: false, error: error.message };

  const result = data as { success: boolean; error?: string; refunded?: number };
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/history");
  revalidatePath("/menu");
  revalidatePath("/orders-queue");
  revalidatePath("/kantin-orders");
  return { success: true, refunded: result.refunded };
}

export async function cancelGroupOrders(orderIds: number[]) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  let totalRefunded = 0;
  for (const id of orderIds) {
    const { data, error } = await supabase.rpc("cancel_order", {
      p_order_id: id,
    });

    if (error) return { success: false, error: error.message };

    const result = data as { success: boolean; error?: string; refunded?: number };
    if (!result.success) return { success: false, error: result.error };
    totalRefunded += result.refunded ?? 0;
  }

  revalidatePath("/history");
  revalidatePath("/menu");
  revalidatePath("/orders-queue");
  revalidatePath("/kantin-orders");
  return { success: true, refunded: totalRefunded };
}
