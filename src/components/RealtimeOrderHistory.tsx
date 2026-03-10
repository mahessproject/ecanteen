"use client";

import { useEffect, useState, useMemo, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { formatRupiah, formatDate, formatWaktu } from "@/lib/utils";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { cancelGroupOrders } from "@/app/actions/order";
import type { Order, OrderStatus, WaktuPengambilan } from "@/lib/supabase";
import Link from "next/link";

type OrderWithMenu = Order & {
  menus: { nama: string; foto_url: string | null } | null;
};

interface Props {
  initialOrders: OrderWithMenu[];
  userId: string;
}

interface HistoryGroup {
  key: string;
  code: string;
  waktu: WaktuPengambilan;
  items: OrderWithMenu[];
  totalHarga: number;
  totalItems: number;
  createdAt: string;
  overallStatus: OrderStatus;
}

function generateCode(firstId: number): string {
  const hash = ((firstId * 2654435761) >>> 0).toString(16).toUpperCase().slice(0, 4);
  return "ORD-" + hash;
}

function getOverallStatus(items: OrderWithMenu[]): OrderStatus {
  const statuses = items.map((i) => i.status);
  if (statuses.every((s) => s === "cancelled")) return "cancelled";
  if (statuses.every((s) => s === "ready")) return "ready";
  if (statuses.some((s) => s === "preparing")) return "preparing";
  if (statuses.some((s) => s === "cancelled")) return "cancelled";
  return "pending";
}

function groupOrders(orders: OrderWithMenu[]): HistoryGroup[] {
  const map = new Map<string, OrderWithMenu[]>();

  for (const o of orders) {
    const timeSec = new Date(o.created_at).toISOString().slice(0, 19);
    const key = timeSec;
    const list = map.get(key) ?? [];
    list.push(o);
    map.set(key, list);
  }

  const groups: HistoryGroup[] = [];
  for (const [key, items] of map) {
    const sorted = items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const first = sorted[0];
    groups.push({
      key,
      code: generateCode(first.id),
      waktu: first.waktu_pengambilan,
      items: sorted,
      totalHarga: sorted.reduce((s, i) => s + i.total_harga, 0),
      totalItems: sorted.reduce((s, i) => s + i.jumlah, 0),
      createdAt: first.created_at,
      overallStatus: getOverallStatus(sorted),
    });
  }

  return groups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function HistoryGroupCard({ group, isHighlighted }: { group: HistoryGroup; isHighlighted: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canCancel = group.overallStatus === "pending";

  return (
    <div
      className={
        "bg-[#0a0a0a] rounded-2xl border transition-all duration-500 overflow-hidden " +
        (isHighlighted
          ? "border-orange-500 shadow-lg shadow-orange-500/20"
          : "border-white/5 hover:border-orange-500/30")
      }
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-orange-500/80 text-xs font-bold">{group.code}</span>
            <span className="text-white/15">|</span>
            <span className="text-xs text-white/40">{group.totalItems} item</span>
            <span className="text-white/15">|</span>
            <span className="text-xs text-white/40">{formatWaktu(group.waktu)}</span>
          </div>
          <p className="text-xs text-white/30">{formatDate(group.createdAt)}</p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <span className="font-bold text-orange-500 text-lg">{formatRupiah(group.totalHarga)}</span>
          <OrderStatusBadge status={group.overallStatus} />
          <svg
            className={"w-4 h-4 text-white/30 transition-transform duration-200 " + (expanded ? "rotate-180" : "")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/5">
          <div className="divide-y divide-white/5">
            {group.items.map((item) => (
              <div key={item.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-white">{item.menus?.nama ?? "-"}</span>
                  <span className="text-white/40 text-sm ml-2">x{item.jumlah}</span>
                </div>
                <span className="text-sm text-white/60 font-medium">{formatRupiah(item.total_harga)}</span>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-0.5">Total</p>
              <p
                className={
                  "text-lg font-bold " +
                  (group.overallStatus === "cancelled" ? "text-red-500 line-through" : "text-orange-500")
                }
              >
                {formatRupiah(group.totalHarga)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {canCancel && (
                <button
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const ids = group.items.map((i) => i.id);
                      const res = await cancelGroupOrders(ids);
                      if (!res.success) alert(res.error ?? "Gagal membatalkan pesanan");
                    })
                  }
                  className="text-xs font-bold px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-50"
                >
                  {isPending ? "..." : "Batalkan"}
                </button>
              )}
              <OrderStatusBadge status={group.overallStatus} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RealtimeOrderHistory({ initialOrders, userId }: Props) {
  const [orders, setOrders] = useState<OrderWithMenu[]>(initialOrders);
  const [highlightedKeys, setHighlightedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`order-history-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
          const gk = updated.waktu_pengambilan + "__" + updated.status;
          setHighlightedKeys((prev) => new Set(prev).add(gk));
          setTimeout(() => {
            setHighlightedKeys((prev) => {
              const next = new Set(prev);
              next.delete(gk);
              return next;
            });
          }, 2500);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const groups = useMemo(() => groupOrders(orders), [orders]);

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
          🛍️
        </div>
        <p className="text-white/40 mb-3">Belum ada pesanan</p>
        <Link
          href="/menu"
          className="inline-block bg-orange-500 text-black font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
        >
          Lihat Menu &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <HistoryGroupCard key={group.key} group={group} isHighlighted={highlightedKeys.has(group.key)} />
      ))}
    </div>
  );
}
