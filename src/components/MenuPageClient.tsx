"use client";

import type { Menu } from "@/lib/supabase";
import { CartProvider } from "@/context/CartContext";
import MenuGrid from "@/components/MenuGrid";
import CartSidebar from "@/components/CartSidebar";
import { User } from "lucide-react";

interface Props {
  menus: Menu[];
  saldo: number;
  nama: string;
}

export default function MenuPageClient({ menus, saldo, nama }: Props) {
  return (
    <CartProvider>
      {/* Header */}
      <header className="flex items-center justify-between px-12 py-8 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5">
        <div>
          <h1 className="text-xl font-serif text-white">Menu Hari Ini</h1>
          <p className="text-xs text-white/40 font-light mt-1">Pariwara kuliner pilihan hari ini</p>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-white tracking-tight">{nama}</p>
              <p className="text-[10px] text-orange-500 font-medium uppercase tracking-widest">Siswa</p>
            </div>
            <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/50">
              <User size={20} />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 min-h-0">
        {/* Main area */}
        <div className="flex-1 px-12 py-12 space-y-16 overflow-y-auto custom-scrollbar">
          {/* Hero banner */}
          <div className="relative overflow-hidden rounded-[3rem] bg-[#0a0a0a] border border-white/5 p-16 flex items-center min-h-[450px]">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-orange-500 mb-8">
                <div className="w-8 h-[1px] bg-orange-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Menu Eksklusif</span>
              </div>
              <h1 className="text-7xl font-serif font-light text-white leading-[1.1] mb-8">
                The Art of <br />
                <span className="italic text-orange-500">School Dining</span>
              </h1>
              <p className="text-white/40 text-lg max-w-md mb-10 leading-relaxed font-light">
                Pesan dari kelas, nikmati di kantin saat istirahat tanpa antre.
              </p>
              <button className="bg-orange-500 text-black px-10 py-5 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-white transition-all shadow-2xl shadow-orange-500/20 active:scale-95">
                Lihat Koleksi
              </button>
            </div>

            <div className="absolute right-0 top-0 w-full h-full opacity-60">
              <img
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1200"
                alt="Hero"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#050505]/80 to-[#050505]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
            </div>
          </div>

          {/* Menu Grid */}
          <section>
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.4em] mb-4">Pilihan Kami</p>
                <h2 className="text-5xl font-serif font-light text-white">The Collection</h2>
              </div>
            </div>
            <MenuGrid menus={menus} />
          </section>
        </div>

        {/* Right Sidebar — Cart */}
        <aside className="w-[450px] bg-[#050505] border-l border-white/5 p-10 flex flex-col h-screen sticky top-0 overflow-y-auto custom-scrollbar hidden lg:flex">
          <CartSidebar saldo={saldo} />
        </aside>
      </div>
    </CartProvider>
  );
}
