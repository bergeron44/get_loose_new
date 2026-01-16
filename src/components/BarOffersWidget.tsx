import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, Tag, Beer, Wine, Copy, Check, Ticket } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';

interface BarOffer {
  id: string;
  titleEn: string;
  titleHe: string;
  descEn: string;
  descHe: string;
  discount: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  icon: React.ElementType;
}

type CouponResponse = {
  _id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  validFrom?: string | null;
  validTo?: string | null;
  isActive: boolean;
  usageLimit: number;
  usageCount: number;
};

const API_BASE = import.meta.env.VITE_SUPABASE_URL || '';

const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const BarOffersWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<BarOffer | null>(null);
  const [redemptionCode, setRedemptionCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [serverCoupons, setServerCoupons] = useState<CouponResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  const { currentBar } = useGame();
  const { toast } = useToast();
  const isRTL = language === 'he';

  useEffect(() => {
    if (!currentBar?._id) {
      setServerCoupons([]);
      return;
    }

    setIsLoading(true);
    fetch(`${API_BASE}/api/coupons/bar/${currentBar._id}/active`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load offers');
        }
        const data = (await response.json()) as CouponResponse[];
        setServerCoupons(data);
      })
      .catch((error) => {
        console.error('Failed to load offers:', error);
        setServerCoupons([]);
      })
      .finally(() => setIsLoading(false));
  }, [currentBar]);

  const offers = useMemo<BarOffer[]>(() => {
    if (serverCoupons.length === 0) {
      return [];
    }

    const icons = [Wine, Sparkles, Beer];
    return serverCoupons.map((coupon, index) => {
      const discountLabel = coupon.discountType === 'percent'
        ? `${coupon.discountValue}%`
        : `₪${coupon.discountValue}`;
      const usageText = isRTL
        ? `מימושים ${coupon.usageCount}/${coupon.usageLimit}`
        : `Uses ${coupon.usageCount}/${coupon.usageLimit}`;

      return {
        id: coupon.code,
        titleEn: 'Bar Coupon',
        titleHe: 'קופון בר',
        descEn: `Valid offer · ${usageText}`,
        descHe: `מבצע פעיל · ${usageText}`,
        discount: discountLabel,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        icon: icons[index % icons.length],
      };
    });
  }, [serverCoupons, isRTL]);

  const handleOfferClick = async (offer: BarOffer) => {
    if (!currentBar?._id) {
      toast({
        title: isRTL ? 'לא זוהה בר' : 'No bar detected',
        description: isRTL
          ? 'אנא אפשרו גישה למיקום כדי לקבל קופון.'
          : 'Please enable location access to get a coupon.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setSelectedOffer(offer);
    
    const code = generateCode();
    
    try {
      if (serverCoupons.length > 0) {
        const response = await fetch(`${API_BASE}/api/coupons/redeem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: offer.id, barId: currentBar._id }),
        });

        if (!response.ok) {
          throw new Error('Failed to redeem coupon');
        }

        const data = await response.json();
        setRedemptionCode(data?.code || offer.id);
      } else {
        const response = await fetch(`${API_BASE}/api/bar/${currentBar._id}/coupons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            discountType: offer.discountType,
            discountValue: offer.discountValue,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create coupon');
        }

        const data = await response.json();
        setRedemptionCode(data?.coupon?.code || code);
      }
    } catch (error) {
      console.error('Error creating redemption code:', error);
      toast({
        title: isRTL ? 'שגיאה' : 'Error',
        description: isRTL ? 'לא הצלחנו ליצור קופון' : 'Failed to create coupon',
        variant: 'destructive',
      });
      setRedemptionCode(null);
    }
    
    setIsGenerating(false);
  };

  const handleCopyCode = () => {
    if (redemptionCode) {
      navigator.clipboard.writeText(redemptionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBack = () => {
    setSelectedOffer(null);
    setRedemptionCode(null);
    setCopied(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setSelectedOffer(null);
      setRedemptionCode(null);
      setCopied(false);
    }, 300);
  };

  return (
    <>
      {/* Floating Widget Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="glass-card px-4 py-3 flex items-center gap-3 cursor-pointer group border border-secondary/30 hover:border-secondary/60 transition-colors"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Pulsing glow effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-secondary/20 to-neon-pink/20"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        <div className="relative flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-neon-pink flex items-center justify-center"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Tag className="w-5 h-5 text-foreground" />
          </motion.div>
          
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">
              {isRTL ? 'קופונים פעילים' : 'Active Coupons'}
            </p>
            <p className="text-xs text-secondary">
              {currentBar 
                ? (isRTL ? `ב-${currentBar.barName}` : `@ ${currentBar.barName}`)
                : (isRTL ? 'הנחות בלעדיות' : 'Live Deals')
              }
            </p>
          </div>

          {/* Live indicator */}
          <motion.div
            className="w-2 h-2 rounded-full bg-accent"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          />
        </div>
      </motion.button>

      {/* Bottom Drawer with offers */}
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="glass-card border-t border-secondary/30">
          <DrawerHeader className="relative">
            <DrawerTitle className="text-xl font-bold text-foreground flex items-center gap-2 justify-center">
              <Sparkles className="w-5 h-5 text-secondary" />
              {selectedOffer 
                ? (isRTL ? 'קוד הקופון שלך' : 'Your Coupon Code')
                : (isRTL 
                    ? (currentBar ? `קופונים ב-${currentBar.barName}` : 'קופונים פעילים')
                    : (currentBar ? `Coupons at ${currentBar.barName}` : 'Active Coupons')
                  )
              }
            </DrawerTitle>
            <DrawerClose className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted/50 transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </DrawerClose>
          </DrawerHeader>

          <div className="px-4 pb-8 space-y-3">
            {selectedOffer && redemptionCode ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                {/* Selected Offer Display */}
                <div className="glass-card p-4 border border-secondary/20">
                  <div className="flex items-center gap-4 justify-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-neon-pink flex items-center justify-center">
                      <selectedOffer.icon className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">
                        {isRTL ? selectedOffer.titleHe : selectedOffer.titleEn}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? selectedOffer.descHe : selectedOffer.descEn}
                      </p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-accent/20 text-accent font-bold text-sm">
                      {selectedOffer.discount}
                    </div>
                  </div>
                </div>

                {/* Redemption Code */}
                <div className="py-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Ticket className="w-5 h-5 text-secondary" />
                    <span className="text-sm text-muted-foreground">
                      {isRTL ? 'הציגו את הקוד לברמן' : 'Show this code to the bartender'}
                    </span>
                  </div>
                  
                  <motion.div
                    className="bg-gradient-to-r from-secondary/20 to-neon-pink/20 rounded-2xl p-6 border-2 border-dashed border-secondary/50"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(0, 255, 170, 0.2)',
                        '0 0 40px rgba(0, 255, 170, 0.4)',
                        '0 0 20px rgba(0, 255, 170, 0.2)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <p className="text-3xl font-mono font-bold tracking-[0.3em] text-foreground">
                      {redemptionCode}
                    </p>
                  </motion.div>

                  <button
                    onClick={handleCopyCode}
                    className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors text-sm text-foreground"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-accent" />
                        {isRTL ? 'הועתק!' : 'Copied!'}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        {isRTL ? 'העתק קוד' : 'Copy Code'}
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleBack}
                  className="text-secondary hover:text-secondary/80 text-sm underline"
                >
                  {isRTL ? '← חזרה למבצעים' : '← Back to offers'}
                </button>
              </motion.div>
            ) : (
              <>
                {isLoading ? (
                  <p className="text-center text-sm text-muted-foreground">
                    {isRTL ? 'טוען קופונים...' : 'Loading coupons...'}
                  </p>
                ) : offers.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    {isRTL ? 'אין קופונים פעילים כרגע' : 'No active coupons right now'}
                  </p>
                ) : offers.map((offer, index) => (
                  <motion.button
                    key={offer.id}
                    onClick={() => handleOfferClick(offer)}
                    disabled={isGenerating}
                    className="w-full glass-card p-4 border border-secondary/20 hover:border-secondary/40 transition-colors text-left disabled:opacity-50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-neon-pink flex items-center justify-center shrink-0">
                        <offer.icon className="w-6 h-6 text-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground">
                          {isRTL ? offer.titleHe : offer.titleEn}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? offer.descHe : offer.descEn}
                        </p>
                      </div>

                      <div className="shrink-0 px-3 py-1 rounded-full bg-accent/20 text-accent font-bold text-sm">
                        {offer.discount}
                      </div>
                    </div>
                  </motion.button>
                ))}

                {!!offers.length && (
                  <p className="text-center text-xs text-muted-foreground pt-4">
                    {isRTL ? 'לחצו על קופון לקבלת קוד' : 'Tap a coupon to get your code'}
                  </p>
                )}
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default BarOffersWidget;
