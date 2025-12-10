import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Bot, Send, Copy, Check, History, PenSquare, 
  Paperclip, ChevronDown, ImagePlus, PencilLine, Newspaper, ArrowUp 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { PremiumGate } from '@/components/PremiumGate';
import { parseRichText } from '@/lib/richTextUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
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
  
  const AI_COMING_SOON = false;
  
  useEffect(() => {
    if (!user) {
      toast.error('Please log in to chat with AfuAI');
      navigate('/auth');
    } else {
      // Fetch user profile
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
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: '1', title: 'AfuChat Updates: Features, Growth, Innovat...', lastMessage: '', timestamp: new Date() },
    { id: '2', title: 'AfuChat: Social, E-commerce, AI Integration', lastMessage: '', timestamp: new Date() },
    { id: '3', title: 'AfuChat: New Social Platform Launch', lastMessage: '', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState('Auto');
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const models = ['Auto', 'AfuAI Pro', 'AfuAI Fast'];

  const quickActions = [
    { icon: ImagePlus, label: 'Create Images', action: () => setInput('Create an image of ') },
    { icon: PencilLine, label: 'Edit Image', action: () => setInput('Edit this image: ') },
    { icon: Newspaper, label: 'Latest News', action: () => handleQuickAction('What are the latest news and trends?') },
  ];

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

  const handleQuickAction = async (prompt: string) => {
    setInput(prompt);
    setShowChat(true);
    // Auto-send the message
    setTimeout(() => {
      const fakeEvent = { key: 'Enter', shiftKey: false };
      handleSendWithMessage(prompt);
    }, 100);
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
    setShowChat(true);

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
    setShowChat(false);
    setInput('');
  };

  const handleConversationClick = (conv: Conversation) => {
    setShowChat(true);
    setMessages([
      {
        role: 'assistant',
        content: `Continuing conversation: "${conv.title}"...\n\nHow can I help you today?`,
        timestamp: new Date(),
      }
    ]);
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

  if (AI_COMING_SOON) {
    return (
      <PremiumGate feature="AI Chat Assistant" showUpgrade={true}>
        <div className="flex flex-col h-screen bg-background items-center justify-center">
          <Bot className="h-16 w-16 text-primary mb-4" />
          <h2 className="text-xl font-bold">AI Features Coming Soon</h2>
        </div>
      </PremiumGate>
    );
  }

  return (
    <PremiumGate feature="AI Chat Assistant" showUpgrade={true}>
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback>{profile?.display_name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-[17px] font-medium">
                {selectedModel}
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {models.map((model) => (
                <DropdownMenuItem 
                  key={model} 
                  onClick={() => setSelectedModel(model)}
                  className="text-[15px]"
                >
                  {model}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <History className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={handleNewChat}>
              <PenSquare className="h-6 w-6" />
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {!showChat ? (
            /* Home View - Recent Conversations & Quick Actions */
            <div className="flex flex-col h-full justify-end p-4 pb-0">
              {/* Recent Conversations */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <History className="h-5 w-5" />
                  <span className="text-[15px]">Recent Conversations</span>
                </div>
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleConversationClick(conv)}
                      className="w-full text-left px-4 py-3 bg-card rounded-xl border border-border hover:bg-muted transition-colors"
                    >
                      <span className="text-[15px] text-foreground line-clamp-1">{conv.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Action Cards */}
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.action}
                    className="flex-shrink-0 flex flex-col items-start gap-2 px-4 py-3 bg-card rounded-xl border border-border hover:bg-muted transition-colors min-w-[140px]"
                  >
                    <action.icon className="h-6 w-6 text-muted-foreground" />
                    <span className="text-[15px] text-foreground">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat View */
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

        {/* Input Area */}
        <div className="p-4 pb-6">
          <div className="bg-card border border-border rounded-2xl px-4 py-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask anything"
              className="border-0 bg-transparent p-0 text-[17px] placeholder:text-muted-foreground focus-visible:ring-0 h-auto"
              disabled={loading}
            />
            <div className="flex items-center justify-between mt-3">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                size="icon"
                className="h-10 w-10 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-30"
              >
                <ArrowUp className="h-5 w-5 text-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PremiumGate>
  );
};

export default AIChat;