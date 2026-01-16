import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Users, Copy, Check, QrCode } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getShuffledNeverHaveIStatements } from '@/data/neverHaveIData';
import BarOffersWidget from '@/components/BarOffersWidget';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
}

const NeverHaveIHost: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen } = useGame();
  const { toast } = useToast();
  const isRTL = language === 'he';

  const primaryColor = 'hsl(142 76% 36%)';
  const secondaryColor = 'hsl(84 81% 44%)';

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isCreating, setIsCreating] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deviceId] = useState(() => `host_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Create room on mount
  useEffect(() => {
    createRoom();
  }, []);

  // Subscribe to player changes
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`nhie-room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const createRoom = async () => {
    try {
      // Generate room code
      const { data: code, error: codeError } = await supabase.rpc('generate_room_code');
      if (codeError) throw codeError;

      // Generate shuffled question order
      const shuffledStatements = getShuffledNeverHaveIStatements();
      const questionOrder = shuffledStatements.map(s => s.id);

      // Create room
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          room_code: code,
          game_type: 'neverHaveI',
          intensity: 'chilled',
          status: 'waiting',
          current_phase: 'waiting',
          total_questions: 15,
          question_order: questionOrder,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      setRoomCode(code);
      setRoomId(room.id);

      // Add host as first player
      await supabase
        .from('game_players')
        .insert({
          room_id: room.id,
          nickname: isRTL ? 'המנחה' : 'Host',
          avatar: '👑',
          device_id: deviceId,
          is_host: true,
          is_ready: true,
        });

      fetchPlayers();
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: isRTL ? 'שגיאה' : 'Error',
        description: isRTL ? 'לא הצלחנו ליצור חדר' : 'Failed to create room',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const fetchPlayers = useCallback(async () => {
    if (!roomId) return;

    const { data } = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (data) {
      setPlayers(data.map(p => ({
        id: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        isHost: p.is_host,
      })));
    }
  }, [roomId]);

  const copyRoomCode = async () => {
    if (!roomCode) return;
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: isRTL ? 'הועתק!' : 'Copied!',
      description: isRTL ? 'קוד החדר הועתק ללוח' : 'Room code copied to clipboard',
    });
  };

  const startGame = async () => {
    if (!roomId || players.length < 2) return;

    try {
      await supabase
        .from('game_rooms')
        .update({
          current_phase: 'voting',
          status: 'playing',
        })
        .eq('id', roomId);

      // Store game info
      localStorage.setItem('nhieRoomId', roomId);
      localStorage.setItem('nhieDeviceId', deviceId);
      localStorage.setItem('nhieIsHost', 'true');

      setCurrentScreen('neverHaveIGame');
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleBack = async () => {
    if (roomId) {
      await supabase.from('game_players').delete().eq('room_id', roomId);
      await supabase.from('game_rooms').delete().eq('id', roomId);
    }
    setCurrentScreen('neverHaveIEntry');
  };

  const canStart = players.length >= 2;

  if (isCreating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            🙊
          </motion.div>
          <p className="text-muted-foreground">
            {isRTL ? 'יוצר חדר...' : 'Creating room...'}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-hero flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 right-0 w-72 h-72 rounded-full blur-3xl"
          style={{ background: `${primaryColor}15` }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      {/* Header */}
      <motion.div
        className="flex items-center gap-4 mb-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={handleBack}
          className="p-3 rounded-xl glass-card hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className={`w-5 h-5 text-foreground ${isRTL ? 'rotate-180' : ''}`} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            🙊 {isRTL ? 'מעולם לא' : 'Never Have I Ever'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRTL ? 'מהדורת לחץ!' : 'Pressure Edition!'}
          </p>
        </div>
      </motion.div>

      {/* Room Code Display */}
      <motion.div
        className="glass-card p-6 mb-6 text-center relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <QrCode className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground text-sm">
            {isRTL ? 'קוד החדר' : 'Room Code'}
          </span>
        </div>

        <motion.button
          onClick={copyRoomCode}
          className="relative group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div
            className="text-6xl font-black tracking-[0.3em] mb-2 transition-colors"
            style={{ color: copied ? 'hsl(142 76% 36%)' : primaryColor }}
          >
            {roomCode}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-500">{isRTL ? 'הועתק!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{isRTL ? 'לחץ להעתקה' : 'Tap to copy'}</span>
              </>
            )}
          </div>
        </motion.button>
      </motion.div>

      {/* Players Section */}
      <div className="flex-1 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="font-bold text-foreground">
              {isRTL ? 'שחקנים' : 'Players'} ({players.length})
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {isRTL ? 'מינימום 2 להתחלה' : 'Min 2 to start'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <AnimatePresence mode="popLayout">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                className="glass-card p-4 relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{player.avatar}</span>
                  <div>
                    <p className="font-bold text-foreground">{player.nickname}</p>
                    {player.isHost && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${primaryColor}30`, color: primaryColor }}
                      >
                        {isRTL ? 'מנחה' : 'Host'}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Waiting placeholder */}
          {players.length < 8 && (
            <motion.div
              className="glass-card p-4 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p className="text-muted-foreground text-sm text-center">
                {isRTL ? 'ממתין לשחקנים...' : 'Waiting for players...'}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Start Button */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          size="xl"
          onClick={startGame}
          disabled={!canStart}
          className="w-full text-xl font-black py-7 relative overflow-hidden"
          style={{
            background: canStart
              ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
              : undefined,
            boxShadow: canStart ? `0 0 30px ${primaryColor}50` : undefined,
          }}
        >
          {canStart && (
            <motion.div
              className="absolute inset-0 bg-white/20"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
          )}
          <Play className="w-6 h-6 mr-2" />
          {isRTL ? 'התחל משחק!' : 'Start Game!'}
        </Button>

        {!canStart && (
          <p className="text-center text-muted-foreground text-sm mt-2">
            {isRTL
              ? `צריך עוד ${2 - players.length} שחקנים להתחיל`
              : `Need ${2 - players.length} more player${2 - players.length > 1 ? 's' : ''} to start`}
          </p>
        )}
      </motion.div>

      {/* Bar Offers Widget */}
      <motion.div
        className="mt-4 flex justify-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <BarOffersWidget />
      </motion.div>
    </div>
  );
};

export default NeverHaveIHost;
