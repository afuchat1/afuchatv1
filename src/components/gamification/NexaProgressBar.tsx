import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GradeBadge, type Grade } from './GradeBadge';

interface NexaProgressBarProps {
  currentNexa: number;
  currentGrade: Grade;
  showDetails?: boolean;
}

const GRADE_THRESHOLDS = [
  { 
    grade: 'Newcomer' as Grade, 
    min: 0, 
    max: 500, 
    gradient: 'from-gray-400 via-gray-500 to-gray-600',
    glow: 'shadow-gray-500/20',
    shimmerSpeed: 2
  },
  { 
    grade: 'Active Chatter' as Grade, 
    min: 500, 
    max: 2000, 
    gradient: 'from-blue-400 via-blue-500 to-blue-600',
    glow: 'shadow-blue-500/30',
    shimmerSpeed: 1.8
  },
  { 
    grade: 'Community Builder' as Grade, 
    min: 2000, 
    max: 5000, 
    gradient: 'from-purple-400 via-purple-500 to-purple-600',
    glow: 'shadow-purple-500/40',
    shimmerSpeed: 1.5
  },
  { 
    grade: 'Elite Creator' as Grade, 
    min: 5000, 
    max: 15000, 
    gradient: 'from-yellow-400 via-yellow-500 to-amber-500',
    glow: 'shadow-yellow-500/50',
    shimmerSpeed: 1.2
  },
  { 
    grade: 'Legend' as Grade, 
    min: 15000, 
    max: Infinity, 
    gradient: 'from-red-500 via-orange-500 to-pink-500',
    glow: 'shadow-red-500/60',
    shimmerSpeed: 1
  },
];

const TOTAL_MAX_FOR_DISPLAY = 15000; // Max value for visual representation

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

  // Get current grade config for styling
  const gradeConfig = currentThreshold || GRADE_THRESHOLDS[0];

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
        
        {/* Progress fill with grade-specific gradient and glow */}
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full overflow-hidden ${gradeConfig.glow}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className={`h-full w-full bg-gradient-to-r ${gradeConfig.gradient} relative`}>
            {/* Shimmer effect with grade-specific speed */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ 
                duration: gradeConfig.shimmerSpeed, 
                repeat: Infinity, 
                ease: 'linear' 
              }}
            />
            
            {/* Pulse effect for higher grades */}
            {(currentGrade === 'Elite Creator' || currentGrade === 'Legend') && (
              <motion.div
                className="absolute inset-0 bg-white/10"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: 'easeInOut' 
                }}
              />
            )}
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