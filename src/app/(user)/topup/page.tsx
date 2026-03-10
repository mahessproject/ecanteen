import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { formatRupiah } from "@/lib/utils";
import TopupForm from "@/components/TopupForm";
import TopupRequestHistory from "@/components/TopupRequestHistory";
import { expirePendingTopups } from "@/app/actions/saldo";
import { CreditCard, TrendingUp, Wallet } from "lucide-react";

export const revalidate = 0;

export default async function TopupPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Auto-expire pending topups older than 10 minutes
  await expirePendingTopups();

  const { data: rawProfile } = await supabase.from("profiles").select("saldo_virtual, nama").eq("id", user.id).single();

  type ProfileSnippet = { saldo_virtual: number; nama: string | null };
  const profile = rawProfile as ProfileSnippet | null;
  const saldo = profile?.saldo_virtual ?? 0;

  // Fetch topup request history
  const { data: rawRequests } = await supabase
    .from("topup_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  type TopupRequest = {
    id: number;
    amount: number;
    status: string;
    code: string;
    admin_note: string | null;
    created_at: string;
    updated_at: string;
  };
  const requests = (rawRequests ?? []) as TopupRequest[];

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between px-12 py-8 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5">
        <div>
          <h1 className="text-xl font-serif text-white">Top-up Saldo</h1>
          <p className="text-xs text-white/40 font-light mt-1">Ajukan permintaan top-up saldo</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-12 py-12 overflow-y-auto custom-scrollbar">
        <div className="w-full">
          <div className="grid lg:grid-cols-5 gap-16 items-start">
            {/* Left Column: Balance & Request History */}
            <div className="lg:col-span-3 space-y-8">
              <div>
                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.4em] mb-4">Vault Info</p>
                <h2 className="text-4xl font-serif font-light text-white">Status Saldo</h2>
              </div>

              {/* Balance Card */}
              <div className="relative h-64 rounded-[2.5rem] bg-gradient-to-br from-[#1a1a1a] to-black p-10 text-white overflow-hidden border border-white/10 shadow-2xl">
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                    <CreditCard className="text-orange-500" size={32} />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">eCanteen Card</p>
                  </div>
                  <div>
                    <p className="text-lg font-mono tracking-[0.3em] text-white/60 mb-4">•••• •••• •••• 8869</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Saldo Aktif</p>
                      </div>
                      <p className="text-4xl font-light tracking-tighter text-orange-500">{formatRupiah(saldo)}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-orange-500/5 rounded-full blur-[100px]" />
                <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-orange-500/3 rounded-full blur-[80px]" />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Wallet className="text-orange-500" size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Saldo Saat Ini</p>
                    <p className="text-xl font-light text-white tracking-tight">{formatRupiah(saldo)}</p>
                  </div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="text-green-400" size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Status</p>
                    <p className="text-lg font-medium text-green-400">Aktif</p>
                  </div>
                </div>
              </div>

              {/* Topup Request History */}
              <TopupRequestHistory initialRequests={requests} userId={user.id} />

              {/* Info banner */}
              <div className="bg-[#0a0a0a]/50 border border-orange-500/10 rounded-[2rem] p-8 mt-4">
                <h3 className="text-orange-500 font-medium mb-2">Cara Top-up</h3>
                <ol className="text-sm text-white/40 leading-relaxed font-light space-y-2 list-decimal list-inside">
                  <li>Ajukan permintaan top-up dengan jumlah yang diinginkan</li>
                  <li>
                    Bayar ke <span className="text-white/60 font-medium">bank sekolah</span> sesuai jumlah
                  </li>
                  <li>Admin akan mengkonfirmasi pembayaranmu</li>
                  <li>Saldo otomatis masuk ke akunmu setelah disetujui</li>
                </ol>
              </div>
            </div>

            {/* Right Column: Top-up Form Section */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.4em] mb-4">Isi Ulang</p>
                <h2 className="text-4xl font-serif font-light text-white">Ajukan Top-up</h2>
              </div>
              <TopupForm currentSaldo={saldo} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
