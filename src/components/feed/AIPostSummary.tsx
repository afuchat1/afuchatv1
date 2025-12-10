import { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { supabase } from '@/integrations/supabase/client';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { motion, AnimatePresence } from 'framer-motion';
import { categorizeContent, ContentCategory } from '@/lib/contentCategorization';

interface AIPostSummaryProps {
  postContent: string;
  postId: string;
}

// Categories that are worth summarizing
const SUMMARY_WORTHY_CATEGORIES: ContentCategory[] = ['news', 'technology', 'politics', 'business', 'sports'];

// Minimum confidence score to trigger auto-summary
const MIN_CONFIDENCE_THRESHOLD = 40;

// Minimum content length for summary consideration
const MIN_CONTENT_LENGTH = 200;

// Check if post content is worth summarizing based on AI analysis
const isWorthSummarizing = (content: string): boolean => {
  if (content.length < MIN_CONTENT_LENGTH) return false;
  
  const categories = categorizeContent(content);
  
  if (categories.length > 0) {
    const topCategory = categories[0];
    if (SUMMARY_WORTHY_CATEGORIES.includes(topCategory.category) && 
        topCategory.confidence >= MIN_CONFIDENCE_THRESHOLD) {
      return true;
    }
  }
  
  const informativePatterns = [
    /breaking:/i, /announced/i, /according to/i, /research shows/i,
    /study finds/i, /experts say/i, /official/i, /report/i,
    /update:/i, /important:/i, /\d+%/, /million|billion/i,
    /government/i, /launched/i, /released/i,
  ];
  
  const matchCount = informativePatterns.filter(pattern => pattern.test(content)).length;
  return matchCount >= 2;
};

export const AIPostSummary = ({ postContent, postId }: AIPostSummaryProps) => {
  const { isPremium } = usePremiumStatus();
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isPremium || checked) return;
    
    const worthSummarizing = isWorthSummarizing(postContent);
    setShouldShow(worthSummarizing);
    
    if (worthSummarizing) {
      checkAndGenerateSummary();
    }
    setChecked(true);
  }, [isPremium, postId]);

  const checkAndGenerateSummary = async () => {
    // First check if summary already exists in database
    const { data: existingSummary } = await supabase
      .from('post_ai_summaries')
      .select('summary')
      .eq('post_id', postId)
      .maybeSingle();
    
    if (existingSummary?.summary) {
      setSummary(existingSummary.summary);
      return;
    }
    
    // Generate new summary if not cached
    await generateSummary();
  };

  const generateSummary = async () => {
    if (loading || summary) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-with-afuai', {
        body: {
          message: `Summarize this social media post in 1-2 concise sentences. Focus on the main point or message:\n\n"${postContent}"`,
          context: 'post_summary'
        }
      });

      if (error) throw error;
      
      const generatedSummary = data?.reply || null;
      
      if (generatedSummary) {
        setSummary(generatedSummary);
        
        // Cache the summary in database
        await supabase
          .from('post_ai_summaries')
          .upsert({ post_id: postId, summary: generatedSummary }, { onConflict: 'post_id' });
      }
    } catch (error) {
      console.error('AI Summary error:', error);
      setShouldShow(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium || !shouldShow) return null;

  return (
    <div 
      className="mt-2 mx-0"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg border border-primary/20 overflow-hidden">
        <div 
          className="flex items-center justify-between px-3 py-2 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (summary) setExpanded(!expanded);
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">AfuAI Summary</span>
          </div>
          
          {summary && (
            expanded ? 
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : 
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-2">
                {loading ? (
                  <div className="flex items-center justify-center py-2">
                    <CustomLoader size="sm" />
                  </div>
                ) : summary ? (
                  <p className="text-xs text-foreground/90 leading-relaxed bg-background/50 rounded p-2">
                    {summary}
                  </p>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
