import { motion } from 'framer-motion';

export type Grade = 'Newcomer' | 'Active Chatter' | 'Community Builder' | 'Elite Creator' | 'Legend';

interface GradeBadgeProps {
  grade: Grade;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

const GRADE_CONFIG: Record<Grade, { color: string; symbol: string; glow: string }> = {
  'Newcomer': { color: 'text-gray-500', symbol: '🟢', glow: 'shadow-gray-500/50' },
  'Active Chatter': { color: 'text-blue-500', symbol: '🔵', glow: 'shadow-blue-500/50' },
  'Community Builder': { color: 'text-purple-500', symbol: '🟣', glow: 'shadow-purple-500/50' },
  'Elite Creator': { color: 'text-yellow-500', symbol: '🟡', glow: 'shadow-yellow-500/50' },
  'Legend': { color: 'text-red-500', symbol: '🔴', glow: 'shadow-red-500/50' },
};

const SIZE_CONFIG = {
  sm: { badge: 'text-[10px] px-1.5 py-0.5', symbol: 'text-xs' },
  md: { badge: 'text-xs px-2 py-1', symbol: 'text-sm' },
  lg: { badge: 'text-sm px-3 py-1.5', symbol: 'text-base' },
};

export const GradeBadge = ({ 
  grade, 
  size = 'sm', 
  showLabel = false,
  animated = true 
}: GradeBadgeProps) => {
  const config = GRADE_CONFIG[grade];
  const sizeConfig = SIZE_CONFIG[size];

  const BadgeContent = (
    <div
      className={`inline-flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-sm border border-border ${sizeConfig.badge} ${config.color} font-semibold shadow-lg ${config.glow}`}
    >
      <span className={sizeConfig.symbol}>{config.symbol}</span>
      {showLabel && <span>{grade}</span>}
    </div>
  );

  if (!animated) return BadgeContent;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {BadgeContent}
    </motion.div>
  );
};