"use client";

import { useState, useTransition } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { requestWithdrawal } from "@/app/actions/withdrawal";

type Withdrawal = {
  id: number;
  amount: number;
  method: "cash" | "transfer";
  bank_info: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  admin_fee: number | null;
  net_amount: number | null;
  created_at: string;
};

const FEE_PERCENT = 5;

interface Props {
  saldoPendapatan: number;
  saldoKantin: number;
  withdrawals: Withdrawal[];
}

const statusLabels: Record<string, string> = {
  pending: "Menunggu Admin",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function KantinWithdrawalClient({ saldoPendapatan, saldoKantin, withdrawals }: Props) {
  const [isPending, startTransition] = useTransition();
  const [method, setMethod] = useState<"cash" | "transfer">("cash");
  const [amount, setAmount] = useState("");
  const [bankInfo, setBankInfo] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const formData = new FormData();
    formData.set("amount", amount);
    formData.set("method", method);
    if (method === "transfer") formData.set("bank_info", bankInfo);

    startTransition(async () => {
      const result = await requestWithdrawal(formData);
      if (result.success) {
        setMessage({ type: "success", text: "Permintaan pencairan berhasil dikirim! Menunggu persetujuan admin." });
        setAmount("");
        setBankInfo("");
      } else {
        setMessage({ type: "error", text: result.error ?? "Gagal mengirim permintaan" });
      }
    });
  };

  const totalApproved = withdrawals.filter((w) => w.status === "approved").reduce((s, w) => s + w.amount, 0);

  const totalPending = withdrawals.filter((w) => w.status === "pending").reduce((s, w) => s + w.amount, 0);

  return (
    <div className="p-8 lg:p-12 w-full">
      <h1 className="text-3xl font-serif text-white tracking-tight mb-8">Pencairan Dana</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Ajukan Pencairan</h2>

            {/* Saldo Info */}
            <div className="mb-6 space-y-3">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Saldo Pendapatan</p>
                <p className="text-xl font-bold text-orange-500">{formatRupiah(saldoPendapatan)}</p>
                <p className="text-[9px] text-white/25 mt-1">Yang bisa dicairkan</p>
                {totalPending > 0 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    {formatRupiah(totalPending)} sedang menunggu persetujuan
                  </p>
                )}
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Saldo Kantin</p>
                <p className="text-lg font-bold text-green-400">{formatRupiah(saldoKantin)}</p>
                <p className="text-[9px] text-white/25 mt-1">Hasil pencairan (setelah potong 5%)</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="text-xs text-white/40 font-bold uppercase tracking-widest block mb-2">
                  Jumlah Pencairan
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Masukkan jumlah..."
                  required
                  min={1}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
                />
              </div>

              {/* Method */}
              <div>
                <label className="text-xs text-white/40 font-bold uppercase tracking-widest block mb-2">
                  Metode Pencairan
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("cash")}
                    className={
                      "flex-1 text-xs font-bold px-3 py-2.5 rounded-xl border transition-all " +
                      (method === "cash"
                        ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        : "bg-white/5 text-white/40 border-white/10 hover:text-white/60")
                    }
                  >
                    💵 Tunai
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("transfer")}
                    className={
                      "flex-1 text-xs font-bold px-3 py-2.5 rounded-xl border transition-all " +
                      (method === "transfer"
                        ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        : "bg-white/5 text-white/40 border-white/10 hover:text-white/60")
                    }
                  >
                    🏦 Transfer
                  </button>
                </div>
              </div>

              {/* Bank Info (only for transfer) */}
              {method === "transfer" && (
                <div>
                  <label className="text-xs text-white/40 font-bold uppercase tracking-widest block mb-2">
                    Info Rekening
                  </label>
                  <input
                    type="text"
                    value={bankInfo}
                    onChange={(e) => setBankInfo(e.target.value)}
                    placeholder="Contoh: BCA 1234567890 a/n Ibu Kantin"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
                  />
                </div>
              )}

              {/* Fee Preview */}
              {amount && Number(amount) > 0 && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Jumlah Pencairan</span>
                    <span className="text-white">{formatRupiah(Number(amount))}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Potongan Sekolah ({FEE_PERCENT}%)</span>
                    <span className="text-red-400">
                      - {formatRupiah(Math.round((Number(amount) * FEE_PERCENT) / 100))}
                    </span>
                  </div>
                  <div className="border-t border-white/5 pt-1.5 flex justify-between text-xs">
                    <span className="text-white/60 font-bold">Yang Diterima</span>
                    <span className="text-green-400 font-bold">
                      {formatRupiah(Number(amount) - Math.round((Number(amount) * FEE_PERCENT) / 100))}
                    </span>
                  </div>
                </div>
              )}

              {/* Message */}
              {message && (
                <div
                  className={
                    "text-xs font-medium px-4 py-3 rounded-xl border " +
                    (message.type === "success"
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20")
                  }
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold text-sm py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {isPending ? "Mengirim..." : "Ajukan Pencairan"}
              </button>
            </form>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4">
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Total Dicairkan</p>
              <p className="text-lg font-bold text-green-400">{formatRupiah(totalApproved)}</p>
            </div>
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4">
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Pending</p>
              <p className="text-lg font-bold text-yellow-400">{formatRupiah(totalPending)}</p>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Riwayat Pencairan</h2>

            <div className="space-y-3">
              {withdrawals.length === 0 && (
                <div className="text-center py-12 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 text-xl">
                    -
                  </div>
                  <p className="text-white/40 text-sm">Belum ada riwayat pencairan.</p>
                </div>
              )}
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-sm">{formatRupiah(w.amount)}</span>
                      <span
                        className={
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border " +
                          (statusColors[w.status] ?? "")
                        }
                      >
                        {statusLabels[w.status] ?? w.status}
                      </span>
                    </div>
                    {w.status === "approved" && w.admin_fee != null && w.net_amount != null && (
                      <div className="flex items-center gap-3 text-xs mb-1">
                        <span className="text-red-400/70">
                          Potongan {FEE_PERCENT}%: {formatRupiah(w.admin_fee)}
                        </span>
                        <span className="text-green-400">Diterima: {formatRupiah(w.net_amount)}</span>
                      </div>
                    )}
                    <p className="text-xs text-white/40">
                      {w.method === "cash" ? "💵 Tunai" : "🏦 Transfer"}
                      {w.bank_info && <span className="ml-1.5">• {w.bank_info}</span>}
                      <span className="text-white/15 mx-1.5">|</span>
                      {formatDate(w.created_at)}
                    </p>
                    {w.admin_note && <p className="text-xs text-red-400/70 mt-1">Catatan: {w.admin_note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
