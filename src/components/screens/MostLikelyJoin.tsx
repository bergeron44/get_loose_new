import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LogIn } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BarOffersWidget from '@/components/BarOffersWidget';

const AVATARS = ['🍺', '🍷', '🍹', '🥃', '🍸', '🍻', '🥂', '🧉'];

const MostLikelyJoin: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen } = useGame();
  const { toast } = useToast();
  const isRTL = language === 'he';

  const primaryColor = 'hsl(174 84% 50%)';
  const secondaryColor = 'hsl(187 100% 42%)';

  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🍺');
  const [isJoining, setIsJoining] = useState(false);
  const [deviceId] = useState(() => `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const handleJoin = async () => {
    if (!roomCode.trim() || !nickname.trim()) return;

    setIsJoining(true);
    try {
      // Find the room
      const { data: room, error: roomError } = await (supabase
        .from('most_likely_rooms' as any)
        .select('*')
        .eq('room_code', roomCode.trim())
        .eq('status', 'waiting')
        .maybeSingle() as any);

      if (roomError) throw roomError;

      if (!room) {
        toast({
          title: isRTL ? 'חדר לא נמצא' : 'Room not found',
          description: isRTL ? 'בדוק את הקוד ונסה שוב' : 'Check the code and try again',
          variant: 'destructive',
        });
        setIsJoining(false);
        return;
      }

      // Check if player already exists in this room
      const { data: existingPlayer } = await (supabase
        .from('most_likely_players' as any)
        .select('*')
        .eq('room_id', room.id)
        .eq('device_id', deviceId)
        .maybeSingle() as any);

      if (existingPlayer) {
        // Player already in room, just rejoin
        localStorage.setItem('mlRoomId', room.id);
        localStorage.setItem('mlDeviceId', deviceId);
        localStorage.setItem('mlIsHost', 'false');
        localStorage.setItem('mlPlayerId', existingPlayer.id);

        if (room.status === 'playing') {
          setCurrentScreen('mostLikelyMultiplayer');
        } else {
          // Wait for game to start - poll or use realtime
          setCurrentScreen('mostLikelyMultiplayer');
        }
        return;
      }

      // Add player to room
      const { data: newPlayer, error: playerError } = await (supabase
        .from('most_likely_players' as any)
        .insert({
          room_id: room.id,
          nickname: nickname.trim(),
          avatar: selectedAvatar,
          device_id: deviceId,
          is_host: false,
          is_ready: true,
        })
        .select()
        .single() as any);

      if (playerError) throw playerError;

      // Store game info
      localStorage.setItem('mlRoomId', room.id);
      localStorage.setItem('mlDeviceId', deviceId);
      localStorage.setItem('mlIsHost', 'false');
      localStorage.setItem('mlPlayerId', newPlayer.id);

      toast({
        title: isRTL ? 'הצטרפת!' : 'Joined!',
        description: isRTL ? 'ממתין שהמנחה יתחיל' : 'Waiting for host to start',
      });

      setCurrentScreen('mostLikelyMultiplayer');
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: isRTL ? 'שגיאה' : 'Error',
        description: isRTL ? 'לא הצלחנו להצטרף לחדר' : 'Failed to join room',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

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
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            ☝️ {isRTL ? 'הכי סביר ש...' : 'Most Likely To'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRTL ? 'הצטרף לחדר' : 'Join a room'}
          </p>
        </div>
      </motion.div>

      {/* Join Form */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10">
        <motion.div
          className="w-full max-w-sm glass-card p-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Avatar Selection */}
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

          {/* Nickname Input */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-foreground mb-2">
              {isRTL ? 'השם שלך' : 'Your Name'}
            </label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={isRTL ? 'הזן את שמך...' : 'Enter your name...'}
              className="text-xl text-center font-bold py-6"
              maxLength={20}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Room Code Input */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-foreground mb-2">
              {isRTL ? 'קוד החדר' : 'Room Code'}
            </label>
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              className="text-4xl text-center font-black tracking-[0.3em] py-6 font-mono"
              maxLength={4}
              inputMode="numeric"
            />
          </div>

          {/* Join Button */}
          <Button
            size="xl"
            onClick={handleJoin}
            disabled={roomCode.length !== 4 || !nickname.trim() || isJoining}
            className="w-full text-xl font-black py-6 relative overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              boxShadow: `0 0 30px ${primaryColor}50`,
            }}
          >
            {isJoining ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ⏳
              </motion.span>
            ) : (
              <>
                <LogIn className={`w-6 h-6 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isRTL ? 'הצטרף!' : 'Join!'}
              </>
            )}
          </Button>
        </motion.div>
      </div>

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

export default MostLikelyJoin;
