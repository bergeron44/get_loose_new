-- Create Most Likely To game rooms table
CREATE TABLE public.most_likely_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code VARCHAR(4) NOT NULL UNIQUE,
  host_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, playing, finished
  current_question_index INTEGER NOT NULL DEFAULT 0,
  question_order TEXT[] NOT NULL DEFAULT '{}',
  total_questions INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '2 hours')
);

-- Create Most Likely To players table
CREATE TABLE public.most_likely_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.most_likely_rooms(id) ON DELETE CASCADE NOT NULL,
  device_id UUID NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  avatar VARCHAR(10) NOT NULL DEFAULT '🍺',
  is_host BOOLEAN NOT NULL DEFAULT false,
  is_ready BOOLEAN NOT NULL DEFAULT false,
  total_votes_received INTEGER NOT NULL DEFAULT 0,
  total_votes_cast INTEGER NOT NULL DEFAULT 0,
  times_voted_differently INTEGER NOT NULL DEFAULT 0, -- for "lone wolf" calculation
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, device_id)
);

-- Create Most Likely To votes table
CREATE TABLE public.most_likely_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.most_likely_rooms(id) ON DELETE CASCADE NOT NULL,
  question_index INTEGER NOT NULL,
  voter_id UUID REFERENCES public.most_likely_players(id) ON DELETE CASCADE NOT NULL,
  voted_for_id UUID REFERENCES public.most_likely_players(id) ON DELETE CASCADE NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, question_index, voter_id)
);

-- Create indexes for better performance
CREATE INDEX idx_most_likely_rooms_code ON public.most_likely_rooms(room_code);
CREATE INDEX idx_most_likely_rooms_status ON public.most_likely_rooms(status);
CREATE INDEX idx_most_likely_players_room ON public.most_likely_players(room_id);
CREATE INDEX idx_most_likely_votes_room_question ON public.most_likely_votes(room_id, question_index);

-- Enable RLS
ALTER TABLE public.most_likely_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.most_likely_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.most_likely_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for rooms - public access for game functionality
CREATE POLICY "Anyone can view rooms" ON public.most_likely_rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON public.most_likely_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON public.most_likely_rooms FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete expired rooms" ON public.most_likely_rooms FOR DELETE USING (expires_at < now());

-- RLS policies for players
CREATE POLICY "Anyone can view players" ON public.most_likely_players FOR SELECT USING (true);
CREATE POLICY "Anyone can join rooms" ON public.most_likely_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update players" ON public.most_likely_players FOR UPDATE USING (true);
CREATE POLICY "Anyone can leave rooms" ON public.most_likely_players FOR DELETE USING (true);

-- RLS policies for votes
CREATE POLICY "Anyone can view votes" ON public.most_likely_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can cast votes" ON public.most_likely_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update votes" ON public.most_likely_votes FOR UPDATE USING (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.most_likely_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.most_likely_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.most_likely_votes;

-- Function to generate unique room codes
CREATE OR REPLACE FUNCTION public.generate_most_likely_room_code()
RETURNS VARCHAR(4)
LANGUAGE plpgsql
AS $$
DECLARE
  new_code VARCHAR(4);
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.most_likely_rooms WHERE room_code = new_code AND expires_at > now()) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;