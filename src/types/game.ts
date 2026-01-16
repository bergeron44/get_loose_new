// Game types - separated to avoid circular dependencies
export type GameType = 
  | 'icebreaker' 
  | 'guessWho' 
  | 'truthDareShot' 
  | 'trivia' 
  | 'truthOrDare' 
  | 'neverHaveI' 
  | 'mostLikely' 
  | 'kingsCup'
  | 'dareOnly';

export type IntensityLevel = 'noAlcohol' | 'chilled' | 'partyAnimal' | 'extreme';

export type RelationshipLevel = 'firstDate' | 'fewMonths' | 'longTerm' | 'married';

export type TriviaDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type TriviaGameMode = 'tableBattle' | 'partyRoom';

export type AppScreen = 
  | 'landing' 
  | 'gameSelection' 
  | 'relationshipSelector'
  | 'triviaDifficulty'
  | 'triviaGameMode'
  | 'triviaLobby'
  | 'triviaMultiplayer'
  | 'triviaPartyEntry'
  | 'triviaPartyHost'
  | 'triviaPartyJoin'
  | 'triviaPartyGame'
  | 'intensity' 
  | 'gameplay'
  | 'mostLikelyGame'
  | 'mostLikelyEntry'
  | 'mostLikelyHost'
  | 'mostLikelyJoin'
  | 'mostLikelyMultiplayer'
  | 'kingsDice'
  | 'truthDareShot'
  | 'dareOnlyGame'
  | 'majorityWinsEntry'
  | 'majorityWinsHost'
  | 'majorityWinsJoin'
  | 'majorityWinsGame'
  | 'neverHaveIEntry'
  | 'neverHaveIHost'
  | 'neverHaveIJoin'
  | 'neverHaveIGame';

export interface TriviaPlayer {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
  drinksTaken: number;
  streak: number;
  isHost?: boolean;
  deviceId?: string;
  lastAnswerTime?: number;
}

export interface PartyRoomState {
  roomId: string;
  roomCode: string;
  hostDeviceId: string;
  players: TriviaPlayer[];
  currentPhase: 'waiting' | 'question' | 'answering' | 'results' | 'leaderboard' | 'gameover';
  currentQuestionIndex: number;
  questionStartTime?: number;
}

export interface PlayerAnswer {
  playerId: string;
  questionIndex: number;
  answerIndex: number | null;
  answerTimeMs: number;
  isCorrect: boolean;
  pointsEarned: number;
}
