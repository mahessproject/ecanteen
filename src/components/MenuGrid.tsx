"use client";

import { useState } from "react";
import Image from "next/image";
import type { Menu } from "@/lib/supabase";
import { formatRupiah } from "@/lib/utils";
import { Plus, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface Props {
  menus: Menu[];
}

function MenuStatusBadge({ menu }: { menu: Menu }) {
  if (menu.stock > 0) {
    return (
      <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white border border-white/10 rounded-full text-[10px] font-bold tracking-tighter shadow-sm">
        Stok: {menu.stock}
      </span>
    );
  }
  return (
    <span className="px-3 py-1 bg-red-500/80 backdrop-blur-md text-white border border-red-500/20 rounded-full text-[10px] font-bold tracking-tighter shadow-sm">
      Habis
    </span>
  );
}

export default function MenuGrid({ menus }: Props) {
  const { items, addItem } = useCart();
  const [filter, setFilter] = useState<"all" | "available" | "sold_out">("all");
  const [justAdded, setJustAdded] = useState<number | null>(null);

  function handleAdd(menu: Menu) {
    addItem(menu);
    setJustAdded(menu.id);
    setTimeout(() => setJustAdded(null), 800);
  }

  const filtered = menus.filter((m) => filter === "all" || m.status === filter);

  return (
    <>
      {/* Category Tabs */}
      <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar">
        {[
          { key: "all", label: "Semua" },
          { key: "available", label: "Tersedia" },
          { key: "sold_out", label: "Habis" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${
              filter === key
                ? "bg-orange-500 border-orange-500 text-black shadow-lg shadow-orange-500/20"
                : "bg-transparent border-white/10 text-white/40 hover:border-white/30 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10">
        {filtered.map((menu) => (
          <div
            key={menu.id}
            className="bg-[#0a0a0a] rounded-[2.5rem] p-6 border border-white/5 hover:border-orange-500/30 transition-all group"
          >
            {/* Image */}
            <div className="relative h-64 mb-6 overflow-hidden rounded-[2rem] bg-white/5">
              {menu.foto_url ? (
                <Image
                  src={menu.foto_url}
                  alt={menu.nama}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-1000"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl opacity-50 grayscale">🍱</div>
              )}
              <div className="absolute top-4 left-4">
                <MenuStatusBadge menu={menu} />
              </div>
            </div>

            {/* Info */}
            <div className="px-2">
              <h3 className="text-xl font-serif font-medium text-white mb-2 line-clamp-1">{menu.nama}</h3>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <p className="text-2xl font-light text-white">
                  <span className="text-sm text-orange-500 font-bold mr-1">Rp</span>
                  {menu.harga.toLocaleString("id-ID")}
                </p>
                <button
                  disabled={menu.stock <= 0}
                  onClick={() => handleAdd(menu)}
                  className={
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all " +
                    (menu.stock <= 0
                      ? "bg-white/5 border border-white/5 text-white/20 cursor-not-allowed"
                      : justAdded === menu.id
                        ? "bg-green-500 border border-green-500 text-black scale-110"
                        : items.some((i) => i.menu.id === menu.id)
                          ? "bg-orange-500 border border-orange-500 text-black hover:bg-orange-600 active:scale-90"
                          : "bg-white/5 border border-white/10 text-white hover:bg-orange-500 hover:text-black hover:border-orange-500 active:scale-90")
                  }
                >
                  {justAdded === menu.id ? <Check size={20} /> : <Plus size={20} />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🍽️</div>
          <p className="text-gray-400">Tidak ada menu ditemukan</p>
        </div>
      )}
    </>
  );
}
