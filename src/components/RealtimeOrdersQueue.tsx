"use client";

import { useEffect, useState, useCallback, useTransition, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { formatRupiah, formatDate, formatWaktu } from "@/lib/utils";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { updateGroupOrderStatus } from "@/app/actions/order";
import type { Order, OrderStatus, WaktuPengambilan } from "@/lib/supabase";

type OrderWithJoin = Order & {
  menus: { nama: string } | null;
  profiles: { nama: string | null; email: string } | null;
};

interface Props {
  initialOrders: OrderWithJoin[];
}

interface OrderGroup {
  key: string;
  code: string;
  userId: string;
  userName: string;
  waktu: WaktuPengambilan;
  items: OrderWithJoin[];
  totalHarga: number;
  totalItems: number;
  createdAt: string;
  overallStatus: OrderStatus;
}

function generateCode(firstId: number): string {
  const hash = ((firstId * 2654435761) >>> 0).toString(16).toUpperCase().slice(0, 4);
  return "ORD-" + hash;
}

function getOverallStatus(items: OrderWithJoin[]): OrderStatus {
  const statuses = items.map((i) => i.status);
  if (statuses.every((s) => s === "cancelled")) return "cancelled";
  if (statuses.every((s) => s === "ready")) return "ready";
  if (statuses.some((s) => s === "preparing")) return "preparing";
  if (statuses.some((s) => s === "cancelled")) return "cancelled";
  return "pending";
}

function groupOrders(orders: OrderWithJoin[]): OrderGroup[] {
  const map = new Map<string, OrderWithJoin[]>();

  for (const o of orders) {
    // Group by user + time (truncated to seconds)
    // Orders from the same user at the exact same second are one group
    const timeSec = new Date(o.created_at).toISOString().slice(0, 19);
    const key = o.user_id + "__" + timeSec;
    const list = map.get(key) ?? [];
    list.push(o);
    map.set(key, list);
  }

  const groups: OrderGroup[] = [];
  for (const [key, items] of map) {
    const sorted = items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const first = sorted[0];
    groups.push({
      key,
      code: generateCode(first.id),
      userId: first.user_id,
      userName: first.profiles?.nama ?? first.profiles?.email ?? "-",
      waktu: first.waktu_pengambilan,
      items: sorted,
      totalHarga: sorted.reduce((s, i) => s + i.total_harga, 0),
      totalItems: sorted.reduce((s, i) => s + i.jumlah, 0),
      createdAt: first.created_at,
      overallStatus: getOverallStatus(sorted),
    });
  }

  return groups.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function GroupStatusButton({ group }: { group: OrderGroup }) {
  const [isPending, startTransition] = useTransition();

  const nextMap: Partial<Record<OrderStatus, "preparing" | "ready">> = {
    pending: "preparing",
    preparing: "ready",
  };

  const labels: Record<string, string> = {
    preparing: "Proses Semua",
    ready: "Siap Diambil",
  };

  const nextStatus = nextMap[group.overallStatus];
  if (!nextStatus) {
    if (group.overallStatus === "cancelled") {
      return <span className="text-[10px] uppercase tracking-wider text-red-500 font-bold">Dibatalkan</span>;
    }
    return <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Selesai</span>;
  }

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const ids = group.items.map((i) => i.id);
          await updateGroupOrderStatus(ids, nextStatus);
        })
      }
      className={
        "text-xs font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50 " +
        (nextStatus === "preparing"
          ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20"
          : "bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20")
      }
    >
      {isPending ? "..." : labels[nextStatus]}
    </button>
  );
}

function OrderGroupCard({ group, isNew }: { group: OrderGroup; isNew: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={
        "bg-[#0a0a0a] rounded-2xl border transition-all duration-500 overflow-hidden " +
        (isNew ? "border-orange-500/50 shadow-lg shadow-orange-500/10 ring-1 ring-orange-500/20" : "border-white/5")
      }
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-11 h-11 shrink-0 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-sm uppercase">
            {group.userName.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-white text-base truncate">{group.userName}</span>
              {isNew && (
                <span className="text-[9px] uppercase tracking-wider bg-orange-500/20 text-orange-400 font-bold px-1.5 py-0.5 rounded-sm animate-pulse">
                  Baru!
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span className="font-mono text-orange-500/80 font-bold">{group.code}</span>
              <span className="text-white/15">|</span>
              <span>{group.totalItems} item</span>
              <span className="text-white/15">|</span>
              <span>{formatDate(group.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <span className="font-bold text-orange-500 text-sm">{formatRupiah(group.totalHarga)}</span>
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

      {expanded && (
        <div className="border-t border-white/5">
          <div className="divide-y divide-white/5">
            {group.items.map((item) => (
              <div key={item.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[11px] text-white/30">
                    *
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white">{item.menus?.nama ?? "-"}</span>
                    <span className="text-white/40 text-sm ml-2">x{item.jumlah}</span>
                  </div>
                </div>
                <span className="text-sm text-white/60 font-medium">{formatRupiah(item.total_harga)}</span>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-0.5">Total</p>
              <p className="text-lg font-bold text-orange-500">{formatRupiah(group.totalHarga)}</p>
            </div>
            <GroupStatusButton group={group} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function RealtimeOrdersQueue({ initialOrders }: Props) {
  const [orders, setOrders] = useState<OrderWithJoin[]>(initialOrders);
  const [newGroupKeys, setNewGroupKeys] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<WaktuPengambilan>("istirahat1");

  const fetchOrder = useCallback(async (id: number) => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("orders")
      .select("*, menus(nama), profiles(nama, email)")
      .eq("id", id)
      .single();
    return data as OrderWithJoin | null;
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel("orders-queue-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, async (payload) => {
        const newOrder = payload.new as Order;
        const full = await fetchOrder(newOrder.id);
        if (full) {
          setOrders((prev) => {
            if (prev.some((o) => o.id === full.id)) return prev;
            return [...prev, full];
          });
          const timeSec = new Date(full.created_at).toISOString().slice(0, 19);
          const groupKey = full.user_id + "__" + timeSec + "__" + full.status;
          setNewGroupKeys((prev) => new Set(prev).add(groupKey));
          setTimeout(() => {
            setNewGroupKeys((prev) => {
              const next = new Set(prev);
              next.delete(groupKey);
              return next;
            });
          }, 4000);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const updated = payload.new as Order;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrder]);

  const allGroups = useMemo(() => groupOrders(orders), [orders]);

  const pendingCount = useMemo(() => orders.filter((o) => o.status === "pending").length, [orders]);

  const tabGroups: Record<WaktuPengambilan, OrderGroup[]> = {
    istirahat1: allGroups.filter((g) => g.waktu === "istirahat1"),
    istirahat2: allGroups.filter((g) => g.waktu === "istirahat2"),
  };

  const tabCounts: Record<WaktuPengambilan, number> = {
    istirahat1: tabGroups.istirahat1.length,
    istirahat2: tabGroups.istirahat2.length,
  };

  return (
    <div className="p-8 lg:p-12 w-full">
      <div className="w-full">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-serif text-white tracking-tight">Antrean Pesanan</h1>
          {pendingCount > 0 && (
            <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold px-3 py-1 rounded-full animate-pulse uppercase tracking-widest relative flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              {pendingCount} pending
            </span>
          )}
        </div>

        <div className="flex space-x-2 bg-[#0a0a0a] p-1.5 rounded-xl border border-white/5 mb-8">
          {(["istirahat1", "istirahat2"] as WaktuPengambilan[]).map((waktu) => (
            <button
              key={waktu}
              onClick={() => setActiveTab(waktu)}
              className={
                "flex-1 flex items-center justify-center py-2.5 text-sm font-semibold rounded-lg transition-all " +
                (activeTab === waktu
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5")
              }
            >
              {formatWaktu(waktu)}
              <span
                className={
                  "ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full " +
                  (activeTab === waktu ? "bg-orange-500/20 text-orange-400" : "bg-white/10 text-white/50")
                }
              >
                {tabCounts[waktu]}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {tabGroups[activeTab].length === 0 && (
            <div className="text-center py-16 bg-[#0a0a0a] border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 text-xl">
                -
              </div>
              <p className="text-white/40 text-sm">Belum ada antrean untuk sesi ini.</p>
            </div>
          )}
          {tabGroups[activeTab].map((group) => (
            <OrderGroupCard key={group.key} group={group} isNew={newGroupKeys.has(group.key)} />
          ))}
        </div>
      </div>
    </div>
  );
}
