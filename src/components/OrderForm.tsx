"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Menu } from "@/lib/supabase";
import { createOrder } from "@/app/actions/order";
import { formatRupiah, formatWaktu } from "@/lib/utils";

interface Props {
  menu: Menu;
  saldo: number;
  onClose: () => void;
}

export default function OrderForm({ menu, saldo, onClose }: Props) {
  const [jumlah, setJumlah] = useState(1);
  const [waktu, setWaktu] = useState<"istirahat1" | "istirahat2">("istirahat1");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const total = menu.harga * jumlah;
  const cukup = saldo >= total;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.append("menu_id", String(menu.id));
    fd.append("jumlah", String(jumlah));
    fd.append("waktu_pengambilan", waktu);

    startTransition(async () => {
      const res = await createOrder(fd);
      if (res.success) {
        onClose();
        router.push("/history");
      } else {
        setError(res.error ?? "Terjadi kesalahan");
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-lg text-gray-800">{menu.nama}</h2>
              <p className="text-orange-600 font-semibold">{formatRupiah(menu.harga)}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Jumlah */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setJumlah(Math.max(1, jumlah - 1))}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-lg flex items-center justify-center"
              >
                −
              </button>
              <span className="w-8 text-center font-semibold text-lg">{jumlah}</span>
              <button
                type="button"
                onClick={() => setJumlah(jumlah + 1)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-lg flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Waktu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Pengambilan</label>
            <div className="grid grid-cols-2 gap-2">
              {(["istirahat1", "istirahat2"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWaktu(w)}
                  className={`py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
                    waktu === w
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {formatWaktu(w)}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Total</span>
              <span className="font-semibold text-gray-800">{formatRupiah(total)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Saldo kamu</span>
              <span className={`font-semibold ${cukup ? "text-green-600" : "text-red-500"}`}>
                {formatRupiah(saldo)}
              </span>
            </div>
            {!cukup && <p className="text-red-500 text-xs mt-1">Saldo tidak cukup</p>}
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={!cukup || isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {isPending ? "Memproses..." : "Pesan Sekarang"}
          </button>
        </form>
      </div>
    </div>
  );
}
