import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import LogoutButton from "@/components/LogoutButton";

export const revalidate = 0;

export default async function KantinLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nama, saldo_virtual, saldo_pendapatan")
    .eq("id", user.id)
    .single<{ role: string; nama: string | null; saldo_virtual: number; saldo_pendapatan: number }>();

  if (!profile || profile.role !== "kantin") {
    if (profile?.role === "admin") redirect("/admin-dashboard");
    redirect("/menu");
  }

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30">
      {/* Kantin Sidebar */}
      <aside className="w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col justify-between sticky top-0 h-screen">
        <div className="p-8">
          <div className="mb-10">
            <span className="font-serif font-light text-white text-3xl tracking-tighter">
              eCanteen
              <br />
              <span className="italic text-orange-500 text-2xl">Kantin</span>
            </span>
          </div>

          {/* Saldo Cards */}
          <div className="mb-10 space-y-3">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Saldo Pendapatan</p>
              <p className="text-xl font-bold text-orange-500">{formatRupiah(profile.saldo_pendapatan)}</p>
              <p className="text-[9px] text-white/25 mt-1">Dari pesanan siswa</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Saldo Kantin</p>
              <p className="text-lg font-bold text-green-400">{formatRupiah(profile.saldo_virtual)}</p>
              <p className="text-[9px] text-white/25 mt-1">Dari pencairan dana</p>
            </div>
          </div>

          <nav className="flex flex-col gap-8">
            <Link
              href="/kantin-dashboard"
              className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-orange-500 transition-colors block"
            >
              Dashboard
            </Link>
            <Link
              href="/kantin-menu"
              className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-orange-500 transition-colors block"
            >
              Kelola Menu
            </Link>
            <Link
              href="/kantin-orders"
              className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-orange-500 transition-colors block"
            >
              Antrean Pesanan
            </Link>
            <Link
              href="/kantin-withdrawal"
              className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-orange-500 transition-colors block"
            >
              Pencairan Dana
            </Link>
          </nav>
        </div>

        <div className="p-8 border-t border-white/5 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white tracking-tight truncate">{profile.nama ?? user.email}</p>
              <p className="text-[10px] text-orange-500 font-medium uppercase tracking-widest mt-1">Pemilik Kantin</p>
            </div>
            <div className="w-10 h-10 shrink-0 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/50">
              <LogoutButton className="text-xs font-bold text-white/40 hover:text-red-500 transition-colors" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 max-h-screen overflow-y-auto">{children}</main>
    </div>
  );
}
