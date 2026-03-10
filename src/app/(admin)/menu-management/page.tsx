import { createSupabaseServerClient } from "@/lib/supabase-server";
import MenuManagementClient from "@/components/MenuManagementClient";
import type { Menu } from "@/lib/supabase";

export const revalidate = 0;

export default async function MenuManagementPage() {
  const supabase = await createSupabaseServerClient();
  const { data: menus } = await supabase.from("menus").select("*").order("nama");

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <div className="w-full">
        <MenuManagementClient menus={(menus as Menu[]) ?? []} />
      </div>
    </div>
  );
}
