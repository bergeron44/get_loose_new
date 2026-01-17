import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Users, Copy, Check, Loader2, QrCode } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getGameTheme } from '@/config/gameThemes';
import { supabase } from '@/integrations/supabase/client';
import type { TriviaPlayer } from '@/types/game';
import BarOffersWidget from '@/components/BarOffersWidget';
import { useToast } from '@/hooks/use-toast';

const AVATARS = ['🍺', '🍷', '🍹', '🥃', '🍸', '🍻', '🥂', '🧉'];

const TriviaPartyHost: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen } = useGame();
  const { toast } = useToast();
  const isRTL = language === 'he';
  
  const theme = getGameTheme('trivia');
  const primaryColor = theme ? `hsl(${theme.primaryColor})` : 'hsl(217 91% 60%)';
  const secondaryColor = theme ? `hsl(${theme.secondaryColor})` : 'hsl(45 93% 47%)';

  const [step, setStep] = useState<'nickname' | 'lobby'>('nickname');
  const [hostNickname, setHostNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🍺');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<TriviaPlayer[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deviceId] = useState(() => `host_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Subscribe to player changes
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-${roomId}`)
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

  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(() => {
      fetchPlayers();
    }, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  const createRoom = async () => {
    if (!hostNickname.trim()) return;
    
    setIsCreating(true);
    try {
      // Generate room code
      const { data: code, error: codeError } = await supabase.rpc('generate_room_code');
      if (codeError) throw codeError;

      // Create room
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          room_code: code,
          game_type: 'trivia',
          intensity: 'chilled',
          status: 'waiting',
          current_phase: 'waiting',
        })
        .select()
        .single();

      if (roomError) throw roomError;

      setRoomCode(code);
      setRoomId(room.id);

      // Add host as first player with custom nickname and avatar
      const { error: playerError } = await supabase
        .from('game_players')
        .insert({
          room_id: room.id,
          nickname: hostNickname.trim(),
          avatar: selectedAvatar,
          device_id: deviceId,
          is_host: true,
          is_ready: true,
        });

      if (playerError) throw playerError;

      setStep('lobby');
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

    const { data, error } = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching players:', error);
      return;
    }

    setPlayers(data.map(p => ({
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      score: p.score,
      drinksTaken: p.drinks_taken,
      streak: p.streak,
      isHost: p.is_host,
      deviceId: p.device_id || undefined,
    })));
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
      // Update room phase
      await supabase
        .from('game_rooms')
        .update({ 
          current_phase: 'question',
          status: 'playing',
        })
        .eq('id', roomId);

      // Store game info
      localStorage.setItem('partyRoomId', roomId);
      localStorage.setItem('partyDeviceId', deviceId);
      localStorage.setItem('partyIsHost', 'true');

      setCurrentScreen('triviaPartyGame');
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: isRTL ? 'שגיאה' : 'Error',
        description: isRTL ? 'לא הצלחנו להתחיל את המשחק' : 'Failed to start game',
        variant: 'destructive',
      });
    }
  };

  const handleBack = async () => {
    if (step === 'lobby' && roomId) {
      await supabase.from('game_players').delete().eq('room_id', roomId);
      await supabase.from('game_rooms').delete().eq('id', roomId);
      setStep('nickname');
      setRoomId(null);
      setRoomCode(null);
    } else {
      setCurrentScreen('triviaPartyEntry');
    }
  };

  const canStart = players.length >= 2;

  // Nickname Entry Step
  if (step === 'nickname') {
    return (
      <div className="min-h-screen px-4 py-6 bg-gradient-hero flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-1/4 right-0 w-72 h-72 rounded-full blur-3xl"
            style={{ background: `${primaryColor}15` }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>

        <motion.div
          className="flex items-center gap-4 mb-8 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => setCurrentScreen('triviaPartyEntry')}
            className="p-3 rounded-xl glass-card hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 text-foreground ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground">
              🧠 {isRTL ? 'טריוויה פארטי' : 'Trivia Party'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isRTL ? 'הזן את שמך' : 'Enter your name'}
            </p>
          </div>
        </motion.div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10">
          <motion.div
            className="w-full max-w-sm glass-card p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center mb-6">
              <p className="text-lg font-bold text-foreground mb-2">
                {isRTL ? 'בחר אימוג׳י' : 'Choose your emoji'}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {AVATARS.map(avatar => (
                  <motion.button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`text-4xl p-2 rounded-xl transition-all ${
                      selectedAvatar === avatar 
                        ? 'bg-primary/30 scale-110' 
                        : 'hover:bg-muted/50'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {avatar}
                  </motion.button>
                ))}
              </div>
            </div>

            <Input
              value={hostNickname}
              onChange={(e) => setHostNickname(e.target.value)}
              placeholder={isRTL ? 'השם שלך...' : 'Your name...'}
              className="text-xl text-center font-bold py-6 mb-4"
              maxLength={20}
              dir={isRTL ? 'rtl' : 'ltr'}
            />

            <Button
              size="xl"
              onClick={createRoom}
              disabled={!hostNickname.trim() || isCreating}
              className="w-full text-xl font-black py-6"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                boxShadow: `0 0 30px ${primaryColor}50`,
              }}
            >
              {isCreating ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ⏳
                </motion.span>
              ) : (
                isRTL ? 'צור חדר' : 'Create Room'
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Lobby Screen
  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-hero flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
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
            🧠 {isRTL ? 'חדר המשחק שלך' : 'Your Game Room'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRTL ? 'שתפו את הקוד עם חברים' : 'Share the code with friends'}
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
            className="text-6xl font-black tracking-[0.3em] mb-2 transition-colors font-mono"
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

          {/* Waiting for players placeholder */}
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
          <Play className={`w-6 h-6 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {isRTL ? 'התחל משחק!' : 'Start Game!'}
        </Button>

        {!canStart && (
          <p className="text-center text-muted-foreground text-sm mt-2">
            {isRTL 
              ? `צריך עוד ${2 - players.length} שחקנים להתחיל`
              : `Need ${2 - players.length} more player${2 - players.length > 1 ? 's' : ''} to start`
            }
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

export default TriviaPartyHost;