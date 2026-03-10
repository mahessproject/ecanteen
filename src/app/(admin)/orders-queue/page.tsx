import { createSupabaseServerClient } from "@/lib/supabase-server";
import RealtimeOrdersQueue from "@/components/RealtimeOrdersQueue";
import type { Order } from "@/lib/supabase";

export const revalidate = 0;

type OrderWithJoin = Order & {
  menus: { nama: string } | null;
  profiles: { nama: string | null; email: string } | null;
};

export default async function OrdersQueuePage() {
  const supabase = await createSupabaseServerClient();

  const { data: rawOrders } = await supabase
    .from("orders")
    .select("*, menus(nama), profiles(nama, email)")
    .order("created_at", { ascending: true });

  const orders = (rawOrders ?? []) as OrderWithJoin[];

  return <RealtimeOrdersQueue initialOrders={orders} />;
}
