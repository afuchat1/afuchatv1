import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { PremiumGate } from '@/components/PremiumGate';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PostDetails {
    postId: string;
    postContent: string;
    postAuthorHandle: string;
}

interface LocationState {
    context?: 'post_analysis';
    postDetails?: PostDetails;
}

const AIChat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // AI Features under development - temporarily disabled
  const AI_COMING_SOON = true;
  
  useEffect(() => {
    if (!user) {
      toast.error('Please log in to chat with AfuAI');
      navigate('/auth');
    }
  }, [user, navigate]);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm AfuAI, your personal assistant. I can help you create posts, answer questions about AfuChat, or just chat! How can I help you today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAIVerified = true;

  const handleInitialSend = async (initialPrompt: string, currentMessages: Message[]) => {
    setLoading(true);

    try {
        const { data, error } = await supabase.functions.invoke('chat-with-afuai', {
            body: {
                message: initialPrompt,
                history: [...currentMessages, { role: 'user', content: initialPrompt, timestamp: new Date() }].slice(-6), 
            }
        });

        if (error) {
          console.error('Edge function error:', error);
          
          // Get error message from various possible sources
          const errorMsg = error.message || JSON.stringify(error);
          
        // Check for payment required error (402)
        if (errorMsg.includes('402') || errorMsg.includes('Payment required') || errorMsg.includes('API_KEY')) {
          toast.error('Invalid or exhausted Gemini API key. Please check your API key configuration.', {
            duration: 6000,
          });
          return;
        }
          
        // Check for rate limit error (429)
        if (errorMsg.includes('429') || errorMsg.includes('Rate limit')) {
          toast.error('Gemini API quota exhausted. The free tier limit has been reached. Please upgrade your Gemini API plan or wait for quota reset.', {
            duration: 6000,
          });
          return;
        }
          
          throw error;
        }
        
        const assistantMessage: Message = {
            role: 'assistant',
            content: data.reply,
            timestamp: new Date(),
        };

        setMessages(prev => {
            if (prev[prev.length - 1]?.content !== initialPrompt) {
                return [...prev, { role: 'user', content: initialPrompt, timestamp: new Date() }, assistantMessage];
            }
            return [...prev, assistantMessage];
        });
    } catch (error) {
        console.error('AI Chat error:', error);
        toast.error('Failed to get response from AfuAI for initial prompt');
    } finally {
        setLoading(false);
    }
  };


  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    if (!user) {
      toast.error('You must be logged in to chat');
      return;
    }

    console.log('Sending message:', input.trim());

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      console.log('Invoking chat-with-afuai function...');
      const { data, error } = await supabase.functions.invoke('chat-with-afuai', {
        body: {
          message: userMessage.content,
          history: messages.slice(-5),
        }
      });

      console.log('Response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        
        // Get error message from various possible sources
        const errorMsg = error.message || JSON.stringify(error);
        
        // Check for payment required error (402)
        if (errorMsg.includes('402') || errorMsg.includes('Payment required') || errorMsg.includes('API_KEY')) {
          toast.error('Invalid or exhausted Gemini API key. Please check your API key configuration.', {
            duration: 6000,
          });
          return;
        }
        
        // Check for rate limit error (429)
        if (errorMsg.includes('429') || errorMsg.includes('Rate limit')) {
          toast.error('Gemini API quota exhausted. The free tier limit has been reached. Please upgrade your Gemini API plan or wait for quota reset.', {
            duration: 6000,
          });
          return;
        }
        
        throw error;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat error:', error);
      toast.error('Failed to get response from AfuAI');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAIAvatarClick = () => {
    navigate('/profile/afuai'); 
  };

  useEffect(() => {
    const state = location.state as LocationState;

    if (state?.context === 'post_analysis' && state.postDetails) {
        const { postContent, postAuthorHandle } = state.postDetails;
        
        const initialPrompt = `Please analyze this post from @${postAuthorHandle}:\n\n"${postContent}"`;
        
        navigate(location.pathname, { replace: true, state: {} });

        handleInitialSend(initialPrompt, messages); 
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  if (AI_COMING_SOON) {
    return (
      <PremiumGate feature="AI Chat Assistant" showUpgrade={true}>
      <div className="flex flex-col h-screen bg-background">
        <div className="border-b border-border bg-card p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">AfuAI</h1>
              <p className="text-xs text-muted-foreground">AI Assistant</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-md w-full p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-10 w-10 text-primary" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">AI Features Coming Soon</h2>
              <p className="text-muted-foreground">
                We're working hard to bring you amazing AI-powered features. Stay tuned!
              </p>
            </div>

            <Badge variant="secondary" className="text-sm px-4 py-2">
              Under Development
            </Badge>

            <Button 
              onClick={() => navigate(-1)} 
              variant="outline"
              className="w-full"
            >
              Go Back
            </Button>
          </Card>
        </div>
      </div>
      </PremiumGate>
    );
  }

  return (
    <PremiumGate feature="AI Chat Assistant" showUpgrade={true}>
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b border-border bg-card p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hidden lg:inline-flex">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
          onClick={handleAIAvatarClick} 
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h1 className="font-bold text-foreground">AfuAI</h1>
              {isAIVerified && (
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/archive/8/81/20230122072306!Twitter_Verified_Badge_Gold.svg" 
                  alt="Verified Organization" 
                  className="h-5 w-5" 
                  title="Verified AI Assistant"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">Your AI Assistant</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card
              className={`max-w-[80%] p-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border-border'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </Card>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] p-3 bg-card border-border">
              <Skeleton className="h-4 w-32" />
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border bg-card p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Message AfuAI..."
            className="flex-1"
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="rounded-full"
            size="icon"
          >
            {loading ? <Send className="h-4 w-4 opacity-50" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
    </PremiumGate>
  );
};

export default AIChat;
