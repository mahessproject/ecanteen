import { createSupabaseServerClient } from "@/lib/supabase-server";
import WithdrawalManagementClient from "@/components/WithdrawalManagementClient";

export const revalidate = 0;

export default async function WithdrawalManagementPage() {
  const supabase = await createSupabaseServerClient();

  const { data: withdrawals } = await supabase
    .from("withdrawal_requests")
    .select("*, profiles(nama, email)")
    .order("created_at", { ascending: false });

  return <WithdrawalManagementClient withdrawals={withdrawals ?? []} />;
}
