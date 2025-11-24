import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { SimpleGiftIcon } from './SimpleGiftIcon';

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
    { top: '-8%', left: '50%', transform: 'translate(-50%, -50%)' },
    { top: '15%', right: '-12%', transform: 'translate(50%, -50%)' },
    { bottom: '15%', right: '-12%', transform: 'translate(50%, 50%)' },
    { bottom: '-8%', left: '50%', transform: 'translate(-50%, 50%)' },
    { bottom: '15%', left: '-12%', transform: 'translate(-50%, 50%)' },
    { top: '15%', left: '-12%', transform: 'translate(-50%, -50%)' },
  ];

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {pinnedGifts.map((pinnedGift, index) => {
        const position = positions[index % positions.length];
        return (
          <motion.div
            key={pinnedGift.id}
            className="absolute pointer-events-auto z-10"
            style={position}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-sm opacity-60 group-hover:opacity-90 transition-opacity" />
              <div className="relative bg-background/80 backdrop-blur-sm rounded-full p-0.5 border border-primary/10 shadow-sm">
                <SimpleGiftIcon emoji={pinnedGift.gift.emoji} size={18} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
