import type { GameType, IntensityLevel } from '@/types/game';

export interface GameCard {
  id: string;
  text: string;
  textHe?: string; // Hebrew translation
  type?: 'question' | 'challenge' | 'action' | 'rule';
  category?: string;
  categoryHe?: string;
  timer?: number; // seconds
  options?: string[];
  optionsHe?: string[];
  correctAnswer?: number; // index for trivia
}

// ============= ICEBREAKER - 20 Hebrew Dating Questions =============
export const icebreakerCards: Record<IntensityLevel, GameCard[]> = {
  noAlcohol: [
    { id: 'ib1', text: "What's your dream vacation destination?", textHe: 'מה יעד החופשה החלומי שלך?', type: 'question' },
    { id: 'ib2', text: 'If you could have dinner with anyone, who would it be?', textHe: 'אם יכולת לאכול ארוחת ערב עם כל אדם בעולם, מי זה היה?', type: 'question' },
    { id: 'ib3', text: "What's your hidden talent?", textHe: 'מה הכישרון הנסתר שלך?', type: 'question' },
    { id: 'ib4', text: 'What song describes your life right now?', textHe: 'איזה שיר מתאר את החיים שלך כרגע?', type: 'question' },
    { id: 'ib5', text: "What's the best advice you've ever received?", textHe: 'מה העצה הכי טובה שקיבלת אי פעם?', type: 'question' },
  ],
  chilled: [
    { id: 'ib6', text: "What's your biggest pet peeve in relationships?", textHe: 'מה הדבר שהכי מעצבן אותך בזוגיות?', type: 'question' },
    { id: 'ib7', text: 'Describe your perfect first date', textHe: 'תאר/י את הדייט הראשון המושלם שלך', type: 'question' },
    { id: 'ib8', text: 'What makes you instantly attracted to someone?', textHe: 'מה גורם לך להתמשך למישהו מיד?', type: 'question' },
    { id: 'ib9', text: "What's your love language?", textHe: 'מה שפת האהבה שלך?', type: 'question' },
    { id: 'ib10', text: "What's a deal-breaker for you?", textHe: 'מה דבר שהוא שובר עסקה בשבילך?', type: 'question' },
    { id: 'ib11', text: 'What was your first impression of me?', textHe: 'מה היה הרושם הראשוני שלך ממני?', type: 'question' },
    { id: 'ib12', text: "What's the most romantic thing someone did for you?", textHe: 'מה הדבר הכי רומנטי שמישהו עשה בשבילך?', type: 'question' },
    { id: 'ib13', text: 'If you could live anywhere in the world, where would it be?', textHe: 'אם יכולת לגור בכל מקום בעולם, איפה היית בוחר/ת?', type: 'question' },
    { id: 'ib14', text: "What's your idea of a perfect weekend?", textHe: 'מה הסופ"ש המושלם בעינייך?', type: 'question' },
    { id: 'ib15', text: 'What do you value most in a partner?', textHe: 'מה אתה/את הכי מעריך/ה בבן/בת זוג?', type: 'question' },
  ],
  partyAnimal: [
    { id: 'ib16', text: "What's the craziest thing you've done for love?", textHe: 'מה הדבר הכי מטורף שעשית בשביל אהבה?', type: 'question' },
    { id: 'ib17', text: 'Describe your most embarrassing date', textHe: 'ספר/י על הדייט הכי מביך שהיה לך', type: 'question' },
    { id: 'ib18', text: "What's your guilty pleasure nobody knows about?", textHe: 'מה ההנאה האשמה שלך שאף אחד לא יודע עליה?', type: 'question' },
    { id: 'ib19', text: 'Have you ever been caught doing something naughty?', textHe: 'תפסו אותך פעם עושה משהו שובב?', type: 'question' },
    { id: 'ib20', text: "What's a fantasy you've never told anyone?", textHe: 'מה פנטזיה שמעולם לא סיפרת לאף אחד?', type: 'question' },
  ],
  extreme: [
    { id: 'ib21', text: "What's the most scandalous thing you've ever done?", textHe: 'מה הדבר הכי שערורייתי שעשית?', type: 'question' },
    { id: 'ib22', text: 'Tell us about your worst hookup experience', textHe: 'ספר/י על החיבור הכי גרוע שהיה לך', type: 'question' },
    { id: 'ib23', text: 'What secret would ruin your reputation if it came out?', textHe: 'איזה סוד היה הורס את המוניטין שלך אם היה יוצא?', type: 'question' },
    { id: 'ib24', text: "What's something you've never told anyone?", textHe: 'מה משהו שמעולם לא סיפרת לאף אחד?', type: 'question' },
    { id: 'ib25', text: 'Confess your biggest regret in love', textHe: 'התוודה על החרטה הכי גדולה שלך באהבה', type: 'question' },
  ],
};

// ============= GUESS WHO - Characters =============
export const guessWhoCards: GameCard[] = [
  { id: 'gw1', text: 'SpongeBob SquarePants', textHe: 'בובספוג מכנסמרובע', type: 'action', timer: 60 },
  { id: 'gw2', text: 'Beyoncé', textHe: 'ביונסה', type: 'action', timer: 60 },
  { id: 'gw3', text: 'Harry Potter', textHe: 'הארי פוטר', type: 'action', timer: 60 },
  { id: 'gw4', text: 'Donald Trump', textHe: 'דונלד טראמפ', type: 'action', timer: 60 },
  { id: 'gw5', text: 'Michael Jackson', textHe: 'מייקל ג׳קסון', type: 'action', timer: 60 },
  { id: 'gw6', text: 'Batman', textHe: 'באטמן', type: 'action', timer: 60 },
  { id: 'gw7', text: 'Taylor Swift', textHe: 'טיילור סוויפט', type: 'action', timer: 60 },
  { id: 'gw8', text: 'Shrek', textHe: 'שרק', type: 'action', timer: 60 },
  { id: 'gw9', text: 'Einstein', textHe: 'איינשטיין', type: 'action', timer: 60 },
  { id: 'gw10', text: 'Kim Kardashian', textHe: 'קים קרדשיאן', type: 'action', timer: 60 },
  { id: 'gw11', text: 'Bibi Netanyahu', textHe: 'ביבי נתניהו', type: 'action', timer: 60 },
  { id: 'gw12', text: 'Gal Gadot', textHe: 'גל גדות', type: 'action', timer: 60 },
  { id: 'gw13', text: 'Eyal Golan', textHe: 'אייל גולן', type: 'action', timer: 60 },
  { id: 'gw14', text: 'Omer Adam', textHe: 'עומר אדם', type: 'action', timer: 60 },
  { id: 'gw15', text: 'Noa Kirel', textHe: 'נועה קירל', type: 'action', timer: 60 },
];

// ============= DO OR DRINK =============
export const doOrDrinkCards: Record<IntensityLevel, GameCard[]> = {
  noAlcohol: [
    { id: 'dod1', text: 'Do 10 jumping jacks or give up a secret', textHe: 'עשה 10 קפיצות כוכב או תגלה סוד', type: 'challenge' },
    { id: 'dod2', text: 'Sing the chorus of your favorite song', textHe: 'שיר את הפזמון של השיר האהוב עליך', type: 'challenge' },
    { id: 'dod3', text: 'Do your best celebrity impression', textHe: 'עשה חיקוי של סלב מפורסם', type: 'challenge' },
    { id: 'dod4', text: 'Tell a joke that makes everyone laugh', textHe: 'ספר בדיחה שתגרום לכולם לצחוק', type: 'challenge' },
    { id: 'dod5', text: 'Do a handstand against the wall for 10 seconds', textHe: 'עשה עמידת ידיים על הקיר ל-10 שניות', type: 'challenge' },
  ],
  chilled: [
    { id: 'dod6', text: 'Let the group post something on your social media OR drink', textHe: 'תן לקבוצה לפרסם משהו בסושיאל שלך או שתה', type: 'challenge' },
    { id: 'dod7', text: 'Show your last 5 Google searches OR drink', textHe: 'הראה את 5 החיפושים האחרונים שלך בגוגל או שתה', type: 'challenge' },
    { id: 'dod8', text: 'Call your ex and say hi OR drink twice', textHe: 'התקשר לאקס ותגיד היי או שתה פעמיים', type: 'challenge' },
    { id: 'dod9', text: 'Let someone go through your phone for 30 seconds OR drink', textHe: 'תן למישהו לחפור בטלפון שלך 30 שניות או שתה', type: 'challenge' },
    { id: 'dod10', text: 'Kiss the person to your left on the cheek OR drink', textHe: 'תן נשיקה על הלחי לאדם משמאלך או שתה', type: 'challenge' },
  ],
  partyAnimal: [
    { id: 'dod11', text: 'Text your crush something flirty OR finish your drink', textHe: 'שלח הודעה פלרטטנית לקראש שלך או סיים את המשקה', type: 'challenge' },
    { id: 'dod12', text: 'Give someone a lap dance OR take 2 shots', textHe: 'תן ריקוד חיק למישהו או קח 2 שוטים', type: 'challenge' },
    { id: 'dod13', text: 'Swap an item of clothing with someone OR drink 3 times', textHe: 'החלף פריט לבוש עם מישהו או שתה 3 פעמים', type: 'challenge' },
    { id: 'dod14', text: 'Let someone write on your body with a marker OR take a shot', textHe: 'תן למישהו לכתוב על הגוף שלך בטוש או קח שוט', type: 'challenge' },
    { id: 'dod15', text: 'Serenade the bartender OR finish your drink', textHe: 'שיר סרנדה לברמן או סיים את המשקה', type: 'challenge' },
  ],
  extreme: [
    { id: 'dod16', text: 'Show your most embarrassing photo OR take 3 shots', textHe: 'הראה את התמונה הכי מביכה שלך או קח 3 שוטים', type: 'challenge' },
    { id: 'dod17', text: 'Let the group create your dating app bio OR finish 2 drinks', textHe: 'תן לקבוצה לכתוב את הביו שלך באפליקציית היכרויות או סיים 2 משקאות', type: 'challenge' },
    { id: 'dod18', text: 'Do a striptease (keep underwear on!) OR waterfall', textHe: 'עשה סטריפטיז (השאר תחתונים!) או מפל', type: 'challenge' },
    { id: 'dod19', text: 'Make out with someone for 30 seconds OR take 4 shots', textHe: 'התנשק עם מישהו 30 שניות או קח 4 שוטים', type: 'challenge' },
    { id: 'dod20', text: 'Send a risky text to someone random in your contacts OR finish everything', textHe: 'שלח הודעה מסוכנת לאיש קשר רנדומלי או סיים הכל', type: 'challenge' },
  ],
};

// ============= TRIVIA =============
export const triviaCards: GameCard[] = [
  { id: 't1', text: 'What year did the Titanic sink?', textHe: 'באיזו שנה טבעה הטיטניק?', type: 'question', options: ['1910', '1912', '1915', '1920'], correctAnswer: 1 },
  { id: 't2', text: 'Which planet is known as the Red Planet?', textHe: 'איזה כוכב לכת מכונה כוכב הלכת האדום?', type: 'question', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], optionsHe: ['נוגה', 'מאדים', 'צדק', 'שבתאי'], correctAnswer: 1 },
  { id: 't3', text: 'Who painted the Mona Lisa?', textHe: 'מי צייר את המונה ליזה?', type: 'question', options: ['Van Gogh', 'Picasso', 'Da Vinci', 'Michelangelo'], optionsHe: ['ואן גוך', 'פיקאסו', 'דה וינצ׳י', 'מיכאלאנג׳לו'], correctAnswer: 2 },
  { id: 't4', text: 'What is the capital of Australia?', textHe: 'מהי בירת אוסטרליה?', type: 'question', options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], optionsHe: ['סידני', 'מלבורן', 'קנברה', 'בריסביין'], correctAnswer: 2 },
  { id: 't5', text: 'How many players are on a soccer team?', textHe: 'כמה שחקנים יש בקבוצת כדורגל?', type: 'question', options: ['9', '10', '11', '12'], correctAnswer: 2 },
  { id: 't6', text: 'What is the largest ocean?', textHe: 'מהו האוקיינוס הגדול ביותר?', type: 'question', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], optionsHe: ['אטלנטי', 'הודי', 'ארקטי', 'שקט'], correctAnswer: 3 },
  { id: 't7', text: 'Who wrote Romeo and Juliet?', textHe: 'מי כתב את רומיאו ויוליה?', type: 'question', options: ['Dickens', 'Shakespeare', 'Austen', 'Hemingway'], optionsHe: ['דיקנס', 'שייקספיר', 'אוסטן', 'המינגוויי'], correctAnswer: 1 },
  { id: 't8', text: 'What element does O represent?', textHe: 'איזה יסוד מייצג O?', type: 'question', options: ['Gold', 'Oxygen', 'Osmium', 'Oganesson'], optionsHe: ['זהב', 'חמצן', 'אוסמיום', 'אוגנסון'], correctAnswer: 1 },
  { id: 't9', text: 'In which country were the Olympics first held?', textHe: 'באיזו מדינה נערכו האולימפיאדה הראשונים?', type: 'question', options: ['Italy', 'Greece', 'France', 'USA'], optionsHe: ['איטליה', 'יוון', 'צרפת', 'ארה״ב'], correctAnswer: 1 },
  { id: 't10', text: 'How many continents are there?', textHe: 'כמה יבשות יש בעולם?', type: 'question', options: ['5', '6', '7', '8'], correctAnswer: 2 },
];

// ============= TRUTH OR DARE =============
export const truthCards: Record<IntensityLevel, GameCard[]> = {
  noAlcohol: [
    { id: 'tr1', text: "What's your biggest fear?", textHe: 'מה הפחד הכי גדול שלך?', type: 'question', category: 'Soft', categoryHe: 'קל' },
    { id: 'tr2', text: "What's something you've never told anyone here?", textHe: 'מה משהו שמעולם לא סיפרת לאף אחד פה?', type: 'question', category: 'Soft', categoryHe: 'קל' },
    { id: 'tr3', text: "What's your most embarrassing moment?", textHe: 'מה הרגע הכי מביך שלך?', type: 'question', category: 'Soft', categoryHe: 'קל' },
    { id: 'tr4', text: 'What makes you cry?', textHe: 'מה גורם לך לבכות?', type: 'question', category: 'Soft', categoryHe: 'קל' },
    { id: 'tr5', text: 'What is your biggest insecurity?', textHe: 'מה חוסר הביטחון הכי גדול שלך?', type: 'question', category: 'Soft', categoryHe: 'קל' },
  ],
  chilled: [
    { id: 'tr6', text: 'Who was your first crush?', textHe: 'מי היה הקראש הראשון שלך?', type: 'question', category: 'Spicy', categoryHe: 'פיקנטי' },
    { id: 'tr7', text: "What's the most romantic thing you've done?", textHe: 'מה הדבר הכי רומנטי שעשית?', type: 'question', category: 'Spicy', categoryHe: 'פיקנטי' },
    { id: 'tr8', text: 'Have you ever lied to get out of a date?', textHe: 'שיקרת פעם כדי להתחמק מדייט?', type: 'question', category: 'Spicy', categoryHe: 'פיקנטי' },
    { id: 'tr9', text: 'Who here would you date?', textHe: 'עם מי פה היית יוצא/ת לדייט?', type: 'question', category: 'Spicy', categoryHe: 'פיקנטי' },
    { id: 'tr10', text: "What's the longest you've gone without showering?", textHe: 'מה הכי הרבה זמן שלא התקלחת?', type: 'question', category: 'Spicy', categoryHe: 'פיקנטי' },
  ],
  partyAnimal: [
    { id: 'tr11', text: "What's your body count?", textHe: 'עם כמה אנשים שכבת?', type: 'question', category: 'Hardcore', categoryHe: 'הארדקור' },
    { id: 'tr12', text: 'Have you ever cheated?', textHe: 'בגדת פעם?', type: 'question', category: 'Hardcore', categoryHe: 'הארדקור' },
    { id: 'tr13', text: "What's your biggest turn-on?", textHe: 'מה הדבר שהכי מדליק אותך?', type: 'question', category: 'Hardcore', categoryHe: 'הארדקור' },
    { id: 'tr14', text: 'Have you ever faked it?', textHe: 'זייפת פעם?', type: 'question', category: 'Hardcore', categoryHe: 'הארדקור' },
    { id: 'tr15', text: "What's your weirdest kink?", textHe: 'מה הקינק הכי מוזר שלך?', type: 'question', category: 'Hardcore', categoryHe: 'הארדקור' },
  ],
  extreme: [
    { id: 'tr16', text: "What's the craziest place you've hooked up?", textHe: 'מה המקום הכי מטורף שעשית בו משהו?', type: 'question', category: 'Hardcore', categoryHe: 'הארדקור' },
    { id: 'tr17', text: 'Have you ever had a one-night stand?', textHe: 'היה לך פעם וואן נייט סטנד?', type: 'question', category: 'Hardcore', categoryHe: 'הארדקור' },
    { id: 'tr18', text: "What's your deepest, darkest secret?", textHe: 'מה הסוד הכי עמוק ואפל שלך?', type: 'question', category: 'Hardcore', categoryHe: 'הארדקור' },
    { id: 'tr19', text: 'What would you do for a million dollars?', textHe: 'מה היית עושה בשביל מיליון דולר?', type: 'question', category: 'Hardcore', categoryHe: 'הארדקור' },
    { id: 'tr20', text: 'Tell us your most embarrassing sexual experience', textHe: 'ספר על החוויה המינית הכי מביכה שלך', type: 'question', category: 'Hardcore', categoryHe: 'הארדקור' },
  ],
};

export const dareCards: Record<IntensityLevel, GameCard[]> = {
  noAlcohol: [
    { id: 'd1', text: 'Do your best dance move', textHe: 'עשה את תנועת הריקוד הכי טובה שלך', type: 'challenge', category: 'Soft', categoryHe: 'קל' },
    { id: 'd2', text: 'Speak in an accent for the next 3 rounds', textHe: 'דבר עם מבטא ב-3 הסיבובים הבאים', type: 'challenge', category: 'Soft', categoryHe: 'קל' },
    { id: 'd3', text: 'Let someone style your hair however they want', textHe: 'תן למישהו לעצב לך את השיער איך שרוצה', type: 'challenge', category: 'Soft', categoryHe: 'קל' },
    { id: 'd4', text: 'Do 20 squats right now', textHe: 'עשה 20 סקוואטים עכשיו', type: 'challenge', category: 'Soft', categoryHe: 'קל' },
    { id: 'd5', text: 'Talk in a whisper for the next 2 rounds', textHe: 'דבר בלחישה ב-2 הסיבובים הבאים', type: 'challenge', category: 'Soft', categoryHe: 'קל' },
  ],
  chilled: [
    { id: 'd6', text: 'Give a massage to the person on your right', textHe: 'תן עיסוי לאדם מימינך', type: 'challenge', category: 'Spicy', categoryHe: 'פיקנטי' },
    { id: 'd7', text: 'Whisper something seductive to a person of your choice', textHe: 'לחש משהו מפתה לאדם לבחירתך', type: 'challenge', category: 'Spicy', categoryHe: 'פיקנטי' },
    { id: 'd8', text: 'Do your sexiest walk across the room', textHe: 'עשה את ההליכה הכי סקסית שלך לאורך החדר', type: 'challenge', category: 'Spicy', categoryHe: 'פיקנטי' },
    { id: 'd9', text: 'Post an embarrassing selfie to your story', textHe: 'העלה סלפי מביך לסטורי שלך', type: 'challenge', category: 'Spicy', categoryHe: 'פיקנטי' },
    { id: 'd10', text: 'Let the group choose your profile picture for a week', textHe: 'תן לקבוצה לבחור את תמונת הפרופיל שלך לשבוע', type: 'challenge', category: 'Spicy', categoryHe: 'פיקנטי' },
  ],
  partyAnimal: [
    { id: 'd11', text: 'Take off one piece of clothing', textHe: 'הורד פריט לבוש אחד', type: 'challenge', category: 'Hardcore', categoryHe: 'הארדקור' },
    { id: 'd12', text: "Sit on someone's lap for the next round", textHe: 'שב על הברכיים של מישהו בסיבוב הבא', type: 'challenge', category: 'Hardcore', categoryHe: 'הארדקור' },
    { id: 'd13', text: 'Let someone take a body shot off you', textHe: 'תן למישהו לקחת בודי שוט ממך', type: 'challenge', category: 'Hardcore', categoryHe: 'הארדקור' },
    { id: 'd14', text: 'Give a lap dance to someone', textHe: 'תן ריקוד חיק למישהו', type: 'challenge', category: 'Hardcore', categoryHe: 'הארדקור' },
    { id: 'd15', text: 'Kiss the person to your left', textHe: 'נשק את האדם משמאלך', type: 'challenge', category: 'Hardcore', categoryHe: 'הארדקור' },
  ],
  extreme: [
    { id: 'd16', text: 'Recreate a romantic movie scene with someone', textHe: 'שחזר סצנה רומנטית מסרט עם מישהו', type: 'challenge', category: 'Hardcore', categoryHe: 'הארדקור' },
    { id: 'd17', text: 'Give someone a hickey', textHe: 'תן למישהו סימן נשיקה', type: 'challenge', category: 'Hardcore', categoryHe: 'הארדקור' },
    { id: 'd18', text: 'Play 7 minutes in heaven with someone', textHe: 'שחק 7 דקות בגן עדן עם מישהו', type: 'challenge', category: 'Hardcore', categoryHe: 'הארדקור' },
    { id: 'd19', text: 'Make out with someone for 60 seconds', textHe: 'התנשק עם מישהו 60 שניות', type: 'challenge', category: 'Hardcore', categoryHe: 'הארדקור' },
    { id: 'd20', text: 'Let someone blindfold you and feed you', textHe: 'תן למישהו לכסות לך את העיניים ולהאכיל אותך', type: 'challenge', category: 'Hardcore', categoryHe: 'הארדקור' },
  ],
};

// ============= NEVER HAVE I EVER =============
export const neverHaveICards: Record<IntensityLevel, GameCard[]> = {
  noAlcohol: [
    { id: 'nhie1', text: 'Never have I ever stayed up all night binge-watching a show', textHe: 'מעולם לא נשארתי ער כל הלילה לראות סדרה', type: 'action' },
    { id: 'nhie2', text: 'Never have I ever pretended to be sick to skip work/school', textHe: 'מעולם לא העמדתי פנים שאני חולה כדי לא ללכת לעבודה/לימודים', type: 'action' },
    { id: 'nhie3', text: 'Never have I ever eaten food that fell on the floor', textHe: 'מעולם לא אכלתי אוכל שנפל על הרצפה', type: 'action' },
    { id: 'nhie4', text: 'Never have I ever lied about my age', textHe: 'מעולם לא שיקרתי לגבי הגיל שלי', type: 'action' },
    { id: 'nhie5', text: 'Never have I ever cried during a movie', textHe: 'מעולם לא בכיתי בסרט', type: 'action' },
  ],
  chilled: [
    { id: 'nhie6', text: 'Never have I ever kissed someone on the first date', textHe: 'מעולם לא נישקתי מישהו בדייט הראשון', type: 'action' },
    { id: 'nhie7', text: 'Never have I ever stalked an ex on social media', textHe: 'מעולם לא עקבתי אחרי אקס ברשתות החברתיות', type: 'action' },
    { id: 'nhie8', text: 'Never have I ever had a friends with benefits relationship', textHe: 'מעולם לא היה לי קשר של חברים עם הטבות', type: 'action' },
    { id: 'nhie9', text: 'Never have I ever ghosted someone', textHe: 'מעולם לא נעלמתי על מישהו', type: 'action' },
    { id: 'nhie10', text: 'Never have I ever drunk texted my ex', textHe: 'מעולם לא שלחתי הודעה לאקס כשהייתי שיכור/ה', type: 'action' },
  ],
  partyAnimal: [
    { id: 'nhie11', text: 'Never have I ever had a one-night stand', textHe: 'מעולם לא היה לי וואן נייט סטנד', type: 'action' },
    { id: 'nhie12', text: 'Never have I ever sent a risky photo', textHe: 'מעולם לא שלחתי תמונה מסוכנת', type: 'action' },
    { id: 'nhie13', text: 'Never have I ever been caught in the act', textHe: 'מעולם לא תפסו אותי באמצע', type: 'action' },
    { id: 'nhie14', text: 'Never have I ever had a threesome', textHe: 'מעולם לא היה לי שלישייה', type: 'action' },
    { id: 'nhie15', text: 'Never have I ever skinny dipped', textHe: 'מעולם לא שחיתי עירום/ה', type: 'action' },
  ],
  extreme: [
    { id: 'nhie16', text: "Never have I ever hooked up with a friend's ex", textHe: 'מעולם לא הייתי עם אקס של חבר/ה', type: 'action' },
    { id: 'nhie17', text: 'Never have I ever done it in a public place', textHe: 'מעולם לא עשיתי את זה במקום ציבורי', type: 'action' },
    { id: 'nhie18', text: 'Never have I ever been in a love triangle', textHe: 'מעולם לא הייתי במשולש אהבה', type: 'action' },
    { id: 'nhie19', text: 'Never have I ever cheated on a partner', textHe: 'מעולם לא בגדתי בבן/בת זוג', type: 'action' },
    { id: 'nhie20', text: 'Never have I ever had a secret relationship', textHe: 'מעולם לא היה לי קשר סודי', type: 'action' },
  ],
};

// ============= MOST LIKELY TO =============
export const mostLikelyCards: GameCard[] = [
  { id: 'mlt1', text: 'Most likely to become famous', textHe: 'הכי סביר להפוך למפורסם/ת', type: 'action' },
  { id: 'mlt2', text: 'Most likely to get arrested', textHe: 'הכי סביר להיעצר', type: 'action' },
  { id: 'mlt3', text: 'Most likely to marry a celebrity', textHe: 'הכי סביר להתחתן עם סלב', type: 'action' },
  { id: 'mlt4', text: 'Most likely to survive a zombie apocalypse', textHe: 'הכי סביר לשרוד אפוקליפסת זומבים', type: 'action' },
  { id: 'mlt5', text: 'Most likely to become a millionaire', textHe: 'הכי סביר להפוך למיליונר/ית', type: 'action' },
  { id: 'mlt6', text: 'Most likely to cry during a movie', textHe: 'הכי סביר לבכות בסרט', type: 'action' },
  { id: 'mlt7', text: 'Most likely to forget their wedding anniversary', textHe: 'הכי סביר לשכוח יום נישואים', type: 'action' },
  { id: 'mlt8', text: 'Most likely to win a drinking contest', textHe: 'הכי סביר לנצח בתחרות שתייה', type: 'action' },
  { id: 'mlt9', text: 'Most likely to get lost in a new city', textHe: 'הכי סביר ללכת לאיבוד בעיר חדשה', type: 'action' },
  { id: 'mlt10', text: 'Most likely to have a secret double life', textHe: 'הכי סביר לחיות חיים כפולים סודיים', type: 'action' },
  { id: 'mlt11', text: 'Most likely to become president', textHe: 'הכי סביר להפוך לנשיא/ה', type: 'action' },
  { id: 'mlt12', text: 'Most likely to star in a reality show', textHe: 'הכי סביר להשתתף בריאליטי', type: 'action' },
  { id: 'mlt13', text: 'Most likely to start a fight', textHe: 'הכי סביר להתחיל קטטה', type: 'action' },
  { id: 'mlt14', text: 'Most likely to sleep with someone famous', textHe: 'הכי סביר לישון עם מישהו מפורסם', type: 'action' },
  { id: 'mlt15', text: 'Most likely to have the most kids', textHe: 'הכי סביר שיהיו לו/ה הכי הרבה ילדים', type: 'action' },
];

// ============= KING'S CUP =============
export const kingsCupCards: GameCard[] = [
  { id: 'kc1', text: 'ACE - Waterfall! Everyone drinks until the person before them stops.', textHe: 'אס - מפל! כולם שותים עד שהאדם לפניהם מפסיק.', type: 'rule', category: 'A' },
  { id: 'kc2', text: '2 - You! Pick someone to drink.', textHe: '2 - אתה! בחר מישהו לשתות.', type: 'rule', category: '2' },
  { id: 'kc3', text: '3 - Me! You drink.', textHe: '3 - אני! אתה שותה.', type: 'rule', category: '3' },
  { id: 'kc4', text: '4 - Floor! Last one to touch the floor drinks.', textHe: '4 - רצפה! האחרון לגעת ברצפה שותה.', type: 'rule', category: '4' },
  { id: 'kc5', text: '5 - Guys! All guys drink.', textHe: '5 - בנים! כל הבנים שותים.', type: 'rule', category: '5' },
  { id: 'kc6', text: '6 - Chicks! All girls drink.', textHe: '6 - בנות! כל הבנות שותות.', type: 'rule', category: '6' },
  { id: 'kc7', text: '7 - Heaven! Last one to point up drinks.', textHe: '7 - שמיים! האחרון להצביע למעלה שותה.', type: 'rule', category: '7' },
  { id: 'kc8', text: '8 - Mate! Pick a drinking buddy.', textHe: '8 - חבר! בחר שותף לשתייה.', type: 'rule', category: '8' },
  { id: 'kc9', text: '9 - Rhyme! Say a word, go around rhyming. First to fail drinks.', textHe: '9 - חריזה! אמור מילה, כולם מחרזים. הראשון שנכשל שותה.', type: 'rule', category: '9' },
  { id: 'kc10', text: '10 - Categories! Pick a category, go around. First to fail drinks.', textHe: '10 - קטגוריות! בחר קטגוריה, כולם אומרים. הראשון שנכשל שותה.', type: 'rule', category: '10' },
  { id: 'kc11', text: 'JACK - Make a Rule! Create a rule everyone must follow.', textHe: 'נסיך - צור חוק! צור חוק שכולם חייבים לעקוב.', type: 'rule', category: 'J' },
  { id: 'kc12', text: 'QUEEN - Question Master! If someone answers your question, they drink.', textHe: 'מלכה - אדון השאלות! מי שעונה לשאלה שלך שותה.', type: 'rule', category: 'Q' },
  { id: 'kc13', text: "KING - Pour into the King's Cup! 4th King drinks it all!", textHe: 'מלך - שפוך לכוס המלך! המלך הרביעי שותה הכל!', type: 'rule', category: 'K' },
];

// ============= HELPER FUNCTIONS =============

// Shuffle array utility
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Get cards for a specific game
export const getGameCards = (game: GameType, intensity: IntensityLevel): GameCard[] => {
  switch (game) {
    case 'icebreaker':
      return shuffleArray([...icebreakerCards[intensity]]);
    case 'guessWho':
      return shuffleArray([...guessWhoCards]);
    case 'truthDareShot':
      return shuffleArray([...doOrDrinkCards[intensity]]);
    case 'trivia':
      return shuffleArray([...triviaCards]);
    case 'truthOrDare':
      return shuffleArray([...truthCards[intensity], ...dareCards[intensity]]);
    case 'neverHaveI':
      return shuffleArray([...neverHaveICards[intensity]]);
    case 'mostLikely':
      return shuffleArray([...mostLikelyCards]);
    case 'kingsCup':
      return shuffleArray([...kingsCupCards]);
    default:
      return [];
  }
};

// Get localized text from card
export const getCardText = (card: GameCard, language: 'en' | 'he'): string => {
  if (language === 'he' && card.textHe) {
    return card.textHe;
  }
  return card.text;
};

// Get localized category from card
export const getCardCategory = (card: GameCard, language: 'en' | 'he'): string | undefined => {
  if (language === 'he' && card.categoryHe) {
    return card.categoryHe;
  }
  return card.category;
};

// Get localized options for trivia
export const getCardOptions = (card: GameCard, language: 'en' | 'he'): string[] | undefined => {
  if (language === 'he' && card.optionsHe) {
    return card.optionsHe;
  }
  return card.options;
};

// Drink penalties with Hebrew translations
export const drinkPenalties: Record<IntensityLevel, { en: string; he: string }[]> = {
  noAlcohol: [
    { en: 'Do 5 push-ups!', he: 'עשה 5 שכיבות סמיכה!' },
    { en: 'Tell an embarrassing story!', he: 'ספר סיפור מביך!' },
    { en: 'Dance for 10 seconds!', he: 'רקוד 10 שניות!' },
    { en: 'Give someone a compliment!', he: 'תן למישהו מחמאה!' },
    { en: 'Do your best animal impression!', he: 'עשה חיקוי של חיה!' },
  ],
  chilled: [
    { en: 'Take 1 sip', he: 'קח לגימה אחת' },
    { en: 'Take 2 sips', he: 'קח 2 לגימות' },
    { en: 'Give a sip to a friend', he: 'תן לגימה לחבר' },
    { en: 'Cheers with everyone!', he: 'לחיים עם כולם!' },
    { en: 'Take a sip and make a toast', he: 'קח לגימה והרם כוסית' },
  ],
  partyAnimal: [
    { en: 'Take 2 sips', he: 'קח 2 לגימות' },
    { en: 'Take 3 sips', he: 'קח 3 לגימות' },
    { en: 'Finish half your drink!', he: 'סיים חצי מהמשקה!' },
    { en: 'Take a shot!', he: 'קח שוט!' },
    { en: 'Give 2 sips to someone of your choice', he: 'תן 2 לגימות למישהו לבחירתך' },
  ],
  extreme: [
    { en: 'Take a shot!', he: 'קח שוט!' },
    { en: 'Finish your drink!', he: 'סיים את המשקה!' },
    { en: 'Take 2 shots!', he: 'קח 2 שוטים!' },
    { en: 'Waterfall with the group!', he: 'מפל עם כל הקבוצה!' },
    { en: 'Down it all!', he: 'שתה הכל!' },
  ],
};

export const getRandomPenalty = (intensity: IntensityLevel, language: 'en' | 'he' = 'en'): string => {
  const penalties = drinkPenalties[intensity];
  const penalty = penalties[Math.floor(Math.random() * penalties.length)];
  return language === 'he' ? penalty.he : penalty.en;
};
