import { createSupabaseServerClient } from "@/lib/supabase-server";
import KantinWithdrawalClient from "@/components/KantinWithdrawalClient";

export const revalidate = 0;

export default async function KantinWithdrawalPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("saldo_virtual, saldo_pendapatan")
    .eq("id", user!.id)
    .single<{ saldo_virtual: number; saldo_pendapatan: number }>();

  const { data: withdrawals } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <KantinWithdrawalClient
      saldoPendapatan={profile?.saldo_pendapatan ?? 0}
      saldoKantin={profile?.saldo_virtual ?? 0}
      withdrawals={withdrawals ?? []}
    />
  );
}
