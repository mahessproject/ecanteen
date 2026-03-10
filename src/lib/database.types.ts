export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      daily_reports: {
        Row: {
          created_at: string;
          id: number;
          tanggal: string;
          total_pendapatan: number;
          total_porsi_terjual: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          tanggal: string;
          total_pendapatan?: number;
          total_porsi_terjual?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          tanggal?: string;
          total_pendapatan?: number;
          total_porsi_terjual?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      menus: {
        Row: {
          created_at: string;
          foto_url: string | null;
          harga: number;
          id: number;
          nama: string;
          status: Database["public"]["Enums"]["menu_status"];
          stock: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          foto_url?: string | null;
          harga: number;
          id?: number;
          nama: string;
          status?: Database["public"]["Enums"]["menu_status"];
          stock?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          foto_url?: string | null;
          harga?: number;
          id?: number;
          nama?: string;
          status?: Database["public"]["Enums"]["menu_status"];
          stock?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          checkout_id: string | null;
          created_at: string;
          id: number;
          jumlah: number;
          menu_id: number;
          status: Database["public"]["Enums"]["order_status"];
          total_harga: number;
          updated_at: string;
          user_id: string;
          waktu_pengambilan: Database["public"]["Enums"]["waktu_pengambilan_type"];
        };
        Insert: {
          checkout_id?: string | null;
          created_at?: string;
          id?: number;
          jumlah: number;
          menu_id: number;
          status?: Database["public"]["Enums"]["order_status"];
          total_harga: number;
          updated_at?: string;
          user_id: string;
          waktu_pengambilan: Database["public"]["Enums"]["waktu_pengambilan_type"];
        };
        Update: {
          checkout_id?: string | null;
          created_at?: string;
          id?: number;
          jumlah?: number;
          menu_id?: number;
          status?: Database["public"]["Enums"]["order_status"];
          total_harga?: number;
          updated_at?: string;
          user_id?: string;
          waktu_pengambilan?: Database["public"]["Enums"]["waktu_pengambilan_type"];
        };
        Relationships: [
          {
            foreignKeyName: "orders_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: false;
            referencedRelation: "menus";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          nama: string | null;
          role: Database["public"]["Enums"]["user_role"];
          saldo_virtual: number;
          saldo_pendapatan: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          nama?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          saldo_virtual?: number;
          saldo_pendapatan?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          nama?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          saldo_virtual?: number;
          saldo_pendapatan?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      topup_requests: {
        Row: {
          id: number;
          user_id: string;
          amount: number;
          status: Database["public"]["Enums"]["topup_request_status"];
          code: string;
          admin_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          amount: number;
          status?: Database["public"]["Enums"]["topup_request_status"];
          code?: string;
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          amount?: number;
          status?: Database["public"]["Enums"]["topup_request_status"];
          code?: string;
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topup_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      withdrawal_requests: {
        Row: {
          id: number;
          user_id: string;
          amount: number;
          method: "cash" | "transfer";
          bank_info: string | null;
          status: "pending" | "approved" | "rejected";
          admin_note: string | null;
          admin_fee: number | null;
          net_amount: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          amount: number;
          method: "cash" | "transfer";
          bank_info?: string | null;
          status?: "pending" | "approved" | "rejected";
          admin_note?: string | null;
          admin_fee?: number | null;
          net_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          amount?: number;
          method?: "cash" | "transfer";
          bank_info?: string | null;
          status?: "pending" | "approved" | "rejected";
          admin_note?: string | null;
          admin_fee?: number | null;
          net_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      approve_topup: {
        Args: { p_request_id: number };
        Returns: Json;
      };
      find_topup_by_code: {
        Args: { p_code: string };
        Returns: Json;
      };
      cancel_order: {
        Args: { p_order_id: number };
        Returns: Json;
      };
      cancel_topup: {
        Args: { p_request_id: number };
        Returns: Json;
      };
      checkout_order: {
        Args: {
          p_jumlah: number;
          p_menu_id: number;
          p_waktu: Database["public"]["Enums"]["waktu_pengambilan_type"];
        };
        Returns: Json;
      };
      generate_today_report: { Args: Record<PropertyKey, never>; Returns: undefined };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      expire_pending_topups: { Args: Record<PropertyKey, never>; Returns: Json };
      reject_topup: {
        Args: { p_request_id: number; p_note?: string | null };
        Returns: Json;
      };
      topup_saldo: {
        Args: { p_amount: number };
        Returns: Json;
      };
    };
    Enums: {
      menu_status: "available" | "sold_out";
      order_status: "pending" | "preparing" | "ready" | "cancelled";
      topup_request_status: "pending" | "approved" | "rejected" | "cancelled" | "expired";
      user_role: "user" | "admin" | "kantin";
      waktu_pengambilan_type: "istirahat1" | "istirahat2";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

// =============================================
// CONVENIENCE ALIASES (from generated types)
// =============================================
export type UserRole = Database["public"]["Enums"]["user_role"];
export type MenuStatus = Database["public"]["Enums"]["menu_status"];
export type WaktuPengambilan = Database["public"]["Enums"]["waktu_pengambilan_type"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Menu = Database["public"]["Tables"]["menus"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  menus?: Menu;
  profiles?: Profile;
};
export type DailyReport = Database["public"]["Tables"]["daily_reports"]["Row"];
export type TopupRequest = Database["public"]["Tables"]["topup_requests"]["Row"];
export type WithdrawalRequest = Database["public"]["Tables"]["withdrawal_requests"]["Row"];
