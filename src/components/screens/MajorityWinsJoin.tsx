import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import BarOffersWidget from '@/components/BarOffersWidget';
import { useToast } from '@/hooks/use-toast';

const avatarOptions = ['🍺', '🍻', '🥃', '🍷', '🍸', '🍹', '🧉', '🥂'];

const MajorityWinsJoin: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen } = useGame();
  const { toast } = useToast();
  const isRTL = language === 'he';

  const primaryColor = 'hsl(300 76% 50%)';

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
        title: isRTL ? 'שגיאה' : 'Error',
        description: isRTL ? 'קוד החדר חייב להיות 4 ספרות' : 'Room code must be 4 digits',
        variant: 'destructive',
      });
      return;
    }

    setIsJoining(true);
    try {
      // Find the room
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode)
        .eq('game_type', 'majorityWins')
        .eq('status', 'waiting')
        .single();

      if (roomError || !room) {
        toast({
          title: isRTL ? 'לא נמצא' : 'Not Found',
          description: isRTL ? 'חדר לא נמצא או שהמשחק כבר התחיל' : 'Room not found or game already started',
          variant: 'destructive',
        });
        return;
      }

      // Check player count
      const { count } = await supabase
        .from('game_players')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id);

      if (count && count >= 8) {
        toast({
          title: isRTL ? 'החדר מלא' : 'Room Full',
          description: isRTL ? 'החדר הזה מלא' : 'This room is full',
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
    if (!nickname.trim() || !roomId) return;

    setIsJoining(true);
    try {
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

      // Get the room's category
      const { data: room } = await supabase
        .from('game_rooms')
        .select('intensity')
        .eq('id', roomId)
        .single();

      // Store game info
      localStorage.setItem('majorityRoomId', roomId);
      localStorage.setItem('majorityDeviceId', deviceId);
      localStorage.setItem('majorityIsHost', 'false');
      localStorage.setItem('majorityCategory', room?.intensity || 'classics');

      setCurrentScreen('majorityWinsGame');
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: isRTL ? 'שגיאה' : 'Error',
        description: isRTL ? 'לא הצלחנו להצטרף' : 'Failed to join',
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
      setCurrentScreen('majorityWinsEntry');
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
            {step === 'code' 
              ? (isRTL ? 'הכנס קוד' : 'Enter Code')
              : (isRTL ? 'בחר שם ואמוג\'י' : 'Choose Name & Emoji')
            }
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === 'code'
              ? (isRTL ? 'קוד 4 ספרות מהמנחה' : '4-digit code from the host')
              : (isRTL ? 'איך יכירו אותך?' : 'How should we call you?')
            }
          </p>
        </div>
      </motion.div>

      {/* Step 1: Room Code */}
      {step === 'code' && (
        <motion.div
          className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="glass-card p-8 w-full max-w-sm">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              className="w-full text-center text-6xl font-black tracking-[0.5em] bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/30"
              maxLength={4}
              inputMode="numeric"
              autoFocus
            />
            <div className="flex justify-center gap-2 mt-4">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="w-12 h-1 rounded-full transition-colors"
                  style={{ 
                    backgroundColor: roomCode.length > i 
                      ? primaryColor 
                      : 'hsl(var(--muted-foreground) / 0.3)'
                  }}
                />
              ))}
            </div>
          </div>

          <Button
            size="xl"
            onClick={handleCodeSubmit}
            disabled={roomCode.length !== 4 || isJoining}
            className="w-full max-w-sm text-xl font-black py-7"
            style={{ 
              background: roomCode.length === 4 
                ? `linear-gradient(135deg, ${primaryColor}, hsl(330 85% 60%))` 
                : undefined,
            }}
          >
            {isJoining ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              isRTL ? 'המשך' : 'Continue'
            )}
          </Button>
        </motion.div>
      )}

      {/* Step 2: Profile */}
      {step === 'profile' && (
        <motion.div
          className="flex-1 flex flex-col gap-6 relative z-10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {/* Nickname Input */}
          <div className="glass-card p-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {isRTL ? 'שם' : 'Nickname'}
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 15))}
              placeholder={isRTL ? 'הכנס שם...' : 'Enter nickname...'}
              className="w-full text-2xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50"
              maxLength={15}
              autoFocus
            />
          </div>

          {/* Avatar Selection */}
          <div className="glass-card p-6">
            <label className="block text-sm font-medium text-muted-foreground mb-4">
              {isRTL ? 'אמוג\'י משקה' : 'Drink Emoji'}
            </label>
            <div className="grid grid-cols-4 gap-3">
              {avatarOptions.map(emoji => (
                <motion.button
                  key={emoji}
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`text-4xl p-3 rounded-xl transition-all ${
                    selectedAvatar === emoji 
                      ? 'bg-primary/20 ring-2 ring-primary' 
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <motion.div 
            className="glass-card p-4 flex items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-4xl">{selectedAvatar}</span>
            <div>
              <p className="font-bold text-foreground text-lg">
                {nickname || (isRTL ? 'השם שלך' : 'Your name')}
              </p>
              <p className="text-muted-foreground text-sm">
                {isRTL ? 'כך תיראה בלובי' : 'This is how you\'ll appear'}
              </p>
            </div>
            {nickname && <Check className="w-5 h-5 text-green-500 ml-auto" />}
          </motion.div>

          {/* Join Button */}
          <motion.div
            className="mt-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="xl"
              onClick={handleJoin}
              disabled={!nickname.trim() || isJoining}
              className="w-full text-xl font-black py-7"
              style={{ 
                background: nickname.trim() 
                  ? `linear-gradient(135deg, ${primaryColor}, hsl(330 85% 60%))` 
                  : undefined,
              }}
            >
              {isJoining ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>⚔️ {isRTL ? 'הצטרף לקרב!' : 'Join Battle!'}</>
              )}
            </Button>
          </motion.div>
        </motion.div>
      )}

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

export default MajorityWinsJoin;
