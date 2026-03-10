"use client";

import { useState, useEffect, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { formatRupiah } from "@/lib/utils";
import { cancelTopup } from "@/app/actions/saldo";
import { Clock, CheckCircle2, XCircle, ChevronDown, Ban, TimerOff } from "lucide-react";

const ADMIN_FEE = 1500;
const EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

type TopupRequest = {
  id: number;
  amount: number;
  status: string;
  code: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

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

function CountdownTimer({ createdAt }: { createdAt: string }) {
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Date.now() - new Date(createdAt).getTime();
    return Math.max(0, EXPIRY_MS - elapsed);
  });

  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - new Date(createdAt).getTime();
      const r = Math.max(0, EXPIRY_MS - elapsed);
      setRemaining(r);
      if (r <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt, remaining]);

  if (remaining <= 0) return <span className="text-[10px] text-red-400">Kedaluwarsa</span>;

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  return (
    <span className={"text-[10px] font-mono font-bold " + (remaining < 120000 ? "text-red-400" : "text-orange-400")}>
      {mins}:{secs.toString().padStart(2, "0")}
    </span>
  );
}

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

export default function TopupRequestHistory({
  initialRequests,
  userId,
}: {
  initialRequests: TopupRequest[];
  userId: string;
}) {
  const [requests, setRequests] = useState<TopupRequest[]>(initialRequests);
  const [showAll, setShowAll] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("topup_requests_user")
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "topup_requests", filter: `user_id=eq.${userId}` },
        (payload: { eventType: string; new: TopupRequest; old: { id: number } }) => {
          if (payload.eventType === "INSERT") {
            setRequests((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setRequests((prev) => prev.map((r) => (r.id === payload.new.id ? payload.new : r)));
          } else if (payload.eventType === "DELETE") {
            setRequests((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const displayed = showAll ? requests : requests.slice(0, 5);
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-bold text-lg">Riwayat Permintaan</h3>
          <p className="text-xs text-white/30 mt-1">
            {pendingCount > 0 ? `${pendingCount} permintaan menunggu konfirmasi` : "Semua permintaan telah diproses"}
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 text-xs font-bold">
            {pendingCount}
          </span>
        )}
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-white/20 text-center py-8">Belum ada permintaan top-up</p>
      ) : (
        <div className="space-y-3">
          {displayed.map((req) => (
            <div
              key={req.id}
              className="px-5 py-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm">{formatRupiah(req.amount)}</p>
                    <span className="text-[10px] text-white/20">
                      ({formatRupiah(req.amount + ADMIN_FEE)} incl. admin)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[11px] text-white/30">{formatDate(req.created_at)}</p>
                    {req.status === "pending" && (
                      <>
                        <span className="text-white/10">·</span>
                        <CountdownTimer createdAt={req.created_at} />
                      </>
                    )}
                  </div>
                  {req.admin_note && (
                    <p className="text-[11px] text-red-400/70 mt-1 italic">Catatan: {req.admin_note}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {req.status === "pending" && (
                    <button
                      disabled={isPending && cancellingId === req.id}
                      onClick={() => {
                        setCancellingId(req.id);
                        startTransition(async () => {
                          const res = await cancelTopup(req.id);
                          if (!res.success) alert(res.error ?? "Gagal membatalkan");
                          setCancellingId(null);
                        });
                      }}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-50 uppercase tracking-wider"
                    >
                      {isPending && cancellingId === req.id ? "..." : "Batalkan"}
                    </button>
                  )}
                  <StatusBadge status={req.status} />
                </div>
              </div>
            </div>
          ))}

          {requests.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              <span>{showAll ? "Tampilkan lebih sedikit" : `Lihat semua (${requests.length})`}</span>
              <ChevronDown size={14} className={`transition-transform ${showAll ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
