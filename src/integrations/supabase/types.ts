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
      acoin_transactions: {
        Row: {
          amount: number
          created_at: string | null
          fee_charged: number | null
          id: string
          metadata: Json | null
          nexa_spent: number | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          fee_charged?: number | null
          id?: string
          metadata?: Json | null
          nexa_spent?: number | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          fee_charged?: number | null
          id?: string
          metadata?: Json | null
          nexa_spent?: number | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acoin_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      active_sessions: {
        Row: {
          browser: string | null
          created_at: string
          device_name: string | null
          expires_at: string
          id: string
          ip_address: string | null
          last_active: string
          session_token: string
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_name?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          last_active?: string
          session_token: string
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_name?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_active?: string
          session_token?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_requests: {
        Row: {
          business_profile_id: string
          commission_rate: number | null
          id: string
          notes: string | null
          payment_terms: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          business_profile_id: string
          commission_rate?: number | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          business_profile_id?: string
          commission_rate?: number | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_requests_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      blocked_users: {
        Row: {
          blocked_at: string | null
          blocked_id: string
          blocker_id: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_at?: string | null
          blocked_id: string
          blocker_id: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_at?: string | null
          blocked_id?: string
          blocker_id?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
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
      chat_preferences: {
        Row: {
          auto_download: boolean | null
          bubble_style: string | null
          chat_lock: boolean | null
          chat_theme: string | null
          created_at: string | null
          font_size: number | null
          id: string
          media_quality: string | null
          read_receipts: boolean | null
          sounds_enabled: boolean | null
          updated_at: string | null
          user_id: string
          wallpaper: string | null
        }
        Insert: {
          auto_download?: boolean | null
          bubble_style?: string | null
          chat_lock?: boolean | null
          chat_theme?: string | null
          created_at?: string | null
          font_size?: number | null
          id?: string
          media_quality?: string | null
          read_receipts?: boolean | null
          sounds_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          wallpaper?: string | null
        }
        Update: {
          auto_download?: boolean | null
          bubble_style?: string | null
          chat_lock?: boolean | null
          chat_theme?: string | null
          created_at?: string | null
          font_size?: number | null
          id?: string
          media_quality?: string | null
          read_receipts?: boolean | null
          sounds_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          wallpaper?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
      currency_settings: {
        Row: {
          conversion_fee_percent: number | null
          id: string
          nexa_to_acoin_rate: number | null
          p2p_fee_percent: number | null
          updated_at: string | null
        }
        Insert: {
          conversion_fee_percent?: number | null
          id?: string
          nexa_to_acoin_rate?: number | null
          p2p_fee_percent?: number | null
          updated_at?: string | null
        }
        Update: {
          conversion_fee_percent?: number | null
          id?: string
          nexa_to_acoin_rate?: number | null
          p2p_fee_percent?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
      game_challenges: {
        Row: {
          challenger_id: string
          challenger_score: number | null
          completed_at: string | null
          created_at: string
          difficulty: string
          game_type: string
          id: string
          opponent_id: string
          opponent_score: number | null
          status: string
          winner_id: string | null
        }
        Insert: {
          challenger_id: string
          challenger_score?: number | null
          completed_at?: string | null
          created_at?: string
          difficulty: string
          game_type: string
          id?: string
          opponent_id: string
          opponent_score?: number | null
          status?: string
          winner_id?: string | null
        }
        Update: {
          challenger_id?: string
          challenger_score?: number | null
          completed_at?: string | null
          created_at?: string
          difficulty?: string
          game_type?: string
          id?: string
          opponent_id?: string
          opponent_score?: number | null
          status?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_challenges_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_challenges_opponent_id_fkey"
            columns: ["opponent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_challenges_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_scores: {
        Row: {
          created_at: string
          difficulty: string
          game_type: string
          id: string
          metadata: Json | null
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty: string
          game_type: string
          id?: string
          metadata?: Json | null
          score: number
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          game_type?: string
          id?: string
          metadata?: Json | null
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          challenge_id: string | null
          completed: boolean
          created_at: string
          id: string
          metadata: Json | null
          player_id: string
          score: number
          updated_at: string
        }
        Insert: {
          challenge_id?: string | null
          completed?: boolean
          created_at?: string
          id?: string
          metadata?: Json | null
          player_id: string
          score?: number
          updated_at?: string
        }
        Update: {
          challenge_id?: string | null
          completed?: boolean
          created_at?: string
          id?: string
          metadata?: Json | null
          player_id?: string
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "game_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_player_id_fkey"
            columns: ["player_id"]
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
      login_history: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          location: string | null
          login_time: string
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          login_time?: string
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          login_time?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string
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
          attachment_name: string | null
          attachment_size: number | null
          attachment_type: string | null
          attachment_url: string | null
          audio_url: string | null
          chat_id: string | null
          delivered_at: string | null
          edited_at: string | null
          encrypted_content: string
          id: string
          read_at: string | null
          reply_to_message_id: string | null
          sender_id: string | null
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          audio_url?: string | null
          chat_id?: string | null
          delivered_at?: string | null
          edited_at?: string | null
          encrypted_content: string
          id?: string
          read_at?: string | null
          reply_to_message_id?: string | null
          sender_id?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          audio_url?: string | null
          chat_id?: string | null
          delivered_at?: string | null
          edited_at?: string | null
          encrypted_content?: string
          id?: string
          read_at?: string | null
          reply_to_message_id?: string | null
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
            foreignKeyName: "messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
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
      mini_programs: {
        Row: {
          category: string
          created_at: string
          description: string | null
          developer_id: string
          icon_url: string | null
          id: string
          image_url: string | null
          install_count: number
          is_published: boolean
          name: string
          rating: number | null
          updated_at: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          developer_id: string
          icon_url?: string | null
          id?: string
          image_url?: string | null
          install_count?: number
          is_published?: boolean
          name: string
          rating?: number | null
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          developer_id?: string
          icon_url?: string | null
          id?: string
          image_url?: string | null
          install_count?: number
          is_published?: boolean
          name?: string
          rating?: number | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "mini_programs_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_digest_frequency: string | null
          email_enabled: boolean | null
          email_follows: boolean | null
          email_gifts: boolean | null
          email_likes: boolean | null
          email_mentions: boolean | null
          email_messages: boolean | null
          email_replies: boolean | null
          id: string
          push_enabled: boolean | null
          push_follows: boolean | null
          push_gifts: boolean | null
          push_likes: boolean | null
          push_mentions: boolean | null
          push_messages: boolean | null
          push_replies: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_digest_frequency?: string | null
          email_enabled?: boolean | null
          email_follows?: boolean | null
          email_gifts?: boolean | null
          email_likes?: boolean | null
          email_mentions?: boolean | null
          email_messages?: boolean | null
          email_replies?: boolean | null
          id?: string
          push_enabled?: boolean | null
          push_follows?: boolean | null
          push_gifts?: boolean | null
          push_likes?: boolean | null
          push_mentions?: boolean | null
          push_messages?: boolean | null
          push_replies?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_digest_frequency?: string | null
          email_enabled?: boolean | null
          email_follows?: boolean | null
          email_gifts?: boolean | null
          email_likes?: boolean | null
          email_mentions?: boolean | null
          email_messages?: boolean | null
          email_replies?: boolean | null
          id?: string
          push_enabled?: boolean | null
          push_follows?: boolean | null
          push_gifts?: boolean | null
          push_likes?: boolean | null
          push_mentions?: boolean | null
          push_messages?: boolean | null
          push_replies?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          is_pinned: boolean | null
          parent_reply_id: string | null
          pinned_at: string | null
          pinned_by: string | null
          post_id: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          parent_reply_id?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          post_id?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          parent_reply_id?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
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
      post_views: {
        Row: {
          id: string
          post_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          post_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          post_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          view_count: number
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          language_code?: string | null
          updated_at?: string | null
          view_count?: number
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          language_code?: string | null
          updated_at?: string | null
          view_count?: number
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
          acoin: number | null
          affiliate_earnings: number | null
          affiliated_business_id: string | null
          ai_chat_id: string | null
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string | null
          current_grade: string | null
          display_name: string
          handle: string
          id: string
          is_admin: boolean | null
          is_affiliate: boolean | null
          is_business_mode: boolean
          is_organization_verified: boolean | null
          is_private: boolean | null
          is_verified: boolean | null
          language: string | null
          last_login_date: string | null
          last_seen: string | null
          login_streak: number | null
          phone_number: string | null
          profile_completion_rewarded: boolean | null
          show_online_status: boolean | null
          show_read_receipts: boolean | null
          updated_at: string | null
          website_url: string | null
          xp: number
        }
        Insert: {
          acoin?: number | null
          affiliate_earnings?: number | null
          affiliated_business_id?: string | null
          ai_chat_id?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_grade?: string | null
          display_name: string
          handle: string
          id: string
          is_admin?: boolean | null
          is_affiliate?: boolean | null
          is_business_mode?: boolean
          is_organization_verified?: boolean | null
          is_private?: boolean | null
          is_verified?: boolean | null
          language?: string | null
          last_login_date?: string | null
          last_seen?: string | null
          login_streak?: number | null
          phone_number?: string | null
          profile_completion_rewarded?: boolean | null
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          updated_at?: string | null
          website_url?: string | null
          xp?: number
        }
        Update: {
          acoin?: number | null
          affiliate_earnings?: number | null
          affiliated_business_id?: string | null
          ai_chat_id?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_grade?: string | null
          display_name?: string
          handle?: string
          id?: string
          is_admin?: boolean | null
          is_affiliate?: boolean | null
          is_business_mode?: boolean
          is_organization_verified?: boolean | null
          is_private?: boolean | null
          is_verified?: boolean | null
          language?: string | null
          last_login_date?: string | null
          last_seen?: string | null
          login_streak?: number | null
          phone_number?: string | null
          profile_completion_rewarded?: boolean | null
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          updated_at?: string | null
          website_url?: string | null
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_affiliated_business_id_fkey"
            columns: ["affiliated_business_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      red_envelope_claims: {
        Row: {
          amount: number
          claimed_at: string
          claimer_id: string
          id: string
          red_envelope_id: string
        }
        Insert: {
          amount: number
          claimed_at?: string
          claimer_id: string
          id?: string
          red_envelope_id: string
        }
        Update: {
          amount?: number
          claimed_at?: string
          claimer_id?: string
          id?: string
          red_envelope_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "red_envelope_claims_claimer_id_fkey"
            columns: ["claimer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "red_envelope_claims_red_envelope_id_fkey"
            columns: ["red_envelope_id"]
            isOneToOne: false
            referencedRelation: "red_envelopes"
            referencedColumns: ["id"]
          },
        ]
      }
      red_envelopes: {
        Row: {
          chat_id: string | null
          claimed_count: number
          created_at: string
          envelope_type: string
          expires_at: string
          id: string
          is_expired: boolean
          message: string | null
          recipient_count: number
          sender_id: string
          total_amount: number
        }
        Insert: {
          chat_id?: string | null
          claimed_count?: number
          created_at?: string
          envelope_type?: string
          expires_at: string
          id?: string
          is_expired?: boolean
          message?: string | null
          recipient_count: number
          sender_id: string
          total_amount: number
        }
        Update: {
          chat_id?: string | null
          claimed_count?: number
          created_at?: string
          envelope_type?: string
          expires_at?: string
          id?: string
          is_expired?: boolean
          message?: string | null
          recipient_count?: number
          sender_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "red_envelopes_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "red_envelopes_sender_id_fkey"
            columns: ["sender_id"]
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
      security_alerts: {
        Row: {
          alert_message: string
          alert_type: string
          created_at: string
          id: string
          is_read: boolean
          user_id: string
        }
        Insert: {
          alert_message: string
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean
          user_id: string
        }
        Update: {
          alert_message?: string
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          user_id?: string
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
          image_url: string | null
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
          image_url?: string | null
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
          image_url?: string | null
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
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          user_id: string
          view_count: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at: string
          id?: string
          media_type: string
          media_url: string
          user_id: string
          view_count?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_mini_programs: {
        Row: {
          id: string
          installed_at: string
          mini_program_id: string
          user_id: string
        }
        Insert: {
          id?: string
          installed_at?: string
          mini_program_id: string
          user_id: string
        }
        Update: {
          id?: string
          installed_at?: string
          mini_program_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mini_programs_mini_program_id_fkey"
            columns: ["mini_program_id"]
            isOneToOne: false
            referencedRelation: "mini_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_mini_programs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
      verification_requests: {
        Row: {
          account_type: string
          business_registration: string | null
          created_at: string | null
          email: string
          engagement_rate: string | null
          follower_count: string | null
          full_name: string
          id: string
          phone: string | null
          primary_platform: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          social_links: Json | null
          status: string
          supporting_documents: string[] | null
          tax_id: string | null
          updated_at: string | null
          user_id: string
          verification_reason: string
          website_url: string | null
        }
        Insert: {
          account_type: string
          business_registration?: string | null
          created_at?: string | null
          email: string
          engagement_rate?: string | null
          follower_count?: string | null
          full_name: string
          id?: string
          phone?: string | null
          primary_platform?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_links?: Json | null
          status?: string
          supporting_documents?: string[] | null
          tax_id?: string | null
          updated_at?: string | null
          user_id: string
          verification_reason: string
          website_url?: string | null
        }
        Update: {
          account_type?: string
          business_registration?: string | null
          created_at?: string | null
          email?: string
          engagement_rate?: string | null
          follower_count?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          primary_platform?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_links?: Json | null
          status?: string
          supporting_documents?: string[] | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string
          verification_reason?: string
          website_url?: string | null
        }
        Relationships: []
      }
      xp_transfers: {
        Row: {
          amount: number
          created_at: string
          id: string
          message: string | null
          receiver_id: string
          sender_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          message?: string | null
          receiver_id: string
          sender_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          message?: string | null
          receiver_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_transfers_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_transfers_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_affiliate_by_business:
        | {
            Args: {
              p_commission_rate?: number
              p_payment_terms?: string
              p_request_id: string
            }
            Returns: Json
          }
        | { Args: { p_request_id: string }; Returns: Json }
      award_xp: {
        Args: {
          p_action_type: string
          p_metadata?: Json
          p_user_id: string
          p_xp_amount: number
        }
        Returns: undefined
      }
      calculate_grade: { Args: { xp_amount: number }; Returns: string }
      check_and_unlock_accessories: {
        Args: { p_user_id: string }
        Returns: Json
      }
      check_daily_login_streak: { Args: { p_user_id: string }; Returns: Json }
      check_profile_completion: { Args: { p_user_id: string }; Returns: Json }
      claim_red_envelope: { Args: { p_envelope_id: string }; Returns: Json }
      cleanup_expired_sessions: { Args: never; Returns: number }
      convert_nexa_to_acoin: { Args: { p_nexa_amount: number }; Returns: Json }
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
      create_red_envelope: {
        Args: {
          p_chat_id?: string
          p_envelope_type?: string
          p_message?: string
          p_recipient_count: number
          p_total_amount: number
        }
        Returns: Json
      }
      finalize_auction: { Args: { p_shop_item_id: string }; Returns: Json }
      get_gift_price: { Args: { p_gift_id: string }; Returns: number }
      get_or_create_chat: { Args: { other_user_id: string }; Returns: string }
      get_protected_profile_fields: {
        Args: { p_user_id: string }
        Returns: {
          affiliated_business_id: string
          is_admin: boolean
          is_affiliate: boolean
          is_business_mode: boolean
          is_organization_verified: boolean
          is_verified: boolean
        }[]
      }
      get_requesting_user: { Args: never; Returns: string }
      get_trending_topics: {
        Args: { hours_ago?: number; num_topics?: number }
        Returns: {
          post_count: number
          topic: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_mini_program_installs: {
        Args: { program_id: string }
        Returns: undefined
      }
      is_chat_admin: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
      is_chat_member: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_blocked: {
        Args: { p_blocked_id: string; p_blocker_id: string }
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
      process_xp_transfer: {
        Args: { p_amount: number; p_message?: string; p_receiver_id: string }
        Returns: Json
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
      record_login_attempt: {
        Args: {
          p_ip_address?: string
          p_location?: string
          p_success?: boolean
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      reject_affiliate_by_business: {
        Args: { p_notes?: string; p_request_id: string }
        Returns: Json
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
      upsert_active_session: {
        Args: {
          p_browser?: string
          p_device_name?: string
          p_expires_at?: string
          p_ip_address?: string
          p_session_token: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      notification_type:
        | "new_follower"
        | "new_like"
        | "new_reply"
        | "new_mention"
        | "gift"
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
        "gift",
      ],
      user_role_enum: ["user", "admin"],
    },
  },
} as const
