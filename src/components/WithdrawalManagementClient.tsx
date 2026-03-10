"use client";

import { useState, useTransition, useMemo } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { approveWithdrawal, rejectWithdrawal } from "@/app/actions/withdrawal";

type WithdrawalWithProfile = {
  id: number;
  user_id: string;
  amount: number;
  method: "cash" | "transfer";
  bank_info: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  admin_fee: number | null;
  net_amount: number | null;
  created_at: string;
  profiles: { nama: string | null; email: string } | null;
};

interface Props {
  withdrawals: WithdrawalWithProfile[];
}

const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

function WithdrawalCard({ item }: { item: WithdrawalWithProfile }) {
  const [isPending, startTransition] = useTransition();
  const [rejectNote, setRejectNote] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleApprove = () => {
    startTransition(async () => {
      const res = await approveWithdrawal(item.id);
      if (!res.success) setResult(res.error ?? "Gagal");
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const res = await rejectWithdrawal(item.id, rejectNote || undefined);
      if (!res.success) setResult(res.error ?? "Gagal");
      setShowReject(false);
    });
  };

  const userName = item.profiles?.nama ?? item.profiles?.email ?? "-";

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-sm uppercase">
            {userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm truncate">{userName}</p>
            <p className="text-xs text-white/40 mt-0.5">{formatDate(item.created_at)}</p>
          </div>
        </div>

        <span
          className={
            "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border " +
            (statusColors[item.status] ?? "")
          }
        >
          {statusLabels[item.status] ?? item.status}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-3">
        <div>
          <p className="text-lg font-bold text-orange-500">{formatRupiah(item.amount)}</p>
          <p className="text-xs text-white/40 mt-0.5">
            {item.method === "cash" ? "💵 Tunai" : "🏦 Transfer"}
            {item.bank_info && <span className="ml-1.5">• {item.bank_info}</span>}
          </p>
          {item.status === "approved" && item.admin_fee != null && item.net_amount != null && (
            <div className="flex items-center gap-3 text-xs mt-1.5">
              <span className="text-white/50">
                Potongan 5%: <span className="text-orange-400">{formatRupiah(item.admin_fee)}</span>
              </span>
              <span className="text-white/50">
                Diterima kantin: <span className="text-green-400">{formatRupiah(item.net_amount)}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {item.admin_note && <p className="text-xs text-white/40 mb-3 italic">Catatan: {item.admin_note}</p>}

      {result && <p className="text-xs text-red-400 mb-3">{result}</p>}

      {item.status === "pending" && (
        <div className="flex gap-2">
          {!showReject ? (
            <>
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="flex-1 text-xs font-bold px-4 py-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all disabled:opacity-50"
              >
                {isPending ? "..." : "Setujui"}
              </button>
              <button
                onClick={() => setShowReject(true)}
                disabled={isPending}
                className="flex-1 text-xs font-bold px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
              >
                Tolak
              </button>
            </>
          ) : (
            <div className="w-full space-y-2">
              <input
                type="text"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Catatan penolakan (opsional)..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-red-500/50"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={isPending}
                  className="flex-1 text-xs font-bold px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  {isPending ? "..." : "Konfirmasi Tolak"}
                </button>
                <button onClick={() => setShowReject(false)} className="text-xs text-white/30 hover:text-white/60 px-3">
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WithdrawalManagementClient({ withdrawals }: Props) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const filtered = useMemo(
    () => (filter === "all" ? withdrawals : withdrawals.filter((w) => w.status === filter)),
    [withdrawals, filter],
  );

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;
  const totalApproved = withdrawals.filter((w) => w.status === "approved").reduce((s, w) => s + w.amount, 0);
  const totalFeeIncome = withdrawals
    .filter((w) => w.status === "approved" && w.admin_fee != null)
    .reduce((s, w) => s + (w.admin_fee ?? 0), 0);
  const totalDisbursed = withdrawals
    .filter((w) => w.status === "approved" && w.net_amount != null)
    .reduce((s, w) => s + (w.net_amount ?? 0), 0);

  return (
    <div className="p-8 lg:p-12 w-full">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-serif text-white tracking-tight">Pencairan Dana</h1>
        {pendingCount > 0 && (
          <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold px-3 py-1 rounded-full animate-pulse uppercase tracking-widest">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Total Request</p>
          <p className="text-xl font-bold text-white">{withdrawals.length}</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Total Pencairan</p>
          <p className="text-xl font-bold text-white">{formatRupiah(totalApproved)}</p>
        </div>
        <div className="bg-[#0a0a0a] border border-orange-500/20 rounded-2xl p-5">
          <p className="text-[10px] text-orange-400 uppercase tracking-widest font-bold mb-1">
            Pendapatan Sekolah (5%)
          </p>
          <p className="text-xl font-bold text-orange-500">{formatRupiah(totalFeeIncome)}</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Dicairkan ke Kantin</p>
          <p className="text-xl font-bold text-green-400">{formatRupiah(totalDisbursed)}</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Menunggu</p>
          <p className="text-xl font-bold text-yellow-400">{pendingCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
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

      {/* List */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-16 bg-[#0a0a0a] border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 text-xl">
              -
            </div>
            <p className="text-white/40 text-sm">Belum ada permintaan pencairan.</p>
          </div>
        )}
        {filtered.map((w) => (
          <WithdrawalCard key={w.id} item={w} />
        ))}
      </div>
    </div>
  );
}
