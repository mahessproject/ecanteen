import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import MenuPageClient from "@/components/MenuPageClient";

export const revalidate = 0;

export default async function MenuPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: rawMenus }, { data: rawProfile }] = await Promise.all([
    supabase.from("menus").select("*").order("nama"),
    supabase.from("profiles").select("saldo_virtual, nama").eq("id", user.id).single(),
  ]);

  type ProfileSnippet = { saldo_virtual: number; nama: string | null };
  const menus = rawMenus ?? [];
  const profile = rawProfile as ProfileSnippet | null;
  const saldo = profile?.saldo_virtual ?? 0;
  const nama = profile?.nama ?? user.email;

  return <MenuPageClient menus={menus} saldo={saldo} nama={nama ?? ""} />;
}
