import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, AlertTriangle, Trophy, Beer, ThumbsUp, ThumbsDown } from 'lucide-react';
import QuitGameDialog from '@/components/QuitGameDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { neverHaveIStatements, type NeverHaveIStatement } from '@/data/neverHaveIData';
import BarOffersWidget from '@/components/BarOffersWidget';

type GamePhase = 'waiting' | 'voting' | 'spotlight' | 'jury' | 'reveal' | 'majorityRule' | 'gameover';

interface Player {
  id: string;
  nickname: string;
  avatar: string;
  drinksTaken: number;
  isHost: boolean;
}

interface Vote {
  playerId: string;
  choice: 'guilty' | 'innocent';
}

interface JuryVote {
  playerId: string;
  verdict: 'good' | 'boring';
}

const VOTE_TIME = 10;
const JURY_TIME = 10;
const SPOTLIGHT_TIME = 10;
const QUESTIONS_PER_GAME = 15;

const NeverHaveIGame: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen, resetGame } = useGame();
  const isRTL = language === 'he';

  const roomId = localStorage.getItem('nhieRoomId');
  const deviceId = localStorage.getItem('nhieDeviceId');
  const isHost = localStorage.getItem('nhieIsHost') === 'true';

  const primaryColor = 'hsl(142 76% 36%)';
  const secondaryColor = 'hsl(84 81% 44%)';

  const [phase, setPhase] = useState<GamePhase>('waiting');
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(VOTE_TIME);
  const [myVote, setMyVote] = useState<'guilty' | 'innocent' | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [orderedQuestions, setOrderedQuestions] = useState<NeverHaveIStatement[]>([]);
  const [spotlightPlayer, setSpotlightPlayer] = useState<Player | null>(null);
  const [juryVotes, setJuryVotes] = useState<JuryVote[]>([]);
  const [hasJuryVoted, setHasJuryVoted] = useState(false);
  const [showSiren, setShowSiren] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentQuestion = orderedQuestions[questionIndex];

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'continuous') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [30],
        medium: [50, 30, 50],
        heavy: [100, 50, 100],
        continuous: [100, 50, 100, 50, 100, 50, 100, 50, 100],
      };
      navigator.vibrate(patterns[type]);
    }
  };

  // Fetch room data
  useEffect(() => {
    if (!roomId) return;

    const fetchData = async () => {
      const { data: roomData } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();

      if (roomData?.question_order && Array.isArray(roomData.question_order)) {
        const orderedCards = roomData.question_order
          .map((id: string) => neverHaveIStatements.find(s => s.id === id))
          .filter((s): s is NeverHaveIStatement => s !== undefined);
        setOrderedQuestions(orderedCards);
      }

      const { data: playersData } = await supabase
        .from('game_players')
        .select('*')
        .eq('room_id', roomId)
        .order('drinks_taken', { ascending: false });

      if (playersData) {
        setPlayers(playersData.map(p => ({
          id: p.id,
          nickname: p.nickname,
          avatar: p.avatar,
          drinksTaken: p.drinks_taken,
          isHost: p.is_host,
        })));

        const myPlayer = playersData.find(p => p.device_id === deviceId);
        if (myPlayer) setMyPlayerId(myPlayer.id);
      }
    };

    fetchData();

    // Subscribe to changes
    const channel = supabase
      .channel(`nhie-game-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const newPhase = payload.new.current_phase as GamePhase;
          const newIndex = payload.new.current_question_index;

          if (newPhase !== phase) {
            setPhase(newPhase);
            if (newPhase === 'voting') {
              setTimeLeft(VOTE_TIME);
              setMyVote(null);
              setHasVoted(false);
              setVotes([]);
              setSpotlightPlayer(null);
              setJuryVotes([]);
              setHasJuryVoted(false);
              setShowSiren(false);
            } else if (newPhase === 'spotlight') {
              setTimeLeft(SPOTLIGHT_TIME);
              triggerHaptic('heavy');
              setShowSiren(true);
            } else if (newPhase === 'jury') {
              setTimeLeft(JURY_TIME);
              setHasJuryVoted(false);
            }
          }
          if (newIndex !== questionIndex) {
            setQuestionIndex(newIndex);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_players', filter: `room_id=eq.${roomId}` },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'player_answers', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setVotes(prev => [...prev, {
            playerId: payload.new.player_id,
            choice: payload.new.answer_index === 0 ? 'guilty' : 'innocent',
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, deviceId, phase, questionIndex]);

  // Fast-path: Check if all players voted during voting phase
  useEffect(() => {
    if (phase !== 'voting' || !isHost || players.length < 2) return;

    // Check if all players have voted
    if (votes.length >= players.length) {
      // All players voted - advance immediately
      if (timerRef.current) clearTimeout(timerRef.current);
      processVotes();
    }
  }, [votes.length, players.length, phase, isHost]);

  // Fast-path: Check if all jurors voted during jury phase
  useEffect(() => {
    if (phase !== 'jury' || !isHost || !spotlightPlayer) return;

    // Exclude spotlight player from jury count
    const jurorCount = players.length - 1;
    if (juryVotes.length >= jurorCount) {
      // All jurors voted - advance immediately
      if (timerRef.current) clearTimeout(timerRef.current);
      processJuryVotes();
    }
  }, [juryVotes.length, players.length, phase, isHost, spotlightPlayer]);

  // Timer countdown
  useEffect(() => {
    if ((phase !== 'voting' && phase !== 'spotlight' && phase !== 'jury') || timeLeft <= 0) return;

    timerRef.current = setTimeout(() => {
      if (phase === 'spotlight' && timeLeft <= 5) {
        triggerHaptic('medium');
      }

      setTimeLeft(prev => {
        if (prev <= 1) {
          if (isHost) {
            if (phase === 'voting') processVotes();
            else if (phase === 'spotlight') startJury();
            else if (phase === 'jury') processJuryVotes();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, timeLeft, isHost]);

  const handleVote = async (choice: 'guilty' | 'innocent') => {
    if (hasVoted || !myPlayerId || !roomId) return;

    setHasVoted(true);
    setMyVote(choice);
    triggerHaptic('light');

    await supabase.from('player_answers').insert({
      room_id: roomId,
      player_id: myPlayerId,
      question_index: questionIndex,
      answer_index: choice === 'guilty' ? 0 : 1,
      is_correct: false,
      points_earned: 0,
    });
  };

  const processVotes = async () => {
    if (!isHost || !roomId) return;

    const { data: answers } = await supabase
      .from('player_answers')
      .select('*')
      .eq('room_id', roomId)
      .eq('question_index', questionIndex);

    const guiltyPlayers = answers?.filter(a => a.answer_index === 0) || [];
    const innocentPlayers = answers?.filter(a => a.answer_index === 1) || [];

    // Spotlight: Exactly one guilty person
    if (guiltyPlayers.length === 1) {
      const spotlightP = players.find(p => p.id === guiltyPlayers[0].player_id);
      if (spotlightP) {
        setSpotlightPlayer(spotlightP);
        await supabase
          .from('game_rooms')
          .update({ current_phase: 'spotlight' })
          .eq('id', roomId);
        return;
      }
    }

    // Majority Rule: Only one innocent
    if (innocentPlayers.length === 1) {
      const innocentPlayer = players.find(p => p.id === innocentPlayers[0].player_id);
      if (innocentPlayer) {
        // Double drinks for the "saint"
        await supabase
          .from('game_players')
          .update({ drinks_taken: innocentPlayer.drinksTaken + 2 })
          .eq('id', innocentPlayer.id);

        setSpotlightPlayer(innocentPlayer);
        await supabase
          .from('game_rooms')
          .update({ current_phase: 'majorityRule' })
          .eq('id', roomId);

        setTimeout(() => nextQuestion(), 5000);
        return;
      }
    }

    // Normal flow: All guilty drink
    for (const answer of guiltyPlayers) {
      const player = players.find(p => p.id === answer.player_id);
      if (player) {
        await supabase
          .from('game_players')
          .update({ drinks_taken: player.drinksTaken + 1 })
          .eq('id', player.id);
      }
    }

    await supabase
      .from('game_rooms')
      .update({ current_phase: 'reveal' })
      .eq('id', roomId);

    setTimeout(() => nextQuestion(), 3000);
  };

  const startJury = async () => {
    if (!isHost || !roomId) return;
    await supabase
      .from('game_rooms')
      .update({ current_phase: 'jury' })
      .eq('id', roomId);
  };

  const handleJuryVote = (verdict: 'good' | 'boring') => {
    if (hasJuryVoted || !myPlayerId || myPlayerId === spotlightPlayer?.id) return;
    setHasJuryVoted(true);
    setJuryVotes(prev => [...prev, { playerId: myPlayerId, verdict }]);
    triggerHaptic('light');
  };

  const processJuryVotes = async () => {
    if (!isHost || !roomId || !spotlightPlayer) return;

    const boringVotes = juryVotes.filter(v => v.verdict === 'boring').length;
    const goodVotes = juryVotes.filter(v => v.verdict === 'good').length;

    // If boring wins, confessor drinks
    if (boringVotes >= goodVotes) {
      await supabase
        .from('game_players')
        .update({ drinks_taken: spotlightPlayer.drinksTaken + 1 })
        .eq('id', spotlightPlayer.id);
    }

    await supabase
      .from('game_rooms')
      .update({ current_phase: 'reveal' })
      .eq('id', roomId);

    setTimeout(() => nextQuestion(), 3000);
  };

  const nextQuestion = async () => {
    if (!isHost || !roomId) return;

    if (questionIndex >= QUESTIONS_PER_GAME - 1 || questionIndex >= orderedQuestions.length - 1) {
      await supabase
        .from('game_rooms')
        .update({ current_phase: 'gameover' })
        .eq('id', roomId);
    } else {
      await supabase
        .from('game_rooms')
        .update({
          current_question_index: questionIndex + 1,
          current_phase: 'voting',
        })
        .eq('id', roomId);
    }
  };

  const handleHome = () => {
    localStorage.removeItem('nhieRoomId');
    localStorage.removeItem('nhieDeviceId');
    localStorage.removeItem('nhieIsHost');
    resetGame();
  };

  const guiltyCount = votes.filter(v => v.choice === 'guilty').length;
  const innocentCount = votes.filter(v => v.choice === 'innocent').length;

  if (!roomId || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <p className="text-foreground">{isRTL ? 'טוען...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-hidden transition-all duration-500 ${
        showSiren ? 'animate-pulse' : ''
      }`}
      style={{
        background: showSiren
          ? 'linear-gradient(180deg, hsl(0 84% 20%) 0%, hsl(220 84% 20%) 50%, hsl(0 84% 15%) 100%)'
          : `linear-gradient(180deg, hsl(222 47% 8%) 0%, hsl(222 47% 4%) 50%, ${primaryColor}20 100%)`,
      }}
    >
      {/* Police Siren Effect */}
      {showSiren && (
        <>
          <motion.div
            className="absolute inset-0 pointer-events-none z-0"
            animate={{
              background: [
                'linear-gradient(45deg, hsla(0, 100%, 50%, 0.3) 0%, transparent 50%)',
                'linear-gradient(45deg, transparent 0%, hsla(220, 100%, 50%, 0.3) 50%)',
                'linear-gradient(45deg, hsla(0, 100%, 50%, 0.3) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </>
      )}

      {/* Header */}
      <motion.div
        className="flex items-center justify-between p-4 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🙊</span>
          <span className="text-muted-foreground text-sm">
            {questionIndex + 1} / {QUESTIONS_PER_GAME}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowQuitDialog(true)} className="p-2 rounded-lg glass-card">
            <Home className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Quit Dialog */}
      <QuitGameDialog
        isOpen={showQuitDialog}
        onClose={() => setShowQuitDialog(false)}
        onConfirm={handleHome}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        <AnimatePresence mode="wait">

          {/* WAITING PHASE */}
          {phase === 'waiting' && (
            <motion.div key="waiting" className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="text-6xl mb-6" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                🙊
              </motion.div>
              <h2 className="text-2xl font-black mb-4">
                {isRTL ? 'מוכנים להתוודות?' : 'Ready to Confess?'}
              </h2>
              {isHost && (
                <Button
                  size="xl"
                  onClick={async () => {
                    await supabase.from('game_rooms').update({ current_phase: 'voting' }).eq('id', roomId);
                  }}
                  className="text-xl font-black py-7"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  {isRTL ? '🙊 התחל!' : '🙊 Start!'}
                </Button>
              )}
            </motion.div>
          )}

          {/* VOTING PHASE */}
          {phase === 'voting' && (
            <motion.div key={`voting-${questionIndex}`} className="w-full max-w-md" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
              {/* Timer */}
              <div className="text-center mb-4">
                <motion.div
                  className="text-5xl font-black"
                  style={{ color: timeLeft <= 3 ? 'hsl(0 84% 60%)' : primaryColor }}
                  animate={timeLeft <= 3 ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.5, repeat: timeLeft <= 3 ? Infinity : 0 }}
                >
                  {timeLeft}
                </motion.div>
              </div>

              {/* Question Card */}
              <motion.div className="glass-card p-8 mb-8 text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                <p
                  className="text-2xl md:text-3xl font-black leading-relaxed"
                  style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                >
                  {isRTL ? currentQuestion.textHe : currentQuestion.text}
                </p>
              </motion.div>

              {/* Vote Buttons */}
              {!hasVoted ? (
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    onClick={() => handleVote('guilty')}
                    className="p-6 rounded-2xl text-center font-black text-xl transition-all"
                    style={{
                      background: 'linear-gradient(135deg, hsl(0 84% 50%), hsl(15 90% 55%))',
                      boxShadow: '0 0 30px hsla(0, 84%, 50%, 0.4)',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-4xl block mb-2">🙋‍♂️</span>
                    {isRTL ? 'אני אשם!' : "I've Done It!"}
                  </motion.button>

                  <motion.button
                    onClick={() => handleVote('innocent')}
                    className="p-6 rounded-2xl text-center font-black text-xl transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      boxShadow: `0 0 30px ${primaryColor}40`,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-4xl block mb-2">😇</span>
                    {isRTL ? 'מעולם לא' : 'Never!'}
                  </motion.button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-xl font-bold text-muted-foreground">
                    {isRTL ? 'הצבעת!' : 'Voted!'}
                  </p>
                  <p className="text-muted-foreground mt-2">
                    🙋‍♂️ {guiltyCount} | 😇 {innocentCount}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* SPOTLIGHT PHASE */}
          {phase === 'spotlight' && spotlightPlayer && (
            <motion.div key="spotlight" className="text-center w-full max-w-md" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              </motion.div>

              <h2 className="text-3xl font-black text-red-500 mb-4">
                {isRTL ? '🚨 רגע! יש לנו בודד!' : '🚨 HOLD UP! One Confessor!'}
              </h2>

              <div className="glass-card p-6 mb-6">
                <span className="text-6xl block mb-2">{spotlightPlayer.avatar}</span>
                <p className="text-2xl font-black">{spotlightPlayer.nickname}</p>
                <p className="text-muted-foreground">
                  {isRTL ? 'יש לך 10 שניות לשכנע!' : 'You have 10 seconds to explain!'}
                </p>
              </div>

              <motion.div
                className="text-6xl font-black"
                style={{ color: timeLeft <= 3 ? 'hsl(0 84% 60%)' : 'white' }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                {timeLeft}
              </motion.div>
            </motion.div>
          )}

          {/* JURY PHASE */}
          {phase === 'jury' && spotlightPlayer && (
            <motion.div key="jury" className="text-center w-full max-w-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl font-black mb-4">
                {isRTL ? '⚖️ הפסק דין' : '⚖️ The Verdict'}
              </h2>

              <p className="text-lg text-muted-foreground mb-6">
                {isRTL
                  ? `האם ${spotlightPlayer.nickname} שיכנע/ה אתכם?`
                  : `Did ${spotlightPlayer.nickname} convince you?`}
              </p>

              {myPlayerId !== spotlightPlayer.id && !hasJuryVoted ? (
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    onClick={() => handleJuryVote('good')}
                    className="p-6 rounded-2xl text-center font-black text-xl"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ThumbsUp className="w-10 h-10 mx-auto mb-2" />
                    {isRTL ? 'סיפור טוב ✅' : 'Good Story ✅'}
                  </motion.button>

                  <motion.button
                    onClick={() => handleJuryVote('boring')}
                    className="p-6 rounded-2xl text-center font-black text-xl"
                    style={{ background: 'linear-gradient(135deg, hsl(30 10% 40%), hsl(30 10% 30%))' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ThumbsDown className="w-10 h-10 mx-auto mb-2" />
                    {isRTL ? 'משעמם 💩' : 'Boring 💩'}
                  </motion.button>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {myPlayerId === spotlightPlayer.id
                    ? isRTL ? 'ממתינים לפסק הדין...' : 'Awaiting verdict...'
                    : isRTL ? 'הצבעת!' : 'Voted!'}
                </p>
              )}

              <div className="mt-4">
                <motion.div
                  className="text-4xl font-black"
                  style={{ color: timeLeft <= 3 ? 'hsl(0 84% 60%)' : 'white' }}
                >
                  {timeLeft}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* MAJORITY RULE PHASE */}
          {phase === 'majorityRule' && spotlightPlayer && (
            <motion.div key="majorityRule" className="text-center w-full max-w-md" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                className="text-8xl mb-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                😇
              </motion.div>

              <h2 className="text-3xl font-black mb-4" style={{ color: primaryColor }}>
                {isRTL ? 'חוק הרוב!' : 'Majority Rule!'}
              </h2>

              <div className="glass-card p-6 mb-4">
                <span className="text-5xl block mb-2">{spotlightPlayer.avatar}</span>
                <p className="text-2xl font-black">{spotlightPlayer.nickname}</p>
              </div>

              <p className="text-2xl font-black" style={{ color: 'hsl(45 93% 47%)' }}>
                {isRTL ? 'החסיד שותה כפול! 🍻🍻' : 'The Saint Drinks Double! 🍻🍻'}
              </p>
            </motion.div>
          )}

          {/* REVEAL PHASE */}
          {phase === 'reveal' && (
            <motion.div key="reveal" className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 1 }}
              >
                🍻
              </motion.div>
              <p className="text-xl font-bold text-muted-foreground">
                {isRTL ? 'שאלה הבאה מגיעה...' : 'Next question coming...'}
              </p>
            </motion.div>
          )}

          {/* GAME OVER */}
          {phase === 'gameover' && (
            <motion.div key="gameover" className="text-center w-full max-w-md" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              <Trophy className="w-20 h-20 mx-auto mb-4" style={{ color: 'hsl(45 93% 47%)' }} />

              <h2 className="text-3xl font-black mb-6">
                {isRTL ? 'סיום המשחק!' : 'Game Over!'}
              </h2>

              <div className="glass-card p-4 mb-6">
                <h3 className="font-bold mb-3">{isRTL ? 'טבלת השותים' : 'Drink Leaderboard'}</h3>
                {players.slice(0, 5).map((player, i) => (
                  <div key={player.id} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                      <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
                      <span>{player.avatar}</span>
                      <span className="font-bold">{player.nickname}</span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Beer className="w-4 h-4" />
                      {player.drinksTaken}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                size="xl"
                onClick={handleHome}
                className="w-full text-xl font-black py-7"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                {isRTL ? '🏠 חזרה לתפריט' : '🏠 Back to Menu'}
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bar Offers Widget */}
      <motion.div className="p-4 flex justify-center relative z-10">
        <BarOffersWidget />
      </motion.div>
    </div>
  );
};

export default NeverHaveIGame;
