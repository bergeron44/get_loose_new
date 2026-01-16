// ============= MAJORITY WINS - "מלחמת הרוב" =============

export interface DilemmaCard {
  id: string;
  optionA: {
    text: string;
    textHe: string;
  };
  optionB: {
    text: string;
    textHe: string;
  };
  category: 'classics' | 'funny' | 'social' | 'stoner';
}

// Category translations
export const categoryInfo = {
  classics: {
    name: 'The Classics',
    nameHe: 'הוויכוח הנצחי',
    emoji: '⚽',
    icon: '⚔️',
    color: 'hsl(45 93% 47%)', // Gold
    colorA: 'hsl(190 95% 50%)', // Cyan
    colorB: 'hsl(45 93% 47%)', // Gold
  },
  funny: {
    name: 'Funny & Weird',
    nameHe: 'הזיות ופדיחות',
    emoji: '🤡',
    icon: '🤪',
    color: 'hsl(330 85% 60%)', // Pink
    colorA: 'hsl(142 76% 36%)', // Green
    colorB: 'hsl(330 85% 60%)', // Pink
  },
  social: {
    name: 'Social & Relationship',
    nameHe: 'בינו לבינה',
    emoji: '💑',
    icon: '💕',
    color: 'hsl(300 76% 50%)', // Magenta
    colorA: 'hsl(0 84% 60%)', // Red
    colorB: 'hsl(300 76% 50%)', // Magenta
  },
  stoner: {
    name: 'The Stoner Epiphany',
    nameHe: 'כאפה של סטלנים',
    emoji: '🤯',
    icon: '🌿',
    color: 'hsl(142 76% 36%)', // Green
    colorA: 'hsl(271 91% 65%)', // Purple
    colorB: 'hsl(142 76% 36%)', // Green
    hasGlitch: true, // Special effect for this category
  },
};

export const majorityWinsCards: DilemmaCard[] = [
  // ============= CLASSICS - הוויכוח הנצחי =============
  {
    id: 'mw1',
    optionA: { text: 'Messi', textHe: 'מסי' },
    optionB: { text: 'Ronaldo', textHe: 'רונאלדו' },
    category: 'classics',
  },
  {
    id: 'mw2',
    optionA: { text: 'Summer', textHe: 'קיץ' },
    optionB: { text: 'Winter', textHe: 'חורף' },
    category: 'classics',
  },
  {
    id: 'mw3',
    optionA: { text: 'Tits', textHe: 'ציצים' },
    optionB: { text: 'Ass', textHe: 'תחת' },
    category: 'classics',
  },
  {
    id: 'mw4',
    optionA: { text: 'Android', textHe: 'אנדרואיד' },
    optionB: { text: 'iPhone', textHe: 'אייפון' },
    category: 'classics',
  },
  {
    id: 'mw5',
    optionA: { text: 'Morning Person', textHe: 'אדם של בוקר' },
    optionB: { text: 'Night Owl', textHe: 'ינשוף לילה' },
    category: 'classics',
  },
  {
    id: 'mw6',
    optionA: { text: 'Dogs', textHe: 'כלבים' },
    optionB: { text: 'Cats', textHe: 'חתולים' },
    category: 'classics',
  },
  {
    id: 'mw7',
    optionA: { text: 'Beer', textHe: 'בירה' },
    optionB: { text: 'Wine', textHe: 'יין' },
    category: 'classics',
  },
  {
    id: 'mw8',
    optionA: { text: 'Beach Vacation', textHe: 'חופשת חוף' },
    optionB: { text: 'Mountain Trip', textHe: 'טיול הרים' },
    category: 'classics',
  },

  // ============= FUNNY & WEIRD - הזיות ופדיחות =============
  {
    id: 'mw9',
    optionA: { text: 'Trump voice for life', textHe: 'קול של טראמפ לכל החיים' },
    optionB: { text: 'Walk like a penguin forever', textHe: 'ללכת כמו פינגווין לנצח' },
    category: 'funny',
  },
  {
    id: 'mw10',
    optionA: { text: 'Fart every time you laugh', textHe: 'להפליץ כל פעם שצוחקים' },
    optionB: { text: 'Moo every time you sneeze', textHe: 'לגעות כמו פרה כל פעם שמתעטשים' },
    category: 'funny',
  },
  {
    id: 'mw11',
    optionA: { text: 'Only eat with your hands forever', textHe: 'לאכול רק עם הידיים לנצח' },
    optionB: { text: 'Only drink through a straw forever', textHe: 'לשתות רק דרך קש לנצח' },
    category: 'funny',
  },
  {
    id: 'mw12',
    optionA: { text: 'Always be 10 min late', textHe: 'תמיד לאחר ב-10 דקות' },
    optionB: { text: 'Always be 2 hours early', textHe: 'תמיד להגיע שעתיים מוקדם' },
    category: 'funny',
  },
  {
    id: 'mw13',
    optionA: { text: 'Hiccup forever', textHe: 'להשהק לנצח' },
    optionB: { text: 'Feel like you need to sneeze forever', textHe: 'להרגיש שצריך להתעטש לנצח' },
    category: 'funny',
  },
  {
    id: 'mw14',
    optionA: { text: 'Sing everything you say', textHe: 'לשיר כל מה שאתה אומר' },
    optionB: { text: 'Dance everywhere you walk', textHe: 'לרקוד לכל מקום שהולכים' },
    category: 'funny',
  },

  // ============= SOCIAL & RELATIONSHIP - בינו לבינה =============
  {
    id: 'mw15',
    optionA: { text: 'Rich and lonely', textHe: 'עשיר ובודד' },
    optionB: { text: 'Poor with friends', textHe: 'עני עם חברים' },
    category: 'social',
  },
  {
    id: 'mw16',
    optionA: { text: 'Extreme beauty, bad personality', textHe: 'יופי קיצוני, אישיות נוראית' },
    optionB: { text: 'Average looks, perfect personality', textHe: 'מראה ממוצע, אישיות מושלמת' },
    category: 'social',
  },
  {
    id: 'mw17',
    optionA: { text: 'Know when you\'ll die', textHe: 'לדעת מתי תמות' },
    optionB: { text: 'Know how you\'ll die', textHe: 'לדעת איך תמות' },
    category: 'social',
  },
  {
    id: 'mw18',
    optionA: { text: 'Read everyone\'s minds', textHe: 'לקרוא מחשבות של כולם' },
    optionB: { text: 'Everyone can read your mind', textHe: 'כולם יכולים לקרוא את מחשבותיך' },
    category: 'social',
  },
  {
    id: 'mw19',
    optionA: { text: 'Be famous but hated', textHe: 'להיות מפורסם אבל שנוא' },
    optionB: { text: 'Be unknown but loved', textHe: 'להיות אנונימי אבל אהוב' },
    category: 'social',
  },
  {
    id: 'mw20',
    optionA: { text: 'Never use social media again', textHe: 'לא להשתמש בסושיאל יותר' },
    optionB: { text: 'Only communicate through social media', textHe: 'לתקשר רק דרך סושיאל' },
    category: 'social',
  },
  {
    id: 'mw21',
    optionA: { text: 'Partner who\'s bad in bed but romantic', textHe: 'בן זוג גרוע במיטה אבל רומנטי' },
    optionB: { text: 'Partner who\'s amazing in bed but cold', textHe: 'בן זוג מדהים במיטה אבל קר' },
    category: 'social',
  },

  // ============= STONER EPIPHANY - כאפה של סטלנים =============
  {
    id: 'mw22',
    optionA: { text: 'Is hummus a soup?', textHe: 'חומוס זה מרק?' },
    optionB: { text: 'Is hummus a dip?', textHe: 'חומוס זה מטבל?' },
    category: 'stoner',
  },
  {
    id: 'mw23',
    optionA: { text: 'Smartest in a room of fools', textHe: 'הכי חכם בחדר של טיפשים' },
    optionB: { text: 'Dumbest in a room of geniuses', textHe: 'הכי טיפש בחדר של גאונים' },
    category: 'stoner',
  },
  {
    id: 'mw24',
    optionA: { text: 'Can you own land on the moon?', textHe: 'אפשר להחזיק אדמה על הירח?' },
    optionB: { text: 'Is the moon even real?', textHe: 'הירח בכלל אמיתי?' },
    category: 'stoner',
  },
  {
    id: 'mw25',
    optionA: { text: 'If you punch yourself and it hurts, are you strong or weak?', textHe: 'אם מכים את עצמך וכואב, אתה חזק או חלש?' },
    optionB: { text: 'Both at the same time', textHe: 'שניהם באותו זמן' },
    category: 'stoner',
  },
  {
    id: 'mw26',
    optionA: { text: 'Is water wet?', textHe: 'האם מים רטובים?' },
    optionB: { text: 'Water makes things wet', textHe: 'מים מרטיבים דברים' },
    category: 'stoner',
  },
  {
    id: 'mw27',
    optionA: { text: 'Are eyebrows facial hair?', textHe: 'גבות זה שיער פנים?' },
    optionB: { text: 'Eyebrows are their own thing', textHe: 'גבות זה משהו בפני עצמו' },
    category: 'stoner',
  },
  {
    id: 'mw28',
    optionA: { text: 'Is a hotdog a sandwich?', textHe: 'נקניקייה זה סנדוויץ\'?' },
    optionB: { text: 'A hotdog is a taco', textHe: 'נקניקייה זה טאקו' },
    category: 'stoner',
  },
];

// Get cards by category
export const getCardsByCategory = (category: DilemmaCard['category']): DilemmaCard[] => {
  return majorityWinsCards.filter(card => card.category === category);
};

// Get shuffled cards for a category
export const getShuffledCards = (category: DilemmaCard['category']): DilemmaCard[] => {
  return [...getCardsByCategory(category)].sort(() => Math.random() - 0.5);
};

// Get all categories
export const getAllCategories = () => Object.keys(categoryInfo) as Array<keyof typeof categoryInfo>;
