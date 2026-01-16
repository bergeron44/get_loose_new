import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, PartyPopper, Zap, MapPin } from 'lucide-react';
import { SpringButton } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { useLocationDetection } from '@/hooks/useLocationDetection';
import BarOffersWidget from '@/components/BarOffersWidget';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
const LandingScreen: React.FC = () => {
  const {
    t,
    isRTL
  } = useLanguage();
  const {
    setCurrentScreen,
    currentBar
  } = useGame();
  const { detectBar, permissionStatus, showPermissionAlert, setShowPermissionAlert } = useLocationDetection();
  const hasDetectedRef = useRef(false);

  // בדיקה אם צריך להציג אלרט להרשאות מיקום
  useEffect(() => {
    // רק אם אין בר מזוהה ו-permission הוא 'prompt' או 'denied'
    if (!currentBar && (permissionStatus === 'prompt' || permissionStatus === 'denied')) {
      // הצג אלרט אחרי 2 שניות (לא מיד) - לא לעצבן את המשתמש
      const timer = setTimeout(() => {
        setShowPermissionAlert(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (currentBar) {
      // אם נמצא בר, סגור אלרט אם היה פתוח
      setShowPermissionAlert(false);
    }
  }, [currentBar, permissionStatus, setShowPermissionAlert]);

  // זיהוי בר אוטומטי ברקע - לא חוסם UI!
  useEffect(() => {
    // רק פעם אחת כשהעמוד נטען
    if (!hasDetectedRef.current && !currentBar) {
      hasDetectedRef.current = true;
      
      // רץ ברקע - לא חוסם את המשתמש
      detectBar().then((bar) => {
        if (bar) {
          console.log('Bar detected in background:', bar.barName);
          setShowPermissionAlert(false); // סגור אלרט אם נמצא בר
        }
      }).catch((err) => {
        // שקט - לא להציג שגיאות למשתמש
        console.log('Bar detection failed (silent):', err);
      });
    }
  }, [currentBar, detectBar, setShowPermissionAlert]);

  // טיפול בלחיצה על "הפעל מיקום"
  const handleEnableLocation = () => {
    setShowPermissionAlert(false);
    // נסה שוב לזהות בר (זה יגרום לבקשת הרשאה)
    detectBar().then((bar) => {
      if (bar) {
        console.log('Bar detected after enabling location:', bar.barName);
      }
    }).catch((err) => {
      console.log('Bar detection failed:', err);
    });
  };

  const handleStartParty = () => {
    setCurrentScreen('gameSelection');
  };
  return <motion.div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden" style={{
    background: 'var(--gradient-hero)'
  }} initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} transition={{
    duration: 0.5
  }}>
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <motion.div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-neon-purple/20 blur-3xl" animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3]
      }} transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut'
      }} />
        <motion.div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-neon-orange/20 blur-3xl" animate={{
        scale: [1.2, 1, 1.2],
        opacity: [0.3, 0.5, 0.3]
      }} transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut'
      }} />
        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-neon-pink/10 blur-3xl" animate={{
        scale: [1, 1.3, 1]
      }} transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut'
      }} />
      </div>

      {/* Content with fade-in/slide-up */}
      <motion.div className="relative z-10 text-center max-w-lg mx-auto" initial={{
      opacity: 0,
      y: 40
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }}>
        {/* Logo/Icon */}
        <motion.div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-neon-purple via-neon-pink to-neon-orange mb-8 shadow-glow" animate={{
        rotate: [0, 5, -5, 0]
      }} transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut'
      }}>
          <PartyPopper className="w-12 h-12 text-foreground" />
        </motion.div>

        {/* Title - Always in English with gradient */}
        <motion.h1 
          className="text-5xl md:text-7xl font-black mb-4 font-outfit tracking-tight overflow-visible" 
          style={{ direction: 'ltr', textAlign: 'center' }} 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="bg-gradient-to-r from-neon-purple via-neon-pink to-neon-orange bg-clip-text text-transparent italic inline-block pr-3">
            Get Loose
          </span>
        </motion.h1>

        {/* Subtitle - Always in English */}
        <motion.h2 
          className="text-xl md:text-2xl font-bold mb-4 italic font-outfit" 
          style={{ 
            direction: 'ltr', 
            textAlign: 'center',
            background: 'linear-gradient(90deg, hsl(var(--neon-purple)), hsl(var(--neon-orange)))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }} 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          The Ultimate Bar Drinking Game
        </motion.h2>

        {/* Description */}
        <motion.p 
          className="text-muted-foreground text-lg mb-12 max-w-md mx-auto" 
          style={{ direction: isRTL ? 'rtl' : 'ltr', textAlign: 'center' }} 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {isRTL 
            ? 'הפכו כל לילה לחוויה בלתי נשכחת עם 8 משחקים אפיים'
            : 'Turn any night out into an unforgettable experience with 8 epic games'}
        </motion.p>

        {/* CTA Button with Spring animation */}
        <motion.div initial={{
        opacity: 0,
        scale: 0.8
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        delay: 0.5,
        type: 'spring',
        stiffness: 200,
        damping: 15
      }}>
          <SpringButton variant="hero" size="xl" onClick={handleStartParty} className="group relative overflow-hidden">
            <span className="relative z-10 flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              Start Party
              <Zap className="w-6 h-6" />
            </span>
          </SpringButton>
        </motion.div>

        {/* Feature badges */}
        <motion.div className="flex flex-wrap justify-center gap-3 mt-12" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 0.7
      }}>
          {['8 Games', 'Party Mode', 'Multilingual'].map((feature, index) => <motion.span key={index} className="glass-card px-4 py-2 rounded-full text-sm font-medium text-muted-foreground" initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.8 + index * 0.1,
          duration: 0.4
        }}>
              {feature}
            </motion.span>)}
        </motion.div>

        {/* Bar Offers Widget */}
        <motion.div className="mt-8 flex justify-center" initial={{
        opacity: 0,
        y: 30
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 1,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }}>
          <BarOffersWidget />
        </motion.div>
      </motion.div>

      {/* Location Permission Alert */}
      <AlertDialog open={showPermissionAlert} onOpenChange={setShowPermissionAlert}>
        <AlertDialogContent className="glass-card border-secondary/30">
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-neon-pink flex items-center justify-center">
                <MapPin className="w-8 h-8 text-foreground" />
              </div>
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-center">
              {isRTL ? 'הפעל מיקום' : 'Enable Location'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              {isRTL 
                ? 'הפעל מיקום על מנת לזכות בהנחות שוות בבר שבו אתה נמצא!'
                : 'Enable location to get exclusive deals at the bar you\'re at!'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              {isRTL ? 'לא עכשיו' : 'Not Now'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEnableLocation}
              className="w-full sm:w-auto bg-gradient-to-r from-secondary to-neon-pink"
            >
              {isRTL ? 'הפעל מיקום' : 'Enable Location'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>;
};
export default LandingScreen;