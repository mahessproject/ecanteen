"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { Home, ClipboardList, LogOut, Sparkles, Wallet } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

const NAV_LINKS = [
  { href: "/menu", icon: Home, label: "Menu" },
  { href: "/topup", icon: Wallet, label: "Top-up" },
  { href: "/history", icon: ClipboardList, label: "Riwayat" },
];

export default function UserNav() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <aside className="w-20 bg-[#0a0a0a] border-r border-white/5 flex flex-col items-center py-8 gap-8 h-screen sticky top-0">
      <Link
        href="/menu"
        className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-black shadow-2xl shadow-orange-500/20"
      >
        <Sparkles size={24} />
      </Link>

      <nav className="flex flex-col gap-6 flex-1 mt-4">
        {NAV_LINKS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={
                "p-3 rounded-full transition-all duration-300 " +
                (isActive ? "bg-orange-500 text-black scale-110" : "text-white/30 hover:text-white hover:bg-white/5")
              }
            >
              <Icon size={22} />
            </Link>
          );
        })}
      </nav>

      <button
        title="Keluar"
        disabled={isPending}
        onClick={() => startTransition(() => logoutAction())}
        className="p-3 text-white/30 hover:text-red-500 transition-colors disabled:opacity-50"
      >
        <LogOut size={22} />
      </button>
    </aside>
  );
}
