"use client";

import { useState, useTransition } from "react";
import { generateTodayReport } from "@/app/actions/report";

export default function GenerateReportButton() {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function handle() {
    setMsg(null);
    startTransition(async () => {
      const res = await generateTodayReport();
      if (res.success) {
        setMsg({ type: "ok", text: "Laporan hari ini berhasil diperbarui!" });
      } else {
        setMsg({ type: "err", text: res.error ?? "Gagal memperbarui laporan" });
      }
      setTimeout(() => setMsg(null), 3000);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handle}
        disabled={isPending}
        className="bg-orange-500 hover:bg-orange-600 disabled:bg-white/10 disabled:text-white/50 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
      >
        {isPending ? "Memperbarui..." : "🔄 Generate Laporan Hari Ini"}
      </button>
      {msg && (
        <p
          className={`text-xs font-medium px-3 py-1.5 rounded-lg ${
            msg.type === "ok"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
