-- Create game rooms table for multiplayer sessions
CREATE TABLE public.game_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code VARCHAR(4) NOT NULL UNIQUE,
  game_type VARCHAR(50) NOT NULL,
  intensity VARCHAR(50) NOT NULL DEFAULT 'chilled',
  host_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  current_question_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '2 hours')
);

-- Create players table for both single-phone and multi-device modes
CREATE TABLE public.game_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  nickname VARCHAR(50) NOT NULL,
  avatar VARCHAR(50) NOT NULL DEFAULT 'beer',
  score INTEGER NOT NULL DEFAULT 0,
  drinks_taken INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  is_host BOOLEAN NOT NULL DEFAULT false,
  device_id VARCHAR(100),
  last_answer_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create player answers for trivia tracking
CREATE TABLE public.player_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.game_players(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  answer_index INTEGER,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  answer_time_ms INTEGER,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public access for game functionality
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_answers ENABLE ROW LEVEL SECURITY;

-- Public access policies (games don't require auth)
CREATE POLICY "Anyone can create game rooms" ON public.game_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view game rooms" ON public.game_rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can update game rooms" ON public.game_rooms FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete expired rooms" ON public.game_rooms FOR DELETE USING (expires_at < now());

CREATE POLICY "Anyone can add players" ON public.game_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view players" ON public.game_players FOR SELECT USING (true);
CREATE POLICY "Anyone can update players" ON public.game_players FOR UPDATE USING (true);
CREATE POLICY "Anyone can remove players" ON public.game_players FOR DELETE USING (true);

CREATE POLICY "Anyone can record answers" ON public.player_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view answers" ON public.player_answers FOR SELECT USING (true);

-- Enable realtime for game tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_answers;

-- Function to generate unique 4-digit room code
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS VARCHAR(4)
LANGUAGE plpgsql
AS $$
DECLARE
  new_code VARCHAR(4);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 4-digit code
    new_code := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.game_rooms WHERE room_code = new_code AND expires_at > now()) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;