import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Beer, Wine, Sparkles, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface GroupDrinkOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'groupSip' | 'toast' | 'waterfall';
}

const overlayContent = {
  groupSip: {
    icon: <Beer className="w-20 h-20" />,
    titleEn: 'Everyone Drinks!',
    titleHe: 'כולם שותים!',
    subtitleEn: 'Take a sip together',
    subtitleHe: 'קחו לגימה ביחד',
    gradient: 'from-amber-500 to-orange-600',
  },
  toast: {
    icon: <Wine className="w-20 h-20" />,
    titleEn: 'Cheers! 🥂',
    titleHe: 'לחיים! 🥂',
    subtitleEn: 'Raise your glasses!',
    subtitleHe: 'הרימו את הכוסות!',
    gradient: 'from-neon-purple to-pink-600',
  },
  waterfall: {
    icon: <Sparkles className="w-20 h-20" />,
    titleEn: 'Waterfall!',
    titleHe: 'מפל!',
    subtitleEn: "Don't stop until the person before you stops!",
    subtitleHe: 'אל תפסיקו עד שהאדם לפניכם מפסיק!',
    gradient: 'from-neon-cyan to-blue-600',
  },
};

const GroupDrinkOverlay: React.FC<GroupDrinkOverlayProps> = ({ isOpen, onClose, type }) => {
  const { language } = useLanguage();
  const isRTL = language === 'he';
  const content = overlayContent[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            className="relative z-10 w-full max-w-sm"
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: 0,
              transition: { type: 'spring', stiffness: 200, damping: 20 }
            }}
            exit={{ scale: 0.8, opacity: 0, y: 30 }}
          >
            <div className="glass-card p-8 text-center overflow-hidden">
              {/* Animated background gradient */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${content.gradient} opacity-20`}
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              {/* Floating bubbles */}
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full bg-white/20"
                  initial={{ 
                    y: 200,
                    x: Math.random() * 300 - 150,
                    opacity: 0,
                  }}
                  animate={{ 
                    y: -200,
                    opacity: [0, 1, 0],
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}

              {/* Icon */}
              <motion.div
                className={`inline-block p-6 rounded-full bg-gradient-to-br ${content.gradient} text-white mb-6`}
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {content.icon}
              </motion.div>

              {/* Text */}
              <motion.h2
                className="text-3xl font-black text-foreground mb-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                {isRTL ? content.titleHe : content.titleEn}
              </motion.h2>
              <p className="text-muted-foreground mb-8">
                {isRTL ? content.subtitleHe : content.subtitleEn}
              </p>

              {/* Close button */}
              <Button
                variant="glass"
                size="lg"
                onClick={onClose}
                className="w-full"
              >
                <X className="w-5 h-5 mr-2" />
                {isRTL ? 'שתינו!' : 'Done!'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GroupDrinkOverlay;
