import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Zap, Flame, Skull } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import type { TriviaDifficulty as TriviaDifficultyLevel } from '@/types/game';

interface DifficultyOption {
  id: TriviaDifficultyLevel;
  icon: React.ReactNode;
  titleEn: string;
  titleHe: string;
  descriptionEn: string;
  descriptionHe: string;
  gradient: string;
  stars: number;
}

const difficultyOptions: DifficultyOption[] = [
  {
    id: 'easy',
    icon: <Brain className="w-8 h-8" />,
    titleEn: 'Easy',
    titleHe: 'קל',
    descriptionEn: 'Warm up your brain',
    descriptionHe: 'חימום למוח',
    gradient: 'from-emerald-400 to-green-500',
    stars: 1,
  },
  {
    id: 'medium',
    icon: <Zap className="w-8 h-8" />,
    titleEn: 'Medium',
    titleHe: 'בינוני',
    descriptionEn: 'Test your knowledge',
    descriptionHe: 'בדוק את הידע שלך',
    gradient: 'from-amber-400 to-orange-500',
    stars: 2,
  },
  {
    id: 'hard',
    icon: <Flame className="w-8 h-8" />,
    titleEn: 'Hard',
    titleHe: 'קשה',
    descriptionEn: 'Challenge accepted',
    descriptionHe: 'אתגר מקובל',
    gradient: 'from-orange-500 to-red-500',
    stars: 3,
  },
  {
    id: 'expert',
    icon: <Skull className="w-8 h-8" />,
    titleEn: 'Expert',
    titleHe: 'מומחה',
    descriptionEn: 'Only for geniuses',
    descriptionHe: 'רק לגאונים',
    gradient: 'from-neon-purple to-violet-700',
    stars: 4,
  },
];

const TriviaDifficulty: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen, setTriviaDifficulty } = useGame();
  const isRTL = language === 'he';

  const handleSelect = (difficulty: TriviaDifficultyLevel) => {
    setTriviaDifficulty(difficulty);
    localStorage.setItem('triviaDifficulty', difficulty);
    localStorage.setItem('triviaGameMode', 'partyRoom');
    setCurrentScreen('triviaPartyHost'); // Go to host nickname screen
  };

  const handleBack = () => {
    setCurrentScreen('triviaPartyEntry');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 100 },
    },
  };

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-hero">
      {/* Liquid background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute bottom-1/3 left-0 w-72 h-72 rounded-full bg-neon-cyan/15 blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Header */}
      <motion.div
        className="flex items-center gap-4 mb-8"
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
          <h1 className="text-2xl font-black text-foreground">
            {isRTL ? '🧠 בחר רמת קושי' : '🧠 Choose Difficulty'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRTL ? 'כמה חכם אתה באמת?' : 'How smart are you really?'}
          </p>
        </div>
      </motion.div>

      {/* Options Grid */}
      <motion.div
        className="grid grid-cols-2 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {difficultyOptions.map((option) => (
          <motion.button
            key={option.id}
            variants={itemVariants}
            onClick={() => handleSelect(option.id)}
            className="p-5 rounded-2xl glass-card-hover flex flex-col items-center gap-3 text-center group"
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className={`p-4 rounded-xl bg-gradient-to-br ${option.gradient} text-white group-hover:scale-110 transition-transform`}>
              {option.icon}
            </div>
            <h3 className="font-bold text-lg text-foreground">
              {isRTL ? option.titleHe : option.titleEn}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isRTL ? option.descriptionHe : option.descriptionEn}
            </p>
            {/* Difficulty stars */}
            <div className="flex gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < option.stars ? `bg-gradient-to-r ${option.gradient}` : 'bg-muted'}`}
                />
              ))}
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default TriviaDifficulty;
