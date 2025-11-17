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
      bids: {
        Row: {
          bid_amount: number
          created_at: string | null
          id: string
          shop_item_id: string
          user_id: string
        }
        Insert: {
          bid_amount: number
          created_at?: string | null
          id?: string
          shop_item_id: string
          user_id: string
        }
        Update: {
          bid_amount?: number
          created_at?: string | null
          id?: string
          shop_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_shop_item_id_fkey"
            columns: ["shop_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_members: {
        Row: {
          chat_id: string | null
          id: string
          is_admin: boolean | null
          joined_at: string | null
          user_id: string | null
        }
        Insert: {
          chat_id?: string | null
          id?: string
          is_admin?: boolean | null
          joined_at?: string | null
          user_id?: string | null
        }
        Update: {
          chat_id?: string | null
          id?: string
          is_admin?: boolean | null
          joined_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_group: boolean | null
          member_limit: number | null
          name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          member_limit?: number | null
          name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          member_limit?: number | null
          name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string | null
          following_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_statistics: {
        Row: {
          gift_id: string
          id: string
          last_updated: string | null
          price_multiplier: number
          total_sent: number
        }
        Insert: {
          gift_id: string
          id?: string
          last_updated?: string | null
          price_multiplier?: number
          total_sent?: number
        }
        Update: {
          gift_id?: string
          id?: string
          last_updated?: string | null
          price_multiplier?: number
          total_sent?: number
        }
        Relationships: [
          {
            foreignKeyName: "gift_statistics_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: true
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_transactions: {
        Row: {
          created_at: string | null
          gift_id: string
          id: string
          message: string | null
          receiver_id: string
          sender_id: string
          xp_cost: number
        }
        Insert: {
          created_at?: string | null
          gift_id: string
          id?: string
          message?: string | null
          receiver_id: string
          sender_id: string
          xp_cost: number
        }
        Update: {
          created_at?: string | null
          gift_id?: string
          id?: string
          message?: string | null
          receiver_id?: string
          sender_id?: string
          xp_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "gift_transactions_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          available_from: string | null
          available_until: string | null
          base_xp_cost: number
          created_at: string | null
          description: string | null
          emoji: string
          id: string
          name: string
          rarity: string
          season: string | null
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          base_xp_cost: number
          created_at?: string | null
          description?: string | null
          emoji: string
          id?: string
          name: string
          rarity?: string
          season?: string | null
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          base_xp_cost?: number
          created_at?: string | null
          description?: string | null
          emoji?: string
          id?: string
          name?: string
          rarity?: string
          season?: string | null
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          asking_price: number
          created_at: string | null
          id: string
          is_active: boolean | null
          purchase_id: string
          shop_item_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asking_price: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          purchase_id: string
          shop_item_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asking_price?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          purchase_id?: string
          shop_item_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "user_shop_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_shop_item_id_fkey"
            columns: ["shop_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          reaction?: string
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
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_status: {
        Row: {
          delivered_at: string | null
          id: string
          message_id: string | null
          read_at: string | null
          user_id: string | null
        }
        Insert: {
          delivered_at?: string | null
          id?: string
          message_id?: string | null
          read_at?: string | null
          user_id?: string | null
        }
        Update: {
          delivered_at?: string | null
          id?: string
          message_id?: string | null
          read_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_status_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          audio_url: string | null
          chat_id: string | null
          delivered_at: string | null
          encrypted_content: string
          id: string
          read_at: string | null
          sender_id: string | null
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          audio_url?: string | null
          chat_id?: string | null
          delivered_at?: string | null
          encrypted_content: string
          id?: string
          read_at?: string | null
          sender_id?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          audio_url?: string | null
          chat_id?: string | null
          delivered_at?: string | null
          encrypted_content?: string
          id?: string
          read_at?: string | null
          sender_id?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string | null
          id: string
          is_read: boolean
          post_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean
          post_id?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean
          post_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_acknowledgments: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_acknowledgments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_acknowledgments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          display_order: number
          id: string
          image_url: string
          post_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          image_url: string
          post_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          image_url?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_link_previews: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          post_id: string
          site_name: string | null
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          post_id: string
          site_name?: string | null
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          post_id?: string
          site_name?: string | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_link_previews_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_replies: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          parent_reply_id: string | null
          post_id: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          parent_reply_id?: string | null
          post_id?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          parent_reply_id?: string | null
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "post_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          language_code: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          language_code?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          language_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_chat_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          current_grade: string | null
          display_name: string
          handle: string
          id: string
          is_admin: boolean | null
          is_organization_verified: boolean | null
          is_private: boolean | null
          is_verified: boolean | null
          language: string | null
          last_login_date: string | null
          last_seen: string | null
          login_streak: number | null
          profile_completion_rewarded: boolean | null
          show_online_status: boolean | null
          show_read_receipts: boolean | null
          updated_at: string | null
          xp: number
        }
        Insert: {
          ai_chat_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_grade?: string | null
          display_name: string
          handle: string
          id: string
          is_admin?: boolean | null
          is_organization_verified?: boolean | null
          is_private?: boolean | null
          is_verified?: boolean | null
          language?: string | null
          last_login_date?: string | null
          last_seen?: string | null
          login_streak?: number | null
          profile_completion_rewarded?: boolean | null
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          updated_at?: string | null
          xp?: number
        }
        Update: {
          ai_chat_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_grade?: string | null
          display_name?: string
          handle?: string
          id?: string
          is_admin?: boolean | null
          is_organization_verified?: boolean | null
          is_private?: boolean | null
          is_verified?: boolean | null
          language?: string | null
          last_login_date?: string | null
          last_seen?: string | null
          login_streak?: number | null
          profile_completion_rewarded?: boolean | null
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          updated_at?: string | null
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_ai_chat_id_fkey"
            columns: ["ai_chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_language_fkey"
            columns: ["language"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          subscription: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          subscription: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          subscription?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          rewarded: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          rewarded?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          rewarded?: boolean | null
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          auction_end_time: string | null
          auction_start_time: string | null
          config: Json
          created_at: string | null
          current_bid: number | null
          description: string | null
          discount_percentage: number | null
          emoji: string | null
          featured_end_date: string | null
          featured_start_date: string | null
          id: string
          is_auction: boolean | null
          is_available: boolean | null
          is_featured: boolean | null
          item_type: string
          min_bid_increment: number | null
          name: string
          starting_bid: number | null
          xp_cost: number
        }
        Insert: {
          auction_end_time?: string | null
          auction_start_time?: string | null
          config?: Json
          created_at?: string | null
          current_bid?: number | null
          description?: string | null
          discount_percentage?: number | null
          emoji?: string | null
          featured_end_date?: string | null
          featured_start_date?: string | null
          id?: string
          is_auction?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean | null
          item_type: string
          min_bid_increment?: number | null
          name: string
          starting_bid?: number | null
          xp_cost: number
        }
        Update: {
          auction_end_time?: string | null
          auction_start_time?: string | null
          config?: Json
          created_at?: string | null
          current_bid?: number | null
          description?: string | null
          discount_percentage?: number | null
          emoji?: string | null
          featured_end_date?: string | null
          featured_start_date?: string | null
          id?: string
          is_auction?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean | null
          item_type?: string
          min_bid_increment?: number | null
          name?: string
          starting_bid?: number | null
          xp_cost?: number
        }
        Relationships: []
      }
      supported_languages: {
        Row: {
          code: string
          created_at: string | null
          name: string
          native_name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          name: string
          native_name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          name?: string
          native_name?: string
        }
        Relationships: []
      }
      tips: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          post_id: string | null
          receiver_id: string
          sender_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          post_id?: string | null
          receiver_id: string
          sender_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          post_id?: string | null
          receiver_id?: string
          sender_id?: string
          xp_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "tips_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_indicators: {
        Row: {
          chat_id: string | null
          id: string
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          chat_id?: string | null
          id?: string
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          chat_id?: string | null
          id?: string
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_indicators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unlocked_accessories: {
        Row: {
          accessory_type: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          accessory_type: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          accessory_type?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_type: string
          earned_at: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achievement_type: string
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achievement_type?: string
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
          xp_earned: number
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      user_avatars: {
        Row: {
          avatar_config: Json
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_config?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_config?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_avatars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role_enum"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role_enum"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role_enum"]
          user_id?: string
        }
        Relationships: []
      }
      user_shop_purchases: {
        Row: {
          id: string
          purchased_at: string | null
          shop_item_id: string
          user_id: string
          xp_paid: number
        }
        Insert: {
          id?: string
          purchased_at?: string | null
          shop_item_id: string
          user_id: string
          xp_paid: number
        }
        Update: {
          id?: string
          purchased_at?: string | null
          shop_item_id?: string
          user_id?: string
          xp_paid?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_shop_purchases_shop_item_id_fkey"
            columns: ["shop_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp: {
        Args: {
          p_action_type: string
          p_metadata?: Json
          p_user_id: string
          p_xp_amount: number
        }
        Returns: undefined
      }
      calculate_grade: { Args: { p_xp: number }; Returns: string }
      check_and_unlock_accessories: {
        Args: { p_user_id: string }
        Returns: Json
      }
      check_daily_login_streak: { Args: { p_user_id: string }; Returns: Json }
      check_profile_completion: { Args: { p_user_id: string }; Returns: Json }
      create_marketplace_listing:
        | {
            Args: { p_asking_price: number; p_purchase_id: string }
            Returns: {
              message: string
              success: boolean
            }[]
          }
        | {
            Args: {
              p_asking_price: number
              p_purchase_id: string
              p_user_id?: string
            }
            Returns: {
              message: string
              success: boolean
            }[]
          }
      create_new_chat: { Args: { other_user_id: string }; Returns: string }
      finalize_auction: { Args: { p_shop_item_id: string }; Returns: Json }
      get_gift_price: { Args: { p_gift_id: string }; Returns: number }
      get_or_create_chat: { Args: { other_user_id: string }; Returns: string }
      get_requesting_user: { Args: never; Returns: string }
      get_trending_topics: {
        Args: { hours_ago?: number; num_topics?: number }
        Returns: {
          post_count: number
          topic: string
        }[]
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["user_role_enum"]
              _user_id: string
            }
            Returns: boolean
          }
      is_chat_admin: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
      is_chat_member: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_in_chat: {
        Args: { p_chat_id: string; p_user_id: string }
        Returns: boolean
      }
      mark_notifications_as_read: { Args: never; Returns: undefined }
      place_bid: {
        Args: { p_bid_amount: number; p_shop_item_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      process_referral_reward:
        | {
            Args: { p_referral_code: string; p_referred_id: string }
            Returns: Json
          }
        | {
            Args: { p_referral_id: string }
            Returns: {
              message: string
              success: boolean
            }[]
          }
      purchase_marketplace_item: {
        Args: { p_listing_id: string }
        Returns: {
          message: string
          new_xp: number
          success: boolean
        }[]
      }
      purchase_shop_item: {
        Args: { p_shop_item_id: string }
        Returns: {
          message: string
          new_xp: number
          success: boolean
        }[]
      }
      rotate_featured_items: { Args: never; Returns: undefined }
      send_gift: {
        Args: { p_gift_id: string; p_message?: string; p_receiver_id: string }
        Returns: Json
      }
      send_gift_combo: {
        Args: {
          p_gift_ids: string[]
          p_message?: string
          p_receiver_id: string
        }
        Returns: Json
      }
      send_message: {
        Args: { p_chat_id: string; p_plain_content: string }
        Returns: undefined
      }
      send_tip: {
        Args: {
          p_message?: string
          p_post_id?: string
          p_receiver_id: string
          p_xp_amount: number
        }
        Returns: Json
      }
      tip_post_author: {
        Args: {
          p_message?: string
          p_post_id: string
          p_sender_id?: string
          p_xp_amount: number
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      notification_type:
        | "new_follower"
        | "new_like"
        | "new_reply"
        | "new_mention"
      user_role_enum: "user" | "admin"
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
      app_role: ["admin", "moderator", "user"],
      notification_type: [
        "new_follower",
        "new_like",
        "new_reply",
        "new_mention",
      ],
      user_role_enum: ["user", "admin"],
    },
  },
} as const
