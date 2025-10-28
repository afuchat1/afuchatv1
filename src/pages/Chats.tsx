import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';

interface Chat {
  id: string;
  name: string | null;
  is_group: boolean;
  updated_at: string;
}

const Chats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      const { data: chatMembers } = await supabase
        .from('chat_members')
        .select('chat_id, chats(id, name, is_group, updated_at)')
        .eq('user_id', user.id);

      if (chatMembers) {
        const chatsData = chatMembers
          .map((member: any) => member.chats)
          .filter(Boolean);
        setChats(chatsData);
      }
      setLoading(false);
    };

    fetchChats();

    // Subscribe to new messages for real-time updates
    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-bold">Chats</h1>
        <Button size="icon" variant="ghost">
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-muted-foreground mb-2">No chats yet</p>
            <p className="text-sm text-muted-foreground">
              Start a conversation to see it here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {chats.map((chat) => (
              <Card
                key={chat.id}
                className="p-4 border-0 rounded-none hover:bg-muted cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {chat.name || 'Direct Message'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {chat.is_group ? 'Group' : '1:1'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;