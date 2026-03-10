"use client";

import { useTransition } from "react";
import { logoutAction } from "@/app/actions/auth";

export default function LogoutButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await logoutAction();
        })
      }
      disabled={isPending}
      className={
        className ?? "text-sm text-gray-500 hover:text-red-500 font-medium transition-colors disabled:opacity-50"
      }
    >
      {isPending ? "..." : "Keluar"}
    </button>
  );
}
