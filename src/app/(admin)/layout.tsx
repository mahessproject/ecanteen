import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nama")
    .eq("id", user.id)
    .single<{ role: string; nama: string | null }>();

  if (!profile || profile.role !== "admin") redirect("/menu");

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30">
      {/* Admin Sidebar */}
      <aside className="w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col justify-between sticky top-0 h-screen">
        <div className="p-8">
          <div className="mb-16">
            <span className="font-serif font-light text-white text-3xl tracking-tighter">
              eCanteen
              <br />
              <span className="italic text-orange-500 text-2xl">Admin</span>
            </span>
          </div>

          <nav className="flex flex-col gap-8">
            <Link
              href="/admin-dashboard"
              className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-orange-500 transition-colors block"
            >
              Dashboard
            </Link>
            <Link
              href="/topup-management"
              className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-orange-500 transition-colors block"
            >
              Top-up
            </Link>
            <Link
              href="/withdrawal-management"
              className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-orange-500 transition-colors block"
            >
              Pencairan
            </Link>
            <Link
              href="/daily-reports"
              className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-orange-500 transition-colors block"
            >
              Laporan
            </Link>
          </nav>
        </div>

        <div className="p-8 border-t border-white/5 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white tracking-tight truncate">{profile.nama ?? user.email}</p>
              <p className="text-[10px] text-orange-500 font-medium uppercase tracking-widest mt-1">Admin</p>
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
