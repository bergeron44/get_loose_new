import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameType } from '@/types/game';
import { useLanguage } from '@/contexts/LanguageContext';

interface InstructionStep {
  icon: string;
  en: string;
  he: string;
}

const gameQuickInstructions: Record<GameType, InstructionStep[]> = {
  icebreaker: [
    { icon: '💬', en: 'Answer or skip', he: 'ענו או דלגו' },
    { icon: '🍺', en: 'Skip = Drink!', he: 'דילוג = שתייה!' },
  ],
  guessWho: [
    { icon: '📱', en: 'Forehead mode', he: 'מצח למעלה' },
    { icon: '⏱️', en: '60 seconds!', he: '60 שניות!' },
  ],
  truthDareShot: [
    { icon: '🌶️', en: 'Truth or Dare', he: 'אמת או חובה' },
    { icon: '🥃', en: 'Or drink!', he: 'או שותים!' },
  ],
  trivia: [
    { icon: '❓', en: 'Pick an answer', he: 'בחרו תשובה' },
    { icon: '❌', en: 'Wrong = Drink!', he: 'טעות = שתייה!' },
  ],
  truthOrDare: [
    { icon: '🔮', en: 'Truth or Dare', he: 'אמת או חובה' },
    { icon: '🍺', en: 'Skip = Drink!', he: 'דילוג = שתייה!' },
  ],
  neverHaveI: [
    { icon: '🙋', en: 'Done it? Drink!', he: 'עשיתם? שותים!' },
    { icon: '🚫', en: "Didn't? Safe!", he: 'לא? בטוחים!' },
  ],
  mostLikely: [
    { icon: '👉', en: 'Point at someone', he: 'הצביעו על מישהו' },
    { icon: '🍺', en: 'Most votes drinks!', he: 'הכי הרבה קולות - שותה!' },
  ],
  kingsCup: [
    { icon: '🃏', en: 'Follow the card rule', he: 'עקבו אחר חוק הקלף' },
    { icon: '👑', en: 'King = Pour!', he: 'מלך = מוזגים!' },
  ],
};

interface Props {
  gameType: GameType;
  onDismiss: () => void;
}

const AutoDismissInstructions: React.FC<Props> = ({ gameType, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { language } = useLanguage();
  const isRTL = language === 'he';
  
  const instructions = gameQuickInstructions[gameType] || [];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Wait for exit animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleTap = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleTap}
        >
          {/* Semi-transparent overlay */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          
          {/* Instructions card */}
          <motion.div
            className="relative z-10 glass-card p-6 max-w-xs text-center border border-primary/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="space-y-3 mb-4">
              {instructions.map((step, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3 justify-center"
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-foreground font-medium">
                    {isRTL ? step.he : step.en}
                  </span>
                </motion.div>
              ))}
            </div>
            
            {/* Tap to dismiss hint */}
            <motion.p
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {isRTL ? 'לחצו להמשך' : 'Tap to continue'}
            </motion.p>
            
            {/* Auto-dismiss progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 bg-primary/30 rounded-b-2xl overflow-hidden"
            >
              <motion.div
                className="h-full bg-primary"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 3, ease: 'linear' }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AutoDismissInstructions;
