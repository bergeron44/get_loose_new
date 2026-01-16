import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Home, Trophy, Beer, Zap, Clock, SkipForward } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { getGameTheme } from '@/config/gameThemes';
import { triviaCards } from '@/data/gameData';
import type { TriviaPlayer, TriviaDifficulty } from '@/types/game';
import BarOffersWidget from '@/components/BarOffersWidget';

type GamePhase = 'question' | 'answering' | 'result' | 'leaderboard' | 'penalty' | 'gameover';

const QUESTION_TIME = 15; // seconds
const QUESTIONS_PER_ROUND = 3; // Show leaderboard every 3 questions

const TriviaMultiplayer: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen, resetGame } = useGame();
  const isRTL = language === 'he';
  
  const theme = getGameTheme('trivia');
  const primaryColor = theme ? `hsl(${theme.primaryColor})` : 'hsl(217 91% 60%)';
  const secondaryColor = theme ? `hsl(${theme.secondaryColor})` : 'hsl(45 93% 47%)';

  const [players, setPlayers] = useState<TriviaPlayer[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('question');
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showCorrect, setShowCorrect] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState(triviaCards);
  const [questionsAnsweredThisRound, setQuestionsAnsweredThisRound] = useState(0);

  useEffect(() => {
    // Load players from localStorage
    const storedPlayers = localStorage.getItem('triviaPlayers');
    if (storedPlayers) {
      setPlayers(JSON.parse(storedPlayers));
    }
    
    // Shuffle questions
    const shuffled = [...triviaCards].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
  }, []);

  const currentPlayer = players[currentPlayerIndex];
  const currentQuestion = shuffledQuestions[questionIndex];

  // Timer countdown
  useEffect(() => {
    if (phase !== 'answering' || timeLeft <= 0) return;
    
    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    if (timeLeft === 0) {
      handleTimeUp();
    }

    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  const handleTimeUp = useCallback(() => {
    // Time's up - wrong answer
    setShowCorrect(true);
    setPhase('result');
    
    // Update player stats
    setPlayers(prev => prev.map((p, i) => 
      i === currentPlayerIndex 
        ? { ...p, drinksTaken: p.drinksTaken + 1, streak: 0 }
        : p
    ));
  }, [currentPlayerIndex]);

  const startAnswering = () => {
    setPhase('answering');
    setTimeLeft(QUESTION_TIME);
    setSelectedAnswer(null);
    setShowCorrect(false);
  };

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return; // Already answered
    
    setSelectedAnswer(answerIndex);
    setShowCorrect(true);
    setPhase('result');

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const timeBonus = Math.floor((timeLeft / QUESTION_TIME) * 100);
    const points = isCorrect ? 100 + timeBonus : 0;

    setPlayers(prev => prev.map((p, i) => {
      if (i !== currentPlayerIndex) return p;
      return {
        ...p,
        score: p.score + points,
        streak: isCorrect ? p.streak + 1 : 0,
        drinksTaken: isCorrect ? p.drinksTaken : p.drinksTaken + 1,
      };
    }));
  };

  const nextTurn = () => {
    const newQuestionsAnswered = questionsAnsweredThisRound + 1;
    
    // Check if we should show leaderboard
    if (newQuestionsAnswered >= QUESTIONS_PER_ROUND) {
      setQuestionsAnsweredThisRound(0);
      setPhase('leaderboard');
      return;
    }

    // Move to next player
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextPlayerIndex);
    
    // If we've gone through all players, move to next question
    if (nextPlayerIndex === 0) {
      if (questionIndex >= shuffledQuestions.length - 1) {
        setPhase('gameover');
        return;
      }
      setQuestionIndex(prev => prev + 1);
    }

    setQuestionsAnsweredThisRound(newQuestionsAnswered);
    setPhase('question');
  };

  const continueFromLeaderboard = () => {
    // Find last place player for penalty
    const sortedPlayers = [...players].sort((a, b) => a.score - b.score);
    const lastPlace = sortedPlayers[0];
    
    if (lastPlace.score < sortedPlayers[sortedPlayers.length - 1].score) {
      // There's a clear loser - show penalty
      setPhase('penalty');
    } else {
      // Tie - continue
      moveToNextQuestion();
    }
  };

  const moveToNextQuestion = () => {
    if (questionIndex >= shuffledQuestions.length - 1) {
      setPhase('gameover');
      return;
    }
    
    setQuestionIndex(prev => prev + 1);
    setCurrentPlayerIndex(0);
    setPhase('question');
  };

  const handleBack = () => {
    setCurrentScreen('triviaLobby');
  };

  const handleHome = () => {
    resetGame();
  };

  const handleRestart = () => {
    setPlayers(prev => prev.map(p => ({ ...p, score: 0, drinksTaken: 0, streak: 0 })));
    setQuestionIndex(0);
    setCurrentPlayerIndex(0);
    setQuestionsAnsweredThisRound(0);
    setPhase('question');
    const shuffled = [...triviaCards].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
  };

  // Sort players by score for leaderboard
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const lastPlacePlayer = sortedPlayers[sortedPlayers.length - 1];

  if (!currentPlayer || !currentQuestion) {
    return null;
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
        <button
          onClick={handleBack}
          className="p-3 rounded-xl glass-card hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <span className="text-muted-foreground text-sm">
            {questionIndex + 1} / {shuffledQuestions.length}
          </span>
        </div>

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
          
          {/* QUESTION PHASE - Show current player and question */}
          {phase === 'question' && (
            <motion.div
              key="question"
              className="w-full max-w-md text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
            >
              {/* Current Player */}
              <motion.div
                className="glass-card p-4 mb-6 inline-flex items-center gap-3"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              >
                <span className="text-4xl">{currentPlayer.avatar}</span>
                <div className="text-left">
                  <p className="font-bold text-foreground text-lg">{currentPlayer.nickname}</p>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? `${currentPlayer.score} נקודות` : `${currentPlayer.score} pts`}
                  </p>
                </div>
                {currentPlayer.streak >= 2 && (
                  <span className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {currentPlayer.streak}
                  </span>
                )}
              </motion.div>

              {/* Question Card */}
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

              <Button
                size="xl"
                onClick={startAnswering}
                className="w-full text-xl font-black py-7"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  boxShadow: `0 0 30px ${primaryColor}50`,
                }}
              >
                {isRTL ? '🎯 התחל!' : '🎯 Start!'}
              </Button>
            </motion.div>
          )}

          {/* ANSWERING PHASE - Timer + Options */}
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ 
                    background: timeLeft <= 5 ? 'hsl(0 84% 60% / 0.2)' : `${primaryColor}20`,
                    color: timeLeft <= 5 ? 'hsl(0 84% 60%)' : primaryColor,
                  }}
                >
                  <Clock className="w-5 h-5" />
                  <span className="text-2xl font-black">{timeLeft}</span>
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
                  
                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      className="p-4 rounded-xl glass-card-hover text-center font-bold text-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={selectedAnswer !== null}
                    >
                      {optionText}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* RESULT PHASE - Show if correct/wrong */}
          {phase === 'result' && (
            <motion.div
              key="result"
              className="w-full max-w-md text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <>
                  <motion.div
                    className="text-8xl mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                  >
                    🎉
                  </motion.div>
                  <h2 
                    className="text-4xl font-black mb-2"
                    style={{ color: 'hsl(142 76% 36%)' }}
                  >
                    {isRTL ? 'נכון!' : 'Correct!'}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    +{100 + Math.floor((timeLeft / QUESTION_TIME) * 100)} {isRTL ? 'נקודות' : 'points'}
                  </p>
                </>
              ) : (
                <>
                  <motion.div
                    className="text-8xl mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    🍺
                  </motion.div>
                  <h2 
                    className="text-4xl font-black mb-2"
                    style={{ color: 'hsl(0 84% 60%)' }}
                  >
                    {isRTL ? 'לשתות!' : 'Drink!'}
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    {isRTL ? 'התשובה הנכונה:' : 'Correct answer:'}
                  </p>
                  <p className="text-xl font-bold text-foreground mb-6">
                    {isRTL && currentQuestion.optionsHe 
                      ? currentQuestion.optionsHe[currentQuestion.correctAnswer!]
                      : currentQuestion.options?.[currentQuestion.correctAnswer!]
                    }
                  </p>
                </>
              )}

              <Button
                size="lg"
                onClick={nextTurn}
                className="w-full text-lg font-bold py-5"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                <SkipForward className="w-5 h-5 mr-2" />
                {isRTL ? 'הבא' : 'Next'}
              </Button>
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
                      <p className="text-xs text-muted-foreground">
                        {player.drinksTaken} {isRTL ? 'שתיות' : 'drinks'}
                      </p>
                    </div>
                    <span className="text-xl font-black" style={{ color: primaryColor }}>
                      {player.score}
                    </span>
                  </motion.div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={continueFromLeaderboard}
                className="w-full text-lg font-bold py-5"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                {isRTL ? 'המשך' : 'Continue'}
              </Button>
            </motion.div>
          )}

          {/* PENALTY PHASE - Last place drinks */}
          {phase === 'penalty' && lastPlacePlayer && (
            <motion.div
              key="penalty"
              className="w-full max-w-md text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                className="text-8xl mb-4"
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
              >
                🍻
              </motion.div>
              
              <h2 
                className="text-3xl font-black mb-4"
                style={{ color: 'hsl(0 84% 60%)' }}
              >
                {isRTL ? 'עונש למקום האחרון!' : 'Last Place Penalty!'}
              </h2>

              <div className="glass-card p-6 mb-6">
                <span className="text-5xl">{lastPlacePlayer.avatar}</span>
                <p className="text-2xl font-black text-foreground mt-2">
                  {lastPlacePlayer.nickname}
                </p>
                <p className="text-lg text-muted-foreground mt-2">
                  {isRTL ? 'שותה שוט! 🥃' : 'Takes a shot! 🥃'}
                </p>
              </div>

              <Button
                size="lg"
                onClick={moveToNextQuestion}
                className="w-full text-lg font-bold py-5"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                {isRTL ? 'המשך למשחק' : 'Continue Game'}
              </Button>
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

              <h2 
                className="text-3xl font-black mb-2"
                style={{ color: secondaryColor }}
              >
                {isRTL ? 'סיום המשחק!' : 'Game Over!'}
              </h2>

              <p className="text-muted-foreground mb-6">
                {isRTL ? 'והמנצח הוא...' : 'And the winner is...'}
              </p>

              <motion.div
                className="glass-card p-6 border-2 mb-6"
                style={{ borderColor: secondaryColor }}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-6xl">{sortedPlayers[0]?.avatar}</span>
                <p className="text-3xl font-black text-foreground mt-2">
                  {sortedPlayers[0]?.nickname}
                </p>
                <p className="text-xl mt-1" style={{ color: primaryColor }}>
                  {sortedPlayers[0]?.score} {isRTL ? 'נקודות' : 'points'}
                </p>
              </motion.div>

              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  onClick={handleRestart}
                  className="w-full text-lg font-bold py-5"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  {isRTL ? 'משחק חדש' : 'Play Again'}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleHome}
                  className="w-full"
                >
                  <Home className="w-5 h-5 mr-2" />
                  {isRTL ? 'חזרה לתפריט' : 'Back to Menu'}
                </Button>
              </div>
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

export default TriviaMultiplayer;
