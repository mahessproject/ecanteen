import { createSupabaseServerClient } from "@/lib/supabase-server";
import ReportDashboard from "@/components/ReportDashboard";
import type { DailyReport } from "@/lib/supabase";

export const revalidate = 0;

export type TopupRecord = {
  id: number;
  amount: number;
  status: string;
  code: string;
  created_at: string;
  updated_at: string;
  profiles: { nama: string | null; email: string | null } | null;
};

export default async function DailyReportsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: reports } = await supabase.from("daily_reports").select("*").order("tanggal", { ascending: false });
  const { data: topups } = await supabase
    .from("topup_requests")
    .select("id, amount, status, code, created_at, updated_at, profiles(nama, email)")
    .order("created_at", { ascending: false });

  const allReports = (reports ?? []) as DailyReport[];
  const allTopups = (topups ?? []) as TopupRecord[];

  return <ReportDashboard reports={allReports} topups={allTopups} />;
}
