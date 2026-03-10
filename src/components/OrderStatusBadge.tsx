import type { OrderStatus } from "@/lib/supabase";

const map: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Menunggu", className: "bg-white/10 text-white/60" },
  preparing: { label: "Disiapkan", className: "bg-yellow-500/10 text-yellow-500" },
  ready: { label: "Siap Diambil", className: "bg-green-500/10 text-green-500" },
  cancelled: { label: "Dibatalkan", className: "bg-red-500/10 text-red-500" },
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = map[status];
  return <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${className}`}>{label}</span>;
}
