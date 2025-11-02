import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Bot, Send, Loader2, ArrowLeft } from 'lucide-react'; 
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom'; // 🚨 ADDED useLocation

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 🚨 Define the structure for the expected state data
interface LocationState {
    context?: 'post_analysis';
    postDetails?: {
        postId: string;
        postContent: string;
        postAuthorHandle: string;
    };
}

const AIChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // 🚨 Hook to access state
  
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

  // Hardcode the AI as verified for display purposes
  const isAIVerified = true; 

  // --- EFFECT TO READ INCOMING POST DATA ---
  useEffect(() => {
    // 🚨 Safely cast and access the state object
    const state = location.state as LocationState;

    if (state?.context === 'post_analysis' && state.postDetails) {
        const { postContent, postAuthorHandle } = state.postDetails;
        
        // 1. Construct the message
        const initialPrompt = `Please analyze this post from @${postAuthorHandle}:\n\n"${postContent}"`;
        
        // 2. Set the message as the initial user input/message
        const initialUserMessage: Message = {
            role: 'user',
            content: initialPrompt,
            timestamp: new Date(),
        };

        // 3. Clear the state in the URL after reading it to prevent re-triggering
        // This is important for cleanup and a cleaner user experience
        navigate(location.pathname, { replace: true, state: {} });

        // 4. Send the message immediately (optional: you could just display it, but sending it starts the chat)
        setMessages(prev => [...prev, initialUserMessage]);
        
        // 5. Automatically trigger the AI response
        // We call a function (or copy the logic) to send this initial message
        handleInitialSend(initialPrompt, messages); 
    }
  }, []); // Run only on mount

  // Helper function to send the initial message immediately after detecting post data
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
                    // Use initial messages (including the system message) plus the new prompt
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

        // Add both the initial user prompt and the assistant response
        setMessages(prev => {
            // Check if the initial prompt is already the last message to avoid duplicates
            if (prev[prev.length - 1]?.content !== initialPrompt) {
                return [...prev, { role: 'user', content: initialPrompt, timestamp: new Date() }, assistantMessage];
            }
            // Otherwise, just append the assistant message
            return [...prev, assistantMessage];
        });
    } catch (error) {
        console.error('AI Chat error:', error);
        toast.error('Failed to get response from AfuAI for initial prompt');
    } finally {
        setLoading(false);
    }
  };
  // --- END EFFECT AND HANDLER ---


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
            history: messages.slice(-5), // Last 5 messages for context
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
  
  // Function to handle the navigation to the AI's profile
  const handleAIAvatarClick = () => {
    navigate('/profile/afuai'); 
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-4 flex items-center gap-3">
        {/* Back Button */}
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        {/* Clickable AI Profile Section */}
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
              {/* === X ORGANIZATION GOLD VERIFIED BADGE === */}
              {isAIVerified && (
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/archive/8/81/20230122072306!Twitter_Verified_Badge_Gold.svg" 
                  alt="Verified Organization" 
                  className="h-5 w-5" 
                  title="Verified AI Assistant"
                />
              )}
              {/* ======================================== */}
            </div>
            <p className="text-xs text-muted-foreground">Your AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Messages */}
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

      {/* Input */}
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
