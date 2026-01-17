import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LogIn } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import BarOffersWidget from '@/components/BarOffersWidget';
import { useToast } from '@/hooks/use-toast';

const avatarOptions = ['🍺', '🍻', '🥃', '🍷', '🍸', '🍹', '🧉', '🥂'];

const NeverHaveIJoin: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen } = useGame();
  const { toast } = useToast();
  const isRTL = language === 'he';

  const primaryColor = 'hsl(142 76% 36%)';
  const secondaryColor = 'hsl(84 81% 44%)';

  const [step, setStep] = useState<'code' | 'profile'>('code');
  const [roomCode, setRoomCode] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🍺');
  const [isJoining, setIsJoining] = useState(false);
  const [deviceId] = useState(() => `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const handleCodeSubmit = async () => {
    if (roomCode.length !== 4) {
      toast({
        title: isRTL ? 'קוד לא תקין' : 'Invalid code',
        description: isRTL ? 'הזן קוד בן 4 ספרות' : 'Enter a 4-digit code',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: room, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode.trim())
        .eq('game_type', 'neverHaveI')
        .eq('status', 'waiting')
        .maybeSingle();

      if (error || !room) {
        toast({
          title: isRTL ? 'חדר לא נמצא' : 'Room not found',
          description: isRTL ? 'בדוק את הקוד ונסה שוב' : 'Check the code and try again',
          variant: 'destructive',
        });
        return;
      }

      // Check player count
      const { data: players } = await supabase
        .from('game_players')
        .select('id')
        .eq('room_id', room.id);

      if (players && players.length >= 8) {
        toast({
          title: isRTL ? 'החדר מלא' : 'Room is full',
          description: isRTL ? 'נסה חדר אחר' : 'Try another room',
          variant: 'destructive',
        });
        return;
      }

      setRoomId(room.id);
      setStep('profile');
    } catch (error) {
      console.error('Error finding room:', error);
    }
  };

  const handleJoin = async () => {
    if (!nickname.trim() || !roomId) return;

    setIsJoining(true);
    try {
      await supabase
        .from('game_players')
        .insert({
          room_id: roomId,
          nickname: nickname.trim(),
          avatar: selectedAvatar,
          device_id: deviceId,
          is_host: false,
          is_ready: true,
        });

      // Store game info
      localStorage.setItem('nhieRoomId', roomId);
      localStorage.setItem('nhieDeviceId', deviceId);
      localStorage.setItem('nhieIsHost', 'false');

      setCurrentScreen('neverHaveIGame');
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
    } else {
      setCurrentScreen('neverHaveIEntry');
    }
  };

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
          <h1 className="text-2xl font-black text-foreground">
            {isRTL ? 'הצטרף למשחק' : 'Join Game'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === 'code'
              ? isRTL ? 'הזן את קוד החדר' : 'Enter the room code'
              : isRTL ? 'בחר את הפרופיל שלך' : 'Choose your profile'
            }
          </p>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10">
        {step === 'code' ? (
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="glass-card p-6 text-center mb-6">
              <motion.div
                className="text-6xl mb-4"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🔢
              </motion.div>
              <Input
                type="text"
                placeholder="0000"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                className="text-center text-4xl font-black tracking-[0.3em] h-20 bg-background/50 border-2"
                style={{ borderColor: `${primaryColor}50` }}
                maxLength={4}
              />
            </div>

            <Button
              size="xl"
              onClick={handleCodeSubmit}
              disabled={roomCode.length !== 4}
              className="w-full text-xl font-black py-7"
              style={{
                background: roomCode.length === 4
                  ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                  : undefined,
              }}
            >
              {isRTL ? 'המשך' : 'Continue'}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Nickname */}
            <div className="glass-card p-6 mb-4">
              <label className="block text-sm font-bold text-foreground mb-2">
                {isRTL ? 'כינוי' : 'Nickname'}
              </label>
              <Input
                type="text"
                placeholder={isRTL ? 'הכינוי שלך' : 'Your nickname'}
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 15))}
                className="text-lg font-bold bg-background/50"
                maxLength={15}
              />
            </div>

            {/* Avatar Selection */}
            <div className="glass-card p-6 mb-6">
              <label className="block text-sm font-bold text-foreground mb-3">
                {isRTL ? 'בחר אייקון' : 'Choose Icon'}
              </label>
              <div className="grid grid-cols-4 gap-3">
                {avatarOptions.map((avatar) => (
                  <motion.button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`text-3xl p-3 rounded-xl transition-all ${
                      selectedAvatar === avatar
                        ? 'bg-primary/20 ring-2 ring-primary'
                        : 'bg-muted/20 hover:bg-muted/40'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {avatar}
                  </motion.button>
                ))}
              </div>
            </div>

            <Button
              size="xl"
              onClick={handleJoin}
              disabled={!nickname.trim() || isJoining}
              className="w-full text-xl font-black py-7 relative overflow-hidden"
              style={{
                background: nickname.trim()
                  ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                  : undefined,
              }}
            >
              {isJoining ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  🙊
                </motion.div>
              ) : (
                <>
                  <LogIn className="w-6 h-6 mr-2" />
                  {isRTL ? 'הצטרף!' : 'Join!'}
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Bar Offers Widget */}
      <motion.div
        className="mt-4 flex justify-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <BarOffersWidget />
      </motion.div>
    </div>
  );
};

export default NeverHaveIJoin;
