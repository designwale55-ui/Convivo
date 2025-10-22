export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          role: 'listener' | 'artist' | 'admin'
          credits_balance: number
          tier: 'X' | 'Y' | 'Z' | null
          free_tester_slots_used: number
          last_free_slot_reset: string | null
          mfa_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          display_name?: string | null
          role?: 'listener' | 'artist' | 'admin'
          credits_balance?: number
          tier?: 'X' | 'Y' | 'Z' | null
          free_tester_slots_used?: number
          last_free_slot_reset?: string | null
          mfa_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          role?: 'listener' | 'artist' | 'admin'
          credits_balance?: number
          tier?: 'X' | 'Y' | 'Z' | null
          free_tester_slots_used?: number
          last_free_slot_reset?: string | null
          mfa_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      songs: {
        Row: {
          id: string
          artist_id: string
          title: string
          genre: string | null
          description: string | null
          price_credits: number
          price_tier: 'X' | 'Y' | 'Z' | null
          cover_art_url: string | null
          cover_thumbnail_url: string | null
          audio_url: string | null
          file_size_bytes: number | null
          duration_seconds: number | null
          upload_status: 'draft' | 'pending' | 'published' | 'rejected'
          moderation_notes: string | null
          total_unlocks: number
          total_credits_earned: number
          haven_heat_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          title: string
          genre?: string | null
          description?: string | null
          price_credits: number
          price_tier?: 'X' | 'Y' | 'Z' | null
          cover_art_url?: string | null
          cover_thumbnail_url?: string | null
          audio_url?: string | null
          file_size_bytes?: number | null
          duration_seconds?: number | null
          upload_status?: 'draft' | 'pending' | 'published' | 'rejected'
          moderation_notes?: string | null
          total_unlocks?: number
          total_credits_earned?: number
          haven_heat_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          title?: string
          genre?: string | null
          description?: string | null
          price_credits?: number
          price_tier?: 'X' | 'Y' | 'Z' | null
          cover_art_url?: string | null
          cover_thumbnail_url?: string | null
          audio_url?: string | null
          file_size_bytes?: number | null
          duration_seconds?: number | null
          upload_status?: 'draft' | 'pending' | 'published' | 'rejected'
          moderation_notes?: string | null
          total_unlocks?: number
          total_credits_earned?: number
          haven_heat_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          transaction_type: 'top-up' | 'unlock' | 'refund' | 'withdrawal' | 'free-tester' | 'signup-bonus'
          amount_credits: number
          amount_inr: number
          artist_share_inr: number
          platform_cut_inr: number
          song_id: string | null
          transaction_reference: string | null
          admin_verified: boolean
          verified_by_admin_id: string | null
          verified_at: string | null
          ip_address: string | null
          device_fingerprint: string | null
          fraud_flag: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: 'top-up' | 'unlock' | 'refund' | 'withdrawal' | 'free-tester' | 'signup-bonus'
          amount_credits: number
          amount_inr?: number
          artist_share_inr?: number
          platform_cut_inr?: number
          song_id?: string | null
          transaction_reference?: string | null
          admin_verified?: boolean
          verified_by_admin_id?: string | null
          verified_at?: string | null
          ip_address?: string | null
          device_fingerprint?: string | null
          fraud_flag?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_type?: 'top-up' | 'unlock' | 'refund' | 'withdrawal' | 'free-tester' | 'signup-bonus'
          amount_credits?: number
          amount_inr?: number
          artist_share_inr?: number
          platform_cut_inr?: number
          song_id?: string | null
          transaction_reference?: string | null
          admin_verified?: boolean
          verified_by_admin_id?: string | null
          verified_at?: string | null
          ip_address?: string | null
          device_fingerprint?: string | null
          fraud_flag?: boolean
          created_at?: string
        }
      }
      unlocked_songs: {
        Row: {
          user_id: string
          song_id: string
          unlocked_at: string
          can_be_refunded: boolean
          refund_expires_at: string | null
          refunded: boolean
        }
        Insert: {
          user_id: string
          song_id: string
          unlocked_at?: string
          can_be_refunded?: boolean
          refund_expires_at?: string | null
          refunded?: boolean
        }
        Update: {
          user_id?: string
          song_id?: string
          unlocked_at?: string
          can_be_refunded?: boolean
          refund_expires_at?: string | null
          refunded?: boolean
        }
      }
      artist_withdrawals: {
        Row: {
          id: string
          artist_id: string
          amount_inr_requested: number
          amount_inr_available: number
          withdrawal_method: 'UPI' | 'bank' | null
          upi_id: string | null
          bank_details: Json | null
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          requested_at: string
          processed_by_admin_id: string | null
          processed_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          artist_id: string
          amount_inr_requested: number
          amount_inr_available: number
          withdrawal_method?: 'UPI' | 'bank' | null
          upi_id?: string | null
          bank_details?: Json | null
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          requested_at?: string
          processed_by_admin_id?: string | null
          processed_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          artist_id?: string
          amount_inr_requested?: number
          amount_inr_available?: number
          withdrawal_method?: 'UPI' | 'bank' | null
          upi_id?: string | null
          bank_details?: Json | null
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          requested_at?: string
          processed_by_admin_id?: string | null
          processed_at?: string | null
          notes?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action_type: string
          details: Json | null
          ip_address: string | null
          timestamp: string
          admin_user_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action_type: string
          details?: Json | null
          ip_address?: string | null
          timestamp?: string
          admin_user_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action_type?: string
          details?: Json | null
          ip_address?: string | null
          timestamp?: string
          admin_user_id?: string | null
        }
      }
      play_history: {
        Row: {
          id: string
          user_id: string
          song_id: string
          played_at: string
          duration_listened_seconds: number
          skipped: boolean
          completed: boolean
        }
        Insert: {
          id?: string
          user_id: string
          song_id: string
          played_at?: string
          duration_listened_seconds?: number
          skipped?: boolean
          completed?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          song_id?: string
          played_at?: string
          duration_listened_seconds?: number
          skipped?: boolean
          completed?: boolean
        }
      }
      fan_relationships: {
        Row: {
          user_id: string
          artist_id: string
          total_credits_spent: number
          total_unlocks: number
          fan_since: string
          hh_contribution_score: number
        }
        Insert: {
          user_id: string
          artist_id: string
          total_credits_spent?: number
          total_unlocks?: number
          fan_since?: string
          hh_contribution_score?: number
        }
        Update: {
          user_id?: string
          artist_id?: string
          total_credits_spent?: number
          total_unlocks?: number
          fan_since?: string
          hh_contribution_score?: number
        }
      }
    }
  }
}
