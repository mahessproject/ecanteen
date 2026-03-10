import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import UserNav from "@/components/UserNav";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  // Admin tidak boleh akses halaman user — arahkan ke dashboard admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single<{ role: string }>();

  if (profile?.role === "admin") redirect("/admin-dashboard");
  if (profile?.role === "kantin") redirect("/kantin-dashboard");

  return (
    <div className="flex min-h-screen bg-[#050505] text-white selection:bg-orange-500/30">
      <UserNav />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
