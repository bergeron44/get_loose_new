import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Sparkles, HeartHandshake, Crown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import type { RelationshipLevel } from '@/types/game';

interface RelationshipOption {
  id: RelationshipLevel;
  icon: React.ReactNode;
  titleEn: string;
  titleHe: string;
  descriptionEn: string;
  descriptionHe: string;
  gradient: string;
}

const relationshipOptions: RelationshipOption[] = [
  {
    id: 'firstDate',
    icon: <Sparkles className="w-8 h-8" />,
    titleEn: '1st Date',
    titleHe: 'דייט ראשון',
    descriptionEn: 'Light fun, no-pressure icebreakers',
    descriptionHe: 'כיף קליל, שוברי קרח בלי לחץ',
    gradient: 'from-pink-400 to-rose-500',
  },
  {
    id: 'fewMonths',
    icon: <Heart className="w-8 h-8" />,
    titleEn: 'Moving Forward',
    titleHe: 'מתקדמים',
    descriptionEn: 'Deeper questions, spicier dares',
    descriptionHe: 'שאלות עמוקות יותר, אתגרים פיקנטיים',
    gradient: 'from-neon-purple to-violet-600',
  },
  {
    id: 'longTerm',
    icon: <HeartHandshake className="w-8 h-8" />,
    titleEn: 'Long-Term',
    titleHe: 'זוגיות ארוכה',
    descriptionEn: '"How well do you know me?" fun',
    descriptionHe: '"כמה טוב אתה מכיר אותי?" כיף',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'married',
    icon: <Crown className="w-8 h-8" />,
    titleEn: 'Old Souls',
    titleHe: 'נשמות ותיקות',
    descriptionEn: 'Old couple humor & deep bonds',
    descriptionHe: 'הומור של זוג ותיק וקשרים עמוקים',
    gradient: 'from-emerald-500 to-teal-500',
  },
];

const RelationshipSelector: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen, setRelationshipLevel } = useGame();
  const isRTL = language === 'he';

  const handleSelect = (level: RelationshipLevel) => {
    setRelationshipLevel(level);
    setCurrentScreen('gameplay');
  };

  const handleBack = () => {
    setCurrentScreen('gameSelection');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    show: { 
      opacity: 1, 
      x: 0,
      transition: { type: 'spring' as const, stiffness: 100 },
    },
  };

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-hero">
      {/* Liquid background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 right-0 w-64 h-64 rounded-full bg-neon-pink/15 blur-3xl"
          animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
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
            {isRTL ? '💕 מה המצב ביניכם?' : '💕 What\'s Your Status?'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRTL ? 'נתאים את השאלות לשלב שלכם' : 'We\'ll tailor questions to your stage'}
          </p>
        </div>
      </motion.div>

      {/* Options */}
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {relationshipOptions.map((option) => (
          <motion.button
            key={option.id}
            variants={itemVariants}
            onClick={() => handleSelect(option.id)}
            className="w-full p-5 rounded-2xl glass-card-hover flex items-center gap-4 text-left group"
            whileHover={{ x: isRTL ? -10 : 10 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={`p-4 rounded-xl bg-gradient-to-br ${option.gradient} text-white shrink-0 group-hover:scale-110 transition-transform`}>
              {option.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-foreground">
                {isRTL ? option.titleHe : option.titleEn}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRTL ? option.descriptionHe : option.descriptionEn}
              </p>
            </div>
            <motion.div
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center`}
            >
              <ArrowLeft className={`w-4 h-4 text-white ${isRTL ? '' : 'rotate-180'}`} />
            </motion.div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default RelationshipSelector;
