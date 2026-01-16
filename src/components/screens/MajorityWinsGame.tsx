import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Users, Crown, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { majorityWinsCards, categoryInfo, type DilemmaCard } from '@/data/majorityWinsData';
import BarOffersWidget from '@/components/BarOffersWidget';

type GamePhase = 'waiting' | 'voting' | 'countdown' | 'reveal' | 'gameover';

interface Player {
  id: string;
  nickname: string;
  avatar: string;
  drinksTaken: number;
  isHost: boolean;
}

interface Vote {
  playerId: string;
  choice: 'A' | 'B';
}

const VOTE_TIME = 7; // seconds
const QUESTIONS_PER_GAME = 10;

const MajorityWinsGame: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen, resetGame } = useGame();
  const isRTL = language === 'he';

  // Get stored info
  const roomId = localStorage.getItem('majorityRoomId');
  const deviceId = localStorage.getItem('majorityDeviceId');
  const isHost = localStorage.getItem('majorityIsHost') === 'true';
  const categoryKey = (localStorage.getItem('majorityCategory') || 'classics') as keyof typeof categoryInfo;

  const catInfo = categoryInfo[categoryKey];
  const primaryColor = catInfo?.color || 'hsl(300 76% 50%)';
  const colorA = catInfo?.colorA || 'hsl(190 95% 50%)';
  const colorB = catInfo?.colorB || primaryColor;
  const hasGlitch = (catInfo as any)?.hasGlitch || false;

  const [phase, setPhase] = useState<GamePhase>('waiting');
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(VOTE_TIME);
  const [myVote, setMyVote] = useState<'A' | 'B' | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [orderedQuestions, setOrderedQuestions] = useState<DilemmaCard[]>([]);
  const [showGlitch, setShowGlitch] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  

  // Get current question from synced order
  const currentQuestion = orderedQuestions[questionIndex];

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy') => {
    if ('vibrate' in navigator) {
      const patterns = { light: [30], medium: [50, 30, 50], heavy: [100, 50, 100] };
      navigator.vibrate(patterns[type]);
    }
  };

  // Fetch room question order and players
  useEffect(() => {
    if (!roomId) return;

    const fetchRoomData = async () => {
      // Fetch room to get question_order
      const { data: roomData } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();

      if (roomData?.question_order && Array.isArray(roomData.question_order)) {
        // Map question IDs to actual question objects in the stored order
        const orderedCards = roomData.question_order
          .map((id: string) => majorityWinsCards.find(card => card.id === id))
          .filter((card): card is DilemmaCard => card !== undefined);
        setOrderedQuestions(orderedCards);
      }
    };

    const fetchPlayers = async () => {
      const { data } = await supabase
        .from('game_players')
        .select('*')
        .eq('room_id', roomId)
        .order('drinks_taken', { ascending: false });

      if (data) {
        setPlayers(data.map(p => ({
          id: p.id,
          nickname: p.nickname,
          avatar: p.avatar,
          drinksTaken: p.drinks_taken,
          isHost: p.is_host,
        })));

        const myPlayer = data.find(p => p.device_id === deviceId);
        if (myPlayer) setMyPlayerId(myPlayer.id);
      }
    };

    fetchRoomData();
    fetchPlayers();

    // Subscribe to room and player changes
    const channel = supabase
      .channel(`majority-game-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`,
        },
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
            }
          }
          if (newIndex !== questionIndex) {
            setQuestionIndex(newIndex);
          }
        }
      )
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_answers',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // Track votes for reveal
          setVotes(prev => [...prev, {
            playerId: payload.new.player_id,
            choice: payload.new.answer_index === 0 ? 'A' : 'B',
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, deviceId, phase, questionIndex]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'voting' || timeLeft <= 0) return;

    timerRef.current = setTimeout(() => {
      // Heartbeat haptic
      if (timeLeft <= 3) {
        triggerHaptic('medium');
      }

      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - host moves to countdown phase
          if (isHost) {
            startCountdown();
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

  const handleVote = async (choice: 'A' | 'B') => {
    if (hasVoted || !myPlayerId || !roomId) return;

    setHasVoted(true);
    setMyVote(choice);
    triggerHaptic('light');

    // Record vote as answer
    await supabase
      .from('player_answers')
      .insert({
        room_id: roomId,
        player_id: myPlayerId,
        question_index: questionIndex,
        answer_index: choice === 'A' ? 0 : 1,
        is_correct: false, // Will be updated on reveal
        points_earned: 0,
      });
  };

  const startCountdown = async () => {
    if (!isHost || !roomId) return;

    await supabase
      .from('game_rooms')
      .update({ current_phase: 'countdown' })
      .eq('id', roomId);

    // After 5 seconds, show reveal
    setTimeout(() => showReveal(), 5000);
  };

  const showReveal = useCallback(async () => {
    if (!isHost || !roomId) return;

    // Fetch all votes for this question
    const { data: answers } = await supabase
      .from('player_answers')
      .select('*')
      .eq('room_id', roomId)
      .eq('question_index', questionIndex);

    const votesA = answers?.filter(a => a.answer_index === 0).length || 0;
    const votesB = answers?.filter(a => a.answer_index === 1).length || 0;
    const total = votesA + votesB;

    // Determine majority
    let minority: 'A' | 'B' | 'tie' = 'tie';
    if (votesA > votesB) {
      minority = 'B';
    } else if (votesB > votesA) {
      minority = 'A';
    }

    // Apply penalties to minority
    if (minority !== 'tie' && answers) {
      const minorityPlayers = answers.filter(a => 
        (minority === 'A' && a.answer_index === 0) ||
        (minority === 'B' && a.answer_index === 1)
      );

      for (const answer of minorityPlayers) {
        const player = players.find(p => p.id === answer.player_id);
        if (player) {
          await supabase
            .from('game_players')
            .update({ drinks_taken: player.drinksTaken + 1 })
            .eq('id', player.id);
        }
      }
    } else if (minority === 'tie') {
      // Everyone drinks on a tie!
      for (const player of players) {
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
  }, [isHost, roomId, questionIndex, players]);

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
    localStorage.removeItem('majorityRoomId');
    localStorage.removeItem('majorityDeviceId');
    localStorage.removeItem('majorityIsHost');
    localStorage.removeItem('majorityCategory');
    resetGame();
  };

  // Calculate vote percentages
  const votesA = votes.filter(v => v.choice === 'A').length;
  const votesB = votes.filter(v => v.choice === 'B').length;
  const total = votesA + votesB || 1;
  const percentA = Math.round((votesA / total) * 100);
  const percentB = 100 - percentA;
  const isTie = votesA === votesB && total > 0;
  const minority = votesA < votesB ? 'A' : votesB < votesA ? 'B' : null;
  const myPlayer = players.find(p => p.id === myPlayerId);
  const isInMinority = myVote && minority === myVote;

  if (!roomId || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <p className="text-foreground">{isRTL ? 'טוען...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, hsl(222 47% 8%) 0%, hsl(222 47% 4%) 50%, ${primaryColor}20 100%)`,
      }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between p-4 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{categoryInfo[categoryKey]?.emoji}</span>
          <span className="text-muted-foreground text-sm">
            {questionIndex + 1} / {QUESTIONS_PER_GAME}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleHome}
            className="p-2 rounded-lg glass-card"
          >
            <Home className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        <AnimatePresence mode="wait">
          
          {/* WAITING PHASE */}
          {phase === 'waiting' && (
            <motion.div
              key="waiting"
              className="w-full max-w-md text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-6"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⚔️
              </motion.div>
              <h2 className="text-2xl font-black text-foreground mb-4">
                {isRTL ? 'מוכנים לקרב?' : 'Ready for Battle?'}
              </h2>
              <p className="text-muted-foreground mb-8">
                {isRTL ? `${players.length} לוחמים בזירה` : `${players.length} warriors in the arena`}
              </p>
              
              {isHost && (
                <Button
                  size="xl"
                  onClick={async () => {
                    await supabase
                      .from('game_rooms')
                      .update({ current_phase: 'voting' })
                      .eq('id', roomId);
                  }}
                  className="w-full text-xl font-black py-7"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}, hsl(330 85% 60%))`,
                  }}
                >
                  {isRTL ? '⚔️ התחל קרב!' : '⚔️ Start Battle!'}
                </Button>
              )}
            </motion.div>
          )}

          {/* VOTING PHASE */}
          {phase === 'voting' && currentQuestion && (
            <motion.div
              key={`voting-${questionIndex}`}
              className="w-full max-w-md"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
            >
              {/* Timer */}
              <div className="text-center mb-6">
                <motion.div
                  className="text-5xl font-black"
                  style={{ color: timeLeft <= 3 ? 'hsl(0 84% 60%)' : primaryColor }}
                  animate={timeLeft <= 3 ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.5, repeat: timeLeft <= 3 ? Infinity : 0 }}
                >
                  {timeLeft}
                </motion.div>
                <p className="text-muted-foreground text-sm">
                  {isRTL ? 'שניות להצביע' : 'seconds to vote'}
                </p>
              </div>

              {/* Question card */}
              <motion.div
                className="glass-card p-6 mb-6 text-center"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              >
                <p className="text-muted-foreground text-sm mb-2">
                  {isRTL ? 'מה עדיף?' : 'What\'s better?'}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {isRTL ? currentQuestion.optionA.textHe : currentQuestion.optionA.text}
                  <span className="text-muted-foreground mx-2">{isRTL ? 'או' : 'or'}</span>
                  {isRTL ? currentQuestion.optionB.textHe : currentQuestion.optionB.text}
                  ?
                </p>
              </motion.div>

              {/* Vote Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  onClick={() => handleVote('A')}
                  disabled={hasVoted}
                  className={`relative overflow-hidden p-6 rounded-2xl text-center font-bold text-lg transition-all ${
                    hasVoted && myVote === 'A'
                      ? 'ring-4 ring-white'
                      : 'hover:scale-105'
                  } ${isRTL ? 'font-heebo' : 'font-outfit'}`}
                  style={{ 
                    background: `linear-gradient(135deg, ${colorA}, ${colorA}cc)`,
                    opacity: hasVoted && myVote !== 'A' ? 0.5 : 1,
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-3xl block mb-2">🅰️</span>
                  <span className="text-white font-black text-game-base">
                    {isRTL ? currentQuestion.optionA.textHe : currentQuestion.optionA.text}
                  </span>
                  {hasVoted && myVote === 'A' && (
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </motion.button>

                <motion.button
                  onClick={() => handleVote('B')}
                  disabled={hasVoted}
                  className={`relative overflow-hidden p-6 rounded-2xl text-center font-bold text-lg transition-all ${
                    hasVoted && myVote === 'B'
                      ? 'ring-4 ring-white'
                      : 'hover:scale-105'
                  } ${isRTL ? 'font-heebo' : 'font-outfit'}`}
                  style={{ 
                    background: `linear-gradient(135deg, ${colorB}, ${colorB}cc)`,
                    opacity: hasVoted && myVote !== 'B' ? 0.5 : 1,
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-3xl block mb-2">🅱️</span>
                  <span className="text-white font-black text-game-base">
                    {isRTL ? currentQuestion.optionB.textHe : currentQuestion.optionB.text}
                  </span>
                  {hasVoted && myVote === 'B' && (
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </motion.button>
              </div>

              {hasVoted && (
                <motion.p
                  className="text-center text-muted-foreground mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {isRTL ? 'הצבעתך נרשמה! ממתין לשאר...' : 'Vote recorded! Waiting for others...'}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* COUNTDOWN PHASE */}
          {phase === 'countdown' && (
            <motion.div
              key="countdown"
              className="w-full max-w-md text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-8xl mb-8"
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                🥁
              </motion.div>
              <h2 className="text-3xl font-black text-foreground">
                {isRTL ? 'ספירת קולות...' : 'Counting votes...'}
              </h2>
              
              {/* Heartbeat effect */}
              <motion.div
                className="mt-8 w-24 h-24 mx-auto rounded-full"
                style={{ background: `${primaryColor}30` }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            </motion.div>
          )}

          {/* REVEAL PHASE */}
          {phase === 'reveal' && currentQuestion && (
            <motion.div
              key="reveal"
              className={`w-full max-w-md ${showGlitch ? 'animate-pulse' : ''}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onAnimationStart={() => {
                // Trigger glitch effect for stoner category
                if (hasGlitch) {
                  setShowGlitch(true);
                  setTimeout(() => setShowGlitch(false), 500);
                }
              }}
            >
              {/* Glitch overlay for stoner category */}
              {showGlitch && (
                <motion.div
                  className="fixed inset-0 z-50 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0, 1, 0],
                    x: [0, -5, 5, -3, 0],
                  }}
                  transition={{ duration: 0.5 }}
                  style={{
                    background: 'linear-gradient(90deg, rgba(255,0,255,0.1) 0%, rgba(0,255,255,0.1) 50%, rgba(255,0,255,0.1) 100%)',
                    mixBlendMode: 'overlay',
                  }}
                />
              )}

              {/* Split screen result with CRUSH animation */}
              <div className="relative h-56 mb-6 rounded-2xl overflow-hidden shadow-2xl">
                {/* Option A side - CRUSH animation */}
                <motion.div
                  className="absolute top-0 h-full flex items-center justify-center overflow-hidden"
                  initial={{ width: '50%', left: 0 }}
                  animate={{ 
                    width: percentA > percentB ? '100%' : `${Math.max(percentA, 15)}%`,
                    left: 0,
                    zIndex: percentA >= percentB ? 2 : 1,
                  }}
                  transition={{ 
                    duration: 1.2, 
                    ease: [0.16, 1, 0.3, 1], // Custom "crush" easing
                    delay: hasGlitch ? 0.5 : 0,
                  }}
                  style={{ 
                    background: `linear-gradient(135deg, ${colorA}, ${colorA}cc)`,
                    boxShadow: percentA > percentB ? `0 0 40px ${colorA}80` : 'none',
                  }}
                >
                  <motion.div 
                    className="text-center p-4"
                    initial={{ scale: 1 }}
                    animate={{ scale: percentA > percentB ? 1.1 : 0.9 }}
                    transition={{ delay: 1, duration: 0.3 }}
                  >
                    <p className="text-5xl font-black text-white drop-shadow-lg">{percentA}%</p>
                    <p className="text-base text-white/90 font-bold mt-2">
                      {isRTL ? currentQuestion.optionA.textHe : currentQuestion.optionA.text}
                    </p>
                    {percentA > percentB && (
                      <motion.div
                        className="text-2xl mt-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.2, type: 'spring' }}
                      >
                        👑
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>

                {/* Option B side - CRUSH animation */}
                <motion.div
                  className="absolute top-0 h-full flex items-center justify-center overflow-hidden"
                  initial={{ width: '50%', right: 0 }}
                  animate={{ 
                    width: percentB > percentA ? '100%' : `${Math.max(percentB, 15)}%`,
                    right: 0,
                    zIndex: percentB > percentA ? 2 : 1,
                  }}
                  transition={{ 
                    duration: 1.2, 
                    ease: [0.16, 1, 0.3, 1],
                    delay: hasGlitch ? 0.5 : 0,
                  }}
                  style={{ 
                    background: `linear-gradient(135deg, ${colorB}, ${colorB}cc)`,
                    boxShadow: percentB > percentA ? `0 0 40px ${colorB}80` : 'none',
                  }}
                >
                  <motion.div 
                    className="text-center p-4"
                    initial={{ scale: 1 }}
                    animate={{ scale: percentB > percentA ? 1.1 : 0.9 }}
                    transition={{ delay: 1, duration: 0.3 }}
                  >
                    <p className="text-5xl font-black text-white drop-shadow-lg">{percentB}%</p>
                    <p className="text-base text-white/90 font-bold mt-2">
                      {isRTL ? currentQuestion.optionB.textHe : currentQuestion.optionB.text}
                    </p>
                    {percentB > percentA && (
                      <motion.div
                        className="text-2xl mt-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.2, type: 'spring' }}
                      >
                        👑
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>

                {/* Splash/Impact effect at the crush point */}
                {percentA !== percentB && (
                  <motion.div
                    className="absolute top-0 bottom-0 w-4 z-10"
                    style={{ 
                      left: `${Math.min(percentA, percentB)}%`,
                      background: 'linear-gradient(90deg, transparent, white, transparent)',
                    }}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: [0, 1, 0], scaleY: [0, 1, 1] }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                  />
                )}
              </div>

              {/* Result message */}
              <motion.div
                className={`glass-card p-6 text-center ${
                  isInMinority ? 'ring-4 ring-red-500 animate-pulse' : ''
                } ${isTie ? 'ring-4 ring-yellow-400' : ''}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {isTie ? (
                  <>
                    <motion.div
                      className="text-6xl mb-4"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: 3 }}
                    >
                      🥂
                    </motion.div>
                    <h2 className="text-2xl font-black text-yellow-400 mb-2">
                      {isRTL ? 'תיקו מושלם!' : 'Perfect Tie!'}
                    </h2>
                    <p className="text-foreground text-lg">
                      {isRTL ? 'כולם שותים לחיים!' : 'Everyone drinks to that!'}
                    </p>
                  </>
                ) : isInMinority ? (
                  <>
                    <motion.div
                      className="text-6xl mb-4"
                      animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.4, repeat: 4 }}
                    >
                      👋
                    </motion.div>
                    <h2 className={`text-game-xl font-black text-red-500 mb-2 ${isRTL ? 'font-heebo' : ''}`}>
                      {isRTL ? 'שתה צ\'ייסר - אתה במיעוט!' : 'You\'re in the minority!'}
                    </h2>
                    <p className={`text-foreground text-game-lg ${isRTL ? 'font-heebo' : ''}`}>
                      🥃 {isRTL ? 'קיבלת כאפה!' : 'Take a shot!'}
                    </p>
                  </>
                ) : (
                  <>
                    <motion.div
                      className="text-6xl mb-4"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.3, repeat: 2 }}
                    >
                      🎉
                    </motion.div>
                    <h2 className="text-2xl font-black text-green-400 mb-2">
                      {isRTL ? 'אתה עם הרוב!' : 'You\'re with the majority!'}
                    </h2>
                    <p className="text-foreground text-lg">
                      {isRTL ? 'ניצלת הפעם!' : 'You\'re safe this time!'}
                    </p>
                  </>
                )}
              </motion.div>

              {/* Next button (host only) */}
              {isHost && (
                <motion.div
                  className="mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                >
                  <Button
                    size="xl"
                    onClick={nextQuestion}
                    className="w-full text-xl font-black py-7"
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}, hsl(330 85% 60%))`,
                    }}
                  >
                    {questionIndex >= QUESTIONS_PER_GAME - 1 
                      ? (isRTL ? '🏆 סיום!' : '🏆 Finish!')
                      : (isRTL ? '➡️ שאלה הבאה' : '➡️ Next Question')
                    }
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* GAME OVER PHASE */}
          {phase === 'gameover' && (
            <motion.div
              key="gameover"
              className="w-full max-w-md text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-8xl mb-6"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🏆
              </motion.div>
              <h2 className="text-3xl font-black text-foreground mb-2">
                {isRTL ? 'המלחמה הסתיימה!' : 'Battle Over!'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {isRTL ? 'ריכוז הכאפות:' : 'Slap summary:'}
              </p>

              {/* Leaderboard */}
              <div className="space-y-3 mb-8">
                {[...players].sort((a, b) => b.drinksTaken - a.drinksTaken).map((player, index) => (
                  <motion.div
                    key={player.id}
                    className={`glass-card p-4 flex items-center gap-3 ${
                      index === 0 ? 'ring-2 ring-red-500' : ''
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="text-2xl">{player.avatar}</span>
                    <span className="font-bold text-foreground flex-1 text-left">
                      {player.nickname}
                    </span>
                    <span className="text-xl font-black" style={{ color: primaryColor }}>
                      🥃 {player.drinksTaken}
                    </span>
                    {index === 0 && (
                      <span className="text-sm">👑</span>
                    )}
                  </motion.div>
                ))}
              </div>

              <Button
                size="xl"
                onClick={handleHome}
                className="w-full text-xl font-black py-7"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, hsl(330 85% 60%))`,
                }}
              >
                {isRTL ? '🏠 חזרה הביתה' : '🏠 Back Home'}
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Player drinks tracker */}
      {phase !== 'gameover' && (
        <motion.div
          className="flex justify-center gap-2 p-4 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {players.slice(0, 6).map(player => (
            <div
              key={player.id}
              className={`glass-card p-2 text-center min-w-[60px] ${
                player.id === myPlayerId ? 'ring-2 ring-primary' : ''
              }`}
            >
              <span className="text-lg">{player.avatar}</span>
              <p className="text-xs text-muted-foreground truncate max-w-[50px]">
                {player.nickname}
              </p>
              <p className="text-sm font-bold" style={{ color: primaryColor }}>
                🥃{player.drinksTaken}
              </p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default MajorityWinsGame;
