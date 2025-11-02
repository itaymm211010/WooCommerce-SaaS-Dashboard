export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      order_status_logs: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_status: string
          old_status: string
          order_id: number
          store_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_status: string
          old_status: string
          order_id: number
          store_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string
          order_id?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          id: string
          status: string
          store_id: string
          total: number
          updated_at: string
          woo_id: number
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          id?: string
          status: string
          store_id: string
          total: number
          updated_at?: string
          woo_id: number
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          id?: string
          status?: string
          store_id?: string
          total?: number
          updated_at?: string
          woo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          created_at: string
          id: string
          name: string
          options: Json
          position: number
          product_id: string
          store_id: string
          updated_at: string
          variation: boolean
          visible: boolean
          woo_id: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          options?: Json
          position?: number
          product_id: string
          store_id: string
          updated_at?: string
          variation?: boolean
          visible?: boolean
          woo_id?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          options?: Json
          position?: number
          product_id?: string
          store_id?: string
          updated_at?: string
          variation?: boolean
          visible?: boolean
          woo_id?: number | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          original_url: string
          product_id: string | null
          storage_source: string
          storage_url: string | null
          store_id: string
          type: string
          updated_at: string
          versions: Json | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          original_url: string
          product_id?: string | null
          storage_source?: string
          storage_url?: string | null
          store_id: string
          type?: string
          updated_at?: string
          versions?: Json | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          original_url?: string
          product_id?: string | null
          storage_source?: string
          storage_url?: string | null
          store_id?: string
          type?: string
          updated_at?: string
          versions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          attributes: Json | null
          created_at: string
          id: string
          image_id: string | null
          price: number | null
          product_id: string
          regular_price: number | null
          sale_price: number | null
          sku: string | null
          stock_quantity: number | null
          stock_status: string | null
          store_id: string
          updated_at: string
          woo_id: number | null
        }
        Insert: {
          attributes?: Json | null
          created_at?: string
          id?: string
          image_id?: string | null
          price?: number | null
          product_id: string
          regular_price?: number | null
          sale_price?: number | null
          sku?: string | null
          stock_quantity?: number | null
          stock_status?: string | null
          store_id: string
          updated_at?: string
          woo_id?: number | null
        }
        Update: {
          attributes?: Json | null
          created_at?: string
          id?: string
          image_id?: string | null
          price?: number | null
          product_id?: string
          regular_price?: number | null
          sale_price?: number | null
          sku?: string | null
          stock_quantity?: number | null
          stock_status?: string | null
          store_id?: string
          updated_at?: string
          woo_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "product_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brands: Json
          categories: Json | null
          created_at: string
          description: string | null
          featured_image_id: string | null
          height: number | null
          id: string
          length: number | null
          name: string
          price: number | null
          sale_price: number | null
          short_description: string | null
          sku: string | null
          status: string
          stock_quantity: number | null
          store_id: string
          tags: Json | null
          type: string
          updated_at: string
          weight: number | null
          width: number | null
          woo_id: number | null
        }
        Insert: {
          brands?: Json
          categories?: Json | null
          created_at?: string
          description?: string | null
          featured_image_id?: string | null
          height?: number | null
          id?: string
          length?: number | null
          name: string
          price?: number | null
          sale_price?: number | null
          short_description?: string | null
          sku?: string | null
          status?: string
          stock_quantity?: number | null
          store_id: string
          tags?: Json | null
          type?: string
          updated_at?: string
          weight?: number | null
          width?: number | null
          woo_id?: number | null
        }
        Update: {
          brands?: Json
          categories?: Json | null
          created_at?: string
          description?: string | null
          featured_image_id?: string | null
          height?: number | null
          id?: string
          length?: number | null
          name?: string
          price?: number | null
          sale_price?: number | null
          short_description?: string | null
          sku?: string | null
          status?: string
          stock_quantity?: number | null
          store_id?: string
          tags?: Json | null
          type?: string
          updated_at?: string
          weight?: number | null
          width?: number | null
          woo_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_brands: {
        Row: {
          count: number | null
          created_at: string | null
          description: string | null
          id: string
          last_synced_at: string | null
          logo_url: string | null
          name: string
          slug: string
          store_id: string
          sync_error: string | null
          sync_status: string | null
          updated_at: string | null
          woo_id: number
        }
        Insert: {
          count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          logo_url?: string | null
          name: string
          slug: string
          store_id: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
          woo_id: number
        }
        Update: {
          count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          logo_url?: string | null
          name?: string
          slug?: string
          store_id?: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
          woo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_brands_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_categories: {
        Row: {
          count: number | null
          created_at: string | null
          description: string | null
          display: string | null
          id: string
          image_url: string | null
          last_synced_at: string | null
          menu_order: number | null
          name: string
          parent_id: string | null
          parent_woo_id: number | null
          slug: string
          store_id: string
          sync_error: string | null
          sync_status: string | null
          updated_at: string | null
          woo_id: number
        }
        Insert: {
          count?: number | null
          created_at?: string | null
          description?: string | null
          display?: string | null
          id?: string
          image_url?: string | null
          last_synced_at?: string | null
          menu_order?: number | null
          name: string
          parent_id?: string | null
          parent_woo_id?: number | null
          slug: string
          store_id: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
          woo_id: number
        }
        Update: {
          count?: number | null
          created_at?: string | null
          description?: string | null
          display?: string | null
          id?: string
          image_url?: string | null
          last_synced_at?: string | null
          menu_order?: number | null
          name?: string
          parent_id?: string | null
          parent_woo_id?: number | null
          slug?: string
          store_id?: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
          woo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_tags: {
        Row: {
          count: number | null
          created_at: string | null
          description: string | null
          id: string
          last_synced_at: string | null
          name: string
          slug: string
          store_id: string
          sync_error: string | null
          sync_status: string | null
          updated_at: string | null
          woo_id: number
        }
        Insert: {
          count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          slug: string
          store_id: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
          woo_id: number
        }
        Update: {
          count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          slug?: string
          store_id?: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
          woo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_tags_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_users: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["store_role"]
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["store_role"]
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["store_role"]
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_users_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          api_key: string
          api_secret: string
          created_at: string
          currency: string
          id: string
          name: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          api_key: string
          api_secret: string
          created_at?: string
          currency?: string
          id?: string
          name: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          api_key?: string
          api_secret?: string
          created_at?: string
          currency?: string
          id?: string
          name?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      taxonomy_sync_log: {
        Row: {
          action: string
          created_at: string | null
          duration_ms: number | null
          error_details: Json | null
          id: string
          items_created: number | null
          items_failed: number | null
          items_synced: number | null
          items_updated: number | null
          store_id: string
          taxonomy_type: string
        }
        Insert: {
          action: string
          created_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          id?: string
          items_created?: number | null
          items_failed?: number | null
          items_synced?: number | null
          items_updated?: number | null
          store_id: string
          taxonomy_type: string
        }
        Update: {
          action?: string
          created_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          id?: string
          items_created?: number | null
          items_failed?: number | null
          items_synced?: number | null
          items_updated?: number | null
          store_id?: string
          taxonomy_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxonomy_sync_log_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          created_at: string
          delivery_url: string
          id: string
          status: string
          store_id: string
          topic: string
          updated_at: string
          woo_webhook_id: number | null
        }
        Insert: {
          created_at?: string
          delivery_url: string
          id?: string
          status?: string
          store_id: string
          topic: string
          updated_at?: string
          woo_webhook_id?: number | null
        }
        Update: {
          created_at?: string
          delivery_url?: string
          id?: string
          status?: string
          store_id?: string
          topic?: string
          updated_at?: string
          woo_webhook_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_taxonomy_sync_logs: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_has_store_access: {
        Args: { _store_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      store_role: "owner" | "manager" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      store_role: ["owner", "manager", "viewer"],
    },
  },
} as const
