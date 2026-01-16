import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage, isRTL, showLanguageToggle } = useLanguage();
  const { currentScreen } = useGame();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'he' : 'en');
  };

  // Hide on gameplay screens or when explicitly hidden
  if (!showLanguageToggle || currentScreen === 'gameplay' || currentScreen === 'mostLikelyGame') {
    return null;
  }

  return (
    <motion.button
      onClick={toggleLanguage}
      className="fixed z-50 flex items-center gap-2 backdrop-blur-xl bg-card/60 px-5 py-3 rounded-full border border-primary/40 hover:border-primary/70 shadow-lg hover:shadow-neon-purple transition-all duration-300"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ 
        top: 'calc(var(--safe-area-inset-top, 0px) + 1rem)',
        right: isRTL ? 'auto' : 'calc(var(--safe-area-inset-right, 0px) + 1rem)', 
        left: isRTL ? 'calc(var(--safe-area-inset-left, 0px) + 1rem)' : 'auto' 
      }}
    >
      <Globe className="w-5 h-5 text-primary" />
      <span className="text-game-sm font-bold text-foreground">
        {language === 'en' ? 'עב' : 'EN'}
      </span>
    </motion.button>
  );
};

export default LanguageToggle;
