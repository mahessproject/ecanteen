"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/app/actions/order";
import type { OrderStatus } from "@/lib/supabase";

interface Props {
  orderId: number;
  currentStatus: OrderStatus;
}

const next: Partial<Record<OrderStatus, "preparing" | "ready">> = {
  pending: "preparing",
  preparing: "ready",
};

const labels: Record<string, string> = {
  preparing: "Tandai: Sedang Disiapkan",
  ready: "Tandai: Siap Diambil",
};

export default function OrderStatusButton({ orderId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const nextStatus = next[currentStatus];

  if (!nextStatus) return <span className="text-xs text-white/40">✓ Selesai</span>;

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await updateOrderStatus(orderId, nextStatus);
        })
      }
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        nextStatus === "preparing"
          ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
          : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
      }`}
    >
      {isPending ? "..." : labels[nextStatus]}
    </button>
  );
}
