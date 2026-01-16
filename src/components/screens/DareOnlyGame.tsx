import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';

type GameLevel = 'soft' | 'wild' | 'extreme';

interface DareCard {
  id: string;
  type: 'dare';
  text: string;
  textHe: string;
  difficulty?: string;
}

// Penalties when user escapes - same as TruthDareShot
const drinkPenalties = [
  { text: 'One Sip', textHe: 'שלוק אחד', emoji: '🍺' },
  { text: 'Half a Glass', textHe: 'חצי כוס', emoji: '🍻' },
  { text: 'A Clean Shot!', textHe: 'צ\'ייסר נקי!', emoji: '🥃' },
];

const DareOnlyGame: React.FC = () => {
  const { language } = useLanguage();
  const isRTL = language === 'he';
  const { setCurrentScreen } = useGame();

  // Game state
  const [phase, setPhase] = useState<'levelSelect' | 'playing'>('levelSelect');
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null);
  const [cards, setCards] = useState<DareCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPenalty, setShowPenalty] = useState(false);
  const [currentPenalty, setCurrentPenalty] = useState<typeof drinkPenalties[0] | null>(null);
  const [direction, setDirection] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shuffle array helper
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Haptic feedback
  const triggerHaptic = (type: 'light' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      navigator.vibrate(type === 'heavy' ? 100 : 30);
    }
  };

  // API: Fetch Dare questions from GetLoose Server
  const fetchDareQuestions = useCallback(async (level: GameLevel): Promise<DareCard[]> => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL; // "http://localhost:3001"
      
      // Load all Dare questions
      const response = await fetch(`${baseUrl}/api/questions/category/Dare`);
      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.statusText}`);
      }
      
      const allDares = await response.json();
      
      // Map level to difficulty (handle case sensitivity!)
      const levelToDifficulty: Record<GameLevel, string[]> = {
        'soft': ['Easy', 'easy'],
        'wild': ['Medium', 'medium'],
        'extreme': ['Hard', 'hard', 'Extreme']
      };
      
      // Filter by difficulty (case-insensitive)
      const targetDifficulties = levelToDifficulty[level].map(d => d.toLowerCase());
      const filteredDares = allDares.filter((q: any) => {
        const qDifficulty = (q.difficult || '').toLowerCase().trim();
        return targetDifficulties.includes(qDifficulty);
      });
      
      if (filteredDares.length === 0) {
        console.warn(`No questions found for level ${level} - using all questions`);
        // Fallback: use all questions if none match
        const allCards: DareCard[] = allDares.map((q: any) => ({
          id: q._id || q.id || Math.random().toString(),
          type: 'dare' as const,
          text: q.questionEnglish || q.question || '',
          textHe: q.question || q.questionEnglish || '',
          difficulty: q.difficult
        }));
        return shuffleArray(allCards);
      }
      
      // Convert to DareCard format
      const dareCards: DareCard[] = filteredDares.map((q: any) => ({
        id: q._id || q.id || Math.random().toString(),
        type: 'dare' as const,
        text: q.questionEnglish || q.question || '',
        textHe: q.question || q.questionEnglish || '',
        difficulty: q.difficult
      }));
      
      // Shuffle
      return shuffleArray(dareCards);
    } catch (err) {
      console.error('Failed to fetch dare questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Start game with selected level
  const handleLevelSelect = async (level: GameLevel) => {
    setSelectedLevel(level);
    setCurrentIndex(0);
    setPhase('playing');
    triggerHaptic('heavy');

    // Load questions from API
    const loadedCards = await fetchDareQuestions(level);
    if (loadedCards.length > 0) {
      setCards(loadedCards);
    } else {
      // If no cards loaded, go back to level select
      setPhase('levelSelect');
    }

    // Shake screen for extreme level
    if (level === 'extreme') {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  // Handle escape (drink instead)
  const handleEscape = () => {
    const randomPenalty = drinkPenalties[Math.floor(Math.random() * drinkPenalties.length)];
    setCurrentPenalty(randomPenalty);
    setShowPenalty(true);
    triggerHaptic('heavy');
  };

  // Handle success (completed task)
  const handleSuccess = () => {
    triggerHaptic('light');
    goToNextCard();
  };

  // Go to next card
  const goToNextCard = () => {
    if (currentIndex < cards.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Close penalty popup and advance
  const closePenalty = () => {
    setShowPenalty(false);
    setCurrentPenalty(null);
    goToNextCard();
  };

  // Restart game
  const handleRestart = async () => {
    if (selectedLevel) {
      setCurrentIndex(0);
      const loadedCards = await fetchDareQuestions(selectedLevel);
      if (loadedCards.length > 0) {
        setCards(loadedCards);
      }
    }
  };

  // Back to level select
  const handleBackToLevels = () => {
    setPhase('levelSelect');
    setSelectedLevel(null);
    setCards([]);
    setCurrentIndex(0);
    setError(null);
  };

  // Exit game
  const handleExit = () => {
    setCurrentScreen('gameSelection');
  };

  const currentCard = cards[currentIndex];

  // Card animation variants - same as TruthDareShot
  const cardVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      rotateY: dir > 0 ? 15 : -15,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      rotateY: dir > 0 ? -15 : 15,
    }),
  };

  // Level selection screen - same as TruthDareShot
  if (phase === 'levelSelect') {
    return (
      <div className="min-h-screen px-4 py-6 flex flex-col bg-gradient-to-b from-background via-background to-background/90">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={handleExit}
            className="p-3 rounded-xl glass-card hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">
            {isRTL ? 'אמיצים בלבד' : 'Dare Only'}
          </h1>
          <div className="w-11" />
        </motion.div>

        {/* Title & Description */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-5xl mb-4 block">🔥</span>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {isRTL ? 'בחר את הרמה שלך' : 'Choose Your Level'}
          </h2>
          <p className="text-muted-foreground">
            {isRTL ? 'כמה אמיץ אתה?' : 'How brave are you?'}
          </p>
        </motion.div>

        {/* Level Cards - same design as TruthDareShot */}
        <div className="flex flex-col gap-4 max-w-md mx-auto w-full">
          {/* Soft Level */}
          <motion.button
            onClick={() => handleLevelSelect('soft')}
            className="relative overflow-hidden rounded-2xl p-6 text-right backdrop-blur-xl border border-white/10"
            style={{
              background: 'linear-gradient(135deg, hsl(190 95% 40% / 0.3), hsl(190 95% 50% / 0.1))',
              boxShadow: '0 0 30px hsl(190 95% 50% / 0.3)',
            }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute top-3 left-3 text-3xl">😇</div>
            <h3 className="text-xl font-bold text-cyan-300 mb-1" dir={isRTL ? 'rtl' : 'ltr'}>
              {isRTL ? 'קליל' : 'Soft'}
            </h3>
            <p className="text-sm text-cyan-200/70" dir={isRTL ? 'rtl' : 'ltr'}>
              {isRTL ? 'דר קליל וכיפי' : 'Fun, easy dares'}
            </p>
          </motion.button>

          {/* Wild Level */}
          <motion.button
            onClick={() => handleLevelSelect('wild')}
            className="relative overflow-hidden rounded-2xl p-6 text-right backdrop-blur-xl border border-white/10"
            style={{
              background: 'linear-gradient(135deg, hsl(271 91% 55% / 0.3), hsl(271 91% 65% / 0.1))',
              boxShadow: '0 0 30px hsl(271 91% 65% / 0.3)',
            }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute top-3 left-3 text-3xl">😈</div>
            <h3 className="text-xl font-bold text-purple-300 mb-1" dir={isRTL ? 'rtl' : 'ltr'}>
              {isRTL ? 'חצוף' : 'Wild'}
            </h3>
            <p className="text-sm text-purple-200/70" dir={isRTL ? 'rtl' : 'ltr'}>
              {isRTL ? 'דר פיקנטי ואמיץ' : 'Spicy and brave dares'}
            </p>
          </motion.button>

          {/* Extreme Level */}
          <motion.button
            onClick={() => handleLevelSelect('extreme')}
            className="relative overflow-hidden rounded-2xl p-6 text-right backdrop-blur-xl border border-white/10"
            style={{
              background: 'linear-gradient(135deg, hsl(0 84% 50% / 0.3), hsl(0 84% 60% / 0.1))',
              boxShadow: '0 0 30px hsl(0 84% 60% / 0.3)',
            }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute top-3 left-3 text-3xl">🔥</div>
            <h3 className="text-xl font-bold text-red-300 mb-1" dir={isRTL ? 'rtl' : 'ltr'}>
              {isRTL ? 'קיצוני' : 'Extreme'}
            </h3>
            <p className="text-sm text-red-200/70" dir={isRTL ? 'rtl' : 'ltr'}>
              {isRTL ? 'דר קיצוני ללא רחמים' : 'High-risk, extreme dares'}
            </p>
          </motion.button>
        </div>
      </div>
    );
  }

  // Game playing screen - same design as TruthDareShot
  return (
    <div 
      className={`min-h-screen px-4 py-6 flex flex-col relative ${isShaking ? 'animate-wiggle' : ''}`}
      style={{
        background: selectedLevel === 'soft' 
          ? 'linear-gradient(180deg, hsl(222 47% 8%) 0%, hsl(190 95% 50% / 0.1) 100%)'
          : selectedLevel === 'wild'
          ? 'linear-gradient(180deg, hsl(222 47% 8%) 0%, hsl(271 91% 65% / 0.1) 100%)'
          : 'linear-gradient(180deg, hsl(222 47% 8%) 0%, hsl(0 84% 60% / 0.1) 100%)',
      }}
    >
      {/* Background glow - same as TruthDareShot */}
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{
          background: selectedLevel === 'soft' 
            ? 'hsl(190 95% 50% / 0.2)'
            : selectedLevel === 'wild'
            ? 'hsl(271 91% 65% / 0.2)'
            : 'hsl(0 84% 60% / 0.2)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Header - same as TruthDareShot */}
      <motion.div
        className="flex items-center justify-between mb-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={handleBackToLevels}
          className="p-3 rounded-xl glass-card hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-muted-foreground">
            {currentIndex + 1}/{cards.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            className="p-3 rounded-xl glass-card hover:bg-muted/50 transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </motion.div>

      {/* Card Area */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center">
            <div className="text-4xl mb-4 animate-spin">⚡</div>
            <p className="text-muted-foreground">
              {isRTL ? 'טוען שאלות...' : 'Loading questions...'}
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {isRTL ? 'שגיאה בטעינת השאלות' : 'Error Loading Questions'}
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleBackToLevels} variant="outline">
              {isRTL ? 'חזרה' : 'Go Back'}
            </Button>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
            <div className="text-4xl mb-4">😔</div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {isRTL ? 'לא נמצאו שאלות' : 'No Questions Found'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isRTL ? 'לא נמצאו שאלות עבור הרמה שנבחרה' : 'No questions found for the selected level'}
            </p>
            <Button onClick={handleBackToLevels} variant="outline">
              {isRTL ? 'חזרה' : 'Go Back'}
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="wait" custom={direction}>
            {currentCard && (
              <motion.div
                key={currentCard.id}
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full max-w-sm"
              >
                <div
                  className="rounded-3xl p-8 backdrop-blur-xl border border-white/10 relative overflow-hidden"
                  style={{
                    background: selectedLevel === 'soft' 
                      ? 'linear-gradient(135deg, hsl(190 95% 40% / 0.4), hsl(190 95% 50% / 0.2))'
                      : selectedLevel === 'wild'
                      ? 'linear-gradient(135deg, hsl(271 91% 55% / 0.4), hsl(271 91% 65% / 0.2))'
                      : 'linear-gradient(135deg, hsl(0 84% 50% / 0.4), hsl(0 84% 60% / 0.2))',
                    boxShadow: selectedLevel === 'soft'
                      ? '0 0 40px hsl(190 95% 50% / 0.4)'
                      : selectedLevel === 'wild'
                      ? '0 0 40px hsl(271 91% 65% / 0.4)'
                      : '0 0 40px hsl(0 84% 60% / 0.4)',
                  }}
                >
                  {/* Card type badge - Only "Dare"! */}
                  <motion.div
                    className="flex justify-center mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    <span
                      className="px-5 py-2 rounded-full font-bold text-lg"
                      style={{
                        background: 'linear-gradient(135deg, hsl(25 95% 53%), hsl(25 95% 63%))',
                        color: 'white',
                      }}
                    >
                      {isRTL ? '🎯 חובה' : '🎯 Dare'}
                    </span>
                  </motion.div>

                  {/* Card text */}
                  <motion.h3
                    className="text-xl md:text-2xl font-bold text-foreground text-center leading-relaxed min-h-[120px] flex items-center justify-center"
                    dir={isRTL ? 'rtl' : 'ltr'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {isRTL ? currentCard.textHe : currentCard.text}
                  </motion.h3>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Action Buttons - same as TruthDareShot */}
      {!loading && !error && cards.length > 0 && currentCard && (
        <motion.div
          className="flex flex-col gap-4 relative z-10 max-w-sm mx-auto w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Success Button */}
          <Button
            onClick={handleSuccess}
            size="lg"
            className="w-full h-14 text-lg font-bold rounded-xl"
            style={{
              background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 76% 46%))',
              boxShadow: '0 0 20px hsl(142 76% 36% / 0.5)',
            }}
          >
            {isRTL ? '✅ ביצעתי! הבא' : '✅ Done! Next'}
          </Button>

          {/* Escape Button - Massive Vibrating */}
          <motion.button
            onClick={handleEscape}
            className="w-full h-16 text-xl font-black rounded-xl border-2 border-amber-400/50"
            style={{
              background: 'linear-gradient(135deg, hsl(45 93% 47% / 0.3), hsl(32 95% 44% / 0.2))',
              boxShadow: '0 0 30px hsl(45 93% 47% / 0.4)',
            }}
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            whileTap={{ scale: 0.95 }}
          >
            {isRTL ? '🥃 אני שותה!' : '🥃 I\'m Drinking!'}
          </motion.button>
        </motion.div>
      )}

      {/* Penalty Popup - same as TruthDareShot */}
      <AnimatePresence>
        {showPenalty && currentPenalty && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePenalty}
          >
            <motion.div
              className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bubbles decoration */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-4 h-4 rounded-full bg-white/20"
                    style={{
                      left: `${Math.random() * 100}%`,
                      bottom: 0,
                    }}
                    animate={{
                      y: [0, -400],
                      opacity: [0.5, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>

              <motion.span
                className="text-6xl block mb-4"
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
              >
                {currentPenalty.emoji}
              </motion.span>

              <h3 className="text-3xl font-black text-white mb-2">
                {isRTL ? 'עונש!' : 'Penalty!'}
              </h3>

              <p className="text-2xl font-bold text-amber-100 mb-6" dir={isRTL ? 'rtl' : 'ltr'}>
                {isRTL ? currentPenalty.textHe : currentPenalty.text}
              </p>

              <Button
                onClick={closePenalty}
                size="lg"
                className="w-full bg-white text-amber-700 hover:bg-amber-100 font-bold"
              >
                {isRTL ? 'הבנתי!' : 'Got it!'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DareOnlyGame;
