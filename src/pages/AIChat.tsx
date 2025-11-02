import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Bot, Send, Loader2, ArrowLeft } from 'lucide-react'; 
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hardcode the AI as verified for display purposes
  const isAIVerified = true; 

  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadOrCreateAIChat = async () => {
      try {
        // Fetch user's profile to get ai_chat_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('ai_chat_id')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        let currentChatId = profile?.ai_chat_id;

        if (!currentChatId) {
          // Create new AI chat
          const { data: newChat, error: chatError } = await supabase
            .from('chats')
            .insert({
              name: 'AfuAI Chat',
              is_group: false,
              created_by: user.id,
              user_id: user.id, // For personal chat
            })
            .select('id')
            .single();

          if (chatError) throw chatError;
          currentChatId = newChat.id;

          // Update profile with ai_chat_id
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ ai_chat_id: currentChatId })
            .eq('id', user.id);

          if (updateError) throw updateError;
        }

        setChatId(currentChatId);

        // Fetch messages for this chat
        const { data: dbMessages, error: msgError } = await supabase
          .from('messages')
          .select('id, role, content, created_at')
          .eq('chat_id', currentChatId)
          .order('created_at', { ascending: true });

        if (msgError) throw msgError;

        const mappedMessages: Message[] = (dbMessages || []).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }));

        if (mappedMessages.length === 0) {
          const welcomeMessage: Message = {
            role: 'assistant',
            content: "Hi! I'm AfuAI, your personal assistant. I can help you create posts, answer questions about AfuChat, or just chat! How can I help you today?",
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
          // Save welcome to DB
          await supabase.from('messages').insert({
            chat_id: currentChatId,
            role: 'assistant',
            content: welcomeMessage.content,
            created_at: welcomeMessage.timestamp.toISOString(),
            user_id: user.id,
            sender_id: user.id, // Assuming sender_id for assistant is user or null; adjust if needed
          });
        } else {
          setMessages(mappedMessages);
        }
      } catch (error) {
        console.error('Load AI chat error:', error);
        toast.error('Failed to load AI chat history');
      }
    };

    loadOrCreateAIChat();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveMessageToDb = async (msg: Message) => {
    if (!chatId) return;
    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      role: msg.role,
      content: msg.content,
      created_at: msg.timestamp.toISOString(),
      user_id: user?.id,
      sender_id: msg.role === 'user' ? user?.id : null, // Adjust for assistant
    });
    if (error) {
      console.error('Save message error:', error);
      toast.error('Failed to save message');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !chatId || !user) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    await saveMessageToDb(userMessage);

    // History for AI: last 5 local messages + new user message
    const historyForAI = messages
      .slice(-4) // Last 4 before new
      .map(m => ({ role: m.role, content: m.content }))
      .concat({ role: 'user' as const, content: userMessage.content });

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
            history: historyForAI,
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
      await saveMessageToDb(assistantMessage);
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

  if (!user) {
    return (
      <div className="flex flex-col h-screen bg-background justify-center items-center">
        <p className="text-muted-foreground">Please log in to chat with AfuAI.</p>
      </div>
    );
  }

  if (!chatId) {
    return (
      <div className="flex flex-col h-screen bg-background justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-2">Loading chat...</p>
      </div>
    );
  }

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
