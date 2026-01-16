import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  ArrowLeft, 
  SkipForward, 
  RotateCcw, 
  Home,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Timer,
  HelpCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { getGameCards, GameCard } from '@/data/gameData';
import { Button } from '@/components/ui/button';
import { getGameTheme } from '@/config/gameThemes';
import AutoDismissInstructions from '@/components/AutoDismissInstructions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Game instructions data
const gameInstructions: Record<string, { titleEn: string; titleHe: string; steps: { icon: string; en: string; he: string }[] }> = {
  icebreaker: {
    titleEn: 'Icebreaker',
    titleHe: 'שובר קרח',
    steps: [
      { icon: '👆', en: 'Swipe through cards', he: 'החליקו בין הקלפים' },
      { icon: '💬', en: 'Answer the question or complete the task', he: 'ענו על השאלה או השלימו את המשימה' },
      { icon: '🍺', en: 'Skip? Take a sip!', he: 'מדלגים? לוגמים!' },
    ],
  },
  guessWho: {
    titleEn: 'Guess Who',
    titleHe: 'נחשו מי',
    steps: [
      { icon: '📱', en: 'Put phone on forehead', he: 'שימו טלפון על המצח' },
      { icon: '⏱️', en: 'You have 60 seconds!', he: 'יש לכם 60 שניות!' },
      { icon: '👥', en: 'Friends give you clues', he: 'חברים נותנים רמזים' },
      { icon: '👎', en: "Time's up? Drink!", he: 'נגמר הזמן? שותים!' },
    ],
  },
  doOrDrink: {
    titleEn: 'Do or Drink',
    titleHe: 'עשה או שתה',
    steps: [
      { icon: '🎯', en: 'Read the challenge', he: 'קראו את האתגר' },
      { icon: '✅', en: 'Complete it or drink!', he: 'השלימו או שתו!' },
    ],
  },
  trivia: {
    titleEn: 'Trivia',
    titleHe: 'טריוויה',
    steps: [
      { icon: '❓', en: 'Read the question', he: 'קראו את השאלה' },
      { icon: '🔘', en: 'Choose your answer', he: 'בחרו תשובה' },
      { icon: '❌', en: 'Wrong answer? Drink!', he: 'טעיתם? שותים!' },
    ],
  },
  truthOrDare: {
    titleEn: 'Truth or Dare',
    titleHe: 'אמת או חובה',
    steps: [
      { icon: '🔮', en: 'Get a truth or dare', he: 'קבלו אמת או חובה' },
      { icon: '💡', en: 'Answer honestly or do the dare', he: 'ענו בכנות או בצעו את החובה' },
      { icon: '🍺', en: 'Chicken out? Drink!', he: 'מפחדים? שותים!' },
    ],
  },
  neverHaveI: {
    titleEn: 'Never Have I Ever',
    titleHe: 'מעולם לא',
    steps: [
      { icon: '👀', en: 'Read the statement', he: 'קראו את המשפט' },
      { icon: '🙋', en: 'Done it? Take a sip!', he: 'עשיתם את זה? לגימה!' },
    ],
  },
  mostLikely: {
    titleEn: 'Most Likely To',
    titleHe: 'מי הכי סביר',
    steps: [
      { icon: '👉', en: 'Read the "Most likely to..." prompt', he: 'קראו את "מי הכי סביר..."' },
      { icon: '🗳️', en: 'Everyone points at someone', he: 'כולם מצביעים על מישהו' },
      { icon: '🍺', en: 'Most votes drinks!', he: 'מי שקיבל הכי הרבה - שותה!' },
    ],
  },
  kingsCup: {
    titleEn: "King's Cup",
    titleHe: 'כוס המלך',
    steps: [
      { icon: '🃏', en: 'Draw a card', he: 'שלפו קלף' },
      { icon: '📜', en: 'Follow the rule', he: 'עקבו אחרי החוק' },
      { icon: '👑', en: 'King = pour into cup!', he: 'מלך = מוזגים לכוס!' },
    ],
  },
};

const GameplayScreen: React.FC = () => {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';
  const { 
    selectedGame, 
    intensity, 
    setCurrentScreen, 
    resetGame,
    triggerPenalty,
    currentCardIndex,
    setCurrentCardIndex,
  } = useGame();

  const [cards, setCards] = useState<GameCard[]>([]);
  const [direction, setDirection] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAutoInstructions, setShowAutoInstructions] = useState(true);

  // Get theme for current game
  const theme = getGameTheme(selectedGame);

  // Load cards when game starts
  useEffect(() => {
    if (selectedGame) {
      const gameCards = getGameCards(selectedGame, intensity);
      setCards(gameCards);
      setCurrentCardIndex(0);
      setShowAutoInstructions(true); // Show instructions for new game
    }
  }, [selectedGame, intensity, setCurrentCardIndex]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timer !== null && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev === null || prev <= 1) {
            setIsTimerRunning(false);
            triggerPenalty();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer, triggerPenalty]);

  const currentCard = cards[currentCardIndex];

  const handleNext = useCallback(() => {
    if (currentCardIndex < cards.length - 1) {
      setDirection(1);
      setCurrentCardIndex(currentCardIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimer(null);
      setIsTimerRunning(false);
    }
  }, [currentCardIndex, cards.length, setCurrentCardIndex]);

  const handlePrevious = useCallback(() => {
    if (currentCardIndex > 0) {
      setDirection(-1);
      setCurrentCardIndex(currentCardIndex - 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimer(null);
      setIsTimerRunning(false);
    }
  }, [currentCardIndex, setCurrentCardIndex]);

  const handleBack = () => {
    setCurrentScreen('gameSelection');
  };

  const handleHome = () => {
    resetGame();
  };

  const handleRestart = () => {
    const gameCards = getGameCards(selectedGame!, intensity);
    setCards(gameCards);
    setCurrentCardIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  // Trivia answer handling
  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    if (currentCard?.correctAnswer !== answerIndex) {
      setTimeout(() => triggerPenalty(), 500);
    }
  };

  // Start timer for Guess Who
  const handleStartTimer = () => {
    if (currentCard?.timer) {
      setTimer(currentCard.timer);
      setIsTimerRunning(true);
    }
  };

  // Handle drink button for various games
  const handleDrink = () => {
    triggerPenalty();
  };

  // Swipe threshold for gesture navigation
  const SWIPE_THRESHOLD = 50;

  // Handle swipe gesture
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipeDistance = info.offset.x;
      const velocity = info.velocity.x;

      // Swipe right (positive x) - go to previous (in RTL this feels like "next")
      if (swipeDistance > SWIPE_THRESHOLD || velocity > 500) {
        if (isRTL) {
          handleNext();
        } else {
          handlePrevious();
        }
      }
      // Swipe left (negative x) - go to next (in RTL this feels like "previous")
      else if (swipeDistance < -SWIPE_THRESHOLD || velocity < -500) {
        if (isRTL) {
          handlePrevious();
        } else {
          handleNext();
        }
      }
    },
    [handleNext, handlePrevious, isRTL]
  );

  const cardVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      rotateY: direction > 0 ? 15 : -15,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      rotateY: direction > 0 ? -15 : 15,
    }),
  };

  const renderCardContent = () => {
    if (!currentCard) return null;

    // Special rendering for Trivia
    if (selectedGame === 'trivia' && currentCard.options) {
      return (
        <div className="flex flex-col h-full">
          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-8 text-center">
            {currentCard.text}
          </h3>
          <div className="grid grid-cols-2 gap-3 mt-auto">
            {currentCard.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={`p-4 rounded-xl font-semibold text-left transition-all ${
                  showResult
                    ? index === currentCard.correctAnswer
                      ? 'bg-accent text-accent-foreground border-2 border-accent'
                      : selectedAnswer === index
                        ? 'bg-destructive text-destructive-foreground border-2 border-destructive'
                        : 'glass-card text-foreground opacity-50'
                    : 'glass-card text-foreground hover:bg-muted/50 border-2 border-transparent hover:border-primary/30'
                }`}
                whileHover={!showResult ? { scale: 1.02 } : {}}
                whileTap={!showResult ? { scale: 0.98 } : {}}
              >
                {option}
              </motion.button>
            ))}
          </div>
          {showResult && (
            <motion.div
              className="mt-6 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {selectedAnswer === currentCard.correctAnswer ? (
                <div className="flex items-center gap-2 text-accent">
                  <Check className="w-6 h-6" />
                  <span className="font-bold">{t('gameplay.correct')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <X className="w-6 h-6" />
                  <span className="font-bold">{t('gameplay.wrong')}</span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      );
    }

    // Special rendering for Guess Who with timer
    if (selectedGame === 'guessWho') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          {timer === null ? (
            <>
              <p className="text-muted-foreground mb-4">Put phone on forehead</p>
              <h3 className="text-3xl md:text-4xl font-black text-foreground mb-8">
                {currentCard.text}
              </h3>
              <Button variant="neonPurple" size="lg" onClick={handleStartTimer}>
                <Timer className="w-5 h-5 mr-2" />
                Start Timer (60s)
              </Button>
            </>
          ) : (
            <>
              <motion.div
                className="text-8xl font-black mb-4"
                style={{ color: theme ? `hsl(${theme.primaryColor})` : 'hsl(var(--primary))' }}
                animate={{ scale: timer <= 10 ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.5, repeat: timer <= 10 ? Infinity : 0 }}
              >
                {timer}
              </motion.div>
              <p className="text-muted-foreground mb-8">seconds remaining</p>
              <div className="flex gap-4">
                <Button
                  variant="neonLime"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimer(null);
                    handleNext();
                  }}
                >
                  <Check className="w-5 h-5 mr-2" />
                  Got it!
                </Button>
                <Button
                  variant="neonOrange"
                  onClick={() => {
                    setIsTimerRunning(false);
                    triggerPenalty();
                    handleNext();
                  }}
                >
                  <X className="w-5 h-5 mr-2" />
                  Skip
                </Button>
              </div>
            </>
          )}
        </div>
      );
    }

    // Special rendering for Truth or Dare
    if (selectedGame === 'truthOrDare') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <span className={`text-sm font-bold px-4 py-1 rounded-full mb-4 ${
            currentCard.category === 'Soft' ? 'bg-emerald-500/20 text-emerald-400' :
            currentCard.category === 'Spicy' ? 'bg-orange-500/20 text-orange-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {currentCard.category}
          </span>
          <span className="text-lg font-bold mb-4" style={{ color: theme ? `hsl(${theme.primaryColor})` : 'hsl(var(--primary))' }}>
            {currentCard.type === 'question' ? t('gameplay.truth') : t('gameplay.dare')}
          </span>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground">
            {currentCard.text}
          </h3>
        </div>
      );
    }

    // Special rendering for Never Have I Ever
    if (selectedGame === 'neverHaveI') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
            {currentCard.text}
          </h3>
          <div className="flex gap-4">
            <Button
              variant="neonLime"
              size="lg"
              onClick={handleDrink}
            >
              {t('gameplay.iHave')} 🙋
            </Button>
            <Button
              variant="glass"
              size="lg"
              onClick={handleNext}
            >
              {t('gameplay.iHaveNot')} 🙅
            </Button>
          </div>
        </div>
      );
    }

    // King's Cup with card visual
    if (selectedGame === 'kingsCup') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div 
            className="w-20 h-28 rounded-lg flex items-center justify-center mb-6 shadow-lg"
            style={{ 
              background: theme 
                ? `linear-gradient(135deg, hsl(${theme.primaryColor}), hsl(${theme.secondaryColor}))` 
                : 'linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--muted)))'
            }}
          >
            <span className="text-3xl font-black text-background">{currentCard.category}</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-foreground">
            {currentCard.text}
          </h3>
        </div>
      );
    }

    // Default card rendering
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-foreground">
          {currentCard.text}
        </h3>
        {(selectedGame === 'truthDareShot' || selectedGame === 'mostLikely') && (
          <Button
            variant="neonOrange"
            size="lg"
            onClick={handleDrink}
            className="mt-8"
          >
            {t('gameplay.drink')} 🍺
          </Button>
        )}
      </div>
    );
  };

  if (!selectedGame || cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // Dynamic background based on game theme
  const bgStyle = theme ? {
    background: `linear-gradient(180deg, hsl(222 47% 8%) 0%, hsl(222 47% 4%) 50%, ${theme.bgAccent} 100%)`,
  } : {};

  return (
    <div className="min-h-screen px-4 py-6 flex flex-col relative" style={bgStyle}>
      {/* Theme-colored accent orb */}
      {theme && (
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: `hsl(${theme.primaryColor} / 0.15)` }}
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
      )}

      {/* Auto-dismiss instructions overlay */}
      {showAutoInstructions && selectedGame && (
        <AutoDismissInstructions 
          gameType={selectedGame} 
          onDismiss={() => setShowAutoInstructions(false)} 
        />
      )}

      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={handleBack}
          className="p-3 rounded-xl glass-card hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        
        {/* Progress indicator with theme color */}
        <div className="flex items-center gap-2">
          {theme && (
            <span className="text-lg">{theme.emojis[0]}</span>
          )}
          <span className="text-muted-foreground text-sm">
            {currentCardIndex + 1} / {cards.length}
          </span>
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full"
              style={{ 
                background: theme 
                  ? `linear-gradient(90deg, hsl(${theme.primaryColor}), hsl(${theme.secondaryColor}))` 
                  : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${((currentCardIndex + 1) / cards.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowInstructions(true)}
            className="p-3 rounded-xl glass-card hover:bg-muted/50 transition-colors"
            title={isRTL ? 'הוראות' : 'Instructions'}
          >
            <HelpCircle className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={handleRestart}
            className="p-3 rounded-xl glass-card hover:bg-muted/50 transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={handleHome}
            className="p-3 rounded-xl glass-card hover:bg-muted/50 transition-colors"
          >
            <Home className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </motion.div>

      {/* Card Area - Swipeable */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden px-2">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentCardIndex}
            custom={direction}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 0.98, cursor: 'grabbing' }}
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="glass-card w-full max-w-md aspect-[3/4] p-6 border-2 cursor-grab touch-pan-y"
            style={{ 
              borderColor: theme ? `hsl(${theme.primaryColor} / 0.3)` : 'hsl(var(--primary) / 0.2)',
              boxShadow: theme ? `0 0 40px hsl(${theme.primaryColor} / 0.2)` : undefined,
            }}
          >
            {renderCardContent()}
          </motion.div>
        </AnimatePresence>

        {/* Swipe hint indicators */}
        <motion.div 
          className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: currentCardIndex > 0 ? 1 : 0 }}
        >
          <ChevronLeft className="w-8 h-8" />
        </motion.div>
        <motion.div 
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: currentCardIndex < cards.length - 1 ? 1 : 0 }}
        >
          <ChevronRight className="w-8 h-8" />
        </motion.div>
      </div>

      {/* Navigation */}
      <motion.div
        className="flex items-center justify-center gap-4 mt-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          variant="glass"
          size="icon"
          onClick={handlePrevious}
          disabled={currentCardIndex === 0}
          className="w-14 h-14"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <Button
          variant="neonPurple"
          size="lg"
          onClick={handleNext}
          disabled={currentCardIndex === cards.length - 1}
          className="px-12"
          style={theme ? { 
            background: `linear-gradient(135deg, hsl(${theme.primaryColor}), hsl(${theme.secondaryColor}))`,
            boxShadow: `0 0 20px hsl(${theme.primaryColor} / 0.4)`,
          } : {}}
        >
          {currentCardIndex === cards.length - 1 ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              {t('gameplay.done')}
            </>
          ) : (
            <>
              {t('gameplay.next')}
              <SkipForward className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        <Button
          variant="glass"
          size="icon"
          onClick={handleNext}
          disabled={currentCardIndex === cards.length - 1}
          className="w-14 h-14"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent 
          className="glass-card max-w-md"
          style={{ borderColor: theme ? `hsl(${theme.primaryColor} / 0.3)` : 'hsl(var(--primary) / 0.2)' }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              {theme && <span className="text-2xl">{theme.emojis[0]}</span>}
              {selectedGame && gameInstructions[selectedGame] 
                ? (isRTL ? gameInstructions[selectedGame].titleHe : gameInstructions[selectedGame].titleEn)
                : (isRTL ? 'הוראות' : 'Instructions')
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {selectedGame && gameInstructions[selectedGame]?.steps.map((step, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl glass-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="text-2xl">{step.icon}</span>
                <span className="text-foreground">{isRTL ? step.he : step.en}</span>
              </motion.div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameplayScreen;
