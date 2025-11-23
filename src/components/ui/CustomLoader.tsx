import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CustomLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const CustomLoader = ({ size = 'md', className, text }: CustomLoaderProps) => {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const containerSizes = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3'
  };

  const dotVariants = {
    initial: { y: 0, opacity: 0.4 },
    animate: { 
      y: [-8, 0, -8],
      opacity: [0.4, 1, 0.4]
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className={cn('flex items-center', containerSizes[size])}>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={cn(
              'rounded-full bg-primary',
              sizes[size]
            )}
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.25
            }}
          />
        ))}
      </div>
      {text && (
        <motion.p
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export const PageLoader = ({ text = 'Loading...' }: { text?: string }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <CustomLoader size="lg" text={text} />
    </div>
  );
};

export const InlineLoader = ({ text }: { text?: string }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <CustomLoader size="md" text={text} />
    </div>
  );
};
