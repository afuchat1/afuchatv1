import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Bot, Copy, Check, PenSquare, ArrowUp, History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { PremiumGate } from '@/components/PremiumGate';
import { parseRichText } from '@/lib/richTextUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileDrawer } from '@/components/ProfileDrawer';

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
  const [profile, setProfile] = useState<{ avatar_url: string | null; display_name: string } | null>(null);
  
  useEffect(() => {
    if (!user) {
      toast.error('Please log in to chat with AfuAI');
      navigate('/auth');
    } else {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url, display_name')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      };
      fetchProfile();
    }
  }, [user, navigate]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = async (content: string, messageIndex: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageIndex);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleSendWithMessage = async (messageText: string) => {
    if (!messageText.trim() || loading) return;
    
    if (!user) {
      toast.error('You must be logged in to chat');
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-afuai', {
        body: {
          message: userMessage.content,
          history: messages.slice(-5),
        }
      });

      if (error) {
        const errorMsg = error.message || JSON.stringify(error);
        
        if (errorMsg.includes('402') || errorMsg.includes('Payment required')) {
          toast.error('API quota exhausted. Please try again later.');
          return;
        }
        
        if (errorMsg.includes('429') || errorMsg.includes('Rate limit')) {
          toast.error('Rate limit exceeded. Please wait a moment.');
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

  const handleSend = async () => {
    await handleSendWithMessage(input);
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  };

  useEffect(() => {
    const state = location.state as LocationState;

    if (state?.context === 'post_analysis' && state.postDetails) {
      const { postContent, postAuthorHandle } = state.postDetails;
      const initialPrompt = `Please analyze this post from @${postAuthorHandle}:\n\n"${postContent}"`;
      navigate(location.pathname, { replace: true, state: {} });
      handleSendWithMessage(initialPrompt);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <PremiumGate feature="AI Chat Assistant" showUpgrade={true}>
      <div className="flex flex-col h-full bg-background relative">
        {/* Header - Fixed at top */}
        <header className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-3 border-b border-border bg-background z-40">
          <ProfileDrawer
            trigger={
              <button className="flex-shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback>{profile?.display_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
              </button>
            }
          />
          
          <div className="flex items-center gap-1">
            <Bot className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">AfuAI</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <History className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={handleNewChat}>
              <PenSquare className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Chat Messages Area - Scrollable with padding for fixed header and input */}
        <div className="flex-1 overflow-y-auto pt-16 pb-16">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">How can I help you today?</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Ask me anything about AfuChat, get help with features, or just have a conversation.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card
                    className={`max-w-[85%] p-3 relative group ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border-border'
                    }`}
                  >
                    <div className="text-[15px] whitespace-pre-wrap select-text leading-[22px]">
                      {parseRichText(msg.content)}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[13px] opacity-70">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {msg.role === 'assistant' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopy(msg.content, idx)}
                        >
                          {copiedId === idx ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <Card className="max-w-[85%] p-3 bg-card border-border">
                    <Skeleton className="h-5 w-40" />
                  </Card>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Fixed above bottom nav */}
        <div className="fixed bottom-14 left-0 right-0 px-3 py-2 bg-background z-40">
          <div className="flex items-end gap-2 bg-card border border-border rounded-full px-4 py-2 max-w-lg mx-auto lg:max-w-none">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message AfuAI..."
              className="border-0 bg-transparent p-0 text-[15px] placeholder:text-muted-foreground focus-visible:ring-0 resize-none min-h-[24px] max-h-[100px] flex-1"
              disabled={loading}
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              size="icon"
              className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-30 flex-shrink-0"
            >
              <ArrowUp className="h-4 w-4 text-primary-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </PremiumGate>
  );
};

export default AIChat;
