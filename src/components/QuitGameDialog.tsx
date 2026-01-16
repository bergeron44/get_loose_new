import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuitGameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const QuitGameDialog: React.FC<QuitGameDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Dialog */}
          <motion.div
            className="relative z-10 w-full max-w-sm"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="glass-card p-6 text-center border border-primary/20">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-full hover:bg-muted/50 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-destructive" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-foreground mb-2">
                {t('quit.title')}
              </h3>

              {/* Description */}
              <p className="text-muted-foreground mb-6">
                {t('quit.description')}
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="glass"
                  className="flex-1"
                  onClick={onClose}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('quit.cancel')}
                </Button>
                <Button
                  variant="neonOrange"
                  className="flex-1"
                  onClick={onConfirm}
                >
                  <Home className="w-4 h-4 mr-2" />
                  {t('quit.confirm')}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuitGameDialog;
