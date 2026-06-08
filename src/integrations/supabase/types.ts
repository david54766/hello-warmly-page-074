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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_grants: {
        Row: {
          access_source: Database["public"]["Enums"]["access_source"]
          active: boolean
          created_at: string
          ends_at: string | null
          id: string
          source_id: string | null
          starts_at: string | null
          target_id: string | null
          target_type: Database["public"]["Enums"]["plan_item_target_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          access_source?: Database["public"]["Enums"]["access_source"]
          active?: boolean
          created_at?: string
          ends_at?: string | null
          id?: string
          source_id?: string | null
          starts_at?: string | null
          target_id?: string | null
          target_type: Database["public"]["Enums"]["plan_item_target_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          access_source?: Database["public"]["Enums"]["access_source"]
          active?: boolean
          created_at?: string
          ends_at?: string | null
          id?: string
          source_id?: string | null
          starts_at?: string | null
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["plan_item_target_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_announcements: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          display_type: Database["public"]["Enums"]["announcement_display_type"]
          id: string
          pinned: boolean
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["announcement_status"]
          target_id: string | null
          target_role: string | null
          target_type: Database["public"]["Enums"]["announcement_target_type"]
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          display_type?: Database["public"]["Enums"]["announcement_display_type"]
          id?: string
          pinned?: boolean
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["announcement_status"]
          target_id?: string | null
          target_role?: string | null
          target_type?: Database["public"]["Enums"]["announcement_target_type"]
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          display_type?: Database["public"]["Enums"]["announcement_display_type"]
          id?: string
          pinned?: boolean
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["announcement_status"]
          target_id?: string | null
          target_role?: string | null
          target_type?: Database["public"]["Enums"]["announcement_target_type"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata_json: Json | null
          target_id: string | null
          target_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata_json?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata_json?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      announcement_views: {
        Row: {
          announcement_id: string
          dismissed: boolean
          id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          announcement_id: string
          dismissed?: boolean
          id?: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          announcement_id?: string
          dismissed?: boolean
          id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_views_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "admin_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          automation_id: string
          created_at: string
          details_json: Json
          error_message: string | null
          id: string
          source_id: string | null
          source_type: string | null
          status: Database["public"]["Enums"]["automation_log_status"]
          trigger_type: string
          user_id: string | null
        }
        Insert: {
          automation_id: string
          created_at?: string
          details_json?: Json
          error_message?: string | null
          id?: string
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["automation_log_status"]
          trigger_type: string
          user_id?: string | null
        }
        Update: {
          automation_id?: string
          created_at?: string
          details_json?: Json
          error_message?: string | null
          id?: string
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["automation_log_status"]
          trigger_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs_dedupe: {
        Row: {
          automation_id: string
          created_at: string
          id: string
          source_id: string | null
          source_type: string | null
          user_id: string | null
        }
        Insert: {
          automation_id: string
          created_at?: string
          id?: string
          source_id?: string | null
          source_type?: string | null
          user_id?: string | null
        }
        Update: {
          automation_id?: string
          created_at?: string
          id?: string
          source_id?: string | null
          source_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_dedupe_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          actions_json: Json
          active: boolean
          conditions_json: Json
          created_at: string
          created_by: string | null
          description: string | null
          error_count: number
          id: string
          last_run_at: string | null
          name: string
          total_runs: number
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actions_json?: Json
          active?: boolean
          conditions_json?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          error_count?: number
          id?: string
          last_run_at?: string | null
          name: string
          total_runs?: number
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actions_json?: Json
          active?: boolean
          conditions_json?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          error_count?: number
          id?: string
          last_run_at?: string | null
          name?: string
          total_runs?: number
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          active: boolean
          badge_type: Database["public"]["Enums"]["badge_type"]
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          name: string
          points_value: number
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          badge_type?: Database["public"]["Enums"]["badge_type"]
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          points_value?: number
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          badge_type?: Database["public"]["Enums"]["badge_type"]
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          points_value?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_settings: {
        Row: {
          billing_support_email: string | null
          created_at: string
          currency: string
          id: string
          stripe_publishable_key: string | null
          stripe_secret_key_placeholder: string | null
          stripe_webhook_secret_placeholder: string | null
          tax_behavior: string
          updated_at: string
        }
        Insert: {
          billing_support_email?: string | null
          created_at?: string
          currency?: string
          id?: string
          stripe_publishable_key?: string | null
          stripe_secret_key_placeholder?: string | null
          stripe_webhook_secret_placeholder?: string | null
          tax_behavior?: string
          updated_at?: string
        }
        Update: {
          billing_support_email?: string | null
          created_at?: string
          currency?: string
          id?: string
          stripe_publishable_key?: string | null
          stripe_secret_key_placeholder?: string | null
          stripe_webhook_secret_placeholder?: string | null
          tax_behavior?: string
          updated_at?: string
        }
        Relationships: []
      }
      bundle_items: {
        Row: {
          access_level: Database["public"]["Enums"]["plan_access_level"]
          bundle_id: string
          created_at: string
          id: string
          target_id: string | null
          target_type: Database["public"]["Enums"]["plan_item_target_type"]
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["plan_access_level"]
          bundle_id: string
          created_at?: string
          id?: string
          target_id?: string | null
          target_type: Database["public"]["Enums"]["plan_item_target_type"]
        }
        Update: {
          access_level?: Database["public"]["Enums"]["plan_access_level"]
          bundle_id?: string
          created_at?: string
          id?: string
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["plan_item_target_type"]
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          description: string | null
          featured: boolean
          id: string
          name: string
          price: number
          sort_order: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          featured?: boolean
          id?: string
          name: string
          price?: number
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          featured?: boolean
          id?: string
          name?: string
          price?: number
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      checkout_sessions: {
        Row: {
          checkout_url: string | null
          created_at: string
          id: string
          plan_id: string | null
          status: Database["public"]["Enums"]["checkout_session_status"]
          stripe_session_id: string | null
          target_id: string | null
          target_type:
            | Database["public"]["Enums"]["plan_item_target_type"]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          checkout_url?: string | null
          created_at?: string
          id?: string
          plan_id?: string | null
          status?: Database["public"]["Enums"]["checkout_session_status"]
          stripe_session_id?: string | null
          target_id?: string | null
          target_type?:
            | Database["public"]["Enums"]["plan_item_target_type"]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          checkout_url?: string | null
          created_at?: string
          id?: string
          plan_id?: string | null
          status?: Database["public"]["Enums"]["checkout_session_status"]
          stripe_session_id?: string | null
          target_id?: string | null
          target_type?:
            | Database["public"]["Enums"]["plan_item_target_type"]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          status: Database["public"]["Enums"]["comment_status"]
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          status?: Database["public"]["Enums"]["comment_status"]
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          status?: Database["public"]["Enums"]["comment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          archived: boolean
          conversation_id: string
          created_at: string
          id: string
          joined_at: string
          last_read_at: string | null
          muted: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          conversation_id: string
          created_at?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          muted?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          conversation_id?: string
          created_at?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          muted?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          space_id: string | null
          title: string | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          space_id?: string | null
          title?: string | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          space_id?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: true
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          amount_discounted: number
          checkout_session_id: string | null
          coupon_id: string
          id: string
          purchase_id: string | null
          redeemed_at: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount_discounted?: number
          checkout_session_id?: string | null
          coupon_id: string
          id?: string
          purchase_id?: string | null
          redeemed_at?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount_discounted?: number
          checkout_session_id?: string | null
          coupon_id?: string
          id?: string
          purchase_id?: string | null
          redeemed_at?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          applies_to_id: string | null
          applies_to_type: Database["public"]["Enums"]["coupon_applies_to_type"]
          code: string
          created_at: string
          description: string | null
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          starts_at: string | null
          times_used: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          applies_to_id?: string | null
          applies_to_type?: Database["public"]["Enums"]["coupon_applies_to_type"]
          code: string
          created_at?: string
          description?: string | null
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          starts_at?: string | null
          times_used?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          applies_to_id?: string | null
          applies_to_type?: Database["public"]["Enums"]["coupon_applies_to_type"]
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          starts_at?: string | null
          times_used?: number
          updated_at?: string
        }
        Relationships: []
      }
      course_sections: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          access_level: Database["public"]["Enums"]["course_access"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean
          overview_content: string | null
          sort_order: number
          space_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["course_visibility"]
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["course_access"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          overview_content?: string | null
          sort_order?: number
          space_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["course_visibility"]
        }
        Update: {
          access_level?: Database["public"]["Enums"]["course_access"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          overview_content?: string | null
          sort_order?: number
          space_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["course_visibility"]
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["rsvp_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          access_level: Database["public"]["Enums"]["event_access"]
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          location: string | null
          rsvp_limit: number | null
          space_id: string
          start_time: string
          status: Database["public"]["Enums"]["event_status"]
          timezone: string
          title: string
          updated_at: string
          virtual_link: string | null
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["event_access"]
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: string | null
          rsvp_limit?: number | null
          space_id: string
          start_time: string
          status?: Database["public"]["Enums"]["event_status"]
          timezone?: string
          title: string
          updated_at?: string
          virtual_link?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          access_level?: Database["public"]["Enums"]["event_access"]
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: string | null
          rsvp_limit?: number | null
          space_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"]
          timezone?: string
          title?: string
          updated_at?: string
          virtual_link?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "events_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      hashtags: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          created_at: string
          currency: string
          hosted_invoice_url: string | null
          id: string
          invoice_pdf_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id: string | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          currency?: string
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          currency?: string
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_snapshots: {
        Row: {
          created_at: string
          data_json: Json
          id: string
          period: Database["public"]["Enums"]["leaderboard_period"]
        }
        Insert: {
          created_at?: string
          data_json: Json
          id?: string
          period: Database["public"]["Enums"]["leaderboard_period"]
        }
        Update: {
          created_at?: string
          data_json?: Json
          id?: string
          period?: Database["public"]["Enums"]["leaderboard_period"]
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          last_viewed_at: string
          lesson_id: string
          status: Database["public"]["Enums"]["lesson_progress_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_viewed_at?: string
          lesson_id: string
          status?: Database["public"]["Enums"]["lesson_progress_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_viewed_at?: string
          lesson_id?: string
          status?: Database["public"]["Enums"]["lesson_progress_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          attachments: string[]
          completion_required: boolean
          content: string
          course_id: string
          created_at: string
          id: string
          preview_enabled: boolean
          section_id: string | null
          sort_order: number
          title: string
          updated_at: string
          video_url: string | null
          visibility: Database["public"]["Enums"]["lesson_visibility"]
        }
        Insert: {
          attachments?: string[]
          completion_required?: boolean
          content?: string
          course_id: string
          created_at?: string
          id?: string
          preview_enabled?: boolean
          section_id?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          video_url?: string | null
          visibility?: Database["public"]["Enums"]["lesson_visibility"]
        }
        Update: {
          attachments?: string[]
          completion_required?: boolean
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          preview_enabled?: boolean
          section_id?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          video_url?: string | null
          visibility?: Database["public"]["Enums"]["lesson_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      member_tags: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          source: string | null
          tag: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          source?: string | null
          tag: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          source?: string | null
          tag?: string
          user_id?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reaction_type: Database["public"]["Enums"]["message_reaction_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reaction_type: Database["public"]["Enums"]["message_reaction_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reaction_type?: Database["public"]["Enums"]["message_reaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          id: string
          media_urls: string[]
          sender_id: string
          status: Database["public"]["Enums"]["message_status"]
          updated_at: string
        }
        Insert: {
          body?: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          media_urls?: string[]
          sender_id: string
          status?: Database["public"]["Enums"]["message_status"]
          updated_at?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          media_urls?: string[]
          sender_id?: string
          status?: Database["public"]["Enums"]["message_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          admin_announcements_enabled: boolean
          comments_enabled: boolean
          created_at: string
          email_notifications_enabled: boolean
          event_rsvps_enabled: boolean
          id: string
          lesson_progress_enabled: boolean
          messages_enabled: boolean
          push_notifications_enabled: boolean
          reactions_enabled: boolean
          replies_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_announcements_enabled?: boolean
          comments_enabled?: boolean
          created_at?: string
          email_notifications_enabled?: boolean
          event_rsvps_enabled?: boolean
          id?: string
          lesson_progress_enabled?: boolean
          messages_enabled?: boolean
          push_notifications_enabled?: boolean
          reactions_enabled?: boolean
          replies_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_announcements_enabled?: boolean
          comments_enabled?: boolean
          created_at?: string
          email_notifications_enabled?: boolean
          event_rsvps_enabled?: boolean
          id?: string
          lesson_progress_enabled?: boolean
          messages_enabled?: boolean
          push_notifications_enabled?: boolean
          reactions_enabled?: boolean
          replies_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          target_id: string | null
          target_type: Database["public"]["Enums"]["notification_target"] | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          target_id?: string | null
          target_type?:
            | Database["public"]["Enums"]["notification_target"]
            | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          target_id?: string | null
          target_type?:
            | Database["public"]["Enums"]["notification_target"]
            | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      payment_webhook_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload_json: Json
          processed: boolean
          processed_at: string | null
          processing_error: string | null
          stripe_event_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload_json?: Json
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          stripe_event_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload_json?: Json
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          stripe_event_id?: string | null
        }
        Relationships: []
      }
      plan_items: {
        Row: {
          access_level: Database["public"]["Enums"]["plan_access_level"]
          created_at: string
          id: string
          plan_id: string
          target_id: string | null
          target_type: Database["public"]["Enums"]["plan_item_target_type"]
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["plan_access_level"]
          created_at?: string
          id?: string
          plan_id: string
          target_id?: string | null
          target_type: Database["public"]["Enums"]["plan_item_target_type"]
        }
        Update: {
          access_level?: Database["public"]["Enums"]["plan_access_level"]
          created_at?: string
          id?: string
          plan_id?: string
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["plan_item_target_type"]
        }
        Relationships: [
          {
            foreignKeyName: "plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          access_rules_json: Json
          active: boolean
          billing_interval: Database["public"]["Enums"]["plan_billing_interval"]
          created_at: string
          currency: string
          description: string | null
          featured: boolean
          id: string
          name: string
          price: number
          sort_order: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          trial_days: number
          updated_at: string
        }
        Insert: {
          access_rules_json?: Json
          active?: boolean
          billing_interval?: Database["public"]["Enums"]["plan_billing_interval"]
          created_at?: string
          currency?: string
          description?: string | null
          featured?: boolean
          id?: string
          name: string
          price?: number
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          trial_days?: number
          updated_at?: string
        }
        Update: {
          access_rules_json?: Json
          active?: boolean
          billing_interval?: Database["public"]["Enums"]["plan_billing_interval"]
          created_at?: string
          currency?: string
          description?: string | null
          featured?: boolean
          id?: string
          name?: string
          price?: number
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          platform_name: string
          primary_color: string | null
          privacy_level: string
          secondary_color: string | null
          support_email: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          platform_name?: string
          primary_color?: string | null
          privacy_level?: string
          secondary_color?: string | null
          support_email?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          platform_name?: string
          primary_color?: string | null
          privacy_level?: string
          secondary_color?: string | null
          support_email?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          created_at: string
          id: string
          points: number
          reason: string | null
          source_id: string | null
          source_type: Database["public"]["Enums"]["points_source_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          reason?: string | null
          source_id?: string | null
          source_type: Database["public"]["Enums"]["points_source_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reason?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["points_source_type"]
          user_id?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          created_at: string
          id: string
          option_text: string
          poll_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          option_text: string
          poll_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          option_text?: string
          poll_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          allow_multiple: boolean
          closes_at: string | null
          created_at: string
          id: string
          post_id: string
          question: string
          updated_at: string
        }
        Insert: {
          allow_multiple?: boolean
          closes_at?: string | null
          created_at?: string
          id?: string
          post_id: string
          question: string
          updated_at?: string
        }
        Update: {
          allow_multiple?: boolean
          closes_at?: string | null
          created_at?: string
          id?: string
          post_id?: string
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_hashtags: {
        Row: {
          created_at: string
          hashtag_id: string
          id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          hashtag_id: string
          id?: string
          post_id: string
        }
        Update: {
          created_at?: string
          hashtag_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          attachment_urls: string[]
          author_id: string | null
          body: string
          created_at: string
          id: string
          is_featured: boolean
          is_pinned: boolean
          media_urls: string[]
          post_type: Database["public"]["Enums"]["post_type"]
          space_id: string
          status: Database["public"]["Enums"]["post_status"]
          title: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["post_visibility"]
        }
        Insert: {
          attachment_urls?: string[]
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_featured?: boolean
          is_pinned?: boolean
          media_urls?: string[]
          post_type?: Database["public"]["Enums"]["post_type"]
          space_id: string
          status?: Database["public"]["Enums"]["post_status"]
          title?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Update: {
          attachment_urls?: string[]
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_featured?: boolean
          is_pinned?: boolean
          media_urls?: string[]
          post_type?: Database["public"]["Enums"]["post_type"]
          space_id?: string
          status?: Database["public"]["Enums"]["post_status"]
          title?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "posts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_image_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          headline: string | null
          id: string
          last_active_at: string | null
          location: string | null
          onboarding_completed: boolean
          social_links_json: Json
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          headline?: string | null
          id: string
          last_active_at?: string | null
          location?: string | null
          onboarding_completed?: boolean
          social_links_json?: Json
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          last_active_at?: string | null
          location?: string | null
          onboarding_completed?: boolean
          social_links_json?: Json
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          bundle_id: string | null
          created_at: string
          currency: string
          id: string
          plan_id: string | null
          purchase_type: Database["public"]["Enums"]["purchase_kind"]
          status: Database["public"]["Enums"]["purchase_status"]
          stripe_payment_intent_id: string | null
          target_id: string | null
          target_type:
            | Database["public"]["Enums"]["plan_item_target_type"]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          bundle_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          plan_id?: string | null
          purchase_type?: Database["public"]["Enums"]["purchase_kind"]
          status?: Database["public"]["Enums"]["purchase_status"]
          stripe_payment_intent_id?: string | null
          target_id?: string | null
          target_type?:
            | Database["public"]["Enums"]["plan_item_target_type"]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bundle_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          plan_id?: string | null
          purchase_type?: Database["public"]["Enums"]["purchase_kind"]
          status?: Database["public"]["Enums"]["purchase_status"]
          stripe_payment_intent_id?: string | null
          target_id?: string | null
          target_type?:
            | Database["public"]["Enums"]["plan_item_target_type"]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      question_details: {
        Row: {
          best_answer_comment_id: string | null
          created_at: string
          id: string
          is_answered: boolean
          post_id: string
          updated_at: string
        }
        Insert: {
          best_answer_comment_id?: string | null
          created_at?: string
          id?: string
          is_answered?: boolean
          post_id: string
          updated_at?: string
        }
        Update: {
          best_answer_comment_id?: string | null
          created_at?: string
          id?: string
          is_answered?: boolean
          post_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: Database["public"]["Enums"]["reaction_type"]
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          moderator_notes: string | null
          reason: string
          reporter_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Insert: {
          created_at?: string
          id?: string
          moderator_notes?: string | null
          reason: string
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Update: {
          created_at?: string
          id?: string
          moderator_notes?: string | null
          reason?: string
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: Database["public"]["Enums"]["saved_target_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: Database["public"]["Enums"]["saved_target_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["saved_target_type"]
          user_id?: string
        }
        Relationships: []
      }
      segment_members: {
        Row: {
          id: string
          matched_at: string
          segment_id: string
          user_id: string
        }
        Insert: {
          id?: string
          matched_at?: string
          segment_id: string
          user_id: string
        }
        Update: {
          id?: string
          matched_at?: string
          segment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "segment_members_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      segments: {
        Row: {
          active: boolean
          conditions_json: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          last_refreshed_at: string | null
          match_mode: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          conditions_json?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_refreshed_at?: string | null
          match_mode?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          conditions_json?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_refreshed_at?: string | null
          match_mode?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      space_members: {
        Row: {
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["space_member_role"]
          space_id: string
          status: Database["public"]["Enums"]["space_member_status"]
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["space_member_role"]
          space_id: string
          status?: Database["public"]["Enums"]["space_member_status"]
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["space_member_role"]
          space_id?: string
          status?: Database["public"]["Enums"]["space_member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          access_level: Database["public"]["Enums"]["space_access"]
          chat_enabled: boolean
          collection_id: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_archived: boolean
          name: string
          privacy_level: Database["public"]["Enums"]["space_privacy"]
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["space_access"]
          chat_enabled?: boolean
          collection_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean
          name: string
          privacy_level?: Database["public"]["Enums"]["space_privacy"]
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["space_access"]
          chat_enabled?: boolean
          collection_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          privacy_level?: Database["public"]["Enums"]["space_privacy"]
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_records: {
        Row: {
          canceled_at: string | null
          converted_at: string | null
          created_at: string
          ends_at: string
          id: string
          plan_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["trial_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          converted_at?: string | null
          created_at?: string
          ends_at: string
          id?: string
          plan_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["trial_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          converted_at?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          plan_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["trial_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_records_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          award_reason: string | null
          awarded_at: string
          awarded_by: string | null
          badge_id: string
          id: string
          source_id: string | null
          source_type: string | null
          user_id: string
        }
        Insert: {
          award_reason?: string | null
          awarded_at?: string
          awarded_by?: string | null
          badge_id: string
          id?: string
          source_id?: string | null
          source_type?: string | null
          user_id: string
        }
        Update: {
          award_reason?: string | null
          awarded_at?: string
          awarded_by?: string | null
          badge_id?: string
          id?: string
          source_id?: string | null
          source_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          email_notifications_enabled: boolean
          id: string
          push_notifications_enabled: boolean
          theme_preference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          push_notifications_enabled?: boolean
          theme_preference?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          push_notifications_enabled?: boolean
          theme_preference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      welcome_checklist_items: {
        Row: {
          action_type: Database["public"]["Enums"]["checklist_action_type"]
          active: boolean
          created_at: string
          description: string | null
          id: string
          sort_order: number
          target_id: string | null
          target_type:
            | Database["public"]["Enums"]["checklist_target_type"]
            | null
          title: string
          updated_at: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["checklist_action_type"]
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          target_id?: string | null
          target_type?:
            | Database["public"]["Enums"]["checklist_target_type"]
            | null
          title: string
          updated_at?: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["checklist_action_type"]
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          target_id?: string | null
          target_type?:
            | Database["public"]["Enums"]["checklist_target_type"]
            | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      welcome_checklist_progress: {
        Row: {
          checklist_item_id: string
          completed_at: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          checklist_item_id: string
          completed_at?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          checklist_item_id?: string
          completed_at?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "welcome_checklist_progress_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "welcome_checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      billing_settings_public: {
        Row: {
          billing_support_email: string | null
          currency: string | null
          id: string | null
          stripe_publishable_key: string | null
          tax_behavior: string | null
          updated_at: string | null
        }
        Insert: {
          billing_support_email?: string | null
          currency?: string | null
          id?: string | null
          stripe_publishable_key?: string | null
          tax_behavior?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_support_email?: string | null
          currency?: string | null
          id?: string | null
          stripe_publishable_key?: string | null
          tax_behavior?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_badge_by_slug: {
        Args: {
          _awarded_by?: string
          _reason?: string
          _slug: string
          _user_id: string
        }
        Returns: string
      }
      award_points: {
        Args: {
          _dedupe?: boolean
          _points: number
          _reason: string
          _source_id?: string
          _source_type: Database["public"]["Enums"]["points_source_type"]
          _user_id: string
        }
        Returns: string
      }
      can_access_conversation: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_course: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_event: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_lesson: {
        Args: { _lesson_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_space: {
        Args: { _space_id: string; _user_id: string }
        Returns: boolean
      }
      can_post_in_space: {
        Args: { _space_id: string; _user_id: string }
        Returns: boolean
      }
      complete_checklist_action: {
        Args: {
          _action: Database["public"]["Enums"]["checklist_action_type"]
          _user_id: string
        }
        Returns: undefined
      }
      create_notification: {
        Args: {
          _actor_id?: string
          _body: string
          _target_id?: string
          _target_type?: Database["public"]["Enums"]["notification_target"]
          _title: string
          _type: Database["public"]["Enums"]["notification_type"]
          _user_id: string
        }
        Returns: undefined
      }
      eval_automation_condition: {
        Args: { _condition: Json; _user_id: string }
        Returns: boolean
      }
      exec_automation_action: {
        Args: { _action: Json; _automation_id: string; _user_id: string }
        Returns: Json
      }
      has_access: {
        Args: {
          _target_id: string
          _target_type: Database["public"]["Enums"]["plan_item_target_type"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_grant_active: {
        Args: { g: Database["public"]["Tables"]["access_grants"]["Row"] }
        Returns: boolean
      }
      is_space_host: {
        Args: { _space_id: string; _user_id: string }
        Returns: boolean
      }
      is_space_member: {
        Args: { _space_id: string; _user_id: string }
        Returns: boolean
      }
      notif_pref: {
        Args: { _flag: string; _user_id: string }
        Returns: boolean
      }
      refresh_segment: { Args: { _segment_id: string }; Returns: number }
      run_automations: {
        Args: {
          _payload?: Json
          _source_id?: string
          _source_type?: string
          _trigger: string
          _user_id: string
        }
        Returns: undefined
      }
      send_announcement: { Args: { _announcement_id: string }; Returns: number }
      test_automation: {
        Args: { _automation_id: string; _user_id: string }
        Returns: Json
      }
      user_matches_announcement: {
        Args: {
          _ann: Database["public"]["Tables"]["admin_announcements"]["Row"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_coupon: {
        Args: {
          _amount?: number
          _applies_to_id?: string
          _applies_to_type?: Database["public"]["Enums"]["coupon_applies_to_type"]
          _code: string
        }
        Returns: Json
      }
    }
    Enums: {
      access_source:
        | "free"
        | "plan"
        | "purchase"
        | "bundle"
        | "manual"
        | "admin_override"
      announcement_display_type:
        | "banner"
        | "feed_post"
        | "notification_only"
        | "modal_placeholder"
      announcement_status: "draft" | "scheduled" | "sent" | "archived"
      announcement_target_type:
        | "all_members"
        | "space"
        | "segment"
        | "plan"
        | "role"
      app_role:
        | "platform_admin"
        | "moderator"
        | "space_host"
        | "member"
        | "limited_member"
      automation_log_status: "pending" | "success" | "failed" | "skipped"
      badge_type:
        | "manual"
        | "milestone"
        | "course"
        | "event"
        | "community"
        | "special"
      checklist_action_type:
        | "complete_profile"
        | "join_space"
        | "create_first_post"
        | "comment_on_post"
        | "follow_member"
        | "rsvp_event"
        | "start_course"
        | "complete_lesson"
        | "update_notifications"
      checklist_target_type:
        | "profile"
        | "space"
        | "post"
        | "event"
        | "course"
        | "lesson"
        | "settings"
        | "member"
      checkout_session_status:
        | "created"
        | "pending"
        | "completed"
        | "expired"
        | "failed"
      comment_status: "active" | "hidden" | "deleted"
      conversation_type: "direct" | "group" | "space"
      coupon_applies_to_type:
        | "all"
        | "plan"
        | "bundle"
        | "course"
        | "event"
        | "space"
      coupon_discount_type: "percent" | "fixed_amount"
      course_access: "free" | "preview" | "paid_placeholder" | "paid"
      course_visibility: "public" | "members_only" | "space_members" | "hidden"
      event_access: "free" | "preview" | "paid_placeholder" | "paid"
      event_status: "draft" | "published" | "canceled" | "completed"
      event_type:
        | "in_person"
        | "virtual"
        | "workshop"
        | "community_call"
        | "course_session"
        | "livestream_placeholder"
      event_visibility: "public" | "members_only" | "space_members" | "hidden"
      invoice_status: "draft" | "open" | "paid" | "uncollectible" | "void"
      leaderboard_period: "all_time" | "month" | "week"
      lesson_progress_status: "not_started" | "in_progress" | "completed"
      lesson_visibility: "visible" | "preview" | "locked" | "hidden"
      message_reaction_type: "like" | "love" | "celebrate" | "helpful"
      message_status: "active" | "deleted" | "hidden"
      notification_target:
        | "post"
        | "comment"
        | "event"
        | "lesson"
        | "course"
        | "space"
        | "user"
        | "announcement_placeholder"
        | "conversation"
        | "message"
      notification_type:
        | "comment_on_post"
        | "reply_to_comment"
        | "reaction_to_post"
        | "reaction_to_comment"
        | "event_rsvp_confirmation"
        | "lesson_completed"
        | "admin_announcement"
        | "space_joined"
        | "report_status_updated"
        | "new_message"
        | "badge_awarded"
        | "points_awarded"
        | "milestone_reached"
        | "question_answered"
        | "best_answer_selected"
        | "poll_vote_received"
        | "checkout_completed"
        | "payment_failed"
        | "subscription_active"
        | "subscription_canceled"
        | "invoice_paid"
        | "trial_started"
        | "trial_ending_soon"
        | "trial_expired"
        | "coupon_applied"
        | "access_expiring"
        | "access_expired"
      plan_access_level: "full_access" | "preview_access" | "limited_access"
      plan_billing_interval: "free" | "monthly" | "annual" | "one_time"
      plan_item_target_type:
        | "platform"
        | "space"
        | "course"
        | "event"
        | "resource_placeholder"
      points_source_type:
        | "profile_complete"
        | "space_joined"
        | "post_created"
        | "comment_created"
        | "reaction_received"
        | "event_rsvp"
        | "course_started"
        | "lesson_completed"
        | "checklist_completed"
        | "follow_member"
        | "manual"
        | "badge_awarded"
        | "question_created"
        | "question_answered"
        | "best_answer"
        | "poll_created"
        | "poll_voted"
      post_status: "active" | "hidden" | "deleted"
      post_type:
        | "quick_post"
        | "article"
        | "question"
        | "event_announcement"
        | "poll"
      post_visibility: "public" | "space_members" | "admins_only" | "hidden"
      purchase_kind: "subscription" | "one_time"
      purchase_status: "pending" | "paid" | "failed" | "refunded" | "canceled"
      reaction_type: "like" | "love" | "celebrate" | "helpful"
      report_status:
        | "pending"
        | "resolved"
        | "dismissed"
        | "open"
        | "under_review"
      report_target:
        | "post"
        | "comment"
        | "user"
        | "event"
        | "course"
        | "lesson"
        | "message"
      rsvp_status: "going" | "not_going" | "waitlist"
      saved_target_type:
        | "post"
        | "course"
        | "lesson"
        | "event"
        | "space"
        | "resource_placeholder"
      space_access: "free" | "preview" | "paid_placeholder" | "paid"
      space_member_role: "space_host" | "space_moderator" | "member"
      space_member_status: "active" | "pending" | "banned"
      space_privacy: "public" | "members_only" | "private" | "hidden"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "unpaid"
        | "paused"
      trial_status: "active" | "converted" | "expired" | "canceled"
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
      access_source: [
        "free",
        "plan",
        "purchase",
        "bundle",
        "manual",
        "admin_override",
      ],
      announcement_display_type: [
        "banner",
        "feed_post",
        "notification_only",
        "modal_placeholder",
      ],
      announcement_status: ["draft", "scheduled", "sent", "archived"],
      announcement_target_type: [
        "all_members",
        "space",
        "segment",
        "plan",
        "role",
      ],
      app_role: [
        "platform_admin",
        "moderator",
        "space_host",
        "member",
        "limited_member",
      ],
      automation_log_status: ["pending", "success", "failed", "skipped"],
      badge_type: [
        "manual",
        "milestone",
        "course",
        "event",
        "community",
        "special",
      ],
      checklist_action_type: [
        "complete_profile",
        "join_space",
        "create_first_post",
        "comment_on_post",
        "follow_member",
        "rsvp_event",
        "start_course",
        "complete_lesson",
        "update_notifications",
      ],
      checklist_target_type: [
        "profile",
        "space",
        "post",
        "event",
        "course",
        "lesson",
        "settings",
        "member",
      ],
      checkout_session_status: [
        "created",
        "pending",
        "completed",
        "expired",
        "failed",
      ],
      comment_status: ["active", "hidden", "deleted"],
      conversation_type: ["direct", "group", "space"],
      coupon_applies_to_type: [
        "all",
        "plan",
        "bundle",
        "course",
        "event",
        "space",
      ],
      coupon_discount_type: ["percent", "fixed_amount"],
      course_access: ["free", "preview", "paid_placeholder", "paid"],
      course_visibility: ["public", "members_only", "space_members", "hidden"],
      event_access: ["free", "preview", "paid_placeholder", "paid"],
      event_status: ["draft", "published", "canceled", "completed"],
      event_type: [
        "in_person",
        "virtual",
        "workshop",
        "community_call",
        "course_session",
        "livestream_placeholder",
      ],
      event_visibility: ["public", "members_only", "space_members", "hidden"],
      invoice_status: ["draft", "open", "paid", "uncollectible", "void"],
      leaderboard_period: ["all_time", "month", "week"],
      lesson_progress_status: ["not_started", "in_progress", "completed"],
      lesson_visibility: ["visible", "preview", "locked", "hidden"],
      message_reaction_type: ["like", "love", "celebrate", "helpful"],
      message_status: ["active", "deleted", "hidden"],
      notification_target: [
        "post",
        "comment",
        "event",
        "lesson",
        "course",
        "space",
        "user",
        "announcement_placeholder",
        "conversation",
        "message",
      ],
      notification_type: [
        "comment_on_post",
        "reply_to_comment",
        "reaction_to_post",
        "reaction_to_comment",
        "event_rsvp_confirmation",
        "lesson_completed",
        "admin_announcement",
        "space_joined",
        "report_status_updated",
        "new_message",
        "badge_awarded",
        "points_awarded",
        "milestone_reached",
        "question_answered",
        "best_answer_selected",
        "poll_vote_received",
        "checkout_completed",
        "payment_failed",
        "subscription_active",
        "subscription_canceled",
        "invoice_paid",
        "trial_started",
        "trial_ending_soon",
        "trial_expired",
        "coupon_applied",
        "access_expiring",
        "access_expired",
      ],
      plan_access_level: ["full_access", "preview_access", "limited_access"],
      plan_billing_interval: ["free", "monthly", "annual", "one_time"],
      plan_item_target_type: [
        "platform",
        "space",
        "course",
        "event",
        "resource_placeholder",
      ],
      points_source_type: [
        "profile_complete",
        "space_joined",
        "post_created",
        "comment_created",
        "reaction_received",
        "event_rsvp",
        "course_started",
        "lesson_completed",
        "checklist_completed",
        "follow_member",
        "manual",
        "badge_awarded",
        "question_created",
        "question_answered",
        "best_answer",
        "poll_created",
        "poll_voted",
      ],
      post_status: ["active", "hidden", "deleted"],
      post_type: [
        "quick_post",
        "article",
        "question",
        "event_announcement",
        "poll",
      ],
      post_visibility: ["public", "space_members", "admins_only", "hidden"],
      purchase_kind: ["subscription", "one_time"],
      purchase_status: ["pending", "paid", "failed", "refunded", "canceled"],
      reaction_type: ["like", "love", "celebrate", "helpful"],
      report_status: [
        "pending",
        "resolved",
        "dismissed",
        "open",
        "under_review",
      ],
      report_target: [
        "post",
        "comment",
        "user",
        "event",
        "course",
        "lesson",
        "message",
      ],
      rsvp_status: ["going", "not_going", "waitlist"],
      saved_target_type: [
        "post",
        "course",
        "lesson",
        "event",
        "space",
        "resource_placeholder",
      ],
      space_access: ["free", "preview", "paid_placeholder", "paid"],
      space_member_role: ["space_host", "space_moderator", "member"],
      space_member_status: ["active", "pending", "banned"],
      space_privacy: ["public", "members_only", "private", "hidden"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "unpaid",
        "paused",
      ],
      trial_status: ["active", "converted", "expired", "canceled"],
    },
  },
} as const
