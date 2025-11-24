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

    if (!error && data) {
      setPinnedGifts(data as PinnedGift[]);
    }
  };

  if (pinnedGifts.length === 0) return null;

  const positions = [
    { top: '0%', left: '50%', transform: 'translate(-50%, -100%)' },
    { top: '20%', right: '-15%', transform: 'translate(0, -50%)' },
    { bottom: '20%', right: '-15%', transform: 'translate(0, 50%)' },
    { bottom: '0%', left: '50%', transform: 'translate(-50%, 100%)' },
    { bottom: '20%', left: '-15%', transform: 'translate(0, 50%)' },
    { top: '20%', left: '-15%', transform: 'translate(0, -50%)' },
  ];

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {pinnedGifts.map((pinnedGift, index) => {
        const position = positions[index % positions.length];
        return (
          <motion.div
            key={pinnedGift.id}
            className="absolute pointer-events-auto"
            style={position}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <SimpleGiftIcon emoji={pinnedGift.gift.emoji} size={32} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
