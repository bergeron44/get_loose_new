import { useGame } from "@/contexts/GameContext";
import LanguageToggle from "@/components/LanguageToggle";
import DrinkPenalty from "@/components/DrinkPenalty";
import LandingScreen from "@/components/screens/LandingScreen";
import GameSelection from "@/components/screens/GameSelection";
import RelationshipSelector from "@/components/screens/RelationshipSelector";
import TriviaDifficulty from "@/components/screens/TriviaDifficulty";

import TriviaLobby from "@/components/screens/TriviaLobby";
import TriviaMultiplayer from "@/components/screens/TriviaMultiplayer";
import TriviaPartyEntry from "@/components/screens/TriviaPartyEntry";
import TriviaPartyHost from "@/components/screens/TriviaPartyHost";
import TriviaPartyJoin from "@/components/screens/TriviaPartyJoin";
import TriviaPartyGame from "@/components/screens/TriviaPartyGame";
import IntensitySelector from "@/components/screens/IntensitySelector";
import GameplayScreen from "@/components/screens/GameplayScreen";
import MostLikelyGame from "@/components/screens/MostLikelyGame";
import MostLikelyEntry from "@/components/screens/MostLikelyEntry";
import MostLikelyHost from "@/components/screens/MostLikelyHost";
import MostLikelyJoin from "@/components/screens/MostLikelyJoin";
import MostLikelyMultiplayer from "@/components/screens/MostLikelyMultiplayer";
import KingsDice from "@/components/screens/KingsDice";
import TruthDareShot from "@/components/screens/TruthDareShot";
import MajorityWinsEntry from "@/components/screens/MajorityWinsEntry";
import MajorityWinsHost from "@/components/screens/MajorityWinsHost";
import MajorityWinsJoin from "@/components/screens/MajorityWinsJoin";
import MajorityWinsGame from "@/components/screens/MajorityWinsGame";
import NeverHaveIEntry from "@/components/screens/NeverHaveIEntry";
import NeverHaveIHost from "@/components/screens/NeverHaveIHost";
import NeverHaveIJoin from "@/components/screens/NeverHaveIJoin";
import NeverHaveIGame from "@/components/screens/NeverHaveIGame";
import GroupDrinkOverlay from "@/components/screens/GroupDrinkOverlay";
import { AnimatePresence, motion } from "framer-motion";
import { Helmet, HelmetProvider } from "react-helmet-async";

const Index = () => {
  const { currentScreen, groupDrinkType, clearGroupDrink } = useGame();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'landing':
        return <LandingScreen />;
      case 'gameSelection':
        return <GameSelection />;
      case 'relationshipSelector':
        return <RelationshipSelector />;
      case 'triviaDifficulty':
        return <TriviaDifficulty />;
      case 'triviaLobby':
        return <TriviaLobby />;
      case 'triviaMultiplayer':
        return <TriviaMultiplayer />;
      case 'triviaPartyEntry':
        return <TriviaPartyEntry />;
      case 'triviaPartyHost':
        return <TriviaPartyHost />;
      case 'triviaPartyJoin':
        return <TriviaPartyJoin />;
      case 'triviaPartyGame':
        return <TriviaPartyGame />;
      case 'intensity':
        return <IntensitySelector />;
      case 'gameplay':
        return <GameplayScreen />;
      case 'mostLikelyGame':
        return <MostLikelyGame />;
      case 'mostLikelyEntry':
        return <MostLikelyEntry />;
      case 'mostLikelyHost':
        return <MostLikelyHost />;
      case 'mostLikelyJoin':
        return <MostLikelyJoin />;
      case 'mostLikelyMultiplayer':
        return <MostLikelyMultiplayer />;
      case 'kingsDice':
        return <KingsDice />;
      case 'truthDareShot':
        return <TruthDareShot />;
      case 'majorityWinsEntry':
        return <MajorityWinsEntry />;
      case 'majorityWinsHost':
        return <MajorityWinsHost />;
      case 'majorityWinsJoin':
        return <MajorityWinsJoin />;
      case 'majorityWinsGame':
        return <MajorityWinsGame />;
      case 'neverHaveIEntry':
        return <NeverHaveIEntry />;
      case 'neverHaveIHost':
        return <NeverHaveIHost />;
      case 'neverHaveIJoin':
        return <NeverHaveIJoin />;
      case 'neverHaveIGame':
        return <NeverHaveIGame />;
      default:
        return <LandingScreen />;
    }
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>Get Loose - The Ultimate Bar Drinking Game</title>
        <meta name="description" content="Turn any night out into an unforgettable experience with 8 epic drinking games. Icebreaker, Truth or Dare, King's Cup and more!" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0a0e1a" />
      </Helmet>
      
      <div className="min-h-screen bg-background font-outfit">
        <LanguageToggle />
        <DrinkPenalty />
        <GroupDrinkOverlay 
          isOpen={groupDrinkType !== null} 
          onClose={clearGroupDrink} 
          type={groupDrinkType || 'toast'} 
        />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
    </HelmetProvider>
  );
};

export default Index;
