/*
  # Add Credit Management Functions
  
  ## New Functions
  
  ### spend_credit
  Atomic credit deduction with balance validation
  - Checks current credits >= amount
  - Deducts amount in single transaction
  - Returns success/failure boolean
  
  ### init_user_credits
  Idempotent free credit initialization on signup
  - Sets credits = 100 only if NULL
  - Prevents duplicate awards
  - Uses FOR UPDATE lock to avoid race conditions
  
  ## Security
  - Functions use SECURITY DEFINER for atomic operations
  - Row-level locking prevents race conditions
  - All operations wrapped in transactions
*/

-- Atomic credit spending function
CREATE OR REPLACE FUNCTION public.spend_credit(p_user_id uuid, p_amount integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  cur_credits integer;
BEGIN
  -- Lock row and get current credits
  SELECT credits_balance INTO cur_credits 
  FROM public.users 
  WHERE id = p_user_id 
  FOR UPDATE;
  
  -- User not found
  IF cur_credits IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Insufficient credits
  IF cur_credits < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE public.users 
  SET credits_balance = credits_balance - p_amount 
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Idempotent credit initialization on signup
CREATE OR REPLACE FUNCTION public.init_user_credits(p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  cur_credits integer;
BEGIN
  -- Lock row and get current credits
  SELECT credits_balance INTO cur_credits 
  FROM public.users 
  WHERE id = p_user_id 
  FOR UPDATE;
  
  -- User not found
  IF cur_credits IS NULL THEN
    -- Set initial 100 credits
    UPDATE public.users 
    SET credits_balance = 100 
    WHERE id = p_user_id;
    RETURN TRUE;
  END IF;
  
  -- Credits already initialized
  RETURN FALSE;
END;
$$;