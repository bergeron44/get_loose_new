import React from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { GameCard as GameCardType } from '@/data/gameData';
import type { GameType } from '@/types/game';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Heart, 
  HelpCircle, 
  Zap, 
  Brain, 
  Sparkles, 
  Users, 
  Crown,
  Target
} from 'lucide-react';

interface GameCardProps {
  card: GameCardType;
  gameType: GameType;
  currentIndex: number;
  totalCards: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  children?: React.ReactNode;
}

const gameIcons: Record<GameType, React.ElementType> = {
  icebreaker: Heart,
  guessWho: HelpCircle,
  truthDareShot: Zap,
  trivia: Brain,
  truthOrDare: Sparkles,
  neverHaveI: Target,
  mostLikely: Users,
  kingsCup: Crown,
};

const GameCard: React.FC<GameCardProps> = ({
  card,
  gameType,
  currentIndex,
  totalCards,
  onSwipeLeft,
  onSwipeRight,
  children,
}) => {
  const { isRTL, t } = useLanguage();
  const x = useMotionValue(0);
  
  // Transform for rotation based on drag
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  
  // Transform for opacity of overlays
  const leftOverlayOpacity = useTransform(x, [-100, -20, 0], [1, 0.5, 0]);
  const rightOverlayOpacity = useTransform(x, [0, 20, 100], [0, 0.5, 1]);
  
  // Background color transform
  const backgroundColor = useTransform(
    x,
    [-100, 0, 100],
    [
      'hsla(25, 95%, 53%, 0.15)',
      'hsla(222, 47%, 12%, 0.6)',
      'hsla(84, 81%, 44%, 0.15)',
    ]
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const velocity = 500;
    
    if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      // Swiped left - Fail/Drink
      onSwipeLeft();
    } else if (info.offset.x > threshold || info.velocity.x > velocity) {
      // Swiped right - Done/Next
      onSwipeRight();
    }
  };

  const Icon = gameIcons[gameType];
  const progress = ((currentIndex + 1) / totalCards) * 100;

  return (
    <motion.div
      className="absolute w-full max-w-md cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.02 }}
    >
      {/* Swipe overlays */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-destructive flex items-center justify-center z-10 pointer-events-none"
        style={{ opacity: leftOverlayOpacity }}
      >
        <div className="bg-destructive/90 text-destructive-foreground px-6 py-3 rounded-full font-bold text-xl rotate-12">
          {t('gameplay.drink')} 🍺
        </div>
      </motion.div>
      
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-accent flex items-center justify-center z-10 pointer-events-none"
        style={{ opacity: rightOverlayOpacity }}
      >
        <div className="bg-accent/90 text-accent-foreground px-6 py-3 rounded-full font-bold text-xl -rotate-12">
          {t('gameplay.next')} ✓
        </div>
      </motion.div>

      {/* Main card */}
      <motion.div
        className="relative rounded-2xl overflow-hidden border border-primary/20 aspect-[3/4] p-6 flex flex-col"
        style={{ backgroundColor }}
      >
        {/* Glassmorphism effect */}
        <div className="absolute inset-0 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header with category badge */}
          {card.category && (
            <div className="flex justify-center mb-4">
              <span className={`text-xs font-bold px-4 py-1.5 rounded-full ${
                card.category === 'Soft' || card.category === 'קל' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                card.category === 'Spicy' || card.category === 'פיקנטי' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                card.category === 'Hardcore' || card.category === 'הארדקור' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                'bg-primary/20 text-primary border border-primary/30'
              }`}>
                {card.category}
              </span>
            </div>
          )}

          {/* Card type indicator */}
          {card.type && gameType === 'truthOrDare' && (
            <div className="flex justify-center mb-2">
              <span className={`text-sm font-bold ${
                card.type === 'question' ? 'text-primary' : 'text-secondary'
              }`}>
                {card.type === 'question' ? t('gameplay.truth') : t('gameplay.dare')}
              </span>
            </div>
          )}

          {/* Main content area */}
          <div className="flex-1 flex items-center justify-center">
            {children || (
              <h3 className="text-2xl md:text-3xl font-bold text-foreground text-center leading-relaxed font-heebo">
                {card.text}
              </h3>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-4 border-t border-border/30">
            <div className="flex items-center justify-between">
              {/* Game icon */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {t(`game.${gameType}`)}
                </span>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {currentIndex + 1} / {totalCards}
                </span>
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-secondary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Swipe hint */}
      <div className="flex justify-between mt-4 px-4">
        <div className={`flex items-center gap-1 text-xs text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className="text-secondary">←</span>
          <span>{t('gameplay.drink')}</span>
        </div>
        <div className={`flex items-center gap-1 text-xs text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span>{t('gameplay.next')}</span>
          <span className="text-accent">→</span>
        </div>
      </div>
    </motion.div>
  );
};

export default GameCard;
