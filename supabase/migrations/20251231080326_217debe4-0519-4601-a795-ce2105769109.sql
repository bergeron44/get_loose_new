-- Add question_order column to store the ordered question IDs for synchronized gameplay
ALTER TABLE public.game_rooms ADD COLUMN IF NOT EXISTS question_order text[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.game_rooms.question_order IS 'Array of question IDs in order for this game session, ensuring all players see the same questions';