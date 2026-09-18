export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          created_at: string
          diff: Json | null
          entity: string
          entity_id: string | null
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: number
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: number
        }
        Relationships: []
      }
      cafe_members: {
        Row: {
          cafe_id: string
          created_at: string
          id: string
          member_role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          cafe_id: string
          created_at?: string
          id?: string
          member_role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          cafe_id?: string
          created_at?: string
          id?: string
          member_role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cafe_members_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cafe_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_notes: {
        Row: {
          author_id: string | null
          body: string
          cafe_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          cafe_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          cafe_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cafe_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cafe_notes_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_stock: {
        Row: {
          baseline_daily_burn: number
          burn_source: string
          cafe_id: string
          computed_at: string | null
          created_at: string
          daily_burn: number
          est_on_hand: number
          id: string
          last_count_at: string
          last_count_units: number
          product_id: string
          reorder_point: number
          updated_at: string
        }
        Insert: {
          baseline_daily_burn?: number
          burn_source?: string
          cafe_id: string
          computed_at?: string | null
          created_at?: string
          daily_burn?: number
          est_on_hand?: number
          id?: string
          last_count_at?: string
          last_count_units?: number
          product_id: string
          reorder_point?: number
          updated_at?: string
        }
        Update: {
          baseline_daily_burn?: number
          burn_source?: string
          cafe_id?: string
          computed_at?: string | null
          created_at?: string
          daily_burn?: number
          est_on_hand?: number
          id?: string
          last_count_at?: string
          last_count_units?: number
          product_id?: string
          reorder_point?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cafe_stock_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cafe_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cafes: {
        Row: {
          active: boolean
          address_line1: string | null
          address_line2: string | null
          auto_ship: boolean
          city: string | null
          contact_email: string | null
          country: string
          created_at: string
          id: string
          lead_time_days: number
          name: string
          payment_terms: Database["public"]["Enums"]["payment_terms"]
          phone: string | null
          pos_type: Database["public"]["Enums"]["pos_type"]
          postal_code: string | null
          province: string | null
          safety_days: number
          sms_opt_in: boolean
          sms_opt_in_at: string | null
          sms_opt_in_source: string | null
          sms_stop_at: string | null
          square_merchant_id: string | null
          stripe_customer_id: string | null
          tax_rate_bps: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          address_line1?: string | null
          address_line2?: string | null
          auto_ship?: boolean
          city?: string | null
          contact_email?: string | null
          country?: string
          created_at?: string
          id?: string
          lead_time_days?: number
          name: string
          payment_terms?: Database["public"]["Enums"]["payment_terms"]
          phone?: string | null
          pos_type?: Database["public"]["Enums"]["pos_type"]
          postal_code?: string | null
          province?: string | null
          safety_days?: number
          sms_opt_in?: boolean
          sms_opt_in_at?: string | null
          sms_opt_in_source?: string | null
          sms_stop_at?: string | null
          square_merchant_id?: string | null
          stripe_customer_id?: string | null
          tax_rate_bps?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          address_line1?: string | null
          address_line2?: string | null
          auto_ship?: boolean
          city?: string | null
          contact_email?: string | null
          country?: string
          created_at?: string
          id?: string
          lead_time_days?: number
          name?: string
          payment_terms?: Database["public"]["Enums"]["payment_terms"]
          phone?: string | null
          pos_type?: Database["public"]["Enums"]["pos_type"]
          postal_code?: string | null
          province?: string | null
          safety_days?: number
          sms_opt_in?: boolean
          sms_opt_in_at?: string | null
          sms_opt_in_source?: string | null
          sms_stop_at?: string | null
          square_merchant_id?: string | null
          stripe_customer_id?: string | null
          tax_rate_bps?: number
          updated_at?: string
        }
        Relationships: []
      }
      cron_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          job: string
          started_at: string
          summary: Json | null
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          job: string
          started_at?: string
          summary?: Json | null
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          job?: string
          started_at?: string
          summary?: Json | null
        }
        Relationships: []
      }
      item_map: {
        Row: {
          cafe_id: string
          cups_per_item: number
          id: string
          product_id: string
          square_variation_id: string
        }
        Insert: {
          cafe_id: string
          cups_per_item?: number
          id?: string
          product_id: string
          square_variation_id: string
        }
        Update: {
          cafe_id?: string
          cups_per_item?: number
          id?: string
          product_id?: string
          square_variation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_map_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          cases: number
          id: string
          line_total_cents: number
          order_id: string
          product_id: string
          unit_price_cents: number
          units: number
        }
        Insert: {
          cases: number
          id?: string
          line_total_cents: number
          order_id: string
          product_id: string
          unit_price_cents: number
          units: number
        }
        Update: {
          cases?: number
          id?: string
          line_total_cents?: number
          order_id?: string
          product_id?: string
          unit_price_cents?: number
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cafe_id: string
          carrier: string | null
          created_at: string
          created_by: string | null
          currency: string
          delivered_at: string | null
          id: string
          invoice_url: string | null
          order_number: string
          receipt_url: string | null
          reorder_id: string | null
          ship_to: Json | null
          shipped_at: string | null
          shipping_cents: number
          status: Database["public"]["Enums"]["order_status"]
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          cafe_id: string
          carrier?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          delivered_at?: string | null
          id?: string
          invoice_url?: string | null
          order_number?: string
          receipt_url?: string | null
          reorder_id?: string | null
          ship_to?: Json | null
          shipped_at?: string | null
          shipping_cents?: number
          status?: Database["public"]["Enums"]["order_status"]
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents: number
          tax_cents?: number
          total_cents: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          cafe_id?: string
          carrier?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          delivered_at?: string | null
          id?: string
          invoice_url?: string | null
          order_number?: string
          receipt_url?: string | null
          reorder_id?: string | null
          ship_to?: Json | null
          shipped_at?: string | null
          shipping_cents?: number
          status?: Database["public"]["Enums"]["order_status"]
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_reorder_id_fkey"
            columns: ["reorder_id"]
            isOneToOne: true
            referencedRelation: "reorders"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_connections: {
        Row: {
          access_token_enc: string | null
          cafe_id: string
          created_at: string
          id: string
          last_error: string | null
          last_sync_at: string | null
          merchant_id: string | null
          provider: Database["public"]["Enums"]["pos_type"]
          refresh_token_enc: string | null
          scopes: string[] | null
          status: Database["public"]["Enums"]["pos_conn_status"]
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token_enc?: string | null
          cafe_id: string
          created_at?: string
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          merchant_id?: string | null
          provider: Database["public"]["Enums"]["pos_type"]
          refresh_token_enc?: string | null
          scopes?: string[] | null
          status?: Database["public"]["Enums"]["pos_conn_status"]
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_enc?: string | null
          cafe_id?: string
          created_at?: string
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          merchant_id?: string | null
          provider?: Database["public"]["Enums"]["pos_type"]
          refresh_token_enc?: string | null
          scopes?: string[] | null
          status?: Database["public"]["Enums"]["pos_conn_status"]
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_connections_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_webhook_events: {
        Row: {
          created_at: string
          error: string | null
          id: string
          payload: Json
          processed_at: string | null
          provider: Database["public"]["Enums"]["pos_type"]
        }
        Insert: {
          created_at?: string
          error?: string | null
          id: string
          payload: Json
          processed_at?: string | null
          provider: Database["public"]["Enums"]["pos_type"]
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: Database["public"]["Enums"]["pos_type"]
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          price_per_case_cents: number
          printed: boolean
          size_oz: number
          sku: string
          sort_order: number
          units_per_case: number
          units_per_sleeve: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          price_per_case_cents: number
          printed?: boolean
          size_oz: number
          sku: string
          sort_order?: number
          units_per_case?: number
          units_per_sleeve?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          price_per_case_cents?: number
          printed?: boolean
          size_oz?: number
          sku?: string
          sort_order?: number
          units_per_case?: number
          units_per_sleeve?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reorders: {
        Row: {
          amount_cents: number
          approved_by: string | null
          approved_via: string | null
          cafe_id: string
          cases: number
          created_at: string
          daily_burn_at_creation: number | null
          days_of_cover_at_creation: number | null
          est_on_hand_at_creation: number | null
          failure_reason: string | null
          id: string
          product_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["reorder_status"]
          stripe_checkout_session_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          tax_cents: number
          updated_at: string
        }
        Insert: {
          amount_cents: number
          approved_by?: string | null
          approved_via?: string | null
          cafe_id: string
          cases: number
          created_at?: string
          daily_burn_at_creation?: number | null
          days_of_cover_at_creation?: number | null
          est_on_hand_at_creation?: number | null
          failure_reason?: string | null
          id?: string
          product_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["reorder_status"]
          stripe_checkout_session_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents: number
          tax_cents?: number
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          approved_by?: string | null
          approved_via?: string | null
          cafe_id?: string
          cases?: number
          created_at?: string
          daily_burn_at_creation?: number | null
          days_of_cover_at_creation?: number | null
          est_on_hand_at_creation?: number | null
          failure_reason?: string | null
          id?: string
          product_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["reorder_status"]
          stripe_checkout_session_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          tax_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reorders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reorders_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reorders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_messages: {
        Row: {
          body: string
          cafe_id: string | null
          created_at: string
          direction: Database["public"]["Enums"]["sms_direction"]
          error_code: string | null
          from_phone: string
          id: string
          needs_review: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          to_phone: string
          twilio_sid: string | null
        }
        Insert: {
          body: string
          cafe_id?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["sms_direction"]
          error_code?: string | null
          from_phone: string
          id?: string
          needs_review?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          to_phone: string
          twilio_sid?: string | null
        }
        Update: {
          body?: string
          cafe_id?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["sms_direction"]
          error_code?: string | null
          from_phone?: string
          id?: string
          needs_review?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          to_phone?: string
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_messages_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_prompts: {
        Row: {
          answer_message_id: string | null
          answered_at: string | null
          cafe_id: string
          created_at: string
          expires_at: string
          id: string
          kind: Database["public"]["Enums"]["sms_prompt_kind"]
          product_id: string | null
          reorder_ids: string[]
          sent_at: string | null
          sent_message_id: string | null
          status: Database["public"]["Enums"]["sms_prompt_status"]
        }
        Insert: {
          answer_message_id?: string | null
          answered_at?: string | null
          cafe_id: string
          created_at?: string
          expires_at?: string
          id?: string
          kind: Database["public"]["Enums"]["sms_prompt_kind"]
          product_id?: string | null
          reorder_ids?: string[]
          sent_at?: string | null
          sent_message_id?: string | null
          status?: Database["public"]["Enums"]["sms_prompt_status"]
        }
        Update: {
          answer_message_id?: string | null
          answered_at?: string | null
          cafe_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["sms_prompt_kind"]
          product_id?: string | null
          reorder_ids?: string[]
          sent_at?: string | null
          sent_message_id?: string | null
          status?: Database["public"]["Enums"]["sms_prompt_status"]
        }
        Relationships: [
          {
            foreignKeyName: "sms_prompts_answer_message_id_fkey"
            columns: ["answer_message_id"]
            isOneToOne: false
            referencedRelation: "sms_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_prompts_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_prompts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_prompts_sent_message_id_fkey"
            columns: ["sent_message_id"]
            isOneToOne: false
            referencedRelation: "sms_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          created_at: string
          error: string | null
          id: string
          processed_at: string | null
          type: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id: string
          processed_at?: string | null
          type: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          processed_at?: string | null
          type?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          cafe_id: string
          created_at: string
          created_by: string | null
          external_id: string | null
          id: string
          note: string | null
          occurred_at: string
          product_id: string
          qty: number
          source: Database["public"]["Enums"]["usage_source"]
        }
        Insert: {
          cafe_id: string
          created_at?: string
          created_by?: string | null
          external_id?: string | null
          id?: string
          note?: string | null
          occurred_at?: string
          product_id: string
          qty: number
          source: Database["public"]["Enums"]["usage_source"]
        }
        Update: {
          cafe_id?: string
          created_at?: string
          created_by?: string | null
          external_id?: string | null
          id?: string
          note?: string | null
          occurred_at?: string
          product_id?: string
          qty?: number
          source?: Database["public"]["Enums"]["usage_source"]
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_stock: {
        Args: {
          p_cafe: string
          p_note: string
          p_product: string
          p_qty_consumed: number
        }
        Returns: {
          baseline_daily_burn: number
          burn_source: string
          cafe_id: string
          computed_at: string | null
          created_at: string
          daily_burn: number
          est_on_hand: number
          id: string
          last_count_at: string
          last_count_units: number
          product_id: string
          reorder_point: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "cafe_stock"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      audit_event: {
        Args: {
          p_action: string
          p_diff?: Json
          p_entity: string
          p_entity_id: string
        }
        Returns: undefined
      }
      call_app_cron: { Args: { p_path: string }; Returns: number }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      expire_sms_prompts: { Args: never; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      is_cafe_member: { Args: { p_cafe: string }; Returns: boolean }
      is_cafe_owner: { Args: { p_cafe: string }; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      record_stock_count: {
        Args: {
          p_cafe: string
          p_product: string
          p_source?: Database["public"]["Enums"]["usage_source"]
          p_units: number
        }
        Returns: {
          baseline_daily_burn: number
          burn_source: string
          cafe_id: string
          computed_at: string | null
          created_at: string
          daily_burn: number
          est_on_hand: number
          id: string
          last_count_at: string
          last_count_units: number
          product_id: string
          reorder_point: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "cafe_stock"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      refresh_cafe_stock: { Args: { p_cafe?: string }; Returns: number }
      request_reorder: {
        Args: { p_cafe: string; p_cases: number; p_product: string }
        Returns: {
          amount_cents: number
          approved_by: string | null
          approved_via: string | null
          cafe_id: string
          cases: number
          created_at: string
          daily_burn_at_creation: number | null
          days_of_cover_at_creation: number | null
          est_on_hand_at_creation: number | null
          failure_reason: string | null
          id: string
          product_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["reorder_status"]
          stripe_checkout_session_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          tax_cents: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reorders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      respond_to_reorder: {
        Args: { p_approve: boolean; p_reorder: string; p_via?: string }
        Returns: {
          amount_cents: number
          approved_by: string | null
          approved_via: string | null
          cafe_id: string
          cases: number
          created_at: string
          daily_burn_at_creation: number | null
          days_of_cover_at_creation: number | null
          est_on_hand_at_creation: number | null
          failure_reason: string | null
          id: string
          product_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["reorder_status"]
          stripe_checkout_session_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          tax_cents: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reorders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      run_reorder_engine: {
        Args: never
        Returns: {
          amount_cents: number
          approved_by: string | null
          approved_via: string | null
          cafe_id: string
          cases: number
          created_at: string
          daily_burn_at_creation: number | null
          days_of_cover_at_creation: number | null
          est_on_hand_at_creation: number | null
          failure_reason: string | null
          id: string
          product_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["reorder_status"]
          stripe_checkout_session_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          tax_cents: number
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "reorders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      member_role: "owner" | "manager"
      order_status:
        | "pending_payment"
        | "paid"
        | "invoiced"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_terms: "card" | "net30"
      pos_conn_status: "active" | "revoked" | "error"
      pos_type: "none" | "square"
      reorder_status:
        | "suggested"
        | "sms_sent"
        | "approved"
        | "charged"
        | "invoiced"
        | "shipped"
        | "delivered"
        | "declined"
        | "failed"
      sms_direction: "inbound" | "outbound"
      sms_prompt_kind: "reorder_approval" | "count_request"
      sms_prompt_status: "open" | "answered" | "expired" | "cancelled"
      usage_source: "square" | "sms_count" | "manual" | "delivery"
      user_role: "client" | "staff" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      member_role: ["owner", "manager"],
      order_status: [
        "pending_payment",
        "paid",
        "invoiced",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_terms: ["card", "net30"],
      pos_conn_status: ["active", "revoked", "error"],
      pos_type: ["none", "square"],
      reorder_status: [
        "suggested",
        "sms_sent",
        "approved",
        "charged",
        "invoiced",
        "shipped",
        "delivered",
        "declined",
        "failed",
      ],
      sms_direction: ["inbound", "outbound"],
      sms_prompt_kind: ["reorder_approval", "count_request"],
      sms_prompt_status: ["open", "answered", "expired", "cancelled"],
      usage_source: ["square", "sms_count", "manual", "delivery"],
      user_role: ["client", "staff", "admin"],
    },
  },
} as const

