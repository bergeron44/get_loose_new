import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Home, RotateCcw, HelpCircle } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Question data - 50 Hebrew "Most Likely To" statements
const questions = [
  { en: 'Most likely to forget where they parked', he: 'מי הכי סביר שישכח איפה הוא החנה את הרכב?' },
  { en: 'Most likely to flirt with the bartender', he: 'מי הכי סביר שינסה להתחיל עם הברמן/ית?' },
  { en: 'Most likely to order pizza at 3 AM', he: 'מי הכי סביר שיזמין פיצה ב-3 לפנות בוקר?' },
  { en: 'Most likely to get arrested tonight', he: 'מי הכי סביר שייעצר הלילה?' },
  { en: 'Most likely to cry over an ex', he: 'מי הכי סביר שיבכה על אקס?' },
  { en: 'Most likely to become a millionaire', he: 'מי הכי סביר שיהפוך למיליונר?' },
  { en: 'Most likely to ghost someone', he: 'מי הכי סביר שיעשה גוסטינג למישהו?' },
  { en: 'Most likely to drunk text their ex', he: 'מי הכי סביר שישלח הודעה לאקס בשכרות?' },
  { en: 'Most likely to lose their phone tonight', he: 'מי הכי סביר שיאבד את הטלפון הלילה?' },
  { en: 'Most likely to end up on the news', he: 'מי הכי סביר שיגיע לחדשות?' },
  { en: 'Most likely to marry a celebrity', he: 'מי הכי סביר שיתחתן עם סלב?' },
  { en: 'Most likely to survive a zombie apocalypse', he: 'מי הכי סביר לשרוד אפוקליפסת זומבים?' },
  { en: 'Most likely to start a bar fight', he: 'מי הכי סביר שיתחיל קטטה בבר?' },
  { en: 'Most likely to become famous', he: 'מי הכי סביר שיהפוך למפורסם?' },
  { en: 'Most likely to wake up in a random place', he: 'מי הכי סביר שיתעורר במקום רנדומלי?' },
  { en: 'Most likely to cry during a movie', he: 'מי הכי סביר לבכות בזמן סרט?' },
  { en: 'Most likely to get lost in a new city', he: 'מי הכי סביר ללכת לאיבוד בעיר חדשה?' },
  { en: 'Most likely to become president', he: 'מי הכי סביר שיהפוך לראש ממשלה?' },
  { en: 'Most likely to win a drinking contest', he: 'מי הכי סביר לנצח בתחרות שתייה?' },
  { en: 'Most likely to embarrass themselves tonight', he: 'מי הכי סביר שיתבייש הלילה?' },
  { en: 'Most likely to fall asleep first at a party', he: 'מי הכי סביר להירדם ראשון במסיבה?' },
  { en: 'Most likely to dance on a table', he: 'מי הכי סביר לרקוד על שולחן?' },
  { en: "Most likely to steal food from someone's plate", he: 'מי הכי סביר לגנוב אוכל מהצלחת של מישהו?' },
  { en: "Most likely to forget someone's birthday", he: 'מי הכי סביר לשכוח יום הולדת של מישהו?' },
  { en: 'Most likely to go viral on TikTok', he: 'מי הכי סביר להפוך לוויראלי בטיקטוק?' },
  { en: 'Most likely to become a reality TV star', he: 'מי הכי סביר להפוך לכוכב ריאליטי?' },
  { en: 'Most likely to talk their way out of a ticket', he: 'מי הכי סביר להתחמק מדוח בזכות הדיבור?' },
  { en: 'Most likely to adopt 10 cats', he: 'מי הכי סביר לאמץ 10 חתולים?' },
  { en: 'Most likely to be late to their own wedding', he: 'מי הכי סביר לאחר לחתונה של עצמו?' },
  { en: 'Most likely to win an argument with anyone', he: 'מי הכי סביר לנצח בוויכוח עם כל אחד?' },
  { en: 'Most likely to spend all their money on shoes', he: 'מי הכי סביר לבזבז את כל הכסף על נעליים?' },
  { en: 'Most likely to binge-watch a whole series tonight', he: 'מי הכי סביר לצפות בסדרה שלמה הלילה?' },
  { en: 'Most likely to survive on an island alone', he: 'מי הכי סביר לשרוד לבד על אי בודד?' },
  { en: 'Most likely to cry at a commercial', he: 'מי הכי סביר לבכות מפרסומת?' },
  { en: 'Most likely to break something expensive', he: 'מי הכי סביר לשבור משהו יקר?' },
  { en: 'Most likely to make friends with a stranger', he: 'מי הכי סביר להתיידד עם זר?' },
  { en: 'Most likely to show up in pajamas', he: "מי הכי סביר להגיע בפיג'מה?" },
  { en: 'Most likely to spill their drink', he: 'מי הכי סביר לשפוך את המשקה?' },
  { en: 'Most likely to take 100 selfies', he: 'מי הכי סביר לצלם 100 סלפים?' },
  { en: 'Most likely to sing karaoke solo', he: 'מי הכי סביר לשיר קריוקי לבד?' },
  { en: 'Most likely to eat the last slice without asking', he: 'מי הכי סביר לאכול את הפרוסה האחרונה בלי לשאול?' },
  { en: 'Most likely to get a tattoo on impulse', he: 'מי הכי סביר לעשות קעקוע באימפולס?' },
  { en: 'Most likely to start their own business', he: 'מי הכי סביר לפתוח עסק משלו?' },
  { en: 'Most likely to fall in love at first sight', he: 'מי הכי סביר להתאהב ממבט ראשון?' },
  { en: 'Most likely to forget what they were saying', he: 'מי הכי סביר לשכוח מה הוא רצה להגיד?' },
  { en: "Most likely to secretly read everyone's horoscope", he: 'מי הכי סביר לקרוא בסתר את ההורוסקופ של כולם?' },
  { en: 'Most likely to trip over nothing', he: 'מי הכי סביר למעוד על כלום?' },
  { en: 'Most likely to laugh at their own jokes', he: 'מי הכי סביר לצחוק על הבדיחות של עצמו?' },
  { en: 'Most likely to give unsolicited advice', he: 'מי הכי סביר לתת עצות בלי שביקשו?' },
  { en: 'Most likely to pretend they understood something', he: 'מי הכי סביר להעמיד פנים שהוא הבין משהו?' },
];

const GAME_LENGTH = 10;

type GamePhase = 'IDLE' | 'COUNTDOWN' | 'FLASH';

const getShuffledQuestions = () => {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, GAME_LENGTH);
};

export const MostLikelyGame: React.FC = () => {
  const { setCurrentScreen } = useGame();
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  // Core state
  const [gameQuestions] = useState(getShuffledQuestions);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('IDLE');
  const [countdown, setCountdown] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);

  // Current question - persists through all phases
  const currentQuestion = gameQuestions[questionIndex];

  // Haptic feedback
  const triggerHaptic = useCallback((duration = 50) => {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }, []);

  // Start countdown
  const handleReady = useCallback(() => {
    setPhase('COUNTDOWN');
    setCountdown(3);
    triggerHaptic(30);
  }, [triggerHaptic]);

  // Next question
  const handleNext = useCallback(() => {
    if (questionIndex >= GAME_LENGTH - 1) {
      setIsGameOver(true);
    } else {
      setQuestionIndex(prev => prev + 1);
      setPhase('IDLE');
      setCountdown(3);
    }
  }, [questionIndex]);

  // Restart game
  const handleRestart = useCallback(() => {
    setQuestionIndex(0);
    setPhase('IDLE');
    setCountdown(3);
    setIsGameOver(false);
  }, []);

  // Countdown effect with sound
  useEffect(() => {
    if (phase !== 'COUNTDOWN') return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
        triggerHaptic(30);
      }, 1000);
      return () => clearTimeout(timer);
    }

    setPhase('FLASH');
    triggerHaptic(200); // Strong vibration for reveal
  }, [phase, countdown, triggerHaptic]);

  // Get countdown color
  const getCountdownColor = (num: number) => {
    switch (num) {
      case 3: return 'text-red-500';
      case 2: return 'text-orange-500';
      case 1: return 'text-green-500';
      default: return 'text-cyan-400';
    }
  };

  // Game Over screen
  if (isGameOver) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex flex-col items-center justify-center p-6 pb-safe"
        dir={isHebrew ? 'rtl' : 'ltr'}
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 1.5rem)' }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, delay: 0.2 }}
          className="text-center"
        >
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="text-game-4xl font-black text-neon-cyan mb-4 game-text">
            {isHebrew ? 'סיימתם!' : 'Game Over!'}
          </h1>
          <p className="text-game-xl text-foreground/70 mb-10 game-text">
            {isHebrew ? 'כל הכבוד! שיחקתם מעולה' : 'Great job! You played well'}
          </p>
          <div className="flex flex-col gap-5">
            <Button
              onClick={handleRestart}
              className="bg-neon-cyan hover:bg-neon-cyan/90 text-background font-black text-game-xl py-7 px-10 rounded-2xl shadow-lg"
            >
              {isHebrew ? 'שחקו שוב 🔄' : 'Play Again 🔄'}
            </Button>
            <Button
              onClick={() => setCurrentScreen('gameSelection')}
              variant="outline"
              className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/20 text-game-lg py-6"
            >
              {isHebrew ? 'חזרה לתפריט' : 'Back to Menu'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ 
        opacity: 1,
        x: phase === 'FLASH' ? [0, -8, 8, -8, 8, 0] : 0 
      }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ 
        opacity: { duration: 0.3 },
        x: { duration: 0.5, ease: 'easeInOut' }
      }}
      className={`min-h-[100dvh] flex flex-col transition-colors duration-300 ${
        phase === 'FLASH' 
          ? 'bg-gradient-to-br from-neon-cyan via-teal-300 to-neon-cyan' 
          : 'bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900'
      }`}
      dir={isHebrew ? 'rtl' : 'ltr'}
      style={{ 
        paddingTop: 'var(--safe-area-inset-top, 0px)',
        paddingBottom: 'var(--safe-area-inset-bottom, 0px)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 relative z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentScreen('gameSelection')}
            className={`rounded-full min-h-[48px] min-w-[48px] ${phase === 'FLASH' ? 'text-background/70 hover:bg-background/10' : 'text-foreground/70 hover:bg-foreground/10'}`}
          >
            <ArrowLeft className="w-7 h-7" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRestart}
            className={`rounded-full min-h-[48px] min-w-[48px] ${phase === 'FLASH' ? 'text-background/70 hover:bg-background/10' : 'text-foreground/70 hover:bg-foreground/10'}`}
          >
            <RotateCcw className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentScreen('landing')}
            className={`rounded-full min-h-[48px] min-w-[48px] ${phase === 'FLASH' ? 'text-background/70 hover:bg-background/10' : 'text-foreground/70 hover:bg-foreground/10'}`}
          >
            <Home className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress */}
        <div className={`text-game-lg font-black ${phase === 'FLASH' ? 'text-background/80' : 'text-neon-cyan'}`}>
          {questionIndex + 1} / {GAME_LENGTH}
        </div>

        {/* Help */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full min-h-[48px] min-w-[48px] ${phase === 'FLASH' ? 'text-background/70 hover:bg-background/10' : 'text-foreground/70 hover:bg-foreground/10'}`}
            >
              <HelpCircle className="w-7 h-7" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-neon-cyan/30 text-foreground mx-4 rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-neon-cyan text-game-xl font-bold">
                {isHebrew ? 'איך משחקים?' : 'How to Play'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-foreground/80 text-game-base">
              <p>{isHebrew ? '1. קראו את השאלה יחד' : '1. Read the question together'}</p>
              <p>{isHebrew ? '2. לחצו על "מוכנים" להתחיל ספירה לאחור' : '2. Press "Ready" to start countdown'}</p>
              <p>{isHebrew ? '3. כשמגיע "להצביע!" - כולם מצביעים על מישהו' : '3. When "Point!" appears - everyone points at someone'}</p>
              <p>{isHebrew ? '4. מי שקיבל הכי הרבה הצבעות - שותה!' : '4. Whoever got the most votes - drinks!'}</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content - Vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-8">
        {/* Question Card - ALWAYS VISIBLE */}
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`w-full max-w-md mb-10 p-7 rounded-3xl backdrop-blur-md transition-all duration-300 ${
            phase === 'FLASH'
              ? 'bg-background/30 border-2 border-background/40 shadow-[0_0_40px_rgba(0,0,0,0.3)]'
              : 'bg-foreground/5 border border-neon-cyan/30'
          }`}
        >
          <p className={`text-game-2xl md:text-game-3xl font-black text-center leading-relaxed game-text ${
            phase === 'FLASH' ? 'text-background' : 'text-foreground'
          }`}>
            {isHebrew ? currentQuestion.he : currentQuestion.en}
          </p>
        </motion.div>

        {/* Phase Content */}
        <AnimatePresence mode="wait">
          {/* IDLE Phase - Ready Button */}
          {phase === 'IDLE' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex flex-col items-center"
            >
              <Button
                onClick={handleReady}
                className="bg-gradient-to-r from-neon-cyan to-teal-500 hover:from-neon-cyan/90 hover:to-teal-400 text-background font-black text-game-2xl py-8 px-14 rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.5)] hover:shadow-[0_0_60px_rgba(6,182,212,0.7)] transition-all active:scale-95"
              >
                {isHebrew ? 'מוכנים?' : 'READY?'}
              </Button>
            </motion.div>
          )}

          {/* COUNTDOWN Phase */}
          {phase === 'COUNTDOWN' && countdown > 0 && (
            <motion.div
              key={`countdown-${countdown}`}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ 
                duration: 0.3,
                ease: [0.34, 1.56, 0.64, 1] // Custom spring-like easing
              }}
              className="flex flex-col items-center"
            >
              {/* Pulsing rings */}
              <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                  className={`absolute rounded-full ${
                    countdown === 3 ? 'bg-destructive' : countdown === 2 ? 'bg-secondary' : 'bg-accent'
                  }`}
                  style={{ width: 180, height: 180 }}
                />
                <motion.span
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
                  className={`relative z-10 text-[180px] font-black game-text ${getCountdownColor(countdown)}`}
                  style={{ textShadow: '0 0 60px currentColor', lineHeight: 1 }}
                >
                  {countdown}
                </motion.span>
              </div>
            </motion.div>
          )}

          {/* FLASH Phase - Reveal */}
          {phase === 'FLASH' && (
            <motion.div
              key="flash"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center text-center"
            >
              {/* Main reveal text */}
              <motion.div
                animate={{ 
                  rotate: [-2, 2, -2, 2, 0],
                  scale: [1, 1.02, 1, 1.02, 1]
                }}
                transition={{ duration: 0.3, repeat: Infinity }}
                className="mb-8"
              >
                <div className="text-7xl mb-3">☝️</div>
                <h1 
                  className="text-game-5xl md:text-[5rem] font-black text-background game-text"
                  style={{ textShadow: '0 0 30px rgba(0,0,0,0.3)' }}
                >
                  {isHebrew ? '!להצביע' : 'POINT!'}
                </h1>
              </motion.div>

              {/* Penalty instruction */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-game-lg md:text-game-xl text-background/80 font-semibold mb-10 max-w-sm px-4 game-text"
              >
                {isHebrew 
                  ? 'מי שקיבל הכי הרבה הצבעות - שותה כמספר האצבעות!' 
                  : 'Whoever got the most votes - drinks for each finger pointed!'}
              </motion.p>

              {/* Next button */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={handleNext}
                  className="bg-background hover:bg-background/90 text-neon-cyan font-black text-game-xl py-7 px-12 rounded-3xl shadow-xl active:scale-95"
                >
                  {isHebrew ? 'לשאלה הבאה ⮕' : 'Next Question ⮕'}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MostLikelyGame;
