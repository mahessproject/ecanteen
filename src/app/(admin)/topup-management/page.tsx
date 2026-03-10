import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import RealtimeTopupManagement from "@/components/RealtimeTopupManagement";
import { expirePendingTopups } from "@/app/actions/saldo";

export const revalidate = 0;

export default async function TopupManagementPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single<{ role: string }>();

  if (!profile || profile.role !== "admin") redirect("/menu");

  // Auto-expire pending topups older than 10 minutes
  await expirePendingTopups();

  // Fetch topup requests with profile info
  const { data: rawRequests } = await supabase
    .from("topup_requests")
    .select("*, profiles:user_id(nama, email)")
    .order("created_at", { ascending: false });

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

  const requests = (rawRequests ?? []) as TopupRequestWithProfile[];

  return (
    <>
      <header className="flex items-center justify-between px-12 py-8 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5">
        <div>
          <h1 className="text-xl font-serif text-white">Top-up Management</h1>
          <p className="text-xs text-white/40 font-light mt-1">Kelola permintaan top-up siswa</p>
        </div>
      </header>

      <div className="flex-1 px-12 py-12 overflow-y-auto custom-scrollbar">
        <RealtimeTopupManagement initialRequests={requests} />
      </div>
    </>
  );
}
