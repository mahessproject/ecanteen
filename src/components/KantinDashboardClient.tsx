"use client";

import { useState, useMemo } from "react";
import { formatRupiah, formatDate, formatWaktu } from "@/lib/utils";

type OrderItem = {
  id: number;
  created_at: string;
  jumlah: number;
  total_harga: number;
  status: "pending" | "preparing" | "ready" | "cancelled";
  waktu_pengambilan: "istirahat1" | "istirahat2";
  checkout_id: string | null;
  menus: { nama: string; harga: number } | null;
  profiles: { nama: string | null; email: string } | null;
};

type StatOrder = {
  total_harga: number;
  status: string;
  created_at: string;
};

interface Props {
  todayOrders: OrderItem[];
  allOrders: StatOrder[];
  saldoPendapatan: number;
  saldoKantin: number;
}

const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  preparing: "Diproses",
  ready: "Siap Diambil",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  preparing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ready: "bg-green-500/10 text-green-400 border-green-500/20",
};

export default function KantinDashboardClient({ todayOrders, allOrders, saldoPendapatan, saldoKantin }: Props) {
  const [filter, setFilter] = useState<"all" | "pending" | "preparing" | "ready">("all");

  const todayStats = useMemo(() => {
    const total = todayOrders.reduce((s, o) => s + o.total_harga, 0);
    const count = todayOrders.length;
    const pending = todayOrders.filter((o) => o.status === "pending").length;
    const ready = todayOrders.filter((o) => o.status === "ready").length;
    return { total, count, pending, ready };
  }, [todayOrders]);

  const allTimeTotal = useMemo(() => allOrders.reduce((s, o) => s + o.total_harga, 0), [allOrders]);

  const filtered = useMemo(
    () => (filter === "all" ? todayOrders : todayOrders.filter((o) => o.status === filter)),
    [todayOrders, filter],
  );

  return (
    <div className="p-8 lg:p-12 w-full">
      <h1 className="text-3xl font-serif text-white tracking-tight mb-8">Dashboard Kantin</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <div className="bg-[#0a0a0a] border border-orange-500/20 rounded-2xl p-6">
          <p className="text-[10px] text-orange-400 uppercase tracking-widest font-bold mb-2">Saldo Pendapatan</p>
          <p className="text-2xl font-bold text-orange-500">{formatRupiah(saldoPendapatan)}</p>
          <p className="text-xs text-white/30 mt-1">Bisa dicairkan</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Saldo Kantin</p>
          <p className="text-2xl font-bold text-green-400">{formatRupiah(saldoKantin)}</p>
          <p className="text-xs text-white/30 mt-1">Dari pencairan</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Pendapatan Hari Ini</p>
          <p className="text-2xl font-bold text-white">{formatRupiah(todayStats.total)}</p>
          <p className="text-xs text-white/30 mt-1">{todayStats.count} pesanan</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Menunggu Proses</p>
          <p className="text-2xl font-bold text-yellow-400">{todayStats.pending}</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Total Pendapatan</p>
          <p className="text-2xl font-bold text-white">{formatRupiah(allTimeTotal)}</p>
          <p className="text-xs text-white/30 mt-1">{allOrders.length} pesanan</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-white/40 font-bold uppercase tracking-widest mr-2">Pesanan Hari Ini</span>
        {(["all", "pending", "preparing", "ready"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "text-xs font-bold px-3 py-1.5 rounded-lg border transition-all " +
              (filter === f
                ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                : "bg-white/5 text-white/40 border-white/5 hover:text-white/60")
            }
          >
            {f === "all" ? "Semua" : statusLabels[f]}
          </button>
        ))}
      </div>

      {/* Order List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 bg-[#0a0a0a] border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 text-xl">
              -
            </div>
            <p className="text-white/40 text-sm">Belum ada pesanan.</p>
          </div>
        )}
        {filtered.map((order) => (
          <div
            key={order.id}
            className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-sm uppercase">
                {(order.profiles?.nama ?? order.profiles?.email ?? "?").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">
                  {order.profiles?.nama ?? order.profiles?.email ?? "-"}
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  {order.menus?.nama ?? "-"} × {order.jumlah}
                  <span className="text-white/15 mx-1.5">|</span>
                  {formatWaktu(order.waktu_pengambilan)}
                  <span className="text-white/15 mx-1.5">|</span>
                  {formatDate(order.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-bold text-orange-500 text-sm">{formatRupiah(order.total_harga)}</span>
              <span
                className={
                  "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border " +
                  (statusColors[order.status] ?? "bg-white/5 text-white/40 border-white/10")
                }
              >
                {statusLabels[order.status] ?? order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
