import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Users, Copy, Check, QrCode } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { getShuffledMostLikelyQuestions } from '@/data/mostLikelyData';
import BarOffersWidget from '@/components/BarOffersWidget';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
}

const AVATARS = ['🍺', '🍷', '🍹', '🥃', '🍸', '🍻', '🥂', '🧉'];

const MostLikelyHost: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen } = useGame();
  const { toast } = useToast();
  const isRTL = language === 'he';

  const primaryColor = 'hsl(174 84% 50%)';
  const secondaryColor = 'hsl(187 100% 42%)';

  const [step, setStep] = useState<'nickname' | 'lobby'>('nickname');
  const [hostNickname, setHostNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🍺');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deviceId] = useState(() => crypto.randomUUID());

  // Fetch players function - defined first so it can be used in useEffect
  const fetchPlayers = useCallback(async () => {
    if (!roomId) return;

    const { data } = await (supabase
      .from('most_likely_players' as any)
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true }) as any);

    if (data) {
      setPlayers((data as any[]).map((p: any) => ({
        id: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        isHost: p.is_host,
      })));
    }
  }, [roomId]);

  // Subscribe to player changes and fetch initial players
  useEffect(() => {
    if (!roomId) return;

    // Fetch players initially
    fetchPlayers();

    const channel = supabase
      .channel(`ml-room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'most_likely_players',
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
  }, [roomId, fetchPlayers]);

  const createRoom = async () => {
    if (!hostNickname.trim()) return;
    
    setIsCreating(true);
    try {
      // Generate room code locally (4 digits)
      const generateCode = () => {
        return Math.floor(1000 + Math.random() * 9000).toString();
      };
      const code = generateCode();

      // Generate shuffled question order
      const shuffledQuestions = getShuffledMostLikelyQuestions(10);
      const questionOrder = shuffledQuestions.map(q => q.id);

      // Create room using type assertion for new tables
      const { data: room, error: roomError } = await (supabase
        .from('most_likely_rooms' as any)
        .insert({
          room_code: code,
          host_id: deviceId,
          status: 'waiting',
          total_questions: 10,
          question_order: questionOrder,
        })
        .select()
        .single() as any);

      if (roomError) throw roomError;

      setRoomCode(code);
      setRoomId(room.id);

      // Add host as first player
      await (supabase
        .from('most_likely_players' as any)
        .insert({
          room_id: room.id,
          nickname: hostNickname.trim(),
          avatar: selectedAvatar,
          device_id: deviceId,
          is_host: true,
          is_ready: true,
        }) as any);

      // Fetch players after creating
      setRoomCode(code);
      setRoomId(room.id);
      setStep('lobby');
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
      await (supabase
        .from('most_likely_rooms' as any)
        .update({
          status: 'playing',
          current_question_index: 0,
        })
        .eq('id', roomId) as any);

      // Store game info
      localStorage.setItem('mlRoomId', roomId);
      localStorage.setItem('mlDeviceId', deviceId);
      localStorage.setItem('mlIsHost', 'true');

      setCurrentScreen('mostLikelyMultiplayer');
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleBack = async () => {
    if (roomId) {
      await (supabase.from('most_likely_players' as any).delete().eq('room_id', roomId) as any);
      await (supabase.from('most_likely_rooms' as any).delete().eq('id', roomId) as any);
    }
    setCurrentScreen('mostLikelyEntry');
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
            onClick={() => setCurrentScreen('mostLikelyEntry')}
            className="p-3 rounded-xl glass-card hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 text-foreground ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground">
              ☝️ {isRTL ? 'הכי סביר ש...' : 'Most Likely To'}
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

  // Lobby Step
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
            ☝️ {isRTL ? 'הכי סביר ש...' : 'Most Likely To'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRTL ? 'ממתין לשחקנים...' : 'Waiting for players...'}
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
            className="text-6xl font-black tracking-[0.3em] mb-2 font-mono"
            style={{ color: primaryColor }}
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
          <Play className={`w-6 h-6 ${isRTL ? 'ml-2' : 'mr-2'}`} />
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

export default MostLikelyHost;
