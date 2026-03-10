import { createSupabaseServerClient } from "@/lib/supabase-server";
import AdminDashboardClient from "@/components/AdminDashboardClient";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Admin saldo
  const { data: profile } = await supabase
    .from("profiles")
    .select("saldo_virtual")
    .eq("id", user!.id)
    .single<{ saldo_virtual: number }>();

  // Withdrawal requests with profiles
  const { data: withdrawals } = await supabase
    .from("withdrawal_requests")
    .select("*, profiles(nama, email)")
    .order("created_at", { ascending: false });

  // Today's orders for daily summary
  const today = new Date().toISOString().split("T")[0];
  const { data: todayOrders } = await supabase
    .from("orders")
    .select("total_harga, status")
    .gte("created_at", today + "T00:00:00");

  // All orders for total stats
  const { data: allOrders } = await supabase.from("orders").select("total_harga, status, created_at");

  return (
    <AdminDashboardClient
      adminSaldo={profile?.saldo_virtual ?? 0}
      withdrawals={withdrawals ?? []}
      todayOrders={todayOrders ?? []}
      allOrders={allOrders ?? []}
    />
  );
}
