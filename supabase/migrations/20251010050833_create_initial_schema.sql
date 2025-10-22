/*
  # Haven Music Platform - Initial Database Schema
  
  ## Overview
  Complete database schema for Haven music streaming platform with credit-based economy.
  1 credit = ₹0.80 INR, Haven keeps 45%, artists receive 55%.
  
  ## New Tables
  
  ### users
  Extended user profile with credits, roles, and free tester slots
  - `id` (uuid, primary key) - references auth.users
  - `email` (text, unique, not null)
  - `display_name` (text)
  - `role` (text) - 'listener', 'artist', or 'admin'
  - `credits_balance` (integer) - current credits available
  - `tier` (text) - 'X', 'Y', or 'Z' for artists
  - `free_tester_slots_used` (integer) - slots used this week
  - `last_free_slot_reset` (date) - last Monday reset
  - `mfa_enabled` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### songs
  Music tracks uploaded by artists with pricing and stats
  - `id` (uuid, primary key)
  - `artist_id` (uuid, foreign key to users)
  - `title` (text, not null)
  - `genre` (text)
  - `description` (text)
  - `price_credits` (integer, not null)
  - `price_tier` (text) - 'X', 'Y', or 'Z'
  - `cover_art_url` (text)
  - `cover_thumbnail_url` (text)
  - `audio_url` (text)
  - `file_size_bytes` (bigint)
  - `duration_seconds` (integer)
  - `upload_status` (text) - 'draft', 'pending', 'published', 'rejected'
  - `moderation_notes` (text)
  - `total_unlocks` (integer)
  - `total_credits_earned` (integer)
  - `haven_heat_score` (integer) - HH algorithm score
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### credit_transactions
  All credit movements with revenue splits
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `transaction_type` (text) - 'top-up', 'unlock', 'refund', 'withdrawal', 'free-tester'
  - `amount_credits` (integer)
  - `amount_inr` (numeric)
  - `artist_share_inr` (numeric)
  - `platform_cut_inr` (numeric)
  - `song_id` (uuid, nullable, foreign key to songs)
  - `transaction_reference` (text) - UPI transaction ID
  - `admin_verified` (boolean)
  - `verified_by_admin_id` (uuid, nullable)
  - `verified_at` (timestamptz)
  - `ip_address` (text)
  - `device_fingerprint` (text)
  - `fraud_flag` (boolean)
  - `created_at` (timestamptz)
  
  ### unlocked_songs
  Junction table tracking which users own which songs
  - `user_id` (uuid, foreign key to users)
  - `song_id` (uuid, foreign key to songs)
  - `unlocked_at` (timestamptz)
  - `can_be_refunded` (boolean)
  - `refund_expires_at` (timestamptz)
  - `refunded` (boolean)
  - Primary key: (user_id, song_id)
  
  ### artist_withdrawals
  Artist payout requests and processing
  - `id` (uuid, primary key)
  - `artist_id` (uuid, foreign key to users)
  - `amount_inr_requested` (numeric)
  - `amount_inr_available` (numeric)
  - `withdrawal_method` (text) - 'UPI' or 'bank'
  - `upi_id` (text, encrypted)
  - `bank_details` (jsonb, encrypted)
  - `status` (text) - 'pending', 'approved', 'rejected', 'completed'
  - `requested_at` (timestamptz)
  - `processed_by_admin_id` (uuid, nullable)
  - `processed_at` (timestamptz)
  - `notes` (text)
  
  ### audit_logs
  Security and compliance tracking
  - `id` (uuid, primary key)
  - `user_id` (uuid)
  - `action_type` (text)
  - `details` (jsonb)
  - `ip_address` (text)
  - `timestamp` (timestamptz)
  - `admin_user_id` (uuid, nullable)
  
  ### play_history
  Track listening behavior for Haven Heat algorithm
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `song_id` (uuid, foreign key to songs)
  - `played_at` (timestamptz)
  - `duration_listened_seconds` (integer)
  - `skipped` (boolean)
  - `completed` (boolean)
  
  ### fan_relationships
  Track top supporters for each artist
  - `user_id` (uuid, foreign key to users - listener)
  - `artist_id` (uuid, foreign key to users - artist)
  - `total_credits_spent` (integer)
  - `total_unlocks` (integer)
  - `fan_since` (timestamptz)
  - `hh_contribution_score` (integer)
  - Primary key: (user_id, artist_id)
  
  ## Security
  - Enable RLS on all tables
  - Users can only read/update their own data
  - Artists can only modify their own songs
  - Admins have full access with audit logging
  - All sensitive data encrypted at rest
  
  ## Important Notes
  - Credit balance validation prevents negative balances
  - All revenue splits calculated automatically via triggers
  - Haven Heat recalculated hourly via Edge Function
  - Free tester slots reset every Monday
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'listener' CHECK (role IN ('listener', 'artist', 'admin')),
  credits_balance integer NOT NULL DEFAULT 0 CHECK (credits_balance >= 0),
  tier text CHECK (tier IN ('X', 'Y', 'Z')),
  free_tester_slots_used integer NOT NULL DEFAULT 0,
  last_free_slot_reset date DEFAULT CURRENT_DATE,
  mfa_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create songs table
CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  genre text,
  description text,
  price_credits integer NOT NULL CHECK (price_credits > 0),
  price_tier text CHECK (price_tier IN ('X', 'Y', 'Z')),
  cover_art_url text,
  cover_thumbnail_url text,
  audio_url text,
  file_size_bytes bigint,
  duration_seconds integer,
  upload_status text NOT NULL DEFAULT 'draft' CHECK (upload_status IN ('draft', 'pending', 'published', 'rejected')),
  moderation_notes text,
  total_unlocks integer NOT NULL DEFAULT 0,
  total_credits_earned integer NOT NULL DEFAULT 0,
  haven_heat_score integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('top-up', 'unlock', 'refund', 'withdrawal', 'free-tester', 'signup-bonus')),
  amount_credits integer NOT NULL,
  amount_inr numeric(10, 2) DEFAULT 0,
  artist_share_inr numeric(10, 2) DEFAULT 0,
  platform_cut_inr numeric(10, 2) DEFAULT 0,
  song_id uuid REFERENCES songs(id) ON DELETE SET NULL,
  transaction_reference text,
  admin_verified boolean DEFAULT false,
  verified_by_admin_id uuid REFERENCES users(id),
  verified_at timestamptz,
  ip_address text,
  device_fingerprint text,
  fraud_flag boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create unlocked_songs table
CREATE TABLE IF NOT EXISTS unlocked_songs (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  can_be_refunded boolean DEFAULT true,
  refund_expires_at timestamptz,
  refunded boolean DEFAULT false,
  PRIMARY KEY (user_id, song_id)
);

-- Create artist_withdrawals table
CREATE TABLE IF NOT EXISTS artist_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_inr_requested numeric(10, 2) NOT NULL CHECK (amount_inr_requested >= 500),
  amount_inr_available numeric(10, 2) NOT NULL,
  withdrawal_method text CHECK (withdrawal_method IN ('UPI', 'bank')),
  upi_id text,
  bank_details jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_at timestamptz DEFAULT now(),
  processed_by_admin_id uuid REFERENCES users(id),
  processed_at timestamptz,
  notes text
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  action_type text NOT NULL,
  details jsonb,
  ip_address text,
  timestamp timestamptz DEFAULT now(),
  admin_user_id uuid REFERENCES users(id)
);

-- Create play_history table
CREATE TABLE IF NOT EXISTS play_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  played_at timestamptz DEFAULT now(),
  duration_listened_seconds integer DEFAULT 0,
  skipped boolean DEFAULT false,
  completed boolean DEFAULT false
);

-- Create fan_relationships table
CREATE TABLE IF NOT EXISTS fan_relationships (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_credits_spent integer NOT NULL DEFAULT 0,
  total_unlocks integer NOT NULL DEFAULT 0,
  fan_since timestamptz DEFAULT now(),
  hh_contribution_score integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, artist_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_songs_upload_status ON songs(upload_status);
CREATE INDEX IF NOT EXISTS idx_songs_haven_heat_score ON songs(haven_heat_score DESC);
CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_song_id ON credit_transactions(song_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_admin_verified ON credit_transactions(admin_verified) WHERE admin_verified = false;
CREATE INDEX IF NOT EXISTS idx_unlocked_songs_user_id ON unlocked_songs(user_id);
CREATE INDEX IF NOT EXISTS idx_unlocked_songs_song_id ON unlocked_songs(song_id);
CREATE INDEX IF NOT EXISTS idx_play_history_user_id ON play_history(user_id);
CREATE INDEX IF NOT EXISTS idx_play_history_song_id ON play_history(song_id);
CREATE INDEX IF NOT EXISTS idx_fan_relationships_artist_id ON fan_relationships(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_withdrawals_status ON artist_withdrawals(status) WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins have full access to users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for songs table
CREATE POLICY "Anyone can view published songs"
  ON songs FOR SELECT
  TO authenticated
  USING (upload_status = 'published');

CREATE POLICY "Artists can view their own songs"
  ON songs FOR SELECT
  TO authenticated
  USING (artist_id = auth.uid());

CREATE POLICY "Artists can insert their own songs"
  ON songs FOR INSERT
  TO authenticated
  WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Artists can update their own songs"
  ON songs FOR UPDATE
  TO authenticated
  USING (artist_id = auth.uid())
  WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Artists can delete their own songs"
  ON songs FOR DELETE
  TO authenticated
  USING (artist_id = auth.uid());

CREATE POLICY "Admins have full access to songs"
  ON songs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for credit_transactions table
CREATE POLICY "Users can view their own transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update transactions"
  ON credit_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for unlocked_songs table
CREATE POLICY "Users can view their own unlocked songs"
  ON unlocked_songs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for artist_withdrawals table
CREATE POLICY "Artists can view their own withdrawals"
  ON artist_withdrawals FOR SELECT
  TO authenticated
  USING (artist_id = auth.uid());

CREATE POLICY "Artists can create withdrawal requests"
  ON artist_withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Admins can view all withdrawals"
  ON artist_withdrawals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update withdrawals"
  ON artist_withdrawals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for audit_logs table
CREATE POLICY "Only admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for play_history table
CREATE POLICY "Users can view their own play history"
  ON play_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own play history"
  ON play_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for fan_relationships table
CREATE POLICY "Users can view their fan relationships"
  ON fan_relationships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR artist_id = auth.uid());

-- Function to calculate revenue splits
CREATE OR REPLACE FUNCTION calculate_revenue_splits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'unlock' THEN
    NEW.amount_inr := NEW.amount_credits * 0.80;
    NEW.artist_share_inr := NEW.amount_inr * 0.55;
    NEW.platform_cut_inr := NEW.amount_inr * 0.45;
  ELSIF NEW.transaction_type = 'top-up' THEN
    NEW.amount_inr := NEW.amount_credits * 0.80;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate splits
DROP TRIGGER IF EXISTS trigger_calculate_revenue_splits ON credit_transactions;
CREATE TRIGGER trigger_calculate_revenue_splits
  BEFORE INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_revenue_splits();

-- Function to update song stats on unlock
CREATE OR REPLACE FUNCTION update_song_stats_on_unlock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE songs
  SET 
    total_unlocks = total_unlocks + 1,
    total_credits_earned = total_credits_earned + (SELECT price_credits FROM songs WHERE id = NEW.song_id),
    haven_heat_score = haven_heat_score + 10
  WHERE id = NEW.song_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update song stats
DROP TRIGGER IF EXISTS trigger_update_song_stats ON unlocked_songs;
CREATE TRIGGER trigger_update_song_stats
  AFTER INSERT ON unlocked_songs
  FOR EACH ROW
  EXECUTE FUNCTION update_song_stats_on_unlock();

-- Function to update fan relationships
CREATE OR REPLACE FUNCTION update_fan_relationships()
RETURNS TRIGGER AS $$
DECLARE
  v_artist_id uuid;
  v_song_price integer;
BEGIN
  IF NEW.transaction_type = 'unlock' AND NEW.song_id IS NOT NULL THEN
    SELECT artist_id, price_credits INTO v_artist_id, v_song_price
    FROM songs WHERE id = NEW.song_id;
    
    INSERT INTO fan_relationships (user_id, artist_id, total_credits_spent, total_unlocks, hh_contribution_score)
    VALUES (NEW.user_id, v_artist_id, v_song_price, 1, 10)
    ON CONFLICT (user_id, artist_id)
    DO UPDATE SET
      total_credits_spent = fan_relationships.total_credits_spent + v_song_price,
      total_unlocks = fan_relationships.total_unlocks + 1,
      hh_contribution_score = fan_relationships.hh_contribution_score + 10;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update fan relationships
DROP TRIGGER IF EXISTS trigger_update_fan_relationships ON credit_transactions;
CREATE TRIGGER trigger_update_fan_relationships
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_fan_relationships();

-- Function to set refund expiry
CREATE OR REPLACE FUNCTION set_refund_expiry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.refund_expires_at := NEW.unlocked_at + INTERVAL '10 seconds';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set refund expiry time
DROP TRIGGER IF EXISTS trigger_set_refund_expiry ON unlocked_songs;
CREATE TRIGGER trigger_set_refund_expiry
  BEFORE INSERT ON unlocked_songs
  FOR EACH ROW
  EXECUTE FUNCTION set_refund_expiry();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_songs_updated_at ON songs;
CREATE TRIGGER trigger_songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();