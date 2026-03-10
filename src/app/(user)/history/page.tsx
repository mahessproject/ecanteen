import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import RealtimeOrderHistory from "@/components/RealtimeOrderHistory";
import type { Order } from "@/lib/supabase";

export const revalidate = 0;

type OrderWithMenu = Order & {
  menus: { nama: string; foto_url: string | null } | null;
};

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: orders } = await supabase
    .from("orders")
    .select("*, menus(nama, foto_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
        <div>
          <h1 className="text-xl font-bold text-white">Riwayat Pesanan</h1>
          <p className="text-sm text-white/50">Pantau status pesananmu secara realtime</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <RealtimeOrderHistory initialOrders={(orders ?? []) as OrderWithMenu[]} userId={user.id} />
      </div>
    </>
  );
}
