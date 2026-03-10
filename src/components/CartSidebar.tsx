"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { createBulkOrder } from "@/app/actions/order";
import { formatRupiah, formatWaktu } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag, CreditCard } from "lucide-react";

interface Props {
  saldo: number;
}

export default function CartSidebar({ saldo }: Props) {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalHarga } = useCart();
  const [waktu, setWaktu] = useState<"istirahat1" | "istirahat2">("istirahat1");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const cukup = saldo >= totalHarga;

  function handleCheckout() {
    if (items.length === 0) return;
    setError(null);

    const cartData = items.map((i) => ({
      menu_id: i.menu.id,
      jumlah: i.jumlah,
    }));

    startTransition(async () => {
      const res = await createBulkOrder(cartData, waktu);
      if (res.success) {
        clearCart();
        router.push("/history");
      } else {
        setError(res.error ?? "Terjadi kesalahan");
      }
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Balance Card */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-white/30 uppercase tracking-[0.3em] mb-6">Vault Balance</h2>
        <div className="relative h-44 rounded-[2rem] bg-gradient-to-br from-[#1a1a1a] to-black p-8 text-white overflow-hidden border border-white/10 shadow-2xl">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <CreditCard className="text-orange-500" size={28} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">eCanteen</p>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Saldo</p>
              </div>
              <p className="text-2xl font-light tracking-tighter text-orange-500">{formatRupiah(saldo)}</p>
            </div>
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px]" />
        </div>
      </div>

      {/* Cart Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShoppingBag size={18} className="text-orange-500" />
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-[0.3em]">Keranjang</h2>
        </div>
        {items.length > 0 && (
          <span className="bg-orange-500 text-black text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 min-h-0">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-2xl">
              🛒
            </div>
            <p className="text-white/30 text-sm">Keranjang kosong</p>
            <p className="text-white/15 text-xs mt-1">Pilih menu untuk mulai memesan</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.menu.id}
              className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                  {item.menu.foto_url ? (
                    <Image
                      src={item.menu.foto_url}
                      alt={item.menu.nama}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">🍱</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.menu.nama}</p>
                  <p className="text-xs text-orange-500 font-medium mt-0.5">{formatRupiah(item.menu.harga)}</p>

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.menu.id, item.jumlah - 1)}
                        className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-bold text-white w-5 text-center">{item.jumlah}</span>
                      <button
                        onClick={() => updateQuantity(item.menu.id, item.jumlah + 1)}
                        className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.menu.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Subtotal */}
              <div className="flex justify-end mt-2 pt-2 border-t border-white/5">
                <p className="text-xs text-white/40">
                  Subtotal:{" "}
                  <span className="text-white font-medium">{formatRupiah(item.menu.harga * item.jumlah)}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Checkout Section */}
      {items.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
          {/* Waktu Pengambilan */}
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">Waktu Pengambilan</p>
            <div className="grid grid-cols-2 gap-2">
              {(["istirahat1", "istirahat2"] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setWaktu(w)}
                  className={`py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    waktu === w
                      ? "border-orange-500 bg-orange-500/10 text-orange-500"
                      : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                  }`}
                >
                  {formatWaktu(w)}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white/5 rounded-xl p-4 space-y-2 border border-white/5">
            {items.map((item) => (
              <div key={item.menu.id} className="flex justify-between text-xs">
                <span className="text-white/40 truncate mr-2">
                  {item.menu.nama} x{item.jumlah}
                </span>
                <span className="text-white/60 flex-shrink-0">{formatRupiah(item.menu.harga * item.jumlah)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-white/10">
              <span className="text-xs font-bold text-white">Total</span>
              <span className="text-lg font-bold text-orange-500">{formatRupiah(totalHarga)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/30">Saldo kamu</span>
              <span className={`font-medium ${cukup ? "text-green-400" : "text-red-500"}`}>{formatRupiah(saldo)}</span>
            </div>
            {!cukup && <p className="text-red-500 text-[10px]">Saldo tidak cukup untuk checkout</p>}
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleCheckout}
            disabled={!cukup || isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-white/10 disabled:text-white/30 text-black font-bold py-4 rounded-xl transition-all shadow-xl shadow-orange-500/20 text-sm active:scale-[0.98] uppercase tracking-widest"
          >
            {isPending ? "Memproses..." : `Pesan Sekarang`}
          </button>
        </div>
      )}
    </div>
  );
}
