import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GradeBadge, type Grade } from './GradeBadge';

interface NexaProgressBarProps {
  currentNexa: number;
  currentGrade: Grade;
  showDetails?: boolean;
}

const GRADE_THRESHOLDS = [
  { grade: 'Newcomer' as Grade, min: 0, max: 100, color: 'bg-gray-500' },
  { grade: 'Active Chatter' as Grade, min: 100, max: 500, color: 'bg-blue-500' },
  { grade: 'Community Builder' as Grade, min: 500, max: 1500, color: 'bg-purple-500' },
  { grade: 'Elite Creator' as Grade, min: 1500, max: 5000, color: 'bg-yellow-500' },
  { grade: 'Legend' as Grade, min: 5000, max: Infinity, color: 'bg-red-500' },
];

const TOTAL_MAX_FOR_DISPLAY = 5000; // Max value for visual representation

export const NexaProgressBar = ({ currentNexa, currentGrade, showDetails = true }: NexaProgressBarProps) => {
  const [progress, setProgress] = useState(0);
  
  const currentThreshold = GRADE_THRESHOLDS.find(t => t.grade === currentGrade);
  const nextThreshold = GRADE_THRESHOLDS[GRADE_THRESHOLDS.findIndex(t => t.grade === currentGrade) + 1];

  useEffect(() => {
    // Calculate overall progress across all levels
    const cappedNexa = Math.min(currentNexa, TOTAL_MAX_FOR_DISPLAY);
    const overallProgress = (cappedNexa / TOTAL_MAX_FOR_DISPLAY) * 100;
    setProgress(overallProgress);
  }, [currentNexa]);

  const nexaToNextGrade = nextThreshold ? nextThreshold.min - currentNexa : 0;

  // Calculate milestone positions as percentages
  const milestones = GRADE_THRESHOLDS.slice(1, -1).map(threshold => ({
    position: (threshold.min / TOTAL_MAX_FOR_DISPLAY) * 100,
    grade: threshold.grade,
  }));

  return (
    <div className="w-full space-y-2">
      {showDetails && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <GradeBadge grade={currentGrade} size="sm" showLabel />
            <span className="text-muted-foreground">{currentNexa} Nexa</span>
          </div>
          {nextThreshold && currentNexa < TOTAL_MAX_FOR_DISPLAY && (
            <span className="text-muted-foreground">
              {nexaToNextGrade} to {nextThreshold.grade}
            </span>
          )}
        </div>
      )}
      
      <div className="relative h-3 bg-muted rounded-full overflow-visible">
        {/* Milestone markers */}
        {milestones.map((milestone, index) => (
          <div
            key={index}
            className="absolute top-0 bottom-0 w-0.5 bg-background z-10"
            style={{ left: `${milestone.position}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-background border-2 border-muted-foreground/30" />
          </div>
        ))}
        
        {/* Progress fill with gradient */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="h-full w-full bg-gradient-to-r from-primary via-primary to-primary/90">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.div>
      </div>
      
      {/* Level labels below the bar */}
      <div className="relative w-full">
        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
          {GRADE_THRESHOLDS.slice(0, -1).map((threshold, index) => (
            <span key={index} className="text-center" style={{ 
              position: index === 0 ? 'relative' : 'absolute',
              left: index === 0 ? '0' : `${(threshold.min / TOTAL_MAX_FOR_DISPLAY) * 100}%`,
              transform: index === 0 ? 'none' : 'translateX(-50%)'
            }}>
              {threshold.min}
            </span>
          ))}
          <span className="text-right">{TOTAL_MAX_FOR_DISPLAY}+</span>
        </div>
      </div>
    </div>
  );
};