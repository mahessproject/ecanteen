"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { approveTopup, rejectTopup, findTopupByCode } from "@/app/actions/saldo";
import { formatRupiah } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Banknote,
  Search,
  User,
  ScanLine,
  Camera,
  X,
  Keyboard,
  Ban,
  TimerOff,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

const ADMIN_FEE = 1500;

type TopupRequestWithProfile = {
  id: number;
  user_id: string;
  amount: number;
  status: string;
  code: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  profiles: { nama: string | null; email: string | null } | null;
};

type Tab = "pending" | "approved" | "rejected" | "all";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
          <Clock size={10} />
          Menunggu
        </span>
      );
    case "approved":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
          <CheckCircle2 size={10} />
          Disetujui
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
          <XCircle size={10} />
          Ditolak
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/40 border border-white/10">
          <Ban size={10} />
          Dibatalkan
        </span>
      );
    case "expired":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/5 text-orange-400/60 border border-orange-500/10">
          <TimerOff size={10} />
          Kedaluwarsa
        </span>
      );
    default:
      return null;
  }
}

function ApproveButton({ requestId, onDone }: { requestId: number; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await approveTopup(requestId);
          onDone();
        });
      }}
      className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all disabled:opacity-50"
    >
      {isPending ? "..." : "Setujui"}
    </button>
  );
}

function RejectButton({ requestId, onDone }: { requestId: number; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");

  if (showNote) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Alasan (opsional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="bg-transparent border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 w-40"
          autoFocus
        />
        <button
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await rejectTopup(requestId, note || undefined);
              onDone();
              setShowNote(false);
              setNote("");
            });
          }}
          className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all disabled:opacity-50"
        >
          {isPending ? "..." : "Tolak"}
        </button>
        <button
          onClick={() => {
            setShowNote(false);
            setNote("");
          }}
          className="px-2 py-1.5 text-xs text-white/30 hover:text-white/60"
        >
          Batal
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowNote(true)}
      className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all"
    >
      Tolak
    </button>
  );
}

export default function RealtimeTopupManagement({ initialRequests }: { initialRequests: TopupRequestWithProfile[] }) {
  const [requests, setRequests] = useState<TopupRequestWithProfile[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // Scan / Code lookup state
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanMode, setScanMode] = useState<"camera" | "manual">("manual");
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<{
    id: number;
    user_id: string;
    amount: number;
    status: string;
    code: string;
    nama: string | null;
    email: string | null;
    created_at: string;
    admin_note: string | null;
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isLookingUp, startLookup] = useTransition();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-scanner-container";

  // Refresh profile data for a request after realtime event
  const fetchRequestWithProfile = useCallback(async (id: number) => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("topup_requests")
      .select("*, profiles:user_id(nama, email)")
      .eq("id", id)
      .single();
    return data as TopupRequestWithProfile | null;
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("topup_requests_admin")
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "topup_requests" },
        async (payload: { eventType: string; new: TopupRequestWithProfile; old: { id: number } }) => {
          if (payload.eventType === "INSERT") {
            const full = await fetchRequestWithProfile(payload.new.id);
            if (full) {
              setRequests((prev) => [full, ...prev]);
              setHighlightedId(full.id);
              setTimeout(() => setHighlightedId(null), 3000);
            }
          } else if (payload.eventType === "UPDATE") {
            const full = await fetchRequestWithProfile(payload.new.id);
            if (full) {
              setRequests((prev) => prev.map((r) => (r.id === full.id ? full : r)));
            }
          } else if (payload.eventType === "DELETE") {
            setRequests((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequestWithProfile]);

  const filtered = requests.filter((r) => {
    if (activeTab !== "all" && r.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      const nama = r.profiles?.nama?.toLowerCase() ?? "";
      const email = r.profiles?.email?.toLowerCase() ?? "";
      const code = r.code?.toLowerCase() ?? "";
      if (!nama.includes(q) && !email.includes(q) && !code.includes(q) && !String(r.amount).includes(q)) return false;
    }
    return true;
  });

  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    all: requests.length,
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "pending", label: "Menunggu" },
    { key: "approved", label: "Disetujui" },
    { key: "rejected", label: "Ditolak" },
    { key: "all", label: "Semua" },
  ];

  function handleDone() {
    // Realtime will handle the update
  }

  function openScanModal() {
    setShowScanModal(true);
    setScanResult(null);
    setScanError(null);
    setManualCode("");
    setScanMode("manual");
  }

  function closeScanModal() {
    setShowScanModal(false);
    stopScanner();
    setScanResult(null);
    setScanError(null);
    setManualCode("");
  }

  function stopScanner() {
    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner.isScanning) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      } else {
        try {
          scanner.clear();
        } catch {
          /* ignore */
        }
      }
    }
  }

  function startCamera() {
    setScanMode("camera");
    setScanError(null);
    // Give DOM time to render the container
    setTimeout(() => {
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;
      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            lookupCode(decodedText);
            stopScanner();
            setScanMode("manual");
          },
          () => {}, // ignore scan failures
        )
        .catch(() => {
          setScanError("Tidak bisa mengakses kamera. Coba masukkan kode manual.");
          setScanMode("manual");
        });
    }, 300);
  }

  function lookupCode(code: string) {
    if (!code.trim()) return;
    setScanError(null);
    startLookup(async () => {
      const res = await findTopupByCode(code.trim());
      if (res.success) {
        setScanResult(res.request);
      } else {
        setScanError(res.error ?? "Kode tidak ditemukan");
        setScanResult(null);
      }
    });
  }

  return (
    <div className="w-full">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
              <Clock className="text-yellow-500" size={20} />
            </div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Menunggu</p>
          </div>
          <p className="text-3xl font-light text-yellow-500">{counts.pending}</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="text-green-400" size={20} />
            </div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Disetujui</p>
          </div>
          <p className="text-3xl font-light text-green-400">{counts.approved}</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <XCircle className="text-red-500" size={20} />
            </div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Ditolak</p>
          </div>
          <p className="text-3xl font-light text-red-500">{counts.rejected}</p>
        </div>
      </div>

      {/* Tabs + Search + Scan */}
      <div className="flex items-center justify-between mb-8 gap-6">
        <div className="flex bg-[#0a0a0a] rounded-2xl p-1.5 border border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {tab.label}
              {tab.key !== "all" && counts[tab.key] > 0 && (
                <span className="ml-2 text-[10px] opacity-70">({counts[tab.key]})</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openScanModal}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-orange-500 text-black text-xs font-bold hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 active:scale-[0.97]"
          >
            <Keyboard size={16} />
            Input Kode
          </button>
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              placeholder="Cari nama / email / kode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0a0a0a] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 w-64 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Request List */}
      {filtered.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-16 text-center">
          <Banknote className="mx-auto text-white/10 mb-4" size={48} />
          <p className="text-white/20 text-sm">Tidak ada permintaan top-up</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div
              key={req.id}
              className={`bg-[#0a0a0a] border rounded-2xl p-6 transition-all ${
                highlightedId === req.id
                  ? "border-orange-500/40 bg-orange-500/5 shadow-lg shadow-orange-500/5"
                  : "border-white/5 hover:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <User size={18} className="text-white/30" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-white font-bold text-sm truncate">{req.profiles?.nama ?? "Unknown"}</p>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-[11px] text-white/30 truncate">{req.profiles?.email ?? req.user_id}</p>
                    <p className="text-[11px] text-white/20 mt-1">{formatDate(req.created_at)}</p>
                    {req.admin_note && (
                      <p className="text-[11px] text-red-400/60 mt-1 italic">Catatan: {req.admin_note}</p>
                    )}
                  </div>
                </div>

                {/* Code + Amount + Actions */}
                <div className="flex items-center gap-6">
                  <span className="font-mono font-bold text-xl text-orange-500 tracking-[0.15em] bg-orange-500/5 px-4 py-2 rounded-xl border border-orange-500/10">
                    {req.code}
                  </span>
                  <div className="text-right">
                    <p className="text-xl font-light text-orange-500 tabular-nums">{formatRupiah(req.amount)}</p>
                    <p className="text-[10px] text-white/30">+{formatRupiah(ADMIN_FEE)} admin</p>
                  </div>
                  {req.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <ApproveButton requestId={req.id} onDone={handleDone} />
                      <RejectButton requestId={req.id} onDone={handleDone} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scan / Input Code Modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm" onClick={closeScanModal} />

          <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] -z-10" />

            <button
              onClick={closeScanModal}
              className="absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center rounded-full text-white/50 hover:text-white transition-all"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
                <ScanLine size={24} className="text-orange-500" />
              </div>
              <h2 className="text-2xl font-serif text-white mb-1">Verifikasi Top-up</h2>
              <p className="text-sm text-white/40 font-light">Masukkan kode dari siswa</p>
            </div>

            {/* Mode Toggle - Camera scan hidden, kept for future use */}
            {/*
            <div className="flex bg-white/5 rounded-xl p-1 mb-6 border border-white/5">
              <button
                onClick={() => {
                  stopScanner();
                  setScanMode("manual");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  scanMode === "manual" ? "bg-orange-500 text-black shadow-lg" : "text-white/40 hover:text-white/60"
                }`}
              >
                <Keyboard size={14} />
                Input Kode
              </button>
              <button
                onClick={startCamera}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  scanMode === "camera" ? "bg-orange-500 text-black shadow-lg" : "text-white/40 hover:text-white/60"
                }`}
              >
                <Camera size={14} />
                Scan QR
              </button>
            </div>

            {scanMode === "camera" && (
              <div className="mb-6 rounded-2xl overflow-hidden border border-white/10 bg-black">
                <div id={scannerContainerId} className="w-full" />
              </div>
            )}
            */}

            {/* Manual input */}
            {scanMode === "manual" && (
              <div className="mb-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Masukkan kode (cth: TU-A3X9F2)"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") lookupCode(manualCode);
                    }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 tracking-wider uppercase transition-all"
                    autoFocus
                  />
                  <button
                    onClick={() => lookupCode(manualCode)}
                    disabled={isLookingUp || !manualCode.trim()}
                    className="px-6 py-3.5 rounded-xl bg-orange-500 text-black font-bold text-sm hover:bg-orange-400 disabled:bg-white/10 disabled:text-white/30 transition-all active:scale-[0.97]"
                  >
                    {isLookingUp ? "..." : "Cari"}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {scanError && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {scanError}
              </div>
            )}

            {/* Result Card */}
            {scanResult && (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <User size={18} className="text-white/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{scanResult.nama ?? "Unknown"}</p>
                    <p className="text-[11px] text-white/30 truncate">{scanResult.email}</p>
                  </div>
                  <StatusBadge status={scanResult.status} />
                </div>

                <div className="flex items-center justify-between py-4 border-t border-white/5">
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Jumlah Top-up</p>
                    <p className="text-2xl font-light text-orange-500">{formatRupiah(scanResult.amount)}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">
                      Total bayar: {formatRupiah(scanResult.amount + ADMIN_FEE)} (incl. biaya admin{" "}
                      {formatRupiah(ADMIN_FEE)})
                    </p>
                  </div>
                  <p className="font-mono text-sm text-white/40">{scanResult.code}</p>
                </div>

                {scanResult.status === "pending" ? (
                  <div className="flex gap-3 mt-4">
                    <ApproveButton
                      requestId={scanResult.id}
                      onDone={() => {
                        setScanResult({ ...scanResult, status: "approved" });
                      }}
                    />
                    <RejectButton
                      requestId={scanResult.id}
                      onDone={() => {
                        setScanResult({ ...scanResult, status: "rejected" });
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-white/30 mt-4 text-center">
                    Permintaan ini sudah {scanResult.status === "approved" ? "disetujui" : "ditolak"}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
