-- Create table for tracking offer redemptions
CREATE TABLE public.offer_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id VARCHAR NOT NULL,
  redemption_code VARCHAR(8) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  is_redeemed BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.offer_redemptions ENABLE ROW LEVEL SECURITY;

-- Anyone can create redemption codes
CREATE POLICY "Anyone can create redemption codes"
ON public.offer_redemptions
FOR INSERT
WITH CHECK (true);

-- Anyone can view their own codes (by code)
CREATE POLICY "Anyone can view redemption codes"
ON public.offer_redemptions
FOR SELECT
USING (true);

-- Anyone can update redemption status
CREATE POLICY "Anyone can update redemptions"
ON public.offer_redemptions
FOR UPDATE
USING (true);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.offer_redemptions;