import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Home, Trophy, Beer, Zap, Clock, Crown, Flame } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { getGameTheme } from '@/config/gameThemes';
import { triviaCards } from '@/data/gameData';
import { supabase } from '@/integrations/supabase/client';
import type { TriviaPlayer, PlayerAnswer } from '@/types/game';
import BarOffersWidget from '@/components/BarOffersWidget';

type GamePhase = 'waiting' | 'question' | 'answering' | 'results' | 'leaderboard' | 'gameover';

const QUESTION_TIME = 15; // seconds
const QUESTIONS_PER_ROUND = 3;

interface RoundResult {
  playerId: string;
  nickname: string;
  avatar: string;
  isCorrect: boolean;
  answerTimeMs: number;
  pointsEarned: number;
}

const TriviaPartyGame: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen, resetGame } = useGame();
  const isRTL = language === 'he';
  
  const theme = getGameTheme('trivia');
  const primaryColor = theme ? `hsl(${theme.primaryColor})` : 'hsl(217 91% 60%)';
  const secondaryColor = theme ? `hsl(${theme.secondaryColor})` : 'hsl(45 93% 47%)';

  // Get stored info
  const roomId = localStorage.getItem('partyRoomId');
  const deviceId = localStorage.getItem('partyDeviceId');
  const isHost = localStorage.getItem('partyIsHost') === 'true';

  const [phase, setPhase] = useState<GamePhase>('waiting');
  const [players, setPlayers] = useState<TriviaPlayer[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [shuffledQuestions] = useState(() => [...triviaCards].sort(() => Math.random() - 0.5));
  const [questionsAnsweredThisRound, setQuestionsAnsweredThisRound] = useState(0);
  
  const questionStartTime = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = shuffledQuestions[questionIndex];

  // Fetch players and subscribe to changes
  useEffect(() => {
    if (!roomId) return;

    const fetchPlayers = async () => {
      const { data } = await supabase
        .from('game_players')
        .select('*')
        .eq('room_id', roomId)
        .order('score', { ascending: false });

      if (data) {
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

        // Find my player
        const myPlayer = data.find(p => p.device_id === deviceId);
        if (myPlayer) setMyPlayerId(myPlayer.id);
      }
    };

    fetchPlayers();

    // Subscribe to room changes
    const roomChannel = supabase
      .channel(`game-room-${roomId}`)
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
          const newQuestionIndex = payload.new.current_question_index;
          
          if (newPhase !== phase) {
            setPhase(newPhase);
            if (newPhase === 'answering') {
              questionStartTime.current = Date.now();
              setTimeLeft(QUESTION_TIME);
              setSelectedAnswer(null);
              setHasAnswered(false);
            }
          }
          if (newQuestionIndex !== questionIndex) {
            setQuestionIndex(newQuestionIndex);
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
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, deviceId, phase, questionIndex]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'answering' || timeLeft <= 0) return;
    
    timerRef.current = setTimeout(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (!hasAnswered) {
            handleAnswer(null); // Auto-submit as wrong if no answer
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, timeLeft, hasAnswered]);

  // Show results after all answer or time up
  const showResults = useCallback(async () => {
    if (!isHost || !roomId) return;

    // Fetch all answers for this question
    const { data: answers } = await supabase
      .from('player_answers')
      .select('*')
      .eq('room_id', roomId)
      .eq('question_index', questionIndex);

    // Calculate results
    const results: RoundResult[] = players.map(player => {
      const answer = answers?.find(a => a.player_id === player.id);
      return {
        playerId: player.id,
        nickname: player.nickname,
        avatar: player.avatar,
        isCorrect: answer?.is_correct || false,
        answerTimeMs: answer?.answer_time_ms || QUESTION_TIME * 1000,
        pointsEarned: answer?.points_earned || 0,
      };
    });

    // Sort by answer time (fastest first)
    results.sort((a, b) => a.answerTimeMs - b.answerTimeMs);
    setRoundResults(results);

    // Apply "The Last One Drinks" penalty
    const correctAnswers = results.filter(r => r.isCorrect);
    if (correctAnswers.length > 0) {
      // The slowest correct answer drinks!
      const slowestCorrect = correctAnswers[correctAnswers.length - 1];
      await supabase
        .from('game_players')
        .update({ drinks_taken: (players.find(p => p.id === slowestCorrect.playerId)?.drinksTaken || 0) + 1 })
        .eq('id', slowestCorrect.playerId);
    }

    // Check for "Lone Loser" - everyone got it right except one person
    const wrongAnswers = results.filter(r => !r.isCorrect);
    if (wrongAnswers.length === 1 && correctAnswers.length >= 2) {
      // Double penalty for the lone loser!
      await supabase
        .from('game_players')
        .update({ drinks_taken: (players.find(p => p.id === wrongAnswers[0].playerId)?.drinksTaken || 0) + 1 })
        .eq('id', wrongAnswers[0].playerId);
    }

    await supabase
      .from('game_rooms')
      .update({ current_phase: 'results' })
      .eq('id', roomId);
  }, [isHost, roomId, questionIndex, players]);

  // Check if all players have answered - Host only
  useEffect(() => {
    if (!isHost || phase !== 'answering' || !roomId || players.length === 0) return;

    const checkAllAnswered = async () => {
      const { data: answers } = await supabase
        .from('player_answers')
        .select('player_id')
        .eq('room_id', roomId)
        .eq('question_index', questionIndex);

      if (answers && answers.length >= players.length) {
        // All players answered - move to results immediately!
        if (timerRef.current) clearTimeout(timerRef.current);
        showResults();
      }
    };

    // Subscribe to new answers
    const answersChannel = supabase
      .channel(`answers-${roomId}-${questionIndex}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_answers',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          checkAllAnswered();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(answersChannel);
    };
  }, [isHost, phase, roomId, questionIndex, players.length, showResults]);

  // Host controls game flow
  const startQuestion = useCallback(async () => {
    if (!isHost || !roomId) return;

    await supabase
      .from('game_rooms')
      .update({
        current_phase: 'answering',
        question_start_time: new Date().toISOString(),
      })
      .eq('id', roomId);
  }, [isHost, roomId]);

  const handleAnswer = async (answerIndex: number | null) => {
    if (hasAnswered || !myPlayerId || !roomId) return;
    
    setHasAnswered(true);
    setSelectedAnswer(answerIndex);
    
    const answerTimeMs = Date.now() - questionStartTime.current;
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
    // Speed bonus: max 100 points for instant answer, decreasing to 0 over 15 seconds
    const speedBonus = Math.max(0, Math.floor(100 * (1 - answerTimeMs / (QUESTION_TIME * 1000))));
    const points = isCorrect ? 100 + speedBonus : 0;

    // Record answer
    await supabase
      .from('player_answers')
      .insert({
        room_id: roomId,
        player_id: myPlayerId,
        question_index: questionIndex,
        answer_index: answerIndex,
        answer_time_ms: answerTimeMs,
        is_correct: isCorrect,
        points_earned: points,
      });

    // Update player score
    const playerUpdate: any = {
      score: players.find(p => p.id === myPlayerId)!.score + points,
      last_answer_time: new Date().toISOString(),
    };

    if (isCorrect) {
      playerUpdate.streak = (players.find(p => p.id === myPlayerId)?.streak || 0) + 1;
    } else {
      playerUpdate.streak = 0;
      playerUpdate.drinks_taken = (players.find(p => p.id === myPlayerId)?.drinksTaken || 0) + 1;
    }

    await supabase
      .from('game_players')
      .update(playerUpdate)
      .eq('id', myPlayerId);
  };

  const nextQuestion = useCallback(async () => {
    if (!isHost || !roomId) return;

    const newQuestionsAnswered = questionsAnsweredThisRound + 1;
    
    if (newQuestionsAnswered >= QUESTIONS_PER_ROUND) {
      setQuestionsAnsweredThisRound(0);
      await supabase
        .from('game_rooms')
        .update({ current_phase: 'leaderboard' })
        .eq('id', roomId);
      return;
    }

    if (questionIndex >= shuffledQuestions.length - 1) {
      await supabase
        .from('game_rooms')
        .update({ current_phase: 'gameover' })
        .eq('id', roomId);
      return;
    }

    setQuestionsAnsweredThisRound(newQuestionsAnswered);
    await supabase
      .from('game_rooms')
      .update({
        current_question_index: questionIndex + 1,
        current_phase: 'question',
      })
      .eq('id', roomId);
  }, [isHost, roomId, questionIndex, questionsAnsweredThisRound, shuffledQuestions.length]);

  const continueFromLeaderboard = useCallback(async () => {
    if (!isHost || !roomId) return;

    if (questionIndex >= shuffledQuestions.length - 1) {
      await supabase
        .from('game_rooms')
        .update({ current_phase: 'gameover' })
        .eq('id', roomId);
      return;
    }

    await supabase
      .from('game_rooms')
      .update({
        current_question_index: questionIndex + 1,
        current_phase: 'question',
      })
      .eq('id', roomId);
  }, [isHost, roomId, questionIndex, shuffledQuestions.length]);

  const handleHome = () => {
    localStorage.removeItem('partyRoomId');
    localStorage.removeItem('partyDeviceId');
    localStorage.removeItem('partyIsHost');
    resetGame();
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const fastestPlayer = roundResults.find(r => r.isCorrect);
  const slowestCorrect = [...roundResults].filter(r => r.isCorrect).pop();
  const loneLoser = roundResults.filter(r => !r.isCorrect).length === 1 
    ? roundResults.find(r => !r.isCorrect) 
    : null;
  const myPlayer = players.find(p => p.id === myPlayerId);

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
        background: `linear-gradient(180deg, hsl(222 47% 8%) 0%, hsl(222 47% 4%) 50%, ${theme?.bgAccent || 'hsl(217 91% 60% / 0.15)'} 100%)`,
      }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between p-4 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <span className="text-muted-foreground text-sm">
            {questionIndex + 1} / {shuffledQuestions.length}
          </span>
        </div>
        
        {myPlayer && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card">
            <span>{myPlayer.avatar}</span>
            <span className="font-bold text-sm" style={{ color: primaryColor }}>
              {myPlayer.score}
            </span>
          </div>
        )}

        <button
          onClick={handleHome}
          className="p-3 rounded-xl glass-card hover:bg-muted/50 transition-colors"
        >
          <Home className="w-5 h-5 text-foreground" />
        </button>
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
                ⏳
              </motion.div>
              <h2 className="text-2xl font-black text-foreground mb-4">
                {isRTL ? 'מחכים להתחלה...' : 'Waiting to start...'}
              </h2>
              <p className="text-muted-foreground">
                {isRTL ? `${players.length} שחקנים מחוברים` : `${players.length} players connected`}
              </p>
              
              {isHost && (
                <Button
                  size="xl"
                  onClick={startQuestion}
                  className="w-full text-xl font-black py-7 mt-8"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  {isRTL ? '🎯 התחל!' : '🎯 Start!'}
                </Button>
              )}
            </motion.div>
          )}

          {/* QUESTION PHASE - Show question before timer starts */}
          {phase === 'question' && (
            <motion.div
              key="question"
              className="w-full max-w-md text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="glass-card p-6 text-center border-2 mb-6"
                style={{ 
                  borderColor: `${primaryColor}40`,
                  boxShadow: `0 0 30px ${primaryColor}30`,
                }}
              >
                <p className="text-xl md:text-2xl font-bold text-foreground">
                  {isRTL ? currentQuestion.textHe : currentQuestion.text}
                </p>
              </motion.div>

              {isHost && (
                <Button
                  size="xl"
                  onClick={startQuestion}
                  className="w-full text-xl font-black py-7"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  {isRTL ? '⏱️ התחל ספירה!' : '⏱️ Start Timer!'}
                </Button>
              )}
            </motion.div>
          )}

          {/* ANSWERING PHASE */}
          {phase === 'answering' && (
            <motion.div
              key="answering"
              className="w-full max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Timer */}
              <motion.div
                className="text-center mb-6"
                animate={{ scale: timeLeft <= 5 ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
              >
                <div 
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full"
                  style={{ 
                    background: timeLeft <= 5 ? 'hsl(0 84% 60% / 0.2)' : `${primaryColor}20`,
                    color: timeLeft <= 5 ? 'hsl(0 84% 60%)' : primaryColor,
                  }}
                >
                  <Clock className="w-6 h-6" />
                  <span className="text-4xl font-black">{timeLeft}</span>
                </div>
              </motion.div>

              {/* Question */}
              <div className="glass-card p-4 mb-6 text-center">
                <p className="text-lg font-bold text-foreground">
                  {isRTL ? currentQuestion.textHe : currentQuestion.text}
                </p>
              </div>

              {/* Answer Options */}
              <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options?.map((option, index) => {
                  const optionText = isRTL && currentQuestion.optionsHe 
                    ? currentQuestion.optionsHe[index] 
                    : option;
                  
                  const isSelected = selectedAnswer === index;
                  
                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      className={`p-5 rounded-xl text-center font-bold text-lg transition-all ${
                        hasAnswered 
                          ? isSelected 
                            ? 'ring-4 ring-primary' 
                            : 'opacity-50'
                          : 'glass-card-hover'
                      }`}
                      style={{
                        background: isSelected ? `${primaryColor}30` : undefined,
                      }}
                      whileHover={!hasAnswered ? { scale: 1.02 } : {}}
                      whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                      disabled={hasAnswered}
                    >
                      {optionText}
                    </motion.button>
                  );
                })}
              </div>

              {hasAnswered && (
                <motion.p
                  className="text-center text-muted-foreground mt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {isRTL ? 'ממתין לשאר השחקנים...' : 'Waiting for other players...'}
                </motion.p>
              )}

              {/* Host: Show results button when all answered or time up */}
              {isHost && timeLeft === 0 && (
                <Button
                  size="lg"
                  onClick={showResults}
                  className="w-full mt-6"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  {isRTL ? 'הצג תוצאות' : 'Show Results'}
                </Button>
              )}
            </motion.div>
          )}

          {/* RESULTS PHASE */}
          {phase === 'results' && (
            <motion.div
              key="results"
              className="w-full max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Fastest Player */}
              {fastestPlayer && (
                <motion.div
                  className="text-center mb-6"
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Flame className="w-6 h-6 text-orange-500" />
                    <span className="text-lg font-bold text-orange-500">
                      {isRTL ? 'הכי מהיר!' : 'Fastest Finger!'}
                    </span>
                    <Flame className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="glass-card p-4 inline-flex items-center gap-3">
                    <span className="text-4xl">{fastestPlayer.avatar}</span>
                    <div>
                      <p className="font-bold text-foreground text-xl">{fastestPlayer.nickname}</p>
                      <p className="text-sm" style={{ color: primaryColor }}>
                        +{fastestPlayer.pointsEarned} {isRTL ? 'נק׳' : 'pts'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* "The Last One Drinks" */}
              {slowestCorrect && slowestCorrect !== fastestPlayer && (
                <motion.div
                  className="glass-card p-4 mb-4 border-2 border-destructive/50"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🐢</span>
                    <div className="flex-1">
                      <p className="font-bold text-destructive">
                        {isRTL ? 'האיטי ביותר!' : 'The Slowest!'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {slowestCorrect.nickname} - {isRTL ? 'שותה שלוק!' : 'Takes a sip!'}
                      </p>
                    </div>
                    <span className="text-2xl">{slowestCorrect.avatar}</span>
                  </div>
                </motion.div>
              )}

              {/* Lone Loser - Double penalty! */}
              {loneLoser && (
                <motion.div
                  className="glass-card p-4 mb-4 border-2"
                  style={{ borderColor: 'hsl(0 84% 60%)' }}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">😱</span>
                    <div className="flex-1">
                      <p className="font-bold" style={{ color: 'hsl(0 84% 60%)' }}>
                        {isRTL ? 'הטועה היחיד!' : 'The Lone Loser!'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {loneLoser.nickname} - {isRTL ? '2 צ׳ייסרים!' : '2 Chasers!'}
                      </p>
                    </div>
                    <span className="text-2xl">{loneLoser.avatar}</span>
                  </div>
                </motion.div>
              )}

              {/* Correct Answer */}
              <div className="glass-card p-4 mb-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  {isRTL ? 'התשובה הנכונה:' : 'Correct Answer:'}
                </p>
                <p className="text-xl font-bold" style={{ color: 'hsl(142 76% 36%)' }}>
                  {isRTL && currentQuestion.optionsHe 
                    ? currentQuestion.optionsHe[currentQuestion.correctAnswer!]
                    : currentQuestion.options?.[currentQuestion.correctAnswer!]
                  }
                </p>
              </div>

              {isHost && (
                <Button
                  size="lg"
                  onClick={nextQuestion}
                  className="w-full text-lg font-bold py-5"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  {isRTL ? 'הבא' : 'Next'}
                </Button>
              )}
            </motion.div>
          )}

          {/* LEADERBOARD PHASE */}
          {phase === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              className="w-full max-w-md"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-6">
                <Trophy className="w-12 h-12 mx-auto mb-2" style={{ color: secondaryColor }} />
                <h2 className="text-2xl font-black text-foreground">
                  {isRTL ? 'טבלת המובילים' : 'Leaderboard'}
                </h2>
              </div>

              <div className="space-y-3 mb-6">
                {sortedPlayers.map((player, index) => (
                  <motion.div
                    key={player.id}
                    className={`glass-card p-4 flex items-center gap-3 ${index === 0 ? 'border-2' : ''}`}
                    style={{ borderColor: index === 0 ? secondaryColor : 'transparent' }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="text-2xl font-black text-muted-foreground w-8">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                    </span>
                    <span className="text-2xl">{player.avatar}</span>
                    <div className="flex-1">
                      <p className="font-bold text-foreground">{player.nickname}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>🍺 {player.drinksTaken}</span>
                        {player.streak >= 2 && (
                          <span className="flex items-center gap-1 text-orange-400">
                            <Zap className="w-3 h-3" /> {player.streak}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xl font-black" style={{ color: primaryColor }}>
                      {player.score}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Most Drunk Award */}
              {sortedPlayers.length > 0 && (
                <motion.div
                  className="glass-card p-4 mb-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="text-3xl">🍻</span>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'הכי שיכור:' : 'Most Drunk:'}
                  </p>
                  <p className="font-bold text-foreground">
                    {[...sortedPlayers].sort((a, b) => b.drinksTaken - a.drinksTaken)[0]?.nickname}
                    <span className="text-muted-foreground ml-2">
                      ({[...sortedPlayers].sort((a, b) => b.drinksTaken - a.drinksTaken)[0]?.drinksTaken} 🍺)
                    </span>
                  </p>
                </motion.div>
              )}

              {isHost && (
                <Button
                  size="lg"
                  onClick={continueFromLeaderboard}
                  className="w-full text-lg font-bold py-5"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  {isRTL ? 'המשך' : 'Continue'}
                </Button>
              )}
            </motion.div>
          )}

          {/* GAME OVER */}
          {phase === 'gameover' && (
            <motion.div
              key="gameover"
              className="w-full max-w-md text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                className="text-7xl mb-4 flex justify-center gap-2"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
              >
                <span>🎉</span>
                <span>🏆</span>
                <span>🎉</span>
              </motion.div>

              <h2 className="text-3xl font-black mb-2" style={{ color: secondaryColor }}>
                {isRTL ? 'סיום המשחק!' : 'Game Over!'}
              </h2>

              <motion.div
                className="glass-card p-6 border-2 mb-6"
                style={{ borderColor: secondaryColor }}
              >
                <Crown className="w-8 h-8 mx-auto mb-2" style={{ color: secondaryColor }} />
                <span className="text-6xl">{sortedPlayers[0]?.avatar}</span>
                <p className="text-3xl font-black text-foreground mt-2">
                  {sortedPlayers[0]?.nickname}
                </p>
                <p className="text-xl mt-1" style={{ color: primaryColor }}>
                  {sortedPlayers[0]?.score} {isRTL ? 'נקודות' : 'points'}
                </p>
              </motion.div>

              <Button
                size="lg"
                onClick={handleHome}
                className="w-full text-lg font-bold py-5"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <Home className="w-5 h-5 mr-2" />
                {isRTL ? 'חזרה לתפריט' : 'Back to Menu'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bar Offers - only on leaderboard */}
      {phase === 'leaderboard' && (
        <motion.div
          className="p-4 flex justify-center relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <BarOffersWidget />
        </motion.div>
      )}
    </div>
  );
};

export default TriviaPartyGame;