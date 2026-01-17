import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'he';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
  showLanguageToggle: boolean;
  setShowLanguageToggle: (show: boolean) => void;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Landing
    'landing.title': 'Get Loose',
    'landing.subtitle': 'The Ultimate Bar Drinking Game',
    'landing.description': 'Turn any night out into an unforgettable experience with 8 epic games',
    'landing.startParty': 'Start Party',
    'landing.selectGame': 'Select Your Game',
    'landing.games8': '8 Games',
    'landing.partyMode': 'Party Mode',
    'landing.multilingual': 'Multilingual',
    
    // Games
    'game.icebreaker': 'No Filter (Date)',
    'game.icebreaker.desc': 'Date talk without filters',
    'game.guessWho': 'Guess Who',
    'game.guessWho.desc': 'Hold phone to forehead, get clues',
    'game.truthDareShot': 'Truth, Dare or Shot',
    'game.truthDareShot.desc': 'Complete the challenge or drink!',
    'game.trivia': 'Trivia Night',
    'game.trivia.desc': 'Test your knowledge',
    'game.truthOrDare': 'Majority Wins',
    'game.truthOrDare.desc': 'The minority drinks!',
    'game.neverHaveI': 'Never Have I Ever',
    'game.neverHaveI.desc': 'Reveal your secrets',
    'game.mostLikely': 'Most Likely To',
    'game.mostLikely.desc': 'Point at the guilty one',
    'game.kingsCup': "King's Cup",
    'game.kingsCup.desc': 'The legendary card game',
    
    // Intensity
    'intensity.title': 'Choose Your Vibe',
    'intensity.noAlcohol': 'No Alcohol',
    'intensity.noAlcohol.desc': 'Fun for everyone',
    'intensity.chilled': 'Chilled',
    'intensity.chilled.desc': 'Easy going vibes',
    'intensity.partyAnimal': 'Party Animal',
    'intensity.partyAnimal.desc': 'Time to get loose',
    'intensity.extreme': 'Extreme',
    'intensity.extreme.desc': 'No mercy mode',
    
    // Gameplay
    'gameplay.next': 'Next',
    'gameplay.back': 'Back',
    'gameplay.done': 'Done',
    'gameplay.skip': 'Skip',
    'gameplay.drink': 'Drink!',
    'gameplay.truth': 'Truth',
    'gameplay.dare': 'Dare',
    'gameplay.iHave': 'I Have',
    'gameplay.iHaveNot': 'Never',
    'gameplay.ready': 'Ready?',
    'gameplay.start': 'Start',
    'gameplay.correct': 'Correct!',
    'gameplay.wrong': 'Wrong!',
    
    // Quit
    'quit.title': 'Quit Game?',
    'quit.description': 'Your progress will be lost. Are you sure?',
    'quit.cancel': 'Keep Playing',
    'quit.confirm': 'Quit',
    
    // Penalties
    'penalty.take1': 'Take 1 sip',
    'penalty.take2': 'Take 2 sips',
    'penalty.take3': 'Take 3 sips',
    'penalty.finish': 'Finish your drink!',
    'penalty.shot': 'Take a shot!',
    'penalty.giveSip': 'Give a sip to a friend',
    'penalty.waterfall': 'Waterfall!',
  },
  he: {
    // Landing
    'landing.title': 'גט לוז',
    'landing.subtitle': 'משחק השתייה האולטימטיבי',
    'landing.description': 'הפכו כל לילה לחוויה בלתי נשכחת עם 8 משחקים אפיים',
    'landing.startParty': 'להתחיל מסיבה',
    'landing.selectGame': 'בחרו משחק',
    'landing.games8': '8 משחקים',
    'landing.partyMode': 'מצב מסיבה',
    'landing.multilingual': 'רב-לשוני',
    
    // Games
    'game.icebreaker': 'בלי פילטר (דייט)',
    'game.icebreaker.desc': 'שיחת דייט בלי פילטרים',
    'game.guessWho': 'נחש מי',
    'game.guessWho.desc': 'שים על המצח וקבל רמזים',
    'game.truthDareShot': 'אמת, חובה או צ\'ייסר',
    'game.truthDareShot.desc': 'השלם את המשימה או שתה!',
    'game.trivia': 'טריוויה',
    'game.trivia.desc': 'בדוק את הידע שלך',
    'game.truthOrDare': 'מלחמת הרוב',
    'game.truthOrDare.desc': 'המיעוט שותה צ\'ייסר!',
    'game.neverHaveI': 'מעולם לא',
    'game.neverHaveI.desc': 'חשוף את הסודות שלך',
    'game.mostLikely': 'הכי סביר ש...',
    'game.mostLikely.desc': 'הצביעו על האשם',
    'game.kingsCup': 'כוס המלך',
    'game.kingsCup.desc': 'משחק הקלפים האגדי',
    
    // Intensity
    'intensity.title': 'בחרו את הווייב',
    'intensity.noAlcohol': 'ללא אלכוהול',
    'intensity.noAlcohol.desc': 'כיף לכולם',
    'intensity.chilled': 'רגוע',
    'intensity.chilled.desc': 'אווירה קלילה',
    'intensity.partyAnimal': 'חיית מסיבות',
    'intensity.partyAnimal.desc': 'הגיע הזמן להשתחרר',
    'intensity.extreme': 'אקסטרים',
    'intensity.extreme.desc': 'מצב ללא רחמים',
    
    // Gameplay
    'gameplay.next': 'הבא',
    'gameplay.back': 'חזרה',
    'gameplay.done': 'סיום',
    'gameplay.skip': 'דלג',
    'gameplay.drink': 'שתה!',
    'gameplay.truth': 'אמת',
    'gameplay.dare': 'חובה',
    'gameplay.iHave': 'עשיתי',
    'gameplay.iHaveNot': 'מעולם',
    'gameplay.ready': 'מוכנים?',
    'gameplay.start': 'התחל',
    'gameplay.correct': 'נכון!',
    'gameplay.wrong': 'טעות!',
    
    // Quit
    'quit.title': 'לצאת מהמשחק?',
    'quit.description': 'ההתקדמות שלך תאבד. בטוח?',
    'quit.cancel': 'להמשיך לשחק',
    'quit.confirm': 'לצאת',
    
    // Penalties
    'penalty.take1': 'קח לגימה אחת',
    'penalty.take2': 'קח 2 לגימות',
    'penalty.take3': 'קח 3 לגימות',
    'penalty.finish': 'סיים את המשקה!',
    'penalty.shot': 'קח שוט!',
    'penalty.giveSip': 'תן לגימה לחבר',
    'penalty.waterfall': 'מפל!',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [showLanguageToggle, setShowLanguageToggle] = useState(true);

  useEffect(() => {
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === 'he';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, showLanguageToggle, setShowLanguageToggle }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
