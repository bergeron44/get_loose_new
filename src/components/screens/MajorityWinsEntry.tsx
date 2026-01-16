import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import BarOffersWidget from '@/components/BarOffersWidget';

const MajorityWinsEntry: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen } = useGame();
  const isRTL = language === 'he';

  const primaryColor = 'hsl(300 76% 50%)'; // Magenta - reusing truthOrDare theme

  const handleBack = () => {
    setCurrentScreen('gameSelection');
  };

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-hero flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 right-0 w-72 h-72 rounded-full blur-3xl"
          style={{ background: `${primaryColor}15` }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 left-0 w-64 h-64 rounded-full blur-3xl"
          style={{ background: 'hsl(330 85% 60% / 0.1)' }}
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 6, repeat: Infinity }}
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
            ⚔️ {isRTL ? 'מלחמת הרוב' : 'Majority Wins'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRTL ? 'המיעוט שותה!' : 'The minority drinks!'}
          </p>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10">
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="text-8xl mb-4"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⚔️
          </motion.div>
          <p className="text-lg text-muted-foreground max-w-xs mx-auto">
            {isRTL 
              ? 'הצביעו על הדילמה, מי שבמיעוט - שותה!'
              : 'Vote on dilemmas, the minority drinks!'
            }
          </p>
        </motion.div>

        {/* Create Room */}
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            size="xl"
            onClick={() => setCurrentScreen('majorityWinsHost')}
            className="w-full text-xl font-black py-7 relative overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}, hsl(330 85% 60%))`,
              boxShadow: `0 0 30px ${primaryColor}50`,
            }}
          >
            <motion.div
              className="absolute inset-0 bg-white/20"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            <Plus className="w-6 h-6 mr-2" />
            {isRTL ? 'צור חדר' : 'Create Room'}
          </Button>
        </motion.div>

        {/* Join Room */}
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            size="xl"
            variant="outline"
            onClick={() => setCurrentScreen('majorityWinsJoin')}
            className="w-full text-xl font-black py-7 border-2 hover:bg-primary/10"
            style={{ borderColor: `${primaryColor}50` }}
          >
            <Users className="w-6 h-6 mr-2" />
            {isRTL ? 'הצטרף לחדר' : 'Join Room'}
          </Button>
        </motion.div>
      </div>

      {/* Bar Offers Widget */}
      <motion.div
        className="mt-4 flex justify-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <BarOffersWidget />
      </motion.div>
    </div>
  );
};

export default MajorityWinsEntry;
