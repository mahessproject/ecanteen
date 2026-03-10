"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// User: submit a topup REQUEST (admin must approve before saldo is added)
export async function requestTopup(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const amount = Number(formData.get("amount"));

  if (!amount || amount <= 0) {
    return { success: false, error: "Jumlah top-up tidak valid" };
  }

  const { data: inserted, error } = await supabase
    .from("topup_requests")
    .insert({
      user_id: user.id,
      amount,
      status: "pending",
    })
    .select("code")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/topup");
  return { success: true, code: (inserted as { code: string }).code };
}

// Admin: approve topup request
export async function approveTopup(requestId: number) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase.rpc("approve_topup", {
    p_request_id: requestId,
  });

  if (error) return { success: false, error: error.message };

  const result = data as { success: boolean; error?: string; saldo_baru?: number };
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/topup-management");
  revalidatePath("/topup");
  return { success: true, saldo_baru: result.saldo_baru };
}

// Admin: reject topup request
export async function rejectTopup(requestId: number, note?: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase.rpc("reject_topup", {
    p_request_id: requestId,
    p_note: note ?? null,
  });

  if (error) return { success: false, error: error.message };

  const result = data as { success: boolean; error?: string };
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/topup-management");
  revalidatePath("/topup");
  return { success: true };
}

// Admin: find topup request by code (for scanning/manual entry)
export async function findTopupByCode(code: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Unauthorized" };

  const { data, error } = await supabase.rpc("find_topup_by_code", {
    p_code: code,
  });

  if (error) return { success: false as const, error: error.message };

  const result = data as {
    success: boolean;
    error?: string;
    request?: {
      id: number;
      user_id: string;
      amount: number;
      status: string;
      admin_note: string | null;
      code: string;
      created_at: string;
      nama: string | null;
      email: string | null;
    };
  };
  if (!result.success) return { success: false as const, error: result.error };

  return { success: true as const, request: result.request! };
}

// User: cancel own pending topup request
export async function cancelTopup(requestId: number) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase.rpc("cancel_topup", {
    p_request_id: requestId,
  });

  if (error) return { success: false, error: error.message };

  const result = data as { success: boolean; error?: string };
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/topup");
  return { success: true };
}

// Auto-expire pending topups older than 10 minutes
// Note: no revalidatePath here — this is called during page render
export async function expirePendingTopups() {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc("expire_pending_topups");

  if (error) return { success: false, error: error.message };

  return { success: true };
}
