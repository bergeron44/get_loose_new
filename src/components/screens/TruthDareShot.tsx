import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Home, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type GameLevel = 'soft' | 'wild' | 'extreme';
type CardType = 'truth' | 'dare';

interface TDSCard {
  id: string;
  type: CardType;
  text: string;
  textHe: string;
}

// Penalties when user escapes
const drinkPenalties = [
  { text: 'One Sip', textHe: 'שלוק אחד', emoji: '🍺' },
  { text: 'Half a Glass', textHe: 'חצי כוס', emoji: '🍻' },
  { text: 'A Clean Shot!', textHe: 'צ\'ייסר נקי!', emoji: '🥃' },
];

// Game content by level
const gameContent: Record<GameLevel, TDSCard[]> = {
  soft: [
    { id: 's1', type: 'truth', text: 'What\'s the weirdest thing you\'ve done on a date?', textHe: 'מה הדבר הכי מוזר שעשית בדייט?' },
    { id: 's2', type: 'truth', text: 'What\'s your most embarrassing childhood memory?', textHe: 'מה הזיכרון הכי מביך מהילדות שלך?' },
    { id: 's3', type: 'truth', text: 'What\'s the last lie you told?', textHe: 'מה השקר האחרון שסיפרת?' },
    { id: 's4', type: 'truth', text: 'Who was your first celebrity crush?', textHe: 'מי היה הסלב הראשון שהתאהבת בו?' },
    { id: 's5', type: 'truth', text: 'What\'s the most ridiculous fear you have?', textHe: 'מה הפחד הכי מגוחך שיש לך?' },
    { id: 's6', type: 'dare', text: 'Do your best impression of someone at this table', textHe: 'עשה חיקוי של מישהו ליד השולחן' },
    { id: 's7', type: 'dare', text: 'Send a heart emoji to the 5th person in your contacts', textHe: 'שלח אימוג\'י לב לאיש קשר החמישי' },
    { id: 's8', type: 'dare', text: 'Speak in an accent for the next 3 rounds', textHe: 'דבר עם מבטא ב-3 הסיבובים הבאים' },
    { id: 's9', type: 'dare', text: 'Let someone post on your Instagram story', textHe: 'תן למישהו להעלות לסטורי שלך' },
    { id: 's10', type: 'dare', text: 'Do 10 jumping jacks right now', textHe: 'עשה 10 קפיצות כוכב עכשיו' },
    { id: 's11', type: 'truth', text: 'What\'s your guilty pleasure TV show?', textHe: 'מה סדרת הטלוויזיה האשמה שלך?' },
    { id: 's12', type: 'dare', text: 'Call your mom and tell her you love her', textHe: 'התקשר לאמא ותגיד שאתה אוהב אותה' },
    { id: 's13', type: 'truth', text: 'What\'s the worst haircut you\'ve ever had?', textHe: 'מה התספורת הכי גרועה שהייתה לך?' },
    { id: 's14', type: 'dare', text: 'Do your best dance move for 30 seconds', textHe: 'תעשה את תנועת הריקוד הטובה שלך 30 שניות' },
    { id: 's15', type: 'truth', text: 'What nickname do your family call you?', textHe: 'איזה כינוי המשפחה שלך קוראת לך?' },
  ],
  wild: [
    { id: 'w1', type: 'truth', text: 'What\'s your biggest turn-off?', textHe: 'מה הדבר שהכי מכבה אותך?' },
    { id: 'w2', type: 'truth', text: 'Who here would you kiss if you had to?', textHe: 'את מי פה היית מנשק אם הייתה חייב?' },
    { id: 'w3', type: 'truth', text: 'What\'s the most embarrassing thing in your search history?', textHe: 'מה הדבר הכי מביך בהיסטוריית החיפוש שלך?' },
    { id: 'w4', type: 'truth', text: 'Have you ever been caught doing something naughty?', textHe: 'פעם תפסו אותך עושה משהו שובב?' },
    { id: 'w5', type: 'truth', text: 'What\'s the craziest thing on your bucket list?', textHe: 'מה הדבר הכי מטורף ברשימת החלומות שלך?' },
    { id: 'w6', type: 'dare', text: 'Order a shot for the hottest person at the bar', textHe: 'הזמן צ\'ייסר לבנאדם הכי חמוד בבר' },
    { id: 'w7', type: 'dare', text: 'Let someone go through your DMs for 30 seconds', textHe: 'תן למישהו לחפור בהודעות שלך 30 שניות' },
    { id: 'w8', type: 'dare', text: 'Send a flirty message to your ex', textHe: 'שלח הודעה פלרטטנית לאקס' },
    { id: 'w9', type: 'dare', text: 'Whisper something seductive to the person on your left', textHe: 'לחש משהו מפתה לאדם משמאלך' },
    { id: 'w10', type: 'dare', text: 'Do your sexiest walk across the room', textHe: 'עשה את ההליכה הכי סקסית לאורך החדר' },
    { id: 'w11', type: 'truth', text: 'What\'s your go-to flirting technique?', textHe: 'מה שיטת הפלירטוט המועדפת עליך?' },
    { id: 'w12', type: 'dare', text: 'Give someone at this table a 10-second massage', textHe: 'תן עיסוי של 10 שניות למישהו בשולחן' },
    { id: 'w13', type: 'truth', text: 'What\'s the most romantic thing you\'ve done?', textHe: 'מה הדבר הכי רומנטי שעשית?' },
    { id: 'w14', type: 'dare', text: 'Post a selfie with no filter right now', textHe: 'העלה סלפי בלי פילטר עכשיו' },
    { id: 'w15', type: 'truth', text: 'Who was your first kiss and how was it?', textHe: 'עם מי היתה הנשיקה הראשונה ואיך היא הייתה?' },
  ],
  extreme: [
    { id: 'e1', type: 'truth', text: 'What\'s your body count?', textHe: 'עם כמה אנשים שכבת?' },
    { id: 'e2', type: 'truth', text: 'What\'s the craziest place you\'ve hooked up?', textHe: 'מה המקום הכי מטורף שעשית בו משהו?' },
    { id: 'e3', type: 'truth', text: 'What\'s a fantasy you\'ve never told anyone?', textHe: 'מה פנטזיה שמעולם לא סיפרת לאף אחד?' },
    { id: 'e4', type: 'truth', text: 'Have you ever faked it?', textHe: 'זייפת פעם?' },
    { id: 'e5', type: 'truth', text: 'What\'s your biggest regret in a relationship?', textHe: 'מה החרטה הכי גדולה שלך בזוגיות?' },
    { id: 'e6', type: 'dare', text: 'Take off one piece of clothing', textHe: 'הורד פריט לבוש אחד' },
    { id: 'e7', type: 'dare', text: 'Give someone a lap dance for 20 seconds', textHe: 'תן ריקוד חיק למישהו 20 שניות' },
    { id: 'e8', type: 'dare', text: 'Let someone write anything on your body', textHe: 'תן למישהו לכתוב מה שרוצה על הגוף שלך' },
    { id: 'e9', type: 'dare', text: 'Make out with someone for 30 seconds', textHe: 'התנשק עם מישהו 30 שניות' },
    { id: 'e10', type: 'dare', text: 'Send a risky text to a random contact', textHe: 'שלח הודעה מסוכנת לאיש קשר רנדומלי' },
    { id: 'e11', type: 'truth', text: 'What\'s your weirdest kink?', textHe: 'מה הקינק הכי מוזר שלך?' },
    { id: 'e12', type: 'dare', text: 'Let someone take a body shot off you', textHe: 'תן למישהו לקחת בודי שוט ממך' },
    { id: 'e13', type: 'truth', text: 'What\'s the most scandalous thing you\'ve done?', textHe: 'מה הדבר הכי שערורייתי שעשית?' },
    { id: 'e14', type: 'dare', text: 'Serenade the bartender with a love song', textHe: 'שיר שיר אהבה לברמן' },
    { id: 'e15', type: 'truth', text: 'Tell us your most embarrassing hookup story', textHe: 'ספר על החיבור הכי מביך שהיה לך' },
  ],
};

const TruthDareShot: React.FC = () => {
  const { language } = useLanguage();
  const isRTL = language === 'he';
  const { setCurrentScreen, resetGame } = useGame();

  // Game state
  const [phase, setPhase] = useState<'levelSelect' | 'playing'>('levelSelect');
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null);
  const [cards, setCards] = useState<TDSCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPenalty, setShowPenalty] = useState(false);
  const [currentPenalty, setCurrentPenalty] = useState<typeof drinkPenalties[0] | null>(null);
  const [direction, setDirection] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

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

  // Start game with selected level
  const handleLevelSelect = (level: GameLevel) => {
    setSelectedLevel(level);
    const levelCards = shuffleArray(gameContent[level]);
    setCards(levelCards);
    setCurrentIndex(0);
    setPhase('playing');
    triggerHaptic('heavy');

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
  const handleRestart = () => {
    if (selectedLevel) {
      const levelCards = shuffleArray(gameContent[selectedLevel]);
      setCards(levelCards);
      setCurrentIndex(0);
    }
  };

  // Back to level select
  const handleBackToLevels = () => {
    setPhase('levelSelect');
    setSelectedLevel(null);
    setCards([]);
    setCurrentIndex(0);
  };

  // Exit game
  const handleExit = () => {
    setCurrentScreen('gameSelection');
  };

  const currentCard = cards[currentIndex];

  // Card animation variants
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

  // Level selection screen
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
            onClick={() => setCurrentScreen('gameSelection')}
            className="p-3 rounded-xl glass-card hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">
            {isRTL ? 'אמת, חובה או צ\'ייסר' : 'Truth, Dare or Shot'}
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
          <span className="text-5xl mb-4 block">🌶️</span>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {isRTL ? 'בחר את הרמה שלך' : 'Choose Your Level'}
          </h2>
          <p className="text-muted-foreground">
            {isRTL ? 'כמה חריף אתה יכול לעמוד?' : 'How spicy can you handle?'}
          </p>
        </motion.div>

        {/* Level Cards */}
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
              {isRTL ? 'שאלות ומשימות כיפיות וחברתיות' : 'Fun, social questions & dares'}
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
              {isRTL ? 'פיקנטי ויותר אישי' : 'Spicy and more personal'}
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
              {isRTL ? 'סיכון גבוה, מביך או פרוע' : 'High-risk, embarrassing, or wild'}
            </p>
          </motion.button>
        </div>
      </div>
    );
  }

  // Game playing screen
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
      {/* Background glow */}
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

      {/* Header */}
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
                {/* Card type badge */}
                <motion.div
                  className="flex justify-center mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <span
                    className="px-5 py-2 rounded-full font-bold text-lg"
                    style={{
                      background: currentCard.type === 'truth' 
                        ? 'linear-gradient(135deg, hsl(217 91% 60%), hsl(217 91% 70%))'
                        : 'linear-gradient(135deg, hsl(25 95% 53%), hsl(25 95% 63%))',
                      color: 'white',
                    }}
                  >
                    {currentCard.type === 'truth' 
                      ? (isRTL ? '🤔 אמת' : '🤔 Truth')
                      : (isRTL ? '🎯 חובה' : '🎯 Dare')
                    }
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
      </div>

      {/* Action Buttons */}
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

      {/* Penalty Popup */}
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

export default TruthDareShot;
