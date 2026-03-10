import { createSupabaseServerClient } from "@/lib/supabase-server";
import KantinDashboardClient from "@/components/KantinDashboardClient";

export const revalidate = 0;

export default async function KantinDashboardPage() {
  const supabase = await createSupabaseServerClient();

  // Fetch today's orders with user and menu info
  const today = new Date().toISOString().split("T")[0];
  const { data: orders } = await supabase
    .from("orders")
    .select("*, menus(nama, harga), profiles(nama, email)")
    .gte("created_at", today + "T00:00:00")
    .order("created_at", { ascending: false });

  // Fetch all-time stats
  const { data: allOrders } = await supabase.from("orders").select("total_harga, status, created_at");

  // Fetch kantin profile for saldo
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("saldo_virtual, saldo_pendapatan")
    .eq("id", user!.id)
    .single<{ saldo_virtual: number; saldo_pendapatan: number }>();

  return (
    <KantinDashboardClient
      todayOrders={orders ?? []}
      allOrders={allOrders ?? []}
      saldoPendapatan={profile?.saldo_pendapatan ?? 0}
      saldoKantin={profile?.saldo_virtual ?? 0}
    />
  );
}
