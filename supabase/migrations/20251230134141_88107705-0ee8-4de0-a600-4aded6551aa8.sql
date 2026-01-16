-- Update game_rooms to track party trivia state
ALTER TABLE public.game_rooms ADD COLUMN IF NOT EXISTS current_phase VARCHAR DEFAULT 'waiting';
ALTER TABLE public.game_rooms ADD COLUMN IF NOT EXISTS question_start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.game_rooms ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 10;

-- Add timestamp tracking for answers
ALTER TABLE public.player_answers ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add device_id tracking for players (for multi-device)
ALTER TABLE public.game_players ADD COLUMN IF NOT EXISTS is_ready BOOLEAN DEFAULT false;
ALTER TABLE public.game_players ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT now();