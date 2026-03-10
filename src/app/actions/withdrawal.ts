"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function requestWithdrawal(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const amount = Number(formData.get("amount"));
  const method = formData.get("method") as "cash" | "transfer";
  const bankInfo = formData.get("bank_info") as string | null;

  if (!amount || amount <= 0) {
    return { success: false, error: "Jumlah pencairan tidak valid" };
  }

  if (!method || !["cash", "transfer"].includes(method)) {
    return { success: false, error: "Metode pencairan tidak valid" };
  }

  // Check kantin saldo_pendapatan (revenue balance)
  const { data: profile } = await supabase
    .from("profiles")
    .select("saldo_pendapatan")
    .eq("id", user.id)
    .single<{ saldo_pendapatan: number }>();

  if (!profile || profile.saldo_pendapatan < amount) {
    return { success: false, error: "Saldo pendapatan tidak mencukupi" };
  }

  const { error } = await supabase.from("withdrawal_requests").insert({
    user_id: user.id,
    amount,
    method,
    bank_info: method === "transfer" ? bankInfo : null,
    status: "pending",
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/kantin-dashboard");
  return { success: true };
}

export async function approveWithdrawal(requestId: number) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // verify admin
  const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (adminProfile?.role !== "admin") return { success: false, error: "Unauthorized" };

  // Get the withdrawal request
  const { data: req } = await supabase.from("withdrawal_requests").select("*").eq("id", requestId).single();
  if (!req) return { success: false, error: "Request tidak ditemukan" };
  if (req.status !== "pending") return { success: false, error: "Request sudah diproses" };

  // Calculate 5% admin/school fee
  const FEE_PERCENT = 5;
  const adminFee = Math.round((req.amount * FEE_PERCENT) / 100);
  const netAmount = req.amount - adminFee;

  // Deduct full amount from kantin saldo_pendapatan
  const { data: kantinProfile } = await supabase
    .from("profiles")
    .select("saldo_pendapatan, saldo_virtual")
    .eq("id", req.user_id)
    .single<{ saldo_pendapatan: number; saldo_virtual: number }>();

  if (!kantinProfile || kantinProfile.saldo_pendapatan < req.amount) {
    return { success: false, error: "Saldo pendapatan kantin tidak mencukupi" };
  }

  // Deduct from saldo_pendapatan, credit net amount (95%) to saldo_virtual
  const { error: updateKantinErr } = await supabase
    .from("profiles")
    .update({
      saldo_pendapatan: kantinProfile.saldo_pendapatan - req.amount,
      saldo_virtual: kantinProfile.saldo_virtual + netAmount,
    })
    .eq("id", req.user_id);

  if (updateKantinErr) return { success: false, error: updateKantinErr.message };

  // Credit 5% fee to admin saldo
  const { data: adminSaldo } = await supabase.from("profiles").select("saldo_virtual").eq("id", user.id).single();

  if (adminSaldo) {
    await supabase
      .from("profiles")
      .update({ saldo_virtual: adminSaldo.saldo_virtual + adminFee })
      .eq("id", user.id);
  }

  const { error } = await supabase
    .from("withdrawal_requests")
    .update({
      status: "approved",
      admin_fee: adminFee,
      net_amount: netAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/withdrawal-management");
  revalidatePath("/kantin-dashboard");
  return { success: true };
}

export async function rejectWithdrawal(requestId: number, note?: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // verify admin
  const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (adminProfile?.role !== "admin") return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("withdrawal_requests")
    .update({
      status: "rejected",
      admin_note: note ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/withdrawal-management");
  revalidatePath("/kantin-dashboard");
  return { success: true };
}
