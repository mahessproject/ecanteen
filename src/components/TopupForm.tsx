"use client";

import { useState, useTransition, useEffect } from "react";
import { requestTopup } from "@/app/actions/saldo";
import { formatRupiah } from "@/lib/utils";
import { Clock, CheckCircle2, QrCode, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const AMOUNTS = [10000, 20000, 50000, 100000];
const ADMIN_FEE = 1500;
const EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export default function TopupForm({ currentSaldo }: { currentSaldo: number }) {
  const [custom, setCustom] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [generatedCode, setGeneratedCode] = useState<{ code: string; amount: number; createdAt: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState(EXPIRY_MS);

  // Countdown timer for generated code
  useEffect(() => {
    if (!generatedCode) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - generatedCode.createdAt;
      const r = Math.max(0, EXPIRY_MS - elapsed);
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        setGeneratedCode(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [generatedCode]);

  async function handleTopup() {
    const amount = selected ?? Number(custom);
    if (!amount || amount <= 0) {
      setMessage({ type: "error", text: "Masukkan jumlah top-up" });
      return;
    }
    setMessage(null);
    const fd = new FormData();
    fd.append("amount", String(amount));

    startTransition(async () => {
      const res = await requestTopup(fd);
      if (res.success && res.code) {
        setGeneratedCode({ code: res.code, amount, createdAt: Date.now() });
        setRemaining(EXPIRY_MS);
        setSelected(null);
        setCustom("");
      } else {
        setMessage({ type: "error", text: (res as { error?: string }).error ?? "Gagal mengirim permintaan" });
      }
    });
  }

  function handleCopyCode() {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Show QR code result view
  if (generatedCode) {
    return (
      <div className="bg-[#0a0a0a] rounded-[1.5rem] p-6 lg:p-8 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
            <CheckCircle2 size={32} className="text-green-400" />
          </div>

          <h3 className="font-extrabold text-white text-2xl mb-2 tracking-tight">Menunggu Pembayaran</h3>
          <p className="text-base text-white/50 mb-2 max-w-[300px] mx-auto leading-relaxed">
            Tunjukkan kode ke kasir / admin untuk menyelesaikan top-up
          </p>

          {/* Countdown Timer */}
          <div
            className={
              "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 " +
              (remaining < 120000
                ? "bg-red-500/10 border border-red-500/20"
                : "bg-orange-500/10 border border-orange-500/20")
            }
          >
            <Clock size={14} className={remaining < 120000 ? "text-red-400" : "text-orange-400"} />
            <span
              className={"text-sm font-mono font-bold " + (remaining < 120000 ? "text-red-400" : "text-orange-400")}
            >
              {Math.floor(remaining / 60000)}:
              {Math.floor((remaining % 60000) / 1000)
                .toString()
                .padStart(2, "0")}
            </span>
            <span className="text-[10px] text-white/30">tersisa</span>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 mb-8 text-left max-w-[320px] mx-auto">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/40">Nominal Top-up</span>
              <span className="text-white font-medium">{formatRupiah(generatedCode.amount)}</span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-white/40">Biaya Admin</span>
              <span className="text-white font-medium">{formatRupiah(ADMIN_FEE)}</span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between text-sm">
              <span className="text-white font-bold">Total Bayar</span>
              <span className="text-orange-400 font-extrabold text-lg">
                {formatRupiah(generatedCode.amount + ADMIN_FEE)}
              </span>
            </div>
          </div>

          {/* Huge Code Display Container */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 mb-8 relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl pointer-events-none"></div>

            <p className="text-sm font-medium text-white/40 mb-3 uppercase tracking-widest">KODE PEMBAYARAN</p>

            <div className="flex items-center justify-center gap-4">
              <p className="text-5xl sm:text-6xl font-black text-white tracking-[0.2em] font-mono drop-shadow-md">
                {generatedCode.code}
              </p>
              <button
                onClick={handleCopyCode}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
              </button>
            </div>
            {copied && (
              <p className="text-green-400 text-xs font-medium mt-3 absolute -bottom-6 left-1/2 -translate-x-1/2">
                Kode disalin!
              </p>
            )}
          </div>

          {/* QR Code Section - Hidden, kept for future use
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 inline-flex flex-col items-center mb-8 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-4 shadow-xl">
              <QRCodeSVG value={generatedCode.code} size={160} level="H" bgColor="#ffffff" fgColor="#000000" />
            </div>
            <div className="flex items-center gap-2 mt-4 text-white/40">
              <QrCode size={14} />
              <span className="text-xs font-medium uppercase tracking-wider">Alternatif Scan QR</span>
            </div>
          </div>
          */}

          <button
            onClick={() => {
              setGeneratedCode(null);
              setMessage(null);
            }}
            className="w-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 font-bold py-4 rounded-2xl transition-all text-sm uppercase tracking-wider"
          >
            Selesai / Ajukan Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] rounded-[1.5rem] p-6 lg:p-8">
      <h3 className="font-bold text-white text-lg mb-2">Ajukan Top-up</h3>
      <p className="text-sm text-white/50 mb-2">
        Saldo saat ini: <span className="font-bold text-orange-500">{formatRupiah(currentSaldo)}</span>
      </p>
      <div className="flex items-center gap-2 mb-6 px-3 py-2 bg-orange-500/5 border border-orange-500/10 rounded-lg">
        <Clock size={14} className="text-orange-500 shrink-0" />
        <p className="text-[11px] text-orange-500/80 leading-relaxed">
          Setelah mengajukan, tunjukkan kode/QR ke admin untuk konfirmasi.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => {
              setSelected(a);
              setCustom("");
            }}
            className={
              "py-3 rounded-xl border text-sm font-medium transition-all " +
              (selected === a
                ? "border-orange-500 bg-orange-500/10 text-orange-500 shadow-sm"
                : "border-white/5 bg-transparent text-white/50 hover:border-white/20 hover:text-white")
            }
          >
            {formatRupiah(a)}
          </button>
        ))}
      </div>

      <input
        type="number"
        placeholder="Jumlah lainnya..."
        value={custom}
        onChange={(e) => {
          setCustom(e.target.value);
          setSelected(null);
        }}
        className="w-full bg-transparent border border-white/5 rounded-xl px-4 py-3.5 text-sm mb-4 focus:outline-none focus:border-orange-500 text-white placeholder:text-white/20 transition-all font-medium"
      />

      {/* Fee Breakdown */}
      {(selected || (custom && Number(custom) > 0)) && (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 mb-6 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Nominal Top-up</span>
            <span className="text-white/70">{formatRupiah(selected ?? Number(custom))}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Biaya Admin</span>
            <span className="text-white/70">{formatRupiah(ADMIN_FEE)}</span>
          </div>
          <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
            <span className="text-white font-bold">Total Bayar</span>
            <span className="text-orange-500 font-bold">{formatRupiah((selected ?? Number(custom)) + ADMIN_FEE)}</span>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`text-sm mb-6 px-4 py-3 rounded-xl flex items-start gap-2.5 ${
            message.type === "success"
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-500 border border-red-500/20"
          }`}
        >
          {message.type === "success" && <CheckCircle2 size={16} className="shrink-0 mt-0.5" />}
          <p>{message.text}</p>
        </div>
      )}

      <button
        onClick={handleTopup}
        disabled={isPending}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-white/10 disabled:text-white/30 text-black font-bold py-3.5 rounded-xl transition-all shadow-xl shadow-orange-500/20 text-sm active:scale-[0.98]"
      >
        {isPending ? "Mengirim permintaan..." : "Ajukan Top-up"}
      </button>
    </div>
  );
}
