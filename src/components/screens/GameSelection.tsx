import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  UserCircle, 
  Flame, 
  Brain, 
  Scale, 
  Hand, 
  Users, 
  Crown,
  Zap,
  ArrowLeft 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import type { GameType } from '@/types/game';
import { gameThemes } from '@/config/gameThemes';
import BarOffersWidget from '@/components/BarOffersWidget';
import { recordBarGameStat } from '@/utils/barStats';

interface GameCardData {
  id: GameType;
  titleKey: string;
  descKey: string;
  icon: React.ElementType;
  gradient: string;
  shadowClass: string;
  emojis: string[];
}

const games: GameCardData[] = [
  {
    id: 'icebreaker',
    titleKey: 'game.icebreaker',
    descKey: 'game.icebreaker.desc',
    icon: Heart,
    gradient: gameThemes.icebreaker.gradient,
    shadowClass: 'neon-glow-pink',
    emojis: gameThemes.icebreaker.emojis,
  },
  {
    id: 'guessWho',
    titleKey: 'game.guessWho',
    descKey: 'game.guessWho.desc',
    icon: UserCircle,
    gradient: gameThemes.guessWho.gradient,
    shadowClass: 'neon-glow-gold',
    emojis: gameThemes.guessWho.emojis,
  },
  {
    id: 'truthDareShot',
    titleKey: 'game.truthDareShot',
    descKey: 'game.truthDareShot.desc',
    icon: Flame,
    gradient: gameThemes.truthDareShot.gradient,
    shadowClass: 'neon-glow-orange',
    emojis: gameThemes.truthDareShot.emojis,
  },
  {
    id: 'dareOnly',
    titleKey: 'game.dareOnly',
    descKey: 'game.dareOnly.desc',
    icon: Zap,
    gradient: gameThemes.dareOnly.gradient,
    shadowClass: 'neon-glow-orange',
    emojis: gameThemes.dareOnly.emojis,
  },
  {
    id: 'trivia',
    titleKey: 'game.trivia',
    descKey: 'game.trivia.desc',
    icon: Brain,
    gradient: gameThemes.trivia.gradient,
    shadowClass: 'neon-glow-blue',
    emojis: gameThemes.trivia.emojis,
  },
  {
    id: 'truthOrDare',
    titleKey: 'game.truthOrDare',
    descKey: 'game.truthOrDare.desc',
    icon: Scale,
    gradient: gameThemes.truthOrDare.gradient,
    shadowClass: 'neon-glow-magenta',
    emojis: gameThemes.truthOrDare.emojis,
  },
  {
    id: 'neverHaveI',
    titleKey: 'game.neverHaveI',
    descKey: 'game.neverHaveI.desc',
    icon: Hand,
    gradient: gameThemes.neverHaveI.gradient,
    shadowClass: 'neon-glow-lime',
    emojis: gameThemes.neverHaveI.emojis,
  },
  {
    id: 'mostLikely',
    titleKey: 'game.mostLikely',
    descKey: 'game.mostLikely.desc',
    icon: Users,
    gradient: gameThemes.mostLikely.gradient,
    shadowClass: 'neon-glow-cyan',
    emojis: gameThemes.mostLikely.emojis,
  },
  {
    id: 'kingsCup',
    titleKey: 'game.kingsCup',
    descKey: 'game.kingsCup.desc',
    icon: Crown,
    gradient: gameThemes.kingsCup.gradient,
    shadowClass: 'neon-glow-gold',
    emojis: gameThemes.kingsCup.emojis,
  },
];

const GameSelection: React.FC = () => {
  const { t, language } = useLanguage();
  const { setCurrentScreen, setSelectedGame, currentBar } = useGame();
  const isRTL = language === 'he';

  const handleSelectGame = (gameId: GameType) => {
    setSelectedGame(gameId);
    if (currentBar?._id) {
      recordBarGameStat(currentBar._id, gameId);
    }
    // Route to specific screens for certain games that need extra config
    if (gameId === 'icebreaker') {
      setCurrentScreen('relationshipSelector');
    } else if (gameId === 'trivia') {
      setCurrentScreen('triviaPartyEntry');
    } else if (gameId === 'mostLikely') {
      setCurrentScreen('mostLikelyEntry');
    } else if (gameId === 'kingsCup') {
      setCurrentScreen('kingsDice');
    } else if (gameId === 'truthDareShot') {
      setCurrentScreen('truthDareShot');
    } else if (gameId === 'dareOnly') {
      setCurrentScreen('dareOnlyGame');
    } else if (gameId === 'truthOrDare') {
      setCurrentScreen('majorityWinsEntry');
    } else if (gameId === 'neverHaveI') {
      setCurrentScreen('neverHaveIEntry');
    } else {
      setCurrentScreen('gameplay');
    }
  };

  const handleBack = () => {
    setCurrentScreen('landing');
  };

  return (
    <motion.div 
      className="min-h-screen px-4 py-8 flex flex-col"
      style={{ background: 'var(--gradient-hero)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header with slide-up animation */}
      <motion.div
        className="flex items-center gap-4 mb-6"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.button
          onClick={handleBack}
          className="p-3 rounded-xl glass-card hover:bg-white/10 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground game-title">
          {t('landing.selectGame')}
        </h1>
      </motion.div>

      {/* Game Grid with staggered fade-in/slide-up */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto flex-1">
        {games.map((game, index) => (
          <motion.button
            key={game.id}
            onClick={() => handleSelectGame(game.id)}
            className={`glass-card p-5 ${isRTL ? 'text-right' : 'text-left'} ${game.shadowClass} relative overflow-hidden group`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.06, 
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1]
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          >
            {/* Emoji decorations */}
            <motion.span
              className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} text-lg opacity-50 group-hover:opacity-100 transition-opacity`}
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {game.emojis[0]}
            </motion.span>

            {/* Icon */}
            <div
              className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${game.gradient} mb-4`}
            >
              <game.icon className="w-7 h-7 text-foreground" />
            </div>

            {/* Title - 15% larger with weight 800 */}
            <h3 className="text-[1.15rem] font-extrabold text-foreground mb-1 game-title leading-tight">
              {t(game.titleKey)}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {t(game.descKey)}
            </p>

            {/* Bottom emoji row on hover */}
            <motion.div 
              className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {game.emojis.map((emoji, i) => (
                <span key={i} className="text-sm">{emoji}</span>
              ))}
            </motion.div>
          </motion.button>
        ))}
      </div>

      {/* Bar Offers Widget at bottom with fade-in */}
      <motion.div
        className="mt-6 flex justify-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <BarOffersWidget />
      </motion.div>
    </motion.div>
  );
};

export default GameSelection;
