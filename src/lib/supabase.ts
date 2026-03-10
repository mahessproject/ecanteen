import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

// Re-export types from generated database types
export type {
  Database,
  UserRole,
  MenuStatus,
  WaktuPengambilan,
  OrderStatus,
  Profile,
  Menu,
  Order,
  DailyReport,
  WithdrawalRequest,
} from "@/lib/database.types";

import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// =============================================
// CLIENT-SIDE (browser) — gunakan di Client Components
// =============================================
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// =============================================
// BROWSER CLIENT (SSR-aware) — gunakan di Client Components dengan cookie
// =============================================
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
