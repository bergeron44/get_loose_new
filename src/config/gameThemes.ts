import { GameType } from '@/types/game';

export interface GameTheme {
  id: GameType;
  name: {
    en: string;
    he: string;
  };
  primaryColor: string; // HSL values
  secondaryColor: string;
  gradient: string;
  emojis: string[];
  glowClass: string;
  shadowVar: string;
  bgAccent: string;
}

export const gameThemes: Record<GameType, GameTheme> = {
  icebreaker: {
    id: 'icebreaker',
    name: { en: 'Icebreaker', he: 'שובר קרח' },
    primaryColor: '330 85% 60%', // Deep Pink
    secondaryColor: '271 91% 65%', // Purple
    gradient: 'from-pink-500 via-rose-500 to-purple-500',
    emojis: ['🥂', '✨', '❤️'],
    glowClass: 'shadow-[0_0_30px_hsl(330_85%_60%/0.5)]',
    shadowVar: '330 85% 60%',
    bgAccent: 'hsl(330 85% 60% / 0.15)',
  },
  trivia: {
    id: 'trivia',
    name: { en: 'Trivia', he: 'טריוויה' },
    primaryColor: '217 91% 60%', // Electric Blue
    secondaryColor: '45 93% 47%', // Gold
    gradient: 'from-blue-500 via-cyan-500 to-amber-400',
    emojis: ['💡', '🏆', '🧠'],
    glowClass: 'shadow-[0_0_30px_hsl(217_91%_60%/0.5)]',
    shadowVar: '217 91% 60%',
    bgAccent: 'hsl(217 91% 60% / 0.15)',
  },
  truthDareShot: {
    id: 'truthDareShot',
    name: { en: 'Truth, Dare or Shot', he: 'אמת, חובה או צ\'ייסר' },
    primaryColor: '25 95% 53%', // Fire Orange
    secondaryColor: '0 84% 60%', // Red
    gradient: 'from-orange-500 via-red-500 to-rose-500',
    emojis: ['🌶️', '🥃', '🔥'],
    glowClass: 'shadow-[0_0_30px_hsl(25_95%_53%/0.5)]',
    shadowVar: '25 95% 53%',
    bgAccent: 'hsl(25 95% 53% / 0.15)',
  },
  dareOnly: {
    id: 'dareOnly',
    name: { en: 'Dare Only', he: 'אמיצים בלבד' },
    primaryColor: '25 95% 53%', // Fire Orange
    secondaryColor: '0 84% 60%', // Red
    gradient: 'from-orange-500 via-red-500 to-rose-500',
    emojis: ['🔥', '💪', '⚡'],
    glowClass: 'shadow-[0_0_30px_hsl(25_95%_53%/0.5)]',
    shadowVar: '25 95% 53%',
    bgAccent: 'hsl(25 95% 53% / 0.15)',
  },
  neverHaveI: {
    id: 'neverHaveI',
    name: { en: 'Never Have I Ever', he: 'מעולם לא' },
    primaryColor: '142 76% 36%', // Neon Green
    secondaryColor: '84 81% 44%', // Lime
    gradient: 'from-emerald-500 via-green-500 to-lime-400',
    emojis: ['🙊', '🍻', '🚫'],
    glowClass: 'shadow-[0_0_30px_hsl(142_76%_36%/0.5)]',
    shadowVar: '142 76% 36%',
    bgAccent: 'hsl(142 76% 36% / 0.15)',
  },
  guessWho: {
    id: 'guessWho',
    name: { en: 'Guess Who', he: 'נחשו מי' },
    primaryColor: '45 93% 47%', // Bright Yellow
    secondaryColor: '32 95% 44%', // Amber
    gradient: 'from-yellow-400 via-amber-500 to-orange-400',
    emojis: ['🎭', '❓', '👀'],
    glowClass: 'shadow-[0_0_30px_hsl(45_93%_47%/0.5)]',
    shadowVar: '45 93% 47%',
    bgAccent: 'hsl(45 93% 47% / 0.15)',
  },
  mostLikely: {
    id: 'mostLikely',
    name: { en: 'Most Likely To', he: 'מי הכי סביר' },
    primaryColor: '190 95% 50%', // Teal/Cyan
    secondaryColor: '180 65% 45%', // Cyan
    gradient: 'from-teal-400 via-cyan-500 to-blue-400',
    emojis: ['☝️', '😂', '🎯'],
    glowClass: 'shadow-[0_0_30px_hsl(190_95%_50%/0.5)]',
    shadowVar: '190 95% 50%',
    bgAccent: 'hsl(190 95% 50% / 0.15)',
  },
  truthOrDare: {
    id: 'truthOrDare',
    name: { en: 'Truth or Dare', he: 'אמת או חובה' },
    primaryColor: '300 76% 50%', // Magenta
    secondaryColor: '330 85% 60%', // Pink
    gradient: 'from-fuchsia-500 via-purple-500 to-pink-500',
    emojis: ['🤐', '🌶️', '🎲'],
    glowClass: 'shadow-[0_0_30px_hsl(300_76%_50%/0.5)]',
    shadowVar: '300 76% 50%',
    bgAccent: 'hsl(300 76% 50% / 0.15)',
  },
  kingsCup: {
    id: 'kingsCup',
    name: { en: "King's Cup", he: 'כוס המלך' },
    primaryColor: '45 93% 47%', // Gold
    secondaryColor: '32 60% 35%', // Royal Brown
    gradient: 'from-yellow-400 via-amber-500 to-yellow-600',
    emojis: ['👑', '🃏', '🍺'],
    glowClass: 'shadow-[0_0_30px_hsl(45_93%_47%/0.5)]',
    shadowVar: '45 93% 47%',
    bgAccent: 'hsl(45 93% 47% / 0.15)',
  },
};

export const getGameTheme = (gameType: GameType | null): GameTheme | null => {
  if (!gameType) return null;
  return gameThemes[gameType] || null;
};
