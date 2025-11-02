import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Bot, Send, Loader2, ArrowLeft } from 'lucide-react'; 
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

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
        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-afuai`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                },
                body: JSON.stringify({
                    message: initialPrompt,
                    history: [...currentMessages, { role: 'user', content: initialPrompt, timestamp: new Date() }].slice(-6), 
                }),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to get initial AI response');
        }

        const data = await response.json();
        
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

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-afuai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: userMessage.content,
            history: messages.slice(-5),
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
          return;
        }
        if (response.status === 402) {
          toast.error('AI service requires payment. Please add credits.');
          return;
        }
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
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


  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b border-border bg-card p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
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
              <Loader2 className="h-4 w-4 animate-spin" />
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
