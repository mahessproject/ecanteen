import type { MenuStatus } from "@/lib/supabase";

export default function MenuStatusBadge({ status }: { status: MenuStatus }) {
  return status === "available" ? (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-500">
      Tersedia
    </span>
  ) : (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500">Habis</span>
  );
}
