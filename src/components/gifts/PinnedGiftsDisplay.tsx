import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { PinnedGiftDetailSheet } from './PinnedGiftDetailSheet';

interface PinnedGift {
  id: string;
  gift: {
    id: string;
    name: string;
    emoji: string;
    rarity: string;
  };
}

interface PinnedGiftsDisplayProps {
  userId: string;
  className?: string;
}

export const PinnedGiftsDisplay = ({ userId, className = '' }: PinnedGiftsDisplayProps) => {
  const [pinnedGifts, setPinnedGifts] = useState<PinnedGift[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchPinnedGifts();
  }, [userId]);

  const fetchPinnedGifts = async () => {
    const { data, error } = await supabase
      .from('pinned_gifts')
      .select(`
        id,
        gift:gifts(id, name, emoji, rarity)
      `)
      .eq('user_id', userId)
      .order('pinned_at', { ascending: false })
      .limit(6);

    console.log('Pinned gifts data:', data, 'error:', error);

    if (!error && data) {
      setPinnedGifts(data as PinnedGift[]);
      console.log('Set pinned gifts:', data);
    }
  };

  if (pinnedGifts.length === 0) return null;

  const positions = [
    { top: '0%', left: '50%', transform: 'translate(-50%, -50%)' },
    { top: '25%', right: '0%', transform: 'translate(50%, -50%)' },
    { bottom: '25%', right: '0%', transform: 'translate(50%, 50%)' },
    { bottom: '0%', left: '50%', transform: 'translate(-50%, 50%)' },
    { bottom: '25%', left: '0%', transform: 'translate(-50%, 50%)' },
    { top: '25%', left: '0%', transform: 'translate(-50%, -50%)' },
  ];

  return (
    <>
      <div className="absolute inset-0 pointer-events-none">
        {pinnedGifts.map((pinnedGift, index) => {
          const position = positions[index % positions.length];
          return (
            <motion.div
              key={pinnedGift.id}
              className="absolute pointer-events-auto z-10 cursor-pointer"
              style={position}
              initial={{ scale: 0, opacity: 0, rotate: -180 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                rotate: 0,
                y: [0, -5, 0]
              }}
              transition={{ 
                delay: index * 0.1, 
                type: 'spring', 
                stiffness: 300, 
                damping: 20,
                y: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                  delay: index * 0.2
                }
              }}
              whileHover={{ 
                scale: 1.3, 
                rotate: 15,
                transition: { type: 'spring', stiffness: 400, damping: 10 }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedGiftId(pinnedGift.gift.id);
                setDetailsOpen(true);
              }}
            >
              <div className="relative text-2xl drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                {pinnedGift.gift.emoji}
              </div>
            </motion.div>
          );
        })}
      </div>

      <PinnedGiftDetailSheet
        giftId={selectedGiftId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
};
