import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Minus, Play, Users, Beer, Trophy, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { getGameTheme } from '@/config/gameThemes';
import BarOffersWidget from '@/components/BarOffersWidget';
import type { TriviaPlayer } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';

const avatarOptions = ['🍺', '🍻', '🥃', '🍷', '🍸', '🍹', '🧉', '🥂'];

const TriviaLobby: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen } = useGame();
  const isRTL = language === 'he';
  
  const theme = getGameTheme('trivia');
  const primaryColor = theme ? `hsl(${theme.primaryColor})` : 'hsl(217 91% 60%)';
  const secondaryColor = theme ? `hsl(${theme.secondaryColor})` : 'hsl(45 93% 47%)';

  const [gameMode, setGameMode] = useState<'tableBattle' | 'partyRoom'>('tableBattle');
  const [players, setPlayers] = useState<TriviaPlayer[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🍺');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  useEffect(() => {
    const mode = localStorage.getItem('triviaGameMode') as 'tableBattle' | 'partyRoom';
    if (mode) {
      setGameMode(mode);
      if (mode === 'partyRoom') {
        createRoom();
      }
    }
  }, []);

  const createRoom = async () => {
    setIsCreatingRoom(true);
    try {
      // Generate room code via Supabase function
      const { data, error } = await supabase.rpc('generate_room_code');
      if (error) throw error;
      
      const code = data as string;
      
      // Create room in database
      const difficulty = localStorage.getItem('triviaDifficulty') || 'medium';
      const { error: insertError } = await supabase
        .from('game_rooms')
        .insert({
          room_code: code,
          game_type: 'trivia',
          intensity: difficulty,
          status: 'waiting',
        });

      if (insertError) throw insertError;
      
      setRoomCode(code);
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const addPlayer = () => {
    if (newPlayerName.trim() && players.length < 8) {
      const newPlayer: TriviaPlayer = {
        id: `player_${Date.now()}`,
        nickname: newPlayerName.trim(),
        avatar: selectedAvatar,
        score: 0,
        drinksTaken: 0,
        streak: 0,
        isHost: players.length === 0,
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName('');
      // Cycle to next avatar
      const currentIndex = avatarOptions.indexOf(selectedAvatar);
      setSelectedAvatar(avatarOptions[(currentIndex + 1) % avatarOptions.length]);
    }
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const startGame = () => {
    // Store players in localStorage for game use
    localStorage.setItem('triviaPlayers', JSON.stringify(players));
    setCurrentScreen('triviaMultiplayer');
  };

  const handleBack = () => {
    setCurrentScreen('triviaDifficulty');
  };

  const canStartGame = players.length >= 2;

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
            {gameMode === 'tableBattle' ? '📱' : '🎉'}
            {isRTL 
              ? (gameMode === 'tableBattle' ? 'קרב שולחן' : 'מסיבת חדר')
              : (gameMode === 'tableBattle' ? 'Table Battle' : 'Party Room')
            }
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRTL ? 'הוסיפו שחקנים להתחיל' : 'Add players to start'}
          </p>
        </div>
      </motion.div>

      {/* Room Code for Party Mode */}
      {gameMode === 'partyRoom' && roomCode && (
        <motion.div
          className="glass-card p-6 mb-6 text-center relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="text-muted-foreground text-sm mb-2">
            {isRTL ? 'קוד החדר' : 'Room Code'}
          </p>
          <div 
            className="text-5xl font-black tracking-widest mb-4"
            style={{ color: primaryColor }}
          >
            {roomCode}
          </div>
          <p className="text-muted-foreground text-xs">
            {isRTL 
              ? 'שחקנים יכולים להצטרף עם הקוד הזה'
              : 'Players can join using this code'
            }
          </p>
        </motion.div>
      )}

      {/* Add Player Form */}
      <motion.div
        className="glass-card p-4 mb-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <p className="text-sm text-muted-foreground mb-3">
          {isRTL ? 'הוסף שחקן' : 'Add Player'} ({players.length}/8)
        </p>
        
        {/* Avatar Selection */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {avatarOptions.map((avatar) => (
            <button
              key={avatar}
              onClick={() => setSelectedAvatar(avatar)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                selectedAvatar === avatar 
                  ? 'bg-primary/30 ring-2 ring-primary scale-110' 
                  : 'glass-card hover:bg-muted/50'
              }`}
            >
              {avatar}
            </button>
          ))}
        </div>

        {/* Name Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
            placeholder={isRTL ? 'שם השחקן...' : 'Player name...'}
            className="flex-1 px-4 py-3 rounded-xl glass-card bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            maxLength={15}
            disabled={players.length >= 8}
          />
          <Button
            onClick={addPlayer}
            disabled={!newPlayerName.trim() || players.length >= 8}
            size="lg"
            className="px-6"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>

      {/* Players List */}
      <div className="flex-1 relative z-10 mb-6">
        <AnimatePresence>
          {players.length === 0 ? (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {isRTL ? 'הוסיפו לפחות 2 שחקנים' : 'Add at least 2 players'}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {players.map((player, index) => (
                <motion.div
                  key={player.id}
                  className="glass-card p-4 relative group"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  {/* Remove button */}
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{player.avatar}</span>
                    <div>
                      <p className="font-bold text-foreground">{player.nickname}</p>
                      {player.isHost && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          {isRTL ? 'מארח' : 'Host'}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
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
          disabled={!canStartGame}
          className="w-full text-xl font-black py-7 relative overflow-hidden"
          style={{ 
            background: canStartGame 
              ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
              : undefined,
            boxShadow: canStartGame ? `0 0 30px ${primaryColor}50` : undefined,
          }}
        >
          {canStartGame && (
            <motion.div
              className="absolute inset-0 bg-white/20"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
          )}
          <Play className="w-6 h-6 mr-2" />
          {isRTL ? 'התחל משחק!' : 'Start Game!'}
          <Sparkles className="w-5 h-5 ml-2" />
        </Button>
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

export default TriviaLobby;
