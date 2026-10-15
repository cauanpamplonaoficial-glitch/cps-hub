// Generated from the authorized Supabase test project (abxmblwgsuiayfhkwzvu).
// Regenerate after schema changes; legacy V1 archive access remains isolated in legacySupabase.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      apple_royal_activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: string
          owner_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
          owner_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
          owner_id?: string
        }
        Relationships: []
      }
      apple_royal_after_sales: {
        Row: {
          closed_at: string | null
          created_at: string
          id: string
          issue: string
          notes: string | null
          opened_at: string
          owner_id: string
          resolution: string | null
          responsible_party: string | null
          sale_id: string
          status: string
          warranty_until: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          id?: string
          issue: string
          notes?: string | null
          opened_at?: string
          owner_id: string
          resolution?: string | null
          responsible_party?: string | null
          sale_id: string
          status?: string
          warranty_until?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          id?: string
          issue?: string
          notes?: string | null
          opened_at?: string
          owner_id?: string
          resolution?: string | null
          responsible_party?: string | null
          sale_id?: string
          status?: string
          warranty_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apple_royal_after_sales_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "apple_royal_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      apple_royal_deliveries: {
        Row: {
          created_at: string
          customer_confirmed: boolean
          delivered_at: string | null
          expected_at: string | null
          id: string
          notes: string | null
          owner_id: string
          responsible_party: string | null
          sale_id: string
          status: string
          tracking_reference: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_confirmed?: boolean
          delivered_at?: string | null
          expected_at?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          responsible_party?: string | null
          sale_id: string
          status?: string
          tracking_reference?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_confirmed?: boolean
          delivered_at?: string | null
          expected_at?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          responsible_party?: string | null
          sale_id?: string
          status?: string
          tracking_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apple_royal_deliveries_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "apple_royal_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      apple_royal_devices: {
        Row: {
          activation_status: string
          advertised_price: number
          battery_health: number | null
          color: string
          condition: string
          created_at: string
          id: string
          model: string
          notes: string | null
          owner_id: string
          partner_price: number
          partner_reference: string | null
          photo_urls: Json
          status: string
          storage: string
          updated_at: string
        }
        Insert: {
          activation_status?: string
          advertised_price?: number
          battery_health?: number | null
          color?: string
          condition?: string
          created_at?: string
          id?: string
          model: string
          notes?: string | null
          owner_id: string
          partner_price?: number
          partner_reference?: string | null
          photo_urls?: Json
          status?: string
          storage?: string
          updated_at?: string
        }
        Update: {
          activation_status?: string
          advertised_price?: number
          battery_health?: number | null
          color?: string
          condition?: string
          created_at?: string
          id?: string
          model?: string
          notes?: string | null
          owner_id?: string
          partner_price?: number
          partner_reference?: string | null
          photo_urls?: Json
          status?: string
          storage?: string
          updated_at?: string
        }
        Relationships: []
      }
      apple_royal_documents: {
        Row: {
          created_at: string
          document_url: string | null
          id: string
          notes: string | null
          owner_id: string
          reference: string | null
          related_id: string | null
          related_type: string
          title: string
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          reference?: string | null
          related_id?: string | null
          related_type: string
          title: string
        }
        Update: {
          created_at?: string
          document_url?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          reference?: string | null
          related_id?: string | null
          related_type?: string
          title?: string
        }
        Relationships: []
      }
      apple_royal_receipts: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          owner_id: string
          payment_method: string | null
          received_at: string
          reference: string | null
          sale_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          owner_id: string
          payment_method?: string | null
          received_at?: string
          reference?: string | null
          sale_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          payment_method?: string | null
          received_at?: string
          reference?: string | null
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apple_royal_receipts_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "apple_royal_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      apple_royal_remittances: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          owner_id: string
          paid_at: string | null
          payment_method: string | null
          proof_reference: string | null
          sale_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          owner_id: string
          paid_at?: string | null
          payment_method?: string | null
          proof_reference?: string | null
          sale_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          paid_at?: string | null
          payment_method?: string | null
          proof_reference?: string | null
          sale_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "apple_royal_remittances_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "apple_royal_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      apple_royal_reservations: {
        Row: {
          agreed_price: number
          created_at: string
          customer_name: string
          customer_phone: string | null
          deposit_amount: number
          desired_model: string | null
          device_id: string | null
          expires_at: string | null
          id: string
          notes: string | null
          owner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          agreed_price?: number
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          deposit_amount?: number
          desired_model?: string | null
          device_id?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          agreed_price?: number
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          deposit_amount?: number
          desired_model?: string | null
          device_id?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apple_royal_reservations_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "apple_royal_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      apple_royal_sales: {
        Row: {
          additional_costs: number
          amount_received: number
          amount_remitted: number
          created_at: string
          customer_name: string
          customer_phone: string | null
          delivered_at: string | null
          device_id: string | null
          id: string
          model_snapshot: string
          notes: string | null
          owner_id: string
          partner_amount_due: number
          payment_status: string
          reservation_id: string | null
          sale_price: number
          sold_at: string
          status: string
          updated_at: string
        }
        Insert: {
          additional_costs?: number
          amount_received?: number
          amount_remitted?: number
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          delivered_at?: string | null
          device_id?: string | null
          id?: string
          model_snapshot: string
          notes?: string | null
          owner_id: string
          partner_amount_due?: number
          payment_status?: string
          reservation_id?: string | null
          sale_price: number
          sold_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          additional_costs?: number
          amount_received?: number
          amount_remitted?: number
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          delivered_at?: string | null
          device_id?: string | null
          id?: string
          model_snapshot?: string
          notes?: string | null
          owner_id?: string
          partner_amount_due?: number
          payment_status?: string
          reservation_id?: string | null
          sale_price?: number
          sold_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apple_royal_sales_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "apple_royal_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apple_royal_sales_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "apple_royal_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      consorcio_activities: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string
          details: string | null
          id: string
          lead_id: string
          next_action: string | null
          next_follow_up: string | null
          occurred_at: string
          outcome: string | null
          owner_id: string
          title: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          created_by?: string
          details?: string | null
          id?: string
          lead_id: string
          next_action?: string | null
          next_follow_up?: string | null
          occurred_at?: string
          outcome?: string | null
          owner_id?: string
          title: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string
          details?: string | null
          id?: string
          lead_id?: string
          next_action?: string | null
          next_follow_up?: string | null
          occurred_at?: string
          outcome?: string | null
          owner_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "consorcio_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "consorcio_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      consorcio_leads: {
        Row: {
          available_bid: number
          city: string | null
          created_at: string
          customer_id: string | null
          desired_credit: number
          desired_installment: number
          id: string
          interest: string | null
          last_contact_at: string | null
          legacy_data: Json | null
          legacy_id: string | null
          loss_reason: string | null
          name: string
          next_action: string | null
          next_follow_up: string | null
          notes: string | null
          owner_id: string
          phone: string | null
          primary_objection: string | null
          qualification: Json
          responsible_id: string | null
          source: string | null
          stage: string
          temperature: string
          updated_at: string
          urgency: string
        }
        Insert: {
          available_bid?: number
          city?: string | null
          created_at?: string
          customer_id?: string | null
          desired_credit?: number
          desired_installment?: number
          id?: string
          interest?: string | null
          last_contact_at?: string | null
          legacy_data?: Json | null
          legacy_id?: string | null
          loss_reason?: string | null
          name: string
          next_action?: string | null
          next_follow_up?: string | null
          notes?: string | null
          owner_id?: string
          phone?: string | null
          primary_objection?: string | null
          qualification?: Json
          responsible_id?: string | null
          source?: string | null
          stage?: string
          temperature?: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          available_bid?: number
          city?: string | null
          created_at?: string
          customer_id?: string | null
          desired_credit?: number
          desired_installment?: number
          id?: string
          interest?: string | null
          last_contact_at?: string | null
          legacy_data?: Json | null
          legacy_id?: string | null
          loss_reason?: string | null
          name?: string
          next_action?: string | null
          next_follow_up?: string | null
          notes?: string | null
          owner_id?: string
          phone?: string | null
          primary_objection?: string | null
          qualification?: Json
          responsible_id?: string | null
          source?: string | null
          stage?: string
          temperature?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "consorcio_leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          legacy_data: Json | null
          legacy_id: string | null
          name: string
          notes: string | null
          owner_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          legacy_data?: Json | null
          legacy_id?: string | null
          name: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          legacy_data?: Json | null
          legacy_id?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          owner_id: string
          paid_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          owner_id?: string
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          owner_id?: string
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          id: string
          legacy_data: Json | null
          legacy_id: string | null
          movement_type: string
          notes: string | null
          owner_id: string
          product_id: string
          quantity_delta: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          legacy_data?: Json | null
          legacy_id?: string | null
          movement_type: string
          notes?: string | null
          owner_id?: string
          product_id: string
          quantity_delta: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          legacy_data?: Json | null
          legacy_id?: string | null
          movement_type?: string
          notes?: string | null
          owner_id?: string
          product_id?: string
          quantity_delta?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string | null
          cost_price: number
          created_at: string
          description: string | null
          id: string
          legacy_data: Json | null
          legacy_id: string | null
          min_stock: number
          name: string
          owner_id: string
          sale_price: number
          sku: string | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          legacy_data?: Json | null
          legacy_id?: string | null
          min_stock?: number
          name: string
          owner_id?: string
          sale_price?: number
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          legacy_data?: Json | null
          legacy_id?: string | null
          min_stock?: number
          name?: string
          owner_id?: string
          sale_price?: number
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          product_id: string | null
          product_name: string
          purchase_id: string
          quantity: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id?: string
          product_id?: string | null
          product_name: string
          purchase_id: string
          quantity: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          product_id?: string | null
          product_name?: string
          purchase_id?: string
          quantity?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          id: string
          legacy_data: Json | null
          legacy_id: string | null
          notes: string | null
          ordered_at: string
          owner_id: string
          received_at: string | null
          status: string
          supplier_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          legacy_data?: Json | null
          legacy_id?: string | null
          notes?: string | null
          ordered_at?: string
          owner_id?: string
          received_at?: string | null
          status?: string
          supplier_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          legacy_data?: Json | null
          legacy_id?: string | null
          notes?: string | null
          ordered_at?: string
          owner_id?: string
          received_at?: string | null
          status?: string
          supplier_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          product_id: string | null
          product_name: string
          quantity: number
          sale_id: string
          unit_cost: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id?: string
          product_id?: string | null
          product_name: string
          quantity: number
          sale_id: string
          unit_cost?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sale_id?: string
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          channel: string
          created_at: string
          customer_id: string | null
          discount: number
          fees: number
          id: string
          legacy_data: Json | null
          legacy_id: string | null
          notes: string | null
          order_number: string | null
          owner_id: string
          shipping_cost: number
          sold_at: string
          status: string
          subtotal: number
          updated_at: string
        }
        Insert: {
          channel?: string
          created_at?: string
          customer_id?: string | null
          discount?: number
          fees?: number
          id?: string
          legacy_data?: Json | null
          legacy_id?: string | null
          notes?: string | null
          order_number?: string | null
          owner_id?: string
          shipping_cost?: number
          sold_at?: string
          status?: string
          subtotal?: number
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          customer_id?: string | null
          discount?: number
          fees?: number
          id?: string
          legacy_data?: Json | null
          legacy_id?: string | null
          notes?: string | null
          order_number?: string | null
          owner_id?: string
          shipping_cost?: number
          sold_at?: string
          status?: string
          subtotal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean
          created_at: string
          document_number: string | null
          email: string | null
          id: string
          legacy_data: Json | null
          legacy_id: string | null
          name: string
          notes: string | null
          owner_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          document_number?: string | null
          email?: string | null
          id?: string
          legacy_data?: Json | null
          legacy_id?: string | null
          name: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          document_number?: string | null
          email?: string | null
          id?: string
          legacy_data?: Json | null
          legacy_id?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      v1_archive: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          entity_name: string
          id: number
          imported_at: string
          legacy_id: string
          payload: Json
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          entity_name: string
          id?: never
          imported_at?: string
          legacy_id: string
          payload: Json
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          entity_name?: string
          id?: never
          imported_at?: string
          legacy_id?: string
          payload?: Json
        }
        Relationships: []
      }
      v1_import_manifest: {
        Row: {
          checked_at: string
          entity_name: string
          imported_record_count: number
          source_app: string
          source_record_count: number
          status: string
        }
        Insert: {
          checked_at?: string
          entity_name: string
          imported_record_count?: number
          source_app?: string
          source_record_count?: number
          status?: string
        }
        Update: {
          checked_at?: string
          entity_name?: string
          imported_record_count?: number
          source_app?: string
          source_record_count?: number
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apple_royal_cancel_sale: {
        Args: { p_sale_id: string }
        Returns: undefined
      }
      apple_royal_create_reservation: {
        Args: {
          p_agreed_price: number
          p_customer_name: string
          p_customer_phone: string
          p_deposit_amount: number
          p_desired_model: string
          p_device_id: string
          p_expires_at: string
          p_notes: string
          p_status: string
        }
        Returns: string
      }
      apple_royal_create_sale: {
        Args: {
          p_additional_costs: number
          p_amount_received: number
          p_customer_name: string
          p_customer_phone: string
          p_device_id: string
          p_model_snapshot: string
          p_notes: string
          p_partner_amount_due: number
          p_payment_status: string
          p_reservation_id: string
          p_sale_price: number
          p_status: string
        }
        Returns: string
      }
      apple_royal_mark_remittance_paid: {
        Args: {
          p_notes: string
          p_paid_at: string
          p_payment_method: string
          p_proof_reference: string
          p_remittance_id: string
        }
        Returns: undefined
      }
      apple_royal_record_receipt: {
        Args: {
          p_amount: number
          p_notes: string
          p_payment_method: string
          p_received_at: string
          p_reference: string
          p_sale_id: string
        }
        Returns: string
      }
      apple_royal_record_remittance: {
        Args: {
          p_amount: number
          p_notes: string
          p_paid_at: string
          p_payment_method: string
          p_proof_reference: string
          p_sale_id: string
          p_status: string
        }
        Returns: string
      }
      cancel_purchase: { Args: { p_purchase_id: string }; Returns: undefined }
      cancel_sale: { Args: { p_sale_id: string }; Returns: undefined }
      create_consorcio_lead: {
        Args: {
          p_available_bid?: number
          p_city?: string
          p_customer_id?: string
          p_desired_credit?: number
          p_desired_installment?: number
          p_interest?: string
          p_name: string
          p_next_action?: string
          p_next_follow_up?: string
          p_notes?: string
          p_phone?: string
          p_source?: string
        }
        Returns: string
      }
      create_product_with_opening_stock: {
        Args: {
          p_category: string
          p_cost_price: number
          p_description: string
          p_min_stock: number
          p_name: string
          p_sale_price: number
          p_sku: string
          p_stock_quantity: number
        }
        Returns: string
      }
      create_purchase: {
        Args: { p_items: Json; p_notes: string; p_supplier_id: string }
        Returns: string
      }
      create_sale: {
        Args: {
          p_channel: string
          p_customer_id: string
          p_discount: number
          p_fees: number
          p_items: Json
          p_notes: string
          p_shipping_cost: number
        }
        Returns: string
      }
      move_consorcio_lead: {
        Args: { p_details?: string; p_lead_id: string; p_stage: string }
        Returns: string
      }
      record_consorcio_activity: {
        Args: {
          p_activity_type: string
          p_details?: string
          p_lead_id: string
          p_next_action?: string
          p_next_follow_up?: string
          p_occurred_at?: string
          p_outcome?: string
          p_title: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
