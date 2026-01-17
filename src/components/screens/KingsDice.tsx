import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Home, 
  RotateCcw, 
  HelpCircle,
  Crown,
  Timer,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import BarOffersWidget from '@/components/BarOffersWidget';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DiceRule {
  sum: number;
  titleEn: string;
  titleHe: string;
  descriptionEn: string;
  descriptionHe: string;
  icon: string;
  isPersistent?: boolean;
  hasTimer?: boolean;
  timerSeconds?: number;
  hasRandomContent?: boolean;
  randomContentType?: 'question' | 'experience' | 'challenge';
  auraColor: string; // Unique aura color for each result
}

// Random personal questions for rule 7
const personalQuestions = [
  { he: 'מה הדבר הכי מביך שקרה לך בדייט?', en: 'What\'s the most embarrassing thing that happened on a date?' },
  { he: 'מה הסוד הכי קטן שלך?', en: 'What\'s your smallest secret?' },
  { he: 'מי האקס הכי מוזר שהיה לך?', en: 'Who was your weirdest ex?' },
  { he: 'מה הדבר הכי יקר ששברת?', en: 'What\'s the most expensive thing you\'ve broken?' },
  { he: 'מה הדבר הכי מטופש שעשית כששתית?', en: 'What\'s the dumbest thing you did while drunk?' },
  { he: 'מה החלום הכי מוזר שחלמת?', en: 'What\'s the weirdest dream you\'ve had?' },
  { he: 'על מה שיקרת לאחרונה?', en: 'What did you lie about recently?' },
  { he: 'מה הדבר הכי ילדותי שאתה עדיין עושה?', en: 'What\'s the most childish thing you still do?' },
  { he: 'מה הפחד הכי מוזר שלך?', en: 'What\'s your weirdest fear?' },
  { he: 'מה הדבר הכי מביך בטלפון שלך?', en: 'What\'s the most embarrassing thing on your phone?' },
];

// Random "Never Have I Ever" experiences for rule 9
const neverHaveIEver = [
  { he: 'מעולם לא נשקתי זר/ה באותו לילה שפגשתי', en: 'Never kissed a stranger the same night I met them' },
  { he: 'מעולם לא שלחתי הודעה לאקס בשכרות', en: 'Never drunk-texted an ex' },
  { he: 'מעולם לא בכיתי מסרט', en: 'Never cried from a movie' },
  { he: 'מעולם לא התעוררתי במקום לא מוכר', en: 'Never woke up in an unfamiliar place' },
  { he: 'מעולם לא שיקרתי בתאריך הלידה לקבל הנחה', en: 'Never lied about my birthday for a discount' },
  { he: 'מעולם לא ברחתי מחשבון במסעדה', en: 'Never left a restaurant without paying' },
  { he: 'מעולם לא העמדתי פנים שאני חולה כדי לא לבוא לעבודה', en: 'Never pretended to be sick to skip work' },
  { he: 'מעולם לא אכלתי אוכל שנפל על הרצפה', en: 'Never ate food that fell on the floor' },
  { he: 'מעולם לא רכלתי על חבר קרוב', en: 'Never gossiped about a close friend' },
  { he: 'מעולם לא שרתי בקריוקי', en: 'Never sang karaoke' },
];

// Random challenges for rule 11 (Do or Drink)
const doOrDrinkChallenges = [
  { he: 'תעשה עיסוי בכתפיים למי שיושב מימינך', en: 'Give a shoulder massage to the person on your right' },
  { he: 'תחקה מישהו מפורסם עד שינחשו מי זה', en: 'Impersonate a celebrity until someone guesses' },
  { he: 'תרקוד 15 שניות בלי מוזיקה', en: 'Dance for 15 seconds with no music' },
  { he: 'תעשה 10 שכיבות סמיכה עכשיו', en: 'Do 10 push-ups right now' },
  { he: 'תשלח הודעה "אני אוהב אותך" להורה', en: 'Text "I love you" to a parent' },
  { he: 'תן ללמי שמשמאלך לפרסם סטורי מהטלפון שלך', en: 'Let the person on your left post a story from your phone' },
  { he: 'תספר בדיחה ואם אף אחד לא צוחק - שותה', en: 'Tell a joke - if no one laughs, drink' },
  { he: 'תמחה את התמונה האחרונה בגלריה', en: 'Delete the last photo in your gallery' },
  { he: 'תראה את השיחה האחרונה בווטסאפ לכולם', en: 'Show your last WhatsApp conversation to everyone' },
  { he: 'תעשה סלפי מכוער ותעלה לסטורי', en: 'Take an ugly selfie and post it to your story' },
];

const diceRules: DiceRule[] = [
  {
    sum: 2,
    titleEn: 'Snake Eyes',
    titleHe: 'עיני נחש',
    descriptionEn: 'Bad luck! Drink 2 shots immediately. 🐍',
    descriptionHe: 'מזל רע! המטיל שותה 2 צ\'ייסרים מיידית. 🐍',
    icon: '🐍',
    auraColor: 'hsl(0 84% 40%)',
  },
  {
    sum: 3,
    titleEn: 'Three Drinks',
    titleHe: 'שלוחים',
    descriptionEn: 'You drink one sip. 🍺',
    descriptionHe: 'המטיל שותה שלוק אחד. 🍺',
    icon: '🍺',
    auraColor: 'hsl(32 95% 44%)',
  },
  {
    sum: 4,
    titleEn: 'Floor!',
    titleHe: 'רצפה!',
    descriptionEn: 'Everyone must touch the floor. Last one drinks! 🖐️',
    descriptionHe: 'כולם חייבים לגעת ברצפה. האחרון שנוגע - שותה! 🖐️',
    icon: '🖐️',
    auraColor: 'hsl(30 60% 35%)',
  },
  {
    sum: 5,
    titleEn: 'Ladies Drink',
    titleHe: 'בחורות שותות',
    descriptionEn: 'All ladies at the table raise a glass and drink! 💃',
    descriptionHe: 'כל הנשים בשולחן מרימות כוס ושותות שלוק. 💃',
    icon: '💃',
    auraColor: 'hsl(320 70% 50%)',
  },
  {
    sum: 6,
    titleEn: 'Guys Drink',
    titleHe: 'בחורים שותים',
    descriptionEn: 'All guys at the table raise a glass and drink! 🕺',
    descriptionHe: 'כל הגברים בשולחן מרימים כוס ושותים שלוק. 🕺',
    icon: '🕺',
    auraColor: 'hsl(220 70% 50%)',
  },
  {
    sum: 7,
    titleEn: 'The Question',
    titleHe: 'השאלה',
    descriptionEn: 'Ask the personal question below. Anyone who refuses to answer - drinks! ❓',
    descriptionHe: 'המטיל שואל את השאלה האישית הבאה. מי שלא עונה - שותה! ❓',
    icon: '❓',
    hasRandomContent: true,
    randomContentType: 'question',
    auraColor: 'hsl(280 60% 50%)',
  },
  {
    sum: 8,
    titleEn: 'Heaven!',
    titleHe: 'שמיים!',
    descriptionEn: 'Everyone raise hands to the sky. Last one drinks! 🙌',
    descriptionHe: 'כולם מרימים ידיים לשמיים. האחרון שמרים - שותה! 🙌',
    icon: '🙌',
    auraColor: 'hsl(200 80% 60%)',
  },
  {
    sum: 9,
    titleEn: 'Innocents Drink',
    titleHe: 'חפים מפשע שותים',
    descriptionEn: 'Anyone who has NEVER done the following - drinks! 😇',
    descriptionHe: 'מי שמעולם לא עשה את המקרה הבא - שותה! 😇',
    icon: '😇',
    hasRandomContent: true,
    randomContentType: 'experience',
    auraColor: 'hsl(160 70% 45%)',
  },
  {
    sum: 10,
    titleEn: 'Confession',
    titleHe: 'וידוי קטן',
    descriptionEn: 'Tell a short, funny story about yourself. Everyone toasts with you! 🗣️',
    descriptionHe: 'ספר סיפור קצר ומצחיק על עצמך. כולם עושים איתך לחיים! 🗣️',
    icon: '🗣️',
    auraColor: 'hsl(25 90% 50%)',
  },
  {
    sum: 11,
    titleEn: 'Do or Drink',
    titleHe: 'דו או דרינק',
    descriptionEn: 'Complete the challenge below or drink a shot! 🔥',
    descriptionHe: 'בצע את המשימה הבאה או שתשתה צ\'ייסר! 🔥',
    icon: '🔥',
    hasRandomContent: true,
    randomContentType: 'challenge',
    auraColor: 'hsl(15 90% 55%)',
  },
  {
    sum: 12,
    titleEn: 'The King!',
    titleHe: 'המלך!',
    descriptionEn: 'Everyone salutes and drinks in honor of the new King! 👑',
    descriptionHe: 'כולם מצדיעים ושותים לכבוד המלך החדש! 👑',
    icon: '👑',
    auraColor: 'hsl(45 93% 50%)',
  },
];

// Royal Nightlife color palette
const ROYAL_GOLD = 'hsl(45 93% 50%)';
const ROYAL_AMBER = 'hsl(32 95% 44%)';
const DEEP_CHARCOAL = 'hsl(220 20% 8%)';

// Single dice face component using CSS Grid for perfect centering
const DiceFace: React.FC<{ value: number; isRolling: boolean }> = ({ 
  value, 
  isRolling,
}) => {
  const dotLayouts: Record<number, number[]> = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
  };

  return (
    <motion.div
      className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl shadow-2xl p-4"
      style={{
        background: `linear-gradient(145deg, ${ROYAL_GOLD}, ${ROYAL_AMBER})`,
        boxShadow: `0 10px 40px ${ROYAL_GOLD}60, inset 0 3px 15px rgba(255,255,255,0.4), inset 0 -3px 10px rgba(0,0,0,0.2)`,
        border: `2px solid ${ROYAL_GOLD}`,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        placeItems: 'center',
        filter: isRolling ? 'blur(3px)' : 'none',
      }}
      animate={isRolling ? {
        rotateX: [0, 360, 720, 1080],
        rotateY: [0, 180, 360, 540],
        rotateZ: [0, 90, 180, 270],
        scale: [1, 0.85, 1.15, 1],
      } : {}}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((pos) => {
        const showDot = dotLayouts[value]?.includes(pos);
        return (
          <div key={pos} className="w-full h-full flex items-center justify-center">
            {showDot && (
              <motion.div
                className="w-4 h-4 md:w-5 md:h-5 rounded-full"
                style={{
                  background: DEEP_CHARCOAL,
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3)',
                }}
                initial={{ scale: 0 }}
                animate={{ scale: isRolling ? [1, 0.5, 1] : 1 }}
              />
            )}
          </div>
        );
      })}
    </motion.div>
  );
};

// Particle explosion component
const ParticleExplosion: React.FC<{ color: string; type: 'confetti' | 'bubbles' | 'sparks' }> = ({ color, type }) => {
  const particles = Array.from({ length: type === 'confetti' ? 30 : 20 }, (_, i) => i);
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((i) => {
        const angle = (i / particles.length) * 360;
        const distance = 100 + Math.random() * 150;
        const size = type === 'confetti' ? 8 + Math.random() * 8 : 4 + Math.random() * 6;
        const delay = Math.random() * 0.2;
        
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: size,
              height: type === 'confetti' ? size * 2 : size,
              background: type === 'confetti' 
                ? `hsl(${Math.random() * 360} 80% 60%)`
                : color,
              boxShadow: type === 'sparks' ? `0 0 10px ${color}` : 'none',
              borderRadius: type === 'bubbles' ? '50%' : '2px',
            }}
            initial={{ x: '-50%', y: '-50%', opacity: 1, scale: 0 }}
            animate={{
              x: `calc(-50% + ${Math.cos(angle * Math.PI / 180) * distance}px)`,
              y: `calc(-50% + ${Math.sin(angle * Math.PI / 180) * distance}px)`,
              opacity: 0,
              scale: [0, 1.5, 0],
              rotate: type === 'confetti' ? [0, 360] : 0,
            }}
            transition={{ 
              duration: 1.2, 
              delay,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
};

const KingsDice: React.FC = () => {
  const { language, setShowLanguageToggle } = useLanguage();
  const { setCurrentScreen, resetGame, currentBar } = useGame();
  const isRTL = language === 'he';

  const [dice1, setDice1] = useState(1);
  const [dice2, setDice2] = useState(6);
  const [isRolling, setIsRolling] = useState(false);
  const [currentRule, setCurrentRule] = useState<DiceRule | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [randomContent, setRandomContent] = useState<{ he: string; en: string } | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [auraColor, setAuraColor] = useState(ROYAL_GOLD);
  
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Hide language toggle during gameplay
  useEffect(() => {
    setShowLanguageToggle(false);
    return () => setShowLanguageToggle(true);
  }, [setShowLanguageToggle]);

  // Haptic feedback
  const triggerHaptic = useCallback((type: 'light' | 'heavy' | 'roll') => {
    if ('vibrate' in navigator) {
      if (type === 'roll') {
        navigator.vibrate([30, 20, 30, 20, 30]);
      } else {
        navigator.vibrate(type === 'heavy' ? 200 : 50);
      }
    }
  }, []);

  // Roll dice with enhanced VFX
  const rollDice = useCallback(() => {
    if (isRolling) return;
    
    setIsRolling(true);
    setCurrentRule(null);
    setCountdown(null);
    setRandomContent(null);
    setShowParticles(false);
    setAuraColor(ROYAL_GOLD);
    
    // Haptic during roll
    triggerHaptic('roll');

    // Animate through random values with motion blur effect
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setDice1(Math.floor(Math.random() * 6) + 1);
      setDice2(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      triggerHaptic('light');
      
      if (rollCount >= 12) {
        clearInterval(rollInterval);
        
        // Final values
        const finalDice1 = Math.floor(Math.random() * 6) + 1;
        const finalDice2 = Math.floor(Math.random() * 6) + 1;
        setDice1(finalDice1);
        setDice2(finalDice2);
        
        const sum = finalDice1 + finalDice2;
        const rule = diceRules.find(r => r.sum === sum);
        
        // Trigger screen shake on impact
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 400);
        
        setTimeout(() => {
          setIsRolling(false);
          triggerHaptic('heavy');
          
          if (rule) {
            setCurrentRule(rule);
            setAuraColor(rule.auraColor);
            setShowParticles(true);
            
            // Generate random content if rule requires it
            if (rule.hasRandomContent && rule.randomContentType) {
              let content: { he: string; en: string } | null = null;
              if (rule.randomContentType === 'question') {
                content = personalQuestions[Math.floor(Math.random() * personalQuestions.length)];
              } else if (rule.randomContentType === 'experience') {
                content = neverHaveIEver[Math.floor(Math.random() * neverHaveIEver.length)];
              } else if (rule.randomContentType === 'challenge') {
                content = doOrDrinkChallenges[Math.floor(Math.random() * doOrDrinkChallenges.length)];
              }
              setRandomContent(content);
            }
            
            // Start countdown if rule has timer
            if (rule.hasTimer && rule.timerSeconds) {
              setCountdown(rule.timerSeconds);
            }
          }
        }, 200);
      }
    }, 70);
  }, [isRolling, triggerHaptic]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          triggerHaptic('heavy');
          return null;
        }
        triggerHaptic('light');
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [countdown, triggerHaptic]);

  const handleBack = () => {
    setCurrentScreen('gameSelection');
  };

  const handleHome = () => {
    resetGame();
  };

  const handleRestart = () => {
    setDice1(1);
    setDice2(6);
    setCurrentRule(null);
    setCountdown(null);
    setRandomContent(null);
    setShowParticles(false);
    setAuraColor(ROYAL_GOLD);
  };

  const diceSum = dice1 + dice2;
  const particleType = currentRule?.sum === 12 ? 'confetti' : currentRule?.sum === 2 ? 'sparks' : 'bubbles';

  return (
    <motion.div 
      className="min-h-screen flex flex-col relative overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        background: `linear-gradient(180deg, ${DEEP_CHARCOAL} 0%, hsl(220 20% 4%) 50%, ${auraColor}15 100%)`,
      }}
      animate={screenShake ? {
        x: [0, -10, 10, -10, 10, -5, 5, 0],
        y: [0, -5, 5, -5, 5, -2, 2, 0],
      } : {}}
      transition={{ duration: 0.4 }}
    >
      {/* Dynamic Aura Glow based on result */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
        animate={{
          background: currentRule ? auraColor : `${ROYAL_GOLD}10`,
          scale: currentRule ? [1, 1.4, 1.2] : [1, 1.2, 1],
          opacity: currentRule ? [0.3, 0.6, 0.4] : [0.15, 0.25, 0.15],
        }}
        transition={{ duration: currentRule ? 0.5 : 4, repeat: currentRule ? 0 : Infinity }}
      />
      
      {/* Secondary ambient glow */}
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-[80px] pointer-events-none"
        style={{ background: `${ROYAL_AMBER}20` }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />

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
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="w-6 h-6" style={{ color: ROYAL_GOLD, filter: `drop-shadow(0 0 8px ${ROYAL_GOLD}80)` }} />
          </motion.div>
          <span 
            className="font-black text-lg"
            style={{ color: ROYAL_GOLD, textShadow: `0 0 20px ${ROYAL_GOLD}50` }}
          >
            {isRTL ? 'קוביות המלך' : "King's Dice"}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowInstructions(true)}
            className="p-3 rounded-xl glass-card hover:bg-muted/50 transition-colors"
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        <AnimatePresence mode="wait">
          {!currentRule ? (
            // DICE VIEW
            <motion.div
              key="dice"
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {/* Dice Display with motion blur during roll */}
              <motion.div 
                className="flex gap-8 mb-10 justify-center perspective-1000"
                animate={isRolling ? { y: [0, -40, 0] } : {}}
                transition={{ duration: 0.12, repeat: isRolling ? Infinity : 0 }}
              >
                <DiceFace value={dice1} isRolling={isRolling} />
                <DiceFace value={dice2} isRolling={isRolling} />
              </motion.div>

              {/* Sum Display */}
              <motion.div
                className="mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.span 
                  className="text-7xl font-black inline-block"
                  style={{ 
                    color: ROYAL_GOLD,
                    textShadow: `0 0 40px ${ROYAL_GOLD}80, 0 0 80px ${ROYAL_GOLD}40`,
                  }}
                  animate={!isRolling ? { scale: [1, 1.05, 1] } : { scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: isRolling ? 0.15 : 2, repeat: Infinity }}
                >
                  {diceSum}
                </motion.span>
              </motion.div>

              {/* Roll Button */}
              <Button
                size="xl"
                onClick={rollDice}
                disabled={isRolling}
                className="w-full max-w-xs text-xl font-black py-8 relative overflow-hidden border-2"
                style={{ 
                  background: `linear-gradient(135deg, ${ROYAL_GOLD}, ${ROYAL_AMBER})`,
                  boxShadow: `0 0 40px ${ROYAL_GOLD}50, 0 10px 30px rgba(0,0,0,0.3)`,
                  borderColor: `${ROYAL_GOLD}80`,
                  color: DEEP_CHARCOAL,
                }}
              >
                {!isRolling && (
                  <motion.div
                    className="absolute inset-0 bg-white/30"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isRolling 
                    ? (isRTL ? '🎲 מגלגל...' : '🎲 Rolling...') 
                    : (isRTL ? '🎲 הטל קוביות!' : '🎲 ROLL!')
                  }
                </span>
              </Button>
            </motion.div>
          ) : (
            // RULE CARD VIEW - Full Screen Overlay with particles
            <motion.div
              key="rule"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: `${DEEP_CHARCOAL}F8` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCurrentRule(null)}
            >
              {/* Particle Explosion */}
              {showParticles && (
                <ParticleExplosion color={auraColor} type={particleType} />
              )}
              
              {/* Aura burst on reveal */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ duration: 0.6 }}
                style={{
                  background: `radial-gradient(circle at center, ${auraColor}60 0%, transparent 70%)`,
                }}
              />

              <motion.div
                className="w-full max-w-md text-center relative"
                initial={{ scale: 0.7, rotateY: -90, opacity: 0 }}
                animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                exit={{ scale: 0.7, rotateY: 90, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                onClick={(event) => event.stopPropagation()}
              >
                {/* Rule Icon - Giant with glow */}
                <motion.div
                  className="text-9xl mb-6 relative"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  <motion.div
                    className="absolute inset-0 blur-2xl"
                    style={{ background: auraColor }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="relative z-10">{currentRule.icon}</span>
                </motion.div>

                {/* Dice Sum Badge */}
                <motion.div
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-6 border-2"
                  style={{ 
                    background: `${auraColor}25`,
                    borderColor: `${auraColor}60`,
                    boxShadow: `0 0 30px ${auraColor}40`,
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span 
                    className="text-4xl font-black"
                    style={{ color: auraColor, textShadow: `0 0 20px ${auraColor}80` }}
                  >
                    {currentRule.sum}
                  </span>
                </motion.div>

                {/* Rule Card */}
                <motion.div
                  className="glass-card p-8 border-2 mb-8 rounded-3xl"
                  style={{ 
                    borderColor: `${auraColor}50`,
                    boxShadow: `0 0 60px ${auraColor}30, inset 0 0 30px ${auraColor}10`,
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 
                    className="text-3xl md:text-4xl font-black mb-4"
                    style={{ color: auraColor, textShadow: `0 0 20px ${auraColor}50` }}
                  >
                    {isRTL ? currentRule.titleHe : currentRule.titleEn}
                  </h2>
                  <p className="text-xl text-foreground leading-relaxed font-bold">
                    {isRTL ? currentRule.descriptionHe : currentRule.descriptionEn}
                  </p>

                  {/* Random Content Display with slide-up animation */}
                  {randomContent && (
                    <motion.div
                      className="mt-6 p-5 rounded-2xl border-2"
                      style={{ 
                        background: `${auraColor}20`,
                        borderColor: `${auraColor}50`,
                        boxShadow: `0 0 30px ${auraColor}30`,
                      }}
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                    >
                      <p className="text-2xl font-black text-foreground leading-relaxed">
                        "{isRTL ? randomContent.he : randomContent.en}"
                      </p>
                    </motion.div>
                  )}

                  {/* Countdown Timer */}
                  {countdown !== null && (
                    <motion.div
                      className="mt-8"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <motion.div
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-full border-2"
                        style={{ 
                          background: countdown <= 1 ? 'hsl(0 84% 60% / 0.3)' : `${auraColor}30`,
                          borderColor: countdown <= 1 ? 'hsl(0 84% 60%)' : auraColor,
                        }}
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        <Timer 
                          className="w-8 h-8" 
                          style={{ color: countdown <= 1 ? 'hsl(0 84% 60%)' : auraColor }} 
                        />
                        <span 
                          className="text-5xl font-black"
                          style={{ color: countdown <= 1 ? 'hsl(0 84% 60%)' : auraColor }}
                        >
                          {countdown}
                        </span>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Action Button */}
                <Button
                  size="lg"
                  onClick={() => setCurrentRule(null)}
                  className="w-full max-w-xs text-lg font-black py-6 border-2"
                  style={{ 
                    background: `linear-gradient(135deg, ${auraColor}, ${ROYAL_AMBER})`,
                    borderColor: auraColor,
                    boxShadow: `0 0 30px ${auraColor}50`,
                    color: DEEP_CHARCOAL,
                  }}
                >
                  {isRTL ? '🎲 לסיבוב הבא' : '🎲 Next Turn'}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bar Offers Widget */}
      <motion.div
        className="p-4 flex justify-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <BarOffersWidget />
      </motion.div>

      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent 
          className="glass-card border-2 max-w-sm max-h-[80vh] overflow-y-auto"
          style={{ borderColor: `${ROYAL_GOLD}40` }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <DialogHeader>
            <DialogTitle 
              className="text-xl font-bold text-center"
              style={{ color: ROYAL_GOLD }}
            >
              {isRTL ? '👑 חוקי קוביות המלך' : "👑 King's Dice Rules"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {diceRules.map((rule) => (
              <div 
                key={rule.sum} 
                className="flex items-start gap-3 p-3 rounded-xl border"
                style={{ 
                  background: `${rule.auraColor}15`,
                  borderColor: `${rule.auraColor}40`,
                }}
              >
                <span className="text-2xl">{rule.icon}</span>
                <div>
                  <p className="font-bold text-foreground">
                    <span style={{ color: rule.auraColor }}>{rule.sum}:</span> {isRTL ? rule.titleHe : rule.titleEn}
                    {rule.isPersistent && <span className="text-xs text-green-400 ml-2">(פעיל)</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? rule.descriptionHe : rule.descriptionEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default KingsDice;
