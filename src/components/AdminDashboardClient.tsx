"use client";

import { useMemo } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";

type WithdrawalItem = {
  id: number;
  user_id: string;
  amount: number;
  method: "cash" | "transfer";
  status: "pending" | "approved" | "rejected";
  admin_fee: number | null;
  net_amount: number | null;
  created_at: string;
  profiles: { nama: string | null; email: string } | null;
};

type OrderStat = {
  total_harga: number;
  status: string;
};

type OrderStatFull = OrderStat & {
  created_at: string;
};

interface Props {
  adminSaldo: number;
  withdrawals: WithdrawalItem[];
  todayOrders: OrderStat[];
  allOrders: OrderStatFull[];
}

export default function AdminDashboardClient({ adminSaldo, withdrawals, todayOrders, allOrders }: Props) {
  const stats = useMemo(() => {
    const totalFeeIncome = withdrawals
      .filter((w) => w.status === "approved" && w.admin_fee != null)
      .reduce((s, w) => s + (w.admin_fee ?? 0), 0);

    const totalDisbursed = withdrawals
      .filter((w) => w.status === "approved" && w.net_amount != null)
      .reduce((s, w) => s + (w.net_amount ?? 0), 0);

    const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
    const pendingAmount = pendingWithdrawals.reduce((s, w) => s + w.amount, 0);

    const todayRevenue = todayOrders.reduce((s, o) => s + o.total_harga, 0);
    const todayOrderCount = todayOrders.length;

    const allTimeRevenue = allOrders.reduce((s, o) => s + o.total_harga, 0);

    // Monthly revenue
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyRevenue = allOrders
      .filter((o) => o.created_at.startsWith(currentMonth))
      .reduce((s, o) => s + o.total_harga, 0);

    return {
      totalFeeIncome,
      totalDisbursed,
      pendingAmount,
      pendingCount: pendingWithdrawals.length,
      todayRevenue,
      todayOrderCount,
      allTimeRevenue,
      monthlyRevenue,
    };
  }, [withdrawals, todayOrders, allOrders]);

  // Recent approved withdrawals (last 10)
  const recentTransactions = useMemo(
    () => withdrawals.filter((w) => w.status === "approved").slice(0, 10),
    [withdrawals],
  );

  // Pending withdrawals
  const pendingList = useMemo(() => withdrawals.filter((w) => w.status === "pending"), [withdrawals]);

  return (
    <div className="p-8 lg:p-12 w-full">
      <h1 className="text-3xl font-serif text-white tracking-tight mb-2">Dashboard Admin</h1>
      <p className="text-sm text-white/40 mb-8">Ringkasan keuangan sekolah &amp; kantin</p>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-[#0a0a0a] border border-orange-500/20 rounded-2xl p-6">
          <p className="text-[10px] text-orange-400 uppercase tracking-widest font-bold mb-2">Saldo Sekolah</p>
          <p className="text-2xl font-bold text-orange-500">{formatRupiah(adminSaldo)}</p>
          <p className="text-xs text-white/30 mt-1">Dari potongan 5% pencairan</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Total Pendapatan 5%</p>
          <p className="text-2xl font-bold text-green-400">{formatRupiah(stats.totalFeeIncome)}</p>
          <p className="text-xs text-white/30 mt-1">Dari seluruh pencairan</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Total Dicairkan Kantin</p>
          <p className="text-2xl font-bold text-white">{formatRupiah(stats.totalDisbursed)}</p>
          <p className="text-xs text-white/30 mt-1">Dana keluar ke kantin</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Menunggu Pencairan</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.pendingCount}</p>
          <p className="text-xs text-white/30 mt-1">{formatRupiah(stats.pendingAmount)}</p>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Omzet Hari Ini</p>
          <p className="text-2xl font-bold text-white">{formatRupiah(stats.todayRevenue)}</p>
          <p className="text-xs text-white/30 mt-1">{stats.todayOrderCount} pesanan</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Omzet Bulan Ini</p>
          <p className="text-2xl font-bold text-white">{formatRupiah(stats.monthlyRevenue)}</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Total Omzet</p>
          <p className="text-2xl font-bold text-white">{formatRupiah(stats.allTimeRevenue)}</p>
          <p className="text-xs text-white/30 mt-1">{allOrders.length} pesanan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Withdrawals */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6">
            Pencairan Menunggu
            {pendingList.length > 0 && (
              <span className="ml-2 text-orange-400 animate-pulse">({pendingList.length})</span>
            )}
          </h2>

          <div className="space-y-3">
            {pendingList.length === 0 && (
              <div className="text-center py-8 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                  ✓
                </div>
                <p className="text-white/40 text-sm">Tidak ada pencairan pending.</p>
              </div>
            )}
            {pendingList.map((w) => {
              const fee = Math.round((w.amount * 5) / 100);
              const net = w.amount - fee;
              const name = w.profiles?.nama ?? w.profiles?.email ?? "-";
              return (
                <div key={w.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-xs uppercase">
                        {name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-white">{name}</span>
                    </div>
                    <span className="text-yellow-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border bg-yellow-500/10 border-yellow-500/20">
                      Menunggu
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">{formatDate(w.created_at)}</span>
                    <div className="text-right">
                      <p className="text-orange-500 font-bold">{formatRupiah(w.amount)}</p>
                      <p className="text-white/30 mt-0.5">
                        Potongan: {formatRupiah(fee)} → Diterima: {formatRupiah(net)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Riwayat Pencairan Terbaru</h2>

          <div className="space-y-3">
            {recentTransactions.length === 0 && (
              <div className="text-center py-8 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                  -
                </div>
                <p className="text-white/40 text-sm">Belum ada pencairan.</p>
              </div>
            )}
            {recentTransactions.map((w) => {
              const name = w.profiles?.nama ?? w.profiles?.email ?? "-";
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 text-xs">
                      ✓
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{name}</p>
                      <p className="text-xs text-white/30">{formatDate(w.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">{formatRupiah(w.amount)}</p>
                    <div className="flex items-center gap-2 text-[10px] mt-0.5">
                      <span className="text-orange-400">+{formatRupiah(w.admin_fee ?? 0)}</span>
                      <span className="text-white/20">|</span>
                      <span className="text-green-400">-{formatRupiah(w.net_amount ?? 0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
