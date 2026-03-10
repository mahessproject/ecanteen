"use client";

import { useState, useTransition, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
  BarChart3,
  Wallet,
  ShoppingBag,
  ArrowUpRight,
  Minus,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  User,
} from "lucide-react";
import { generateTodayReport } from "@/app/actions/report";
import type { DailyReport } from "@/lib/supabase";

const ADMIN_FEE = 1500;

type TopupRecord = {
  id: number;
  amount: number;
  status: string;
  code: string;
  created_at: string;
  updated_at: string;
  profiles: { nama: string | null; email: string | null } | null;
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatTanggal(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTanggalShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().slice(0, 10);
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function getAvailableMonths(reports: DailyReport[]): string[] {
  const months = new Set<string>();
  reports.forEach((r) => months.add(r.tanggal.slice(0, 7)));
  return Array.from(months).sort().reverse();
}

function generateCSV(reports: DailyReport[], title: string): string {
  const header = "Tanggal,Porsi Terjual,Total Pendapatan,Terakhir Diperbarui";
  const rows = reports.map((r) => {
    const tanggal = formatTanggal(r.tanggal);
    const porsi = r.total_porsi_terjual;
    const pendapatan = Number(r.total_pendapatan);
    const updated = new Date(r.updated_at).toLocaleString("id-ID");
    return `"${tanggal}",${porsi},${pendapatan},"${updated}"`;
  });

  const totalPorsi = reports.reduce((s, r) => s + r.total_porsi_terjual, 0);
  const totalPendapatan = reports.reduce((s, r) => s + Number(r.total_pendapatan), 0);
  rows.push(`"TOTAL",${totalPorsi},${totalPendapatan},""`);

  return `${title}\n\n${header}\n${rows.join("\n")}`;
}

function downloadCSV(content: string, filename: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type Tab = "overview" | "daily" | "monthly" | "topup";

export default function ReportDashboard({ reports, topups = [] }: { reports: DailyReport[]; topups?: TopupRecord[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().slice(0, 7);
  });
  const [isPending, startTransition] = useTransition();
  const [genMsg, setGenMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const availableMonths = useMemo(() => getAvailableMonths(reports), [reports]);

  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const monthReports = useMemo(
    () => reports.filter((r) => r.tanggal.startsWith(selectedMonth)),
    [reports, selectedMonth],
  );
  const currentMonthReports = useMemo(
    () => reports.filter((r) => r.tanggal.startsWith(thisMonth)),
    [reports, thisMonth],
  );

  // Previous month for comparison
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthReports = useMemo(() => reports.filter((r) => r.tanggal.startsWith(prevMonth)), [reports, prevMonth]);

  // Stats
  const totalPendapatan = currentMonthReports.reduce((s, r) => s + Number(r.total_pendapatan), 0);
  const totalPorsi = currentMonthReports.reduce((s, r) => s + r.total_porsi_terjual, 0);
  const rataHarian = currentMonthReports.length > 0 ? totalPendapatan / currentMonthReports.length : 0;

  const prevTotalPendapatan = prevMonthReports.reduce((s, r) => s + Number(r.total_pendapatan), 0);
  const prevTotalPorsi = prevMonthReports.reduce((s, r) => s + r.total_porsi_terjual, 0);

  const revenueChange =
    prevTotalPendapatan > 0 ? ((totalPendapatan - prevTotalPendapatan) / prevTotalPendapatan) * 100 : 0;
  const porsiChange = prevTotalPorsi > 0 ? ((totalPorsi - prevTotalPorsi) / prevTotalPorsi) * 100 : 0;

  // Today's report
  const todayReport = reports.find((r) => isToday(r.tanggal));

  // Monthly summary data
  const monthlySummary = useMemo(() => {
    const map = new Map<string, { pendapatan: number; porsi: number; days: number }>();
    reports.forEach((r) => {
      const m = r.tanggal.slice(0, 7);
      const existing = map.get(m) || { pendapatan: 0, porsi: 0, days: 0 };
      existing.pendapatan += Number(r.total_pendapatan);
      existing.porsi += r.total_porsi_terjual;
      existing.days += 1;
      map.set(m, existing);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, data]) => ({ month, ...data }));
  }, [reports]);

  // Max pendapatan for bar chart scale
  const maxDayPendapatan = Math.max(...monthReports.map((r) => Number(r.total_pendapatan)), 1);
  const maxMonthPendapatan = Math.max(...monthlySummary.map((m) => m.pendapatan), 1);

  function handleGenerate() {
    setGenMsg(null);
    startTransition(async () => {
      const res = await generateTodayReport();
      if (res.success) {
        setGenMsg({ type: "ok", text: "Laporan hari ini berhasil diperbarui!" });
      } else {
        setGenMsg({ type: "err", text: res.error ?? "Gagal memperbarui laporan" });
      }
      setTimeout(() => setGenMsg(null), 3000);
    });
  }

  function downloadDaily() {
    const filtered = monthReports;
    const monthLabel = getMonthLabel(new Date(selectedMonth + "-01T00:00:00"));
    const csv = generateCSV(filtered, `Laporan Harian - ${monthLabel}`);
    downloadCSV(csv, `laporan-harian-${selectedMonth}.csv`);
  }

  function downloadMonthly() {
    const header = "Bulan,Hari Aktif,Porsi Terjual,Total Pendapatan,Rata-rata Harian";
    const rows = monthlySummary.map((m) => {
      const label = getMonthLabel(new Date(m.month + "-01T00:00:00"));
      const avg = m.days > 0 ? Math.round(m.pendapatan / m.days) : 0;
      return `"${label}",${m.days},${m.porsi},${m.pendapatan},${avg}`;
    });
    const totalP = monthlySummary.reduce((s, m) => s + m.pendapatan, 0);
    const totalPo = monthlySummary.reduce((s, m) => s + m.porsi, 0);
    const totalD = monthlySummary.reduce((s, m) => s + m.days, 0);
    rows.push(`"TOTAL",${totalD},${totalPo},${totalP},${totalD > 0 ? Math.round(totalP / totalD) : 0}`);
    const csv = `Laporan Bulanan\n\n${header}\n${rows.join("\n")}`;
    downloadCSV(csv, `laporan-bulanan.csv`);
  }

  function TrendBadge({ value }: { value: number }) {
    if (value === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white/30">
          <Minus size={10} /> 0%
        </span>
      );
    }
    const positive = value > 0;
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold ${
          positive ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {positive ? "+" : ""}
        {value.toFixed(1)}%
      </span>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <BarChart3 size={14} /> },
    { key: "daily", label: "Harian", icon: <Calendar size={14} /> },
    { key: "monthly", label: "Bulanan", icon: <FileSpreadsheet size={14} /> },
    { key: "topup", label: "Top-up", icon: <Banknote size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="w-full mx-auto px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-light text-white tracking-tight">
                Laporan <span className="italic text-orange-500">&amp; Analitik</span>
              </h1>
              <p className="text-xs text-white/40 mt-1 tracking-wide">Dashboard pendapatan dan performa kantin</p>
            </div>
            <div className="flex items-center gap-3">
              {genMsg && (
                <span
                  className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                    genMsg.type === "ok"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {genMsg.text}
                </span>
              )}
              <button
                onClick={handleGenerate}
                disabled={isPending}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-white/10 disabled:text-white/30 text-black font-bold px-5 py-2.5 rounded-full text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 active:scale-[0.97]"
              >
                <RefreshCw size={12} className={isPending ? "animate-spin" : ""} />
                {isPending ? "Memperbarui..." : "Generate Hari Ini"}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 -mb-[1px]">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-t-xl border border-b-0 transition-all ${
                  activeTab === tab.key
                    ? "bg-[#0a0a0a] text-orange-500 border-white/10"
                    : "bg-transparent text-white/30 border-transparent hover:text-white/60"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-6 py-6 space-y-6">
        {/* =================== OVERVIEW TAB =================== */}
        {activeTab === "overview" && (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Today */}
              <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Hari Ini</span>
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <ArrowUpRight size={14} className="text-orange-500" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-white">
                  {todayReport ? formatRupiah(Number(todayReport.total_pendapatan)) : "—"}
                </p>
                <p className="text-[11px] text-white/30 mt-1">
                  {todayReport ? `${todayReport.total_porsi_terjual} porsi terjual` : "Belum ada laporan"}
                </p>
              </div>

              {/* Monthly Revenue */}
              <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Pendapatan Bulan Ini
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Wallet size={14} className="text-emerald-400" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-white">{formatRupiah(totalPendapatan)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <TrendBadge value={revenueChange} />
                  <span className="text-[10px] text-white/20">vs bulan lalu</span>
                </div>
              </div>

              {/* Monthly Portions */}
              <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Porsi Bulan Ini</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <ShoppingBag size={14} className="text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-white">{totalPorsi.toLocaleString("id-ID")}</p>
                <div className="flex items-center gap-2 mt-1">
                  <TrendBadge value={porsiChange} />
                  <span className="text-[10px] text-white/20">vs bulan lalu</span>
                </div>
              </div>

              {/* Average */}
              <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Rata-rata / Hari
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <BarChart3 size={14} className="text-violet-400" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-white">{formatRupiah(rataHarian)}</p>
                <p className="text-[11px] text-white/30 mt-1">{currentMonthReports.length} hari aktif</p>
              </div>
            </div>

            {/* Chart - Mini bar chart for current month */}
            {currentMonthReports.length > 0 && (
              <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-white">Pendapatan Harian</h3>
                    <p className="text-[11px] text-white/30 mt-0.5">{getMonthLabel(now)}</p>
                  </div>
                </div>
                <div className="flex items-end gap-1 h-32">
                  {[...currentMonthReports].reverse().map((r) => {
                    const pct = (Number(r.total_pendapatan) / maxDayPendapatan) * 100;
                    return (
                      <div
                        key={r.id}
                        className="flex-1 group relative"
                        title={`${formatTanggalShort(r.tanggal)}: ${formatRupiah(Number(r.total_pendapatan))}`}
                      >
                        <div
                          className={`w-full rounded-t-md transition-all ${
                            isToday(r.tanggal) ? "bg-orange-500" : "bg-white/10 group-hover:bg-orange-500/60"
                          }`}
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        />
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-[10px] whitespace-nowrap shadow-xl">
                            <p className="text-white font-bold">{formatRupiah(Number(r.total_pendapatan))}</p>
                            <p className="text-white/40">{formatTanggalShort(r.tanggal)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Reports - last 5 */}
            <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Laporan Terakhir</h3>
                <button
                  onClick={() => setActiveTab("daily")}
                  className="text-[10px] font-bold uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors"
                >
                  Lihat Semua
                </button>
              </div>
              {reports.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <BarChart3 size={32} className="mx-auto mb-3 text-white/10" />
                  <p className="text-sm">Belum ada laporan</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {reports.slice(0, 5).map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between px-6 py-4 transition-colors ${
                        isToday(r.tanggal) ? "bg-orange-500/5" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${
                            isToday(r.tanggal) ? "bg-orange-500/20 text-orange-500" : "bg-white/5 text-white/40"
                          }`}
                        >
                          {new Date(r.tanggal + "T00:00:00").getDate()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {formatTanggal(r.tanggal)}
                            {isToday(r.tanggal) && (
                              <span className="ml-2 text-[9px] bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Hari ini
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-white/30 mt-0.5">
                            {r.total_porsi_terjual} porsi &middot; Update{" "}
                            {new Date(r.updated_at).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-orange-500">{formatRupiah(Number(r.total_pendapatan))}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* =================== DAILY TAB =================== */}
        {activeTab === "daily" && (
          <>
            {/* Month selector + download */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none bg-[#0a0a0a] border border-white/10 text-white text-sm font-medium rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {getMonthLabel(new Date(m + "-01T00:00:00"))}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                />
              </div>

              <button
                onClick={downloadDaily}
                disabled={monthReports.length === 0}
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all"
              >
                <Download size={12} />
                Download CSV Harian
              </button>
            </div>

            {/* Summary for selected month */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Pendapatan</p>
                <p className="text-2xl font-extrabold text-orange-500">
                  {formatRupiah(monthReports.reduce((s, r) => s + Number(r.total_pendapatan), 0))}
                </p>
              </div>
              <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Porsi Terjual</p>
                <p className="text-2xl font-extrabold text-blue-400">
                  {monthReports.reduce((s, r) => s + r.total_porsi_terjual, 0).toLocaleString("id-ID")}
                </p>
              </div>
              <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Hari Aktif</p>
                <p className="text-2xl font-extrabold text-white">{monthReports.length}</p>
              </div>
            </div>

            {/* Mini chart for selected month */}
            {monthReports.length > 0 && (
              <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Grafik Pendapatan</h3>
                <div className="flex items-end gap-1.5 h-28">
                  {[...monthReports].reverse().map((r) => {
                    const pct = (Number(r.total_pendapatan) / maxDayPendapatan) * 100;
                    return (
                      <div key={r.id} className="flex-1 group relative">
                        <div
                          className={`w-full rounded-t transition-all ${
                            isToday(r.tanggal) ? "bg-orange-500" : "bg-white/10 group-hover:bg-orange-500/50"
                          }`}
                          style={{ height: `${Math.max(pct, 3)}%` }}
                        />
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-[10px] whitespace-nowrap shadow-xl">
                            <p className="text-white font-bold">{formatRupiah(Number(r.total_pendapatan))}</p>
                            <p className="text-white/40">{formatTanggalShort(r.tanggal)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Daily report list */}
            <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-sm font-bold text-white">
                  Detail Harian &mdash;{" "}
                  <span className="text-white/50">{getMonthLabel(new Date(selectedMonth + "-01T00:00:00"))}</span>
                </h3>
              </div>
              {monthReports.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <Calendar size={32} className="mx-auto mb-3 text-white/10" />
                  <p className="text-sm">Tidak ada laporan untuk bulan ini</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {monthReports.map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between px-6 py-4 transition-colors ${
                        isToday(r.tanggal) ? "bg-orange-500/5" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${
                            isToday(r.tanggal) ? "bg-orange-500/20 text-orange-500" : "bg-white/5 text-white/40"
                          }`}
                        >
                          {new Date(r.tanggal + "T00:00:00").getDate()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {formatTanggal(r.tanggal)}
                            {isToday(r.tanggal) && (
                              <span className="ml-2 text-[9px] bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Hari ini
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-white/30 mt-0.5">
                            Update{" "}
                            {new Date(r.updated_at).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-orange-500">{formatRupiah(Number(r.total_pendapatan))}</p>
                        <p className="text-[11px] text-blue-400 font-medium">{r.total_porsi_terjual} porsi</p>
                      </div>
                    </div>
                  ))}

                  {/* Total row */}
                  <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02]">
                    <p className="text-sm font-bold text-white/60">Total ({monthReports.length} hari)</p>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-white">
                        {formatRupiah(monthReports.reduce((s, r) => s + Number(r.total_pendapatan), 0))}
                      </p>
                      <p className="text-[11px] text-blue-400 font-bold">
                        {monthReports.reduce((s, r) => s + r.total_porsi_terjual, 0).toLocaleString("id-ID")} porsi
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* =================== MONTHLY TAB =================== */}
        {activeTab === "monthly" && (
          <>
            {/* Download */}
            <div className="flex justify-end">
              <button
                onClick={downloadMonthly}
                disabled={monthlySummary.length === 0}
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all"
              >
                <Download size={12} />
                Download CSV Bulanan
              </button>
            </div>

            {/* Monthly chart */}
            {monthlySummary.length > 0 && (
              <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
                  Tren Pendapatan Bulanan
                </h3>
                <div className="flex items-end gap-3 h-36">
                  {[...monthlySummary].reverse().map((m) => {
                    const pct = (m.pendapatan / maxMonthPendapatan) * 100;
                    const isCurrent = m.month === thisMonth;
                    return (
                      <div key={m.month} className="flex-1 group relative flex flex-col items-center">
                        <div
                          className={`w-full max-w-16 rounded-t-lg transition-all ${
                            isCurrent ? "bg-orange-500" : "bg-white/10 group-hover:bg-orange-500/50"
                          }`}
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        />
                        <p className="text-[9px] text-white/30 mt-2 font-medium">
                          {new Date(m.month + "-01T00:00:00").toLocaleDateString("id-ID", { month: "short" })}
                        </p>
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-[10px] whitespace-nowrap shadow-xl">
                            <p className="text-white font-bold">{formatRupiah(m.pendapatan)}</p>
                            <p className="text-white/40">
                              {m.porsi} porsi &middot; {m.days} hari
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Monthly list */}
            <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-sm font-bold text-white">Ringkasan Bulanan</h3>
              </div>
              {monthlySummary.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <FileSpreadsheet size={32} className="mx-auto mb-3 text-white/10" />
                  <p className="text-sm">Belum ada data bulanan</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {monthlySummary.map((m) => {
                    const isCurrent = m.month === thisMonth;
                    const avgDaily = m.days > 0 ? m.pendapatan / m.days : 0;
                    return (
                      <div
                        key={m.month}
                        className={`flex items-center justify-between px-6 py-5 transition-colors ${
                          isCurrent ? "bg-orange-500/5" : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-bold ${
                              isCurrent ? "bg-orange-500/20 text-orange-500" : "bg-white/5 text-white/40"
                            }`}
                          >
                            {new Date(m.month + "-01T00:00:00").toLocaleDateString("id-ID", { month: "short" })}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {getMonthLabel(new Date(m.month + "-01T00:00:00"))}
                              {isCurrent && (
                                <span className="ml-2 text-[9px] bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Bulan ini
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-white/30 mt-0.5">
                              {m.days} hari aktif &middot; {m.porsi.toLocaleString("id-ID")} porsi &middot; Avg{" "}
                              {formatRupiah(avgDaily)}/hari
                            </p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-orange-500">{formatRupiah(m.pendapatan)}</p>
                      </div>
                    );
                  })}

                  {/* Grand total */}
                  <div className="flex items-center justify-between px-6 py-5 bg-white/[0.02]">
                    <div>
                      <p className="text-sm font-bold text-white/60">Grand Total</p>
                      <p className="text-[11px] text-white/30 mt-0.5">
                        {monthlySummary.reduce((s, m) => s + m.days, 0)} hari &middot;{" "}
                        {monthlySummary.reduce((s, m) => s + m.porsi, 0).toLocaleString("id-ID")} porsi
                      </p>
                    </div>
                    <p className="text-lg font-extrabold text-white">
                      {formatRupiah(monthlySummary.reduce((s, m) => s + m.pendapatan, 0))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* =================== TOPUP TAB =================== */}
        {activeTab === "topup" &&
          (() => {
            const approvedTopups = topups.filter((t) => t.status === "approved");
            const pendingTopups = topups.filter((t) => t.status === "pending");
            const rejectedTopups = topups.filter((t) => t.status === "rejected");

            const totalTopupAmount = approvedTopups.reduce((s, t) => s + t.amount, 0);
            const totalAdminFee = approvedTopups.length * ADMIN_FEE;

            // Group by month
            const topupByMonth = new Map<string, { count: number; amount: number; fee: number }>();
            approvedTopups.forEach((t) => {
              const m = t.created_at.slice(0, 7);
              const existing = topupByMonth.get(m) || { count: 0, amount: 0, fee: 0 };
              existing.count += 1;
              existing.amount += t.amount;
              existing.fee += ADMIN_FEE;
              topupByMonth.set(m, existing);
            });

            const topupFilter = ["all", "approved", "pending", "rejected"] as const;
            type TopupFilter = (typeof topupFilter)[number];

            function TopupTab() {
              const [filter, setFilter] = useState<TopupFilter>("all");
              const [showAllTopups, setShowAllTopups] = useState(false);

              const filteredTopups = filter === "all" ? topups : topups.filter((t) => t.status === filter);
              const displayedTopups = showAllTopups ? filteredTopups : filteredTopups.slice(0, 20);

              function TopupStatusBadge({ status }: { status: string }) {
                switch (status) {
                  case "pending":
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                        <Clock size={10} />
                        Menunggu
                      </span>
                    );
                  case "approved":
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                        <CheckCircle2 size={10} />
                        Disetujui
                      </span>
                    );
                  case "rejected":
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                        <XCircle size={10} />
                        Ditolak
                      </span>
                    );
                  default:
                    return null;
                }
              }

              return (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                          Total Top-up Disetujui
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <Wallet size={14} className="text-emerald-400" />
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-white">{formatRupiah(totalTopupAmount)}</p>
                      <p className="text-[11px] text-white/30 mt-1">{approvedTopups.length} transaksi</p>
                    </div>

                    <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl" />
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                          Pendapatan Biaya Admin
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                          <Banknote size={14} className="text-orange-500" />
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-orange-500">{formatRupiah(totalAdminFee)}</p>
                      <p className="text-[11px] text-white/30 mt-1">
                        {formatRupiah(ADMIN_FEE)} × {approvedTopups.length}
                      </p>
                    </div>

                    <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl" />
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Menunggu</span>
                        <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                          <Clock size={14} className="text-yellow-500" />
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-yellow-500">{pendingTopups.length}</p>
                      <p className="text-[11px] text-white/30 mt-1">
                        {formatRupiah(pendingTopups.reduce((s, t) => s + t.amount, 0))}
                      </p>
                    </div>

                    <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Ditolak</span>
                        <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                          <XCircle size={14} className="text-red-400" />
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-red-400">{rejectedTopups.length}</p>
                      <p className="text-[11px] text-white/30 mt-1">
                        {formatRupiah(rejectedTopups.reduce((s, t) => s + t.amount, 0))}
                      </p>
                    </div>
                  </div>

                  {/* Filter + Download */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                      {topupFilter.map((f) => (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                            filter === f ? "bg-orange-500 text-black shadow-lg" : "text-white/40 hover:text-white/60"
                          }`}
                        >
                          {f === "all"
                            ? "Semua"
                            : f === "approved"
                              ? "Disetujui"
                              : f === "pending"
                                ? "Menunggu"
                                : "Ditolak"}
                          <span className="ml-1.5 opacity-60">
                            {f === "all"
                              ? topups.length
                              : f === "approved"
                                ? approvedTopups.length
                                : f === "pending"
                                  ? pendingTopups.length
                                  : rejectedTopups.length}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transaction List */}
                  <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5">
                      <h3 className="text-sm font-bold text-white">Riwayat Transaksi Top-up</h3>
                    </div>
                    {filteredTopups.length === 0 ? (
                      <div className="text-center py-12 text-white/30">
                        <Banknote size={32} className="mx-auto mb-3 text-white/10" />
                        <p className="text-sm">Tidak ada transaksi top-up</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {displayedTopups.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                <User size={16} className="text-white/30" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{t.profiles?.nama ?? "Unknown"}</p>
                                <p className="text-[11px] text-white/30 mt-0.5">
                                  {t.profiles?.email} &middot;{" "}
                                  {new Date(t.created_at).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-bold text-orange-500">{formatRupiah(t.amount)}</p>
                                {t.status === "approved" && (
                                  <p className="text-[10px] text-white/20">+{formatRupiah(ADMIN_FEE)} admin</p>
                                )}
                              </div>
                              <TopupStatusBadge status={t.status} />
                            </div>
                          </div>
                        ))}

                        {filteredTopups.length > 20 && !showAllTopups && (
                          <button
                            onClick={() => setShowAllTopups(true)}
                            className="w-full py-4 text-xs text-white/30 hover:text-white/60 font-bold uppercase tracking-wider transition-colors"
                          >
                            Lihat Semua ({filteredTopups.length} transaksi)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              );
            }

            return <TopupTab />;
          })()}
      </div>
    </div>
  );
}
