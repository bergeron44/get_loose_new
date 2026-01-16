import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Users, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { getGameTheme } from '@/config/gameThemes';
import BarOffersWidget from '@/components/BarOffersWidget';

const TriviaPartyEntry: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen } = useGame();
  const isRTL = language === 'he';
  
  const theme = getGameTheme('trivia');
  const primaryColor = theme ? `hsl(${theme.primaryColor})` : 'hsl(217 91% 60%)';
  const secondaryColor = theme ? `hsl(${theme.secondaryColor})` : 'hsl(45 93% 47%)';

  const handleBack = () => {
    setCurrentScreen('gameSelection');
  };

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-hero flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 right-0 w-80 h-80 rounded-full blur-3xl"
          style={{ background: `${primaryColor}20` }}
          animate={{ scale: [1, 1.3, 1], x: [0, -50, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/3 left-0 w-72 h-72 rounded-full blur-3xl"
          style={{ background: `${secondaryColor}15` }}
          animate={{ scale: [1, 1.2, 1], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      {/* Header */}
      <motion.div
        className="flex items-center gap-4 mb-8 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={handleBack}
          className="p-3 rounded-xl glass-card hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className={`w-5 h-5 text-foreground ${isRTL ? 'rotate-180' : ''}`} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            🎉 {isRTL ? 'מסיבת טריוויה' : 'Party Trivia'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRTL ? 'כולם משחקים מהטלפון שלהם!' : 'Everyone plays from their phone!'}
          </p>
        </div>
      </motion.div>

      {/* Main Buttons */}
      <div className="flex-1 flex flex-col justify-center gap-6 relative z-10">
        {/* Host Button */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            size="xl"
            onClick={() => setCurrentScreen('triviaDifficulty')}
            className="w-full text-xl font-black py-10 relative overflow-hidden group"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}, hsl(250 91% 55%))`,
              boxShadow: `0 0 40px ${primaryColor}40`,
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8" />
                <span>{isRTL ? 'פתח משחק חדש' : 'Host New Game'}</span>
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-sm font-normal opacity-80">
                {isRTL ? 'צור קוד חדר ושתף עם חברים' : 'Create room code and share with friends'}
              </span>
            </div>
          </Button>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-muted-foreground text-sm px-4">
            {isRTL ? 'או' : 'or'}
          </span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Join Button */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            size="xl"
            onClick={() => setCurrentScreen('triviaPartyJoin')}
            className="w-full text-xl font-black py-10 relative overflow-hidden group"
            style={{ 
              background: `linear-gradient(135deg, ${secondaryColor}, hsl(35 95% 50%))`,
              boxShadow: `0 0 40px ${secondaryColor}40`,
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2.5 }}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8" />
                <span>{isRTL ? 'הצטרף למשחק' : 'Join Game'}</span>
              </div>
              <span className="text-sm font-normal opacity-80">
                {isRTL ? 'הכנס קוד חדר של חבר' : 'Enter friend\'s room code'}
              </span>
            </div>
          </Button>
        </motion.div>
      </div>

      {/* Features List */}
      <motion.div
        className="glass-card p-4 mb-4 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex flex-wrap justify-center gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-primary/20 text-primary flex items-center gap-1">
            ⚡ {isRTL ? 'זמן אמת' : 'Real-time'}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-secondary/20 text-secondary flex items-center gap-1">
            🏆 {isRTL ? 'הכי מהיר מנצח' : 'Fastest Wins'}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-destructive/20 text-destructive flex items-center gap-1">
            🍺 {isRTL ? 'האחרון שותה' : 'Last One Drinks'}
          </span>
        </div>
      </motion.div>

      {/* Bar Offers Widget */}
      <motion.div
        className="flex justify-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <BarOffersWidget />
      </motion.div>
    </div>
  );
};

export default TriviaPartyEntry;