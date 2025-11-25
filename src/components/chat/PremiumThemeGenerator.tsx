import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface PremiumThemeGeneratorProps {
  type: 'theme' | 'wallpaper';
  onGenerated: () => void;
}

export const PremiumThemeGenerator = ({ type, onGenerated }: PremiumThemeGeneratorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const AI_FEATURES_COMING_SOON = true;

  const handleGenerate = async () => {
    if (AI_FEATURES_COMING_SOON) {
      toast.info('AI theme generation coming soon!');
      return;
    }
    
    if (!prompt.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-chat-theme', {
        body: { type, prompt: prompt.trim() }
      });

      if (error) {
        if (error.message?.includes('403') || error.message?.includes('Premium')) {
          toast.error('Premium subscription required');
        } else {
          toast.error('Failed to generate. Please try again.');
        }
        return;
      }

      toast.success(`${type === 'theme' ? 'Theme' : 'Wallpaper'} generated successfully!`);
      setIsOpen(false);
      setPrompt('');
      onGenerated();
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Generate AI {type === 'theme' ? 'Theme' : 'Wallpaper'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] bg-background/95 backdrop-blur-xl border-t border-border/50 rounded-t-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Generate AI {type === 'theme' ? 'Theme' : 'Wallpaper'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Describe your perfect chat {type} and let AI create it for you
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder={type === 'theme' ? 
                'E.g., Sunset orange and purple vibes' : 
                'E.g., Starry night sky with cosmic clouds'
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={generating}
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={generating || !prompt.trim()}
            className="w-full h-12 rounded-xl font-semibold"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};