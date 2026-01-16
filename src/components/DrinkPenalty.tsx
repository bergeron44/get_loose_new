import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wine, Beer, Martini, GlassWater } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getRandomPenalty } from '@/data/gameData';
import { Button } from '@/components/ui/button';
import { getGameTheme } from '@/config/gameThemes';

const penaltyIcons = [Wine, Beer, Martini, GlassWater];

const DrinkPenalty: React.FC = () => {
  const { showPenalty, setShowPenalty, intensity, selectedGame } = useGame();
  const { language } = useLanguage();
  const [penalty, setPenalty] = useState('');
  const [IconComponent, setIconComponent] = useState<React.ElementType>(Wine);

  // Get theme for current game
  const theme = getGameTheme(selectedGame);

  useEffect(() => {
    if (showPenalty) {
      setPenalty(getRandomPenalty(intensity, language));
      setIconComponent(penaltyIcons[Math.floor(Math.random() * penaltyIcons.length)]);
    }
  }, [showPenalty, intensity, language]);

  const handleClose = () => {
    setShowPenalty(false);
  };

  // Dynamic colors based on game theme
  const gradientStyle = theme 
    ? { background: `linear-gradient(135deg, hsl(${theme.primaryColor}), hsl(${theme.secondaryColor}))` }
    : { background: 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--neon-pink)))' };

  const glowStyle = theme
    ? { boxShadow: `0 0 30px hsl(${theme.primaryColor} / 0.5)` }
    : { boxShadow: 'var(--shadow-neon-orange)' };

  const textColor = theme 
    ? `hsl(${theme.primaryColor})`
    : 'hsl(var(--secondary))';

  return (
    <AnimatePresence>
      {showPenalty && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Penalty Card */}
          <motion.div
            className="relative z-10 w-full max-w-sm"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
            }}
          >
            <div 
              className="glass-card p-8 text-center border-2"
              style={{ 
                borderColor: theme ? `hsl(${theme.primaryColor} / 0.5)` : 'hsl(var(--secondary) / 0.5)',
                ...glowStyle,
              }}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Animated Icon */}
              <motion.div
                className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6"
                style={gradientStyle}
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                <IconComponent className="w-12 h-12 text-foreground" />
              </motion.div>

              {/* Title with theme emojis */}
              <motion.h2
                className="text-3xl font-black mb-4"
                style={{ 
                  color: textColor,
                  textShadow: theme 
                    ? `0 0 20px hsl(${theme.primaryColor} / 0.6), 0 0 40px hsl(${theme.primaryColor} / 0.4)`
                    : '0 0 20px hsl(var(--neon-orange) / 0.6), 0 0 40px hsl(var(--neon-orange) / 0.4)',
                }}
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                }}
              >
                {theme ? `${theme.emojis[0]} DRINK! ${theme.emojis[2]}` : 'DRINK!'}
              </motion.h2>

              {/* Penalty Text */}
              <motion.p
                className="text-xl font-semibold text-foreground mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {penalty}
              </motion.p>

              {/* Dismiss Button */}
              <Button
                size="lg"
                onClick={handleClose}
                className="w-full"
                style={gradientStyle}
              >
                Got it! 🍻
              </Button>
            </div>

            {/* Confetti particles with theme colors */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: theme 
                    ? (i % 2 === 0 ? `hsl(${theme.primaryColor})` : `hsl(${theme.secondaryColor})`)
                    : (i % 2 === 0 ? 'hsl(var(--neon-orange))' : 'hsl(var(--neon-purple))'),
                  top: '50%',
                  left: '50%',
                }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i * 30 * Math.PI) / 180) * 150,
                  y: Math.sin((i * 30 * Math.PI) / 180) * 150,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{
                  duration: 0.8,
                  ease: 'easeOut',
                  delay: 0.1,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DrinkPenalty;
