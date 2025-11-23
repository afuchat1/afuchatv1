import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CustomLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const CustomLoader = ({ size = 'md', className, text }: CustomLoaderProps) => {
  const sizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const containerSizes = {
    sm: 'gap-1.5',
    md: 'gap-2.5',
    lg: 'gap-3'
  };

  const dotVariants = {
    initial: { y: 0, scale: 0.8, opacity: 0.3 },
    animate: { 
      y: [-12, 0, -12],
      scale: [0.8, 1.2, 0.8],
      opacity: [0.3, 1, 0.3]
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className={cn('flex items-center', containerSizes[size])}>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={cn(
              'rounded-full bg-gradient-to-br from-primary via-primary to-accent shadow-lg shadow-primary/50',
              sizes[size]
            )}
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1],
              delay: index * 0.15
            }}
          />
        ))}
      </div>
      {text && (
        <motion.p
          className="text-sm font-medium text-muted-foreground"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export const PageLoader = ({ text = 'Loading...' }: { text?: string }) => {
  return (
    <motion.div 
      className="flex min-h-screen items-center justify-center bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <CustomLoader size="lg" text={text} />
    </motion.div>
  );
};

export const InlineLoader = ({ text }: { text?: string }) => {
  return (
    <motion.div 
      className="flex items-center justify-center py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <CustomLoader size="md" text={text} />
    </motion.div>
  );
};
