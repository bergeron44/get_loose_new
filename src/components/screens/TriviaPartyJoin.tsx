import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LogIn, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { getGameTheme } from '@/config/gameThemes';
import { supabase } from '@/integrations/supabase/client';
import BarOffersWidget from '@/components/BarOffersWidget';
import { useToast } from '@/hooks/use-toast';

const avatarOptions = ['🍺', '🍻', '🥃', '🍷', '🍸', '🍹', '🧉', '🥂'];

const TriviaPartyJoin: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen } = useGame();
  const { toast } = useToast();
  const isRTL = language === 'he';
  
  const theme = getGameTheme('trivia');
  const primaryColor = theme ? `hsl(${theme.primaryColor})` : 'hsl(217 91% 60%)';
  const secondaryColor = theme ? `hsl(${theme.secondaryColor})` : 'hsl(45 93% 47%)';

  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🍺');
  const [isJoining, setIsJoining] = useState(false);
  const [step, setStep] = useState<'code' | 'profile'>('code');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [deviceId] = useState(() => `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const handleCodeSubmit = async () => {
    if (roomCode.length !== 4) {
      toast({
        title: isRTL ? 'קוד לא תקין' : 'Invalid Code',
        description: isRTL ? 'הקוד צריך להיות 4 ספרות' : 'Code must be 4 digits',
        variant: 'destructive',
      });
      return;
    }

    setIsJoining(true);
    try {
      // Find room
      const nowIso = new Date().toISOString();
      const { data: room, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode.trim())
        .eq('game_type', 'trivia')
        .eq('status', 'waiting')
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .single();

      if (error || !room) {
        toast({
          title: isRTL ? 'חדר לא נמצא' : 'Room Not Found',
          description: isRTL ? 'בדוק את הקוד ונסה שוב' : 'Check the code and try again',
          variant: 'destructive',
        });
        return;
      }

      // Check if room is full
      const { count } = await supabase
        .from('game_players')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id);

      if (count && count >= 8) {
        toast({
          title: isRTL ? 'החדר מלא' : 'Room Full',
          description: isRTL ? 'החדר כבר מלא (8 שחקנים)' : 'Room is already full (8 players)',
          variant: 'destructive',
        });
        return;
      }

      setRoomId(room.id);
      setStep('profile');
    } catch (error) {
      console.error('Error finding room:', error);
      toast({
        title: isRTL ? 'שגיאה' : 'Error',
        description: isRTL ? 'משהו השתבש' : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoin = async () => {
    if (!nickname.trim() || !roomId) {
      toast({
        title: isRTL ? 'שם חסר' : 'Name Required',
        description: isRTL ? 'הכנס שם כדי להצטרף' : 'Enter a name to join',
        variant: 'destructive',
      });
      return;
    }

    setIsJoining(true);
    try {
      // Add player to room
      const { error } = await supabase
        .from('game_players')
        .insert({
          room_id: roomId,
          nickname: nickname.trim(),
          avatar: selectedAvatar,
          device_id: deviceId,
          is_host: false,
          is_ready: true,
        });

      if (error) throw error;

      // Store game info
      localStorage.setItem('partyRoomId', roomId);
      localStorage.setItem('partyDeviceId', deviceId);
      localStorage.setItem('partyIsHost', 'false');
      
      setCurrentScreen('triviaPartyGame');
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

  const handleBack = () => {
    if (step === 'profile') {
      setStep('code');
      setRoomId(null);
    } else {
      setCurrentScreen('triviaPartyEntry');
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-hero flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-0 w-72 h-72 rounded-full blur-3xl"
          style={{ background: `${secondaryColor}15` }}
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
          onClick={handleBack}
          className="p-3 rounded-xl glass-card hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className={`w-5 h-5 text-foreground ${isRTL ? 'rotate-180' : ''}`} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            🎮 {isRTL ? 'הצטרף למשחק' : 'Join Game'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === 'code' 
              ? (isRTL ? 'הכנס את קוד החדר' : 'Enter the room code')
              : (isRTL ? 'בחר כינוי ואמוג\'י' : 'Choose your name & emoji')
            }
          </p>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center relative z-10">
        {step === 'code' ? (
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <label className="block text-sm text-muted-foreground mb-3">
              {isRTL ? 'קוד החדר (4 ספרות)' : 'Room Code (4 digits)'}
            </label>
            
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              className="w-full text-center text-5xl font-black tracking-[0.5em] px-4 py-6 rounded-xl glass-card bg-background/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={4}
              inputMode="numeric"
              autoFocus
            />

            <Button
              size="xl"
              onClick={handleCodeSubmit}
              disabled={roomCode.length !== 4 || isJoining}
              className="w-full text-xl font-black py-6 mt-6"
              style={{ 
                background: roomCode.length === 4 
                  ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
                  : undefined,
              }}
            >
              {isJoining ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-6 h-6 mr-2" />
                  {isRTL ? 'המשך' : 'Continue'}
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Avatar Selection */}
            <label className="block text-sm text-muted-foreground mb-3">
              {isRTL ? 'בחר משקה' : 'Choose Your Drink'}
            </label>
            <div className="flex gap-2 mb-6 flex-wrap justify-center">
              {avatarOptions.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-all ${
                    selectedAvatar === avatar 
                      ? 'ring-2 ring-primary scale-110' 
                      : 'glass-card hover:bg-muted/50'
                  }`}
                  style={{
                    background: selectedAvatar === avatar ? `${primaryColor}30` : undefined,
                  }}
                >
                  {avatar}
                </button>
              ))}
            </div>

            {/* Nickname Input */}
            <label className="block text-sm text-muted-foreground mb-3">
              {isRTL ? 'הכינוי שלך' : 'Your Nickname'}
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={isRTL ? 'הכנס כינוי...' : 'Enter nickname...'}
              className="w-full px-4 py-4 rounded-xl glass-card bg-background/50 text-foreground text-lg font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={15}
              autoFocus
            />

            <Button
              size="xl"
              onClick={handleJoin}
              disabled={!nickname.trim() || isJoining}
              className="w-full text-xl font-black py-6 mt-6"
              style={{ 
                background: nickname.trim() 
                  ? `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})` 
                  : undefined,
                boxShadow: nickname.trim() ? `0 0 30px ${secondaryColor}50` : undefined,
              }}
            >
              {isJoining ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span className="text-2xl mr-2">{selectedAvatar}</span>
                  {isRTL ? 'הצטרף למשחק!' : 'Join Game!'}
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Bar Offers Widget */}
      <motion.div
        className="mt-6 flex justify-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <BarOffersWidget />
      </motion.div>
    </div>
  );
};

export default TriviaPartyJoin;