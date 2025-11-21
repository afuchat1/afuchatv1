import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GradeBadge, type Grade } from './GradeBadge';

interface NexaProgressBarProps {
  currentNexa: number;
  currentGrade: Grade;
  showDetails?: boolean;
}

const GRADE_THRESHOLDS = [
  { grade: 'Newcomer' as Grade, min: 0, max: 100 },
  { grade: 'Active Chatter' as Grade, min: 100, max: 500 },
  { grade: 'Community Builder' as Grade, min: 500, max: 1500 },
  { grade: 'Elite Creator' as Grade, min: 1500, max: 5000 },
  { grade: 'Legend' as Grade, min: 5000, max: Infinity },
];

export const NexaProgressBar = ({ currentNexa, currentGrade, showDetails = true }: NexaProgressBarProps) => {
  const [progress, setProgress] = useState(0);
  
  const currentThreshold = GRADE_THRESHOLDS.find(t => t.grade === currentGrade);
  const nextThreshold = GRADE_THRESHOLDS[GRADE_THRESHOLDS.findIndex(t => t.grade === currentGrade) + 1];

  useEffect(() => {
    if (!currentThreshold) return;
    
    const nexaInCurrentGrade = currentNexa - currentThreshold.min;
    const nexaNeededForNext = currentThreshold.max - currentThreshold.min;
    const progressPercent = Math.min((nexaInCurrentGrade / nexaNeededForNext) * 100, 100);
    
    setProgress(progressPercent);
  }, [currentNexa, currentThreshold]);

  const nexaToNextGrade = nextThreshold ? nextThreshold.min - currentNexa : 0;

  return (
    <div className="w-full space-y-2">
      {showDetails && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <GradeBadge grade={currentGrade} size="sm" showLabel />
            <span className="text-muted-foreground">{currentNexa} Nexa</span>
          </div>
          {nextThreshold && (
            <span className="text-muted-foreground">
              {nexaToNextGrade} Nexa to {nextThreshold.grade}
            </span>
          )}
        </div>
      )}
      
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      </div>
    </div>
  );
};