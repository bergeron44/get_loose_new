import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Coffee, Beer, PartyPopper, Skull } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import type { IntensityLevel } from '@/types/game';

interface IntensityOption {
  id: IntensityLevel;
  titleKey: string;
  descKey: string;
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
  emoji: string;
}

const intensityOptions: IntensityOption[] = [
  {
    id: 'noAlcohol',
    titleKey: 'intensity.noAlcohol',
    descKey: 'intensity.noAlcohol.desc',
    icon: Coffee,
    gradient: 'from-emerald-400 to-teal-500',
    borderColor: 'border-emerald-500/50 hover:border-emerald-500',
    emoji: '☕',
  },
  {
    id: 'chilled',
    titleKey: 'intensity.chilled',
    descKey: 'intensity.chilled.desc',
    icon: Beer,
    gradient: 'from-blue-400 to-cyan-500',
    borderColor: 'border-blue-500/50 hover:border-blue-500',
    emoji: '🍺',
  },
  {
    id: 'partyAnimal',
    titleKey: 'intensity.partyAnimal',
    descKey: 'intensity.partyAnimal.desc',
    icon: PartyPopper,
    gradient: 'from-orange-400 to-pink-500',
    borderColor: 'border-orange-500/50 hover:border-orange-500',
    emoji: '🎉',
  },
  {
    id: 'extreme',
    titleKey: 'intensity.extreme',
    descKey: 'intensity.extreme.desc',
    icon: Skull,
    gradient: 'from-red-500 to-rose-600',
    borderColor: 'border-red-500/50 hover:border-red-500',
    emoji: '💀',
  },
];

const IntensitySelector: React.FC = () => {
  const { t } = useLanguage();
  const { setCurrentScreen, setIntensity } = useGame();

  const handleSelectIntensity = (level: IntensityLevel) => {
    setIntensity(level);
    setCurrentScreen('gameplay');
  };

  const handleBack = () => {
    setCurrentScreen('gameSelection');
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-hero flex flex-col">
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
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {t('intensity.title')}
        </h1>
      </motion.div>

      {/* Intensity Options */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full gap-4">
        {intensityOptions.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => handleSelectIntensity(option.id)}
            className={`glass-card p-5 flex items-center gap-4 border-2 ${option.borderColor} transition-all duration-300 hover:scale-[1.02]`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ x: 10 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Icon */}
            <div
              className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${option.gradient} flex items-center justify-center`}
            >
              <span className="text-3xl">{option.emoji}</span>
            </div>

            {/* Text */}
            <div className="text-left flex-1">
              <h3 className="text-xl font-bold text-foreground">
                {t(option.titleKey)}
              </h3>
              <p className="text-muted-foreground">
                {t(option.descKey)}
              </p>
            </div>

            {/* Arrow */}
            <motion.div
              className="text-muted-foreground"
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
            >
              →
            </motion.div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default IntensitySelector;
