import React, { createContext, useContext, useState, useCallback } from 'react';
import type { 
  GameType, 
  IntensityLevel, 
  RelationshipLevel, 
  TriviaDifficulty, 
  AppScreen 
} from '@/types/game';

// Re-export types for backwards compatibility
export type { GameType, IntensityLevel, RelationshipLevel, TriviaDifficulty, AppScreen };

interface GameContextType {
  currentScreen: AppScreen;
  setCurrentScreen: (screen: AppScreen) => void;
  selectedGame: GameType | null;
  setSelectedGame: (game: GameType | null) => void;
  intensity: IntensityLevel;
  setIntensity: (level: IntensityLevel) => void;
  relationshipLevel: RelationshipLevel;
  setRelationshipLevel: (level: RelationshipLevel) => void;
  triviaDifficulty: TriviaDifficulty;
  setTriviaDifficulty: (difficulty: TriviaDifficulty) => void;
  selectedPackage: string | null;
  setSelectedPackage: (packageId: string | null) => void;
  currentCardIndex: number;
  setCurrentCardIndex: (index: number) => void;
  nextCard: () => void;
  previousCard: () => void;
  resetGame: () => void;
  showPenalty: boolean;
  setShowPenalty: (show: boolean) => void;
  triggerPenalty: () => void;
  groupDrinkType: 'groupSip' | 'toast' | 'waterfall' | null;
  triggerGroupDrink: (type: 'groupSip' | 'toast' | 'waterfall') => void;
  clearGroupDrink: () => void;
  currentBar: {
    _id: string;
    barName: string;
    location: {
      type: string;
      coordinates: [number, number];
    };
    qrUrl: string;
    barIp: string;
    gameStats: {
      datingGame: number;
      friendsGame: number;
      partyGame: number;
    };
  } | null;
  setCurrentBar: (bar: {
    _id: string;
    barName: string;
    location: {
      type: string;
      coordinates: [number, number];
    };
    qrUrl: string;
    barIp: string;
    gameStats: {
      datingGame: number;
      friendsGame: number;
      partyGame: number;
    };
  } | null) => void;
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
  setUserLocation: (location: {
    latitude: number;
    longitude: number;
  } | null) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('landing');
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [intensity, setIntensity] = useState<IntensityLevel>('chilled');
  const [relationshipLevel, setRelationshipLevel] = useState<RelationshipLevel>('firstDate');
  const [triviaDifficulty, setTriviaDifficulty] = useState<TriviaDifficulty>('easy');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showPenalty, setShowPenalty] = useState(false);
  const [groupDrinkType, setGroupDrinkType] = useState<'groupSip' | 'toast' | 'waterfall' | null>(null);
  const [currentBar, setCurrentBar] = useState<{
    _id: string;
    barName: string;
    location: {
      type: string;
      coordinates: [number, number];
    };
    qrUrl: string;
    barIp: string;
    gameStats: {
      datingGame: number;
      friendsGame: number;
      partyGame: number;
    };
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const nextCard = useCallback(() => {
    setCurrentCardIndex(prev => prev + 1);
  }, []);

  const previousCard = useCallback(() => {
    setCurrentCardIndex(prev => Math.max(0, prev - 1));
  }, []);

  const resetGame = useCallback(() => {
    setCurrentScreen('landing');
    setSelectedGame(null);
    setIntensity('chilled');
    setRelationshipLevel('firstDate');
    setTriviaDifficulty('easy');
    setSelectedPackage(null);
    setCurrentCardIndex(0);
    setShowPenalty(false);
    setGroupDrinkType(null);
    setCurrentBar(null);
    setUserLocation(null);
  }, []);

  const triggerPenalty = useCallback(() => {
    setShowPenalty(true);
  }, []);

  const triggerGroupDrink = useCallback((type: 'groupSip' | 'toast' | 'waterfall') => {
    setGroupDrinkType(type);
  }, []);

  const clearGroupDrink = useCallback(() => {
    setGroupDrinkType(null);
  }, []);

  return (
    <GameContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        selectedGame,
        setSelectedGame,
        intensity,
        setIntensity,
        relationshipLevel,
        setRelationshipLevel,
        triviaDifficulty,
        setTriviaDifficulty,
        selectedPackage,
        setSelectedPackage,
        currentCardIndex,
        setCurrentCardIndex,
        nextCard,
        previousCard,
        resetGame,
        showPenalty,
        setShowPenalty,
        triggerPenalty,
        groupDrinkType,
        triggerGroupDrink,
        clearGroupDrink,
        currentBar,
        setCurrentBar,
        userLocation,
        setUserLocation,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
