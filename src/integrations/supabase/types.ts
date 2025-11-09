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
      agent_alerts: {
        Row: {
          agent_type: string
          created_at: string | null
          id: string
          insight_id: string | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          read_at: string | null
          read_by: string | null
          severity: string
          title: string
        }
        Insert: {
          agent_type: string
          created_at?: string | null
          id?: string
          insight_id?: string | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          read_by?: string | null
          severity: string
          title: string
        }
        Update: {
          agent_type?: string
          created_at?: string | null
          id?: string
          insight_id?: string | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          read_by?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_alerts_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "agent_insights"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_execution_log: {
        Row: {
          agent_type: string
          alerts_generated: number | null
          completed_at: string | null
          duration_ms: number | null
          error_message: string | null
          execution_type: string
          id: string
          insights_generated: number | null
          metadata: Json | null
          started_at: string | null
          status: string
        }
        Insert: {
          agent_type: string
          alerts_generated?: number | null
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          execution_type: string
          id?: string
          insights_generated?: number | null
          metadata?: Json | null
          started_at?: string | null
          status: string
        }
        Update: {
          agent_type?: string
          alerts_generated?: number | null
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          execution_type?: string
          id?: string
          insights_generated?: number | null
          metadata?: Json | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      agent_insights: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          agent_type: string
          analysis: string
          created_at: string | null
          id: string
          metadata: Json | null
          recommendations: Json | null
          resolved_at: string | null
          severity: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          agent_type: string
          analysis: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          recommendations?: Json | null
          resolved_at?: string | null
          severity: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          agent_type?: string
          analysis?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          recommendations?: Json | null
          resolved_at?: string | null
          severity?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          affected_files: string[] | null
          assigned_to: string | null
          created_at: string
          description: string
          id: string
          introduced_by_task_id: string | null
          reporter_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by_task_id: string | null
          root_cause: string | null
          severity: string
          status: string
          steps_to_reproduce: string | null
          title: string
          updated_at: string
        }
        Insert: {
          affected_files?: string[] | null
          assigned_to?: string | null
          created_at?: string
          description: string
          id?: string
          introduced_by_task_id?: string | null
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_task_id?: string | null
          root_cause?: string | null
          severity: string
          status?: string
          steps_to_reproduce?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          affected_files?: string[] | null
          assigned_to?: string | null
          created_at?: string
          description?: string
          id?: string
          introduced_by_task_id?: string | null
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_task_id?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_reports_introduced_by_task_id_fkey"
            columns: ["introduced_by_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_reports_resolved_by_task_id_fkey"
            columns: ["resolved_by_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      deployments: {
        Row: {
          completed_at: string | null
          created_at: string
          deployed_by: string | null
          deployed_tasks: string[] | null
          environment: string
          error_log: string | null
          git_commit_hash: string | null
          id: string
          notes: string | null
          sprint_id: string | null
          status: string
          version: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deployed_by?: string | null
          deployed_tasks?: string[] | null
          environment: string
          error_log?: string | null
          git_commit_hash?: string | null
          id?: string
          notes?: string | null
          sprint_id?: string | null
          status?: string
          version: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deployed_by?: string | null
          deployed_tasks?: string[] | null
          environment?: string
          error_log?: string | null
          git_commit_hash?: string | null
          id?: string
          notes?: string | null
          sprint_id?: string | null
          status?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployments_deployed_by_fkey"
            columns: ["deployed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployments_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
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
            referencedRelation: "store_basic_info"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "store_basic_info"
            referencedColumns: ["id"]
          },
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
          global_attribute_id: string | null
          id: string
          name: string
          options: Json
          position: number
          product_id: string
          source: Database["public"]["Enums"]["data_source"] | null
          store_id: string
          synced_at: string | null
          updated_at: string
          variation: boolean
          visible: boolean
          woo_id: number | null
        }
        Insert: {
          created_at?: string
          global_attribute_id?: string | null
          id?: string
          name: string
          options?: Json
          position?: number
          product_id: string
          source?: Database["public"]["Enums"]["data_source"] | null
          store_id: string
          synced_at?: string | null
          updated_at?: string
          variation?: boolean
          visible?: boolean
          woo_id?: number | null
        }
        Update: {
          created_at?: string
          global_attribute_id?: string | null
          id?: string
          name?: string
          options?: Json
          position?: number
          product_id?: string
          source?: Database["public"]["Enums"]["data_source"] | null
          store_id?: string
          synced_at?: string | null
          updated_at?: string
          variation?: boolean
          visible?: boolean
          woo_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_global_attribute_id_fkey"
            columns: ["global_attribute_id"]
            isOneToOne: false
            referencedRelation: "store_attributes"
            referencedColumns: ["id"]
          },
        ]
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
          source: Database["public"]["Enums"]["data_source"] | null
          storage_source: string
          storage_url: string | null
          store_id: string
          synced_at: string | null
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
          source?: Database["public"]["Enums"]["data_source"] | null
          storage_source?: string
          storage_url?: string | null
          store_id: string
          synced_at?: string | null
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
          source?: Database["public"]["Enums"]["data_source"] | null
          storage_source?: string
          storage_url?: string | null
          store_id?: string
          synced_at?: string | null
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
            referencedRelation: "store_basic_info"
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
          source: Database["public"]["Enums"]["data_source"] | null
          stock_quantity: number | null
          stock_status: string | null
          store_id: string
          synced_at: string | null
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
          source?: Database["public"]["Enums"]["data_source"] | null
          stock_quantity?: number | null
          stock_status?: string | null
          store_id: string
          synced_at?: string | null
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
          source?: Database["public"]["Enums"]["data_source"] | null
          stock_quantity?: number | null
          stock_status?: string | null
          store_id?: string
          synced_at?: string | null
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
            referencedRelation: "store_basic_info"
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
          source: Database["public"]["Enums"]["data_source"] | null
          status: string
          stock_quantity: number | null
          store_id: string
          synced_at: string | null
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
          source?: Database["public"]["Enums"]["data_source"] | null
          status?: string
          stock_quantity?: number | null
          store_id: string
          synced_at?: string | null
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
          source?: Database["public"]["Enums"]["data_source"] | null
          status?: string
          stock_quantity?: number | null
          store_id?: string
          synced_at?: string | null
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
            referencedRelation: "store_basic_info"
            referencedColumns: ["id"]
          },
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
      project_alerts: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          severity: string
          sprint_id: string | null
          task_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          severity?: string
          sprint_id?: string | null
          task_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          severity?: string
          sprint_id?: string | null
          task_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_alerts_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_alerts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_attribute_terms: {
        Row: {
          attribute_id: string
          count: number | null
          created_at: string
          description: string | null
          id: string
          menu_order: number | null
          name: string
          slug: string
          source: Database["public"]["Enums"]["data_source"] | null
          store_id: string
          synced_at: string | null
          updated_at: string
          woo_id: number
        }
        Insert: {
          attribute_id: string
          count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          menu_order?: number | null
          name: string
          slug: string
          source?: Database["public"]["Enums"]["data_source"] | null
          store_id: string
          synced_at?: string | null
          updated_at?: string
          woo_id: number
        }
        Update: {
          attribute_id?: string
          count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          menu_order?: number | null
          name?: string
          slug?: string
          source?: Database["public"]["Enums"]["data_source"] | null
          store_id?: string
          synced_at?: string | null
          updated_at?: string
          woo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_attribute_terms_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "store_attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_attribute_terms_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_basic_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_attribute_terms_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_attributes: {
        Row: {
          created_at: string
          has_archives: boolean | null
          id: string
          name: string
          order_by: string | null
          slug: string
          source: Database["public"]["Enums"]["data_source"] | null
          store_id: string
          synced_at: string | null
          type: string | null
          updated_at: string
          woo_id: number
        }
        Insert: {
          created_at?: string
          has_archives?: boolean | null
          id?: string
          name: string
          order_by?: string | null
          slug: string
          source?: Database["public"]["Enums"]["data_source"] | null
          store_id: string
          synced_at?: string | null
          type?: string | null
          updated_at?: string
          woo_id: number
        }
        Update: {
          created_at?: string
          has_archives?: boolean | null
          id?: string
          name?: string
          order_by?: string | null
          slug?: string
          source?: Database["public"]["Enums"]["data_source"] | null
          store_id?: string
          synced_at?: string | null
          type?: string | null
          updated_at?: string
          woo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_attributes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_basic_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_attributes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "store_basic_info"
            referencedColumns: ["id"]
          },
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
          source: Database["public"]["Enums"]["data_source"] | null
          store_id: string
          sync_error: string | null
          sync_status: string | null
          synced_at: string | null
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
          source?: Database["public"]["Enums"]["data_source"] | null
          store_id: string
          sync_error?: string | null
          sync_status?: string | null
          synced_at?: string | null
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
          source?: Database["public"]["Enums"]["data_source"] | null
          store_id?: string
          sync_error?: string | null
          sync_status?: string | null
          synced_at?: string | null
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
            referencedRelation: "store_basic_info"
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
          source: Database["public"]["Enums"]["data_source"] | null
          store_id: string
          sync_error: string | null
          sync_status: string | null
          synced_at: string | null
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
          source?: Database["public"]["Enums"]["data_source"] | null
          store_id: string
          sync_error?: string | null
          sync_status?: string | null
          synced_at?: string | null
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
          source?: Database["public"]["Enums"]["data_source"] | null
          store_id?: string
          sync_error?: string | null
          sync_status?: string | null
          synced_at?: string | null
          updated_at?: string | null
          woo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_tags_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_basic_info"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "store_basic_info"
            referencedColumns: ["id"]
          },
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
          webhook_secret: string | null
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
          webhook_secret?: string | null
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
          webhook_secret?: string | null
        }
        Relationships: []
      }
      sync_errors: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string
          error_code: string | null
          error_message: string
          id: string
          last_retry_at: string | null
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          retry_count: number | null
          stack_trace: string | null
          store_id: string
          woo_id: number | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          error_code?: string | null
          error_message: string
          id?: string
          last_retry_at?: string | null
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          retry_count?: number | null
          stack_trace?: string | null
          store_id: string
          woo_id?: number | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          error_code?: string | null
          error_message?: string
          id?: string
          last_retry_at?: string | null
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          retry_count?: number | null
          stack_trace?: string | null
          store_id?: string
          woo_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_errors_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_basic_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_errors_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          action: string
          created_at: string | null
          duration_ms: number | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          status: string
          store_id: string
          woo_id: number | null
        }
        Insert: {
          action: string
          created_at?: string | null
          duration_ms?: number | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          status?: string
          store_id: string
          woo_id?: number | null
        }
        Update: {
          action?: string
          created_at?: string | null
          duration_ms?: number | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          status?: string
          store_id?: string
          woo_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_basic_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_logs: {
        Row: {
          context: Json | null
          created_at: string
          file_path: string | null
          id: string
          level: string
          line_number: number | null
          message: string
          stack_trace: string | null
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          file_path?: string | null
          id?: string
          level: string
          line_number?: number | null
          message: string
          stack_trace?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          file_path?: string | null
          id?: string
          level?: string
          line_number?: number | null
          message?: string
          stack_trace?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          priority: string
          related_files: string[] | null
          sprint_id: string | null
          status: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          related_files?: string[] | null
          sprint_id?: string | null
          status?: string
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          related_files?: string[] | null
          sprint_id?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "store_basic_info"
            referencedColumns: ["id"]
          },
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
      webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          received_at: string
          status: string
          store_id: string
          topic: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          received_at?: string
          status: string
          store_id: string
          topic: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          received_at?: string
          status?: string
          store_id?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_basic_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "store_basic_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      work_logs: {
        Row: {
          created_at: string
          description: string | null
          hours: number
          id: string
          task_id: string
          user_id: string
          work_date: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hours: number
          id?: string
          task_id: string
          user_id: string
          work_date?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hours?: number
          id?: string
          task_id?: string
          user_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      audit_critical_changes: {
        Row: {
          action: string | null
          changed_fields: string[] | null
          created_at: string | null
          id: string | null
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          severity: string | null
          table_name: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string | null
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          severity?: never
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string | null
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          severity?: never
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_user_activity: {
        Row: {
          action: string | null
          change_count: number | null
          first_change: string | null
          last_change: string | null
          table_name: string | null
          user_email: string | null
          user_id: string | null
        }
        Relationships: []
      }
      orders_summary: {
        Row: {
          created_at: string | null
          customer_email_masked: string | null
          customer_name_masked: string | null
          id: string | null
          status: string | null
          store_id: string | null
          total: number | null
          updated_at: string | null
          woo_id: number | null
        }
        Insert: {
          created_at?: string | null
          customer_email_masked?: never
          customer_name_masked?: never
          id?: string | null
          status?: string | null
          store_id?: string | null
          total?: number | null
          updated_at?: string | null
          woo_id?: number | null
        }
        Update: {
          created_at?: string | null
          customer_email_masked?: never
          customer_name_masked?: never
          id?: string | null
          status?: string | null
          store_id?: string | null
          total?: number | null
          updated_at?: string | null
          woo_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_basic_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_basic_info: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string | null
          name: string | null
          updated_at: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string | null
          name?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string | null
          name?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_audit_logs: { Args: never; Returns: undefined }
      cleanup_old_sync_logs: { Args: never; Returns: undefined }
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
      data_source: "woo" | "local"
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
      data_source: ["woo", "local"],
      store_role: ["owner", "manager", "viewer"],
    },
  },
} as const
