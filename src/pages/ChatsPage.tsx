import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Chats from './Chats';
import NewChatDialog from '@/components/ui/NewChatDialog';
import Layout from '@/components/Layout';

const ChatsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const handleNewChat = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setIsChatModalOpen(true);
  };

  return (
    <Layout>
      <div className="relative">
        <Chats />

        {/* Floating Action Button */}
        <Button
          size="lg"
          onClick={handleNewChat}
          aria-label="Start new chat"
          className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 rounded-full shadow-2xl h-12 w-12 sm:h-14 sm:w-14 z-50"
        >
          <MessageSquarePlus className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>

        {user && (
          <NewChatDialog
            isOpen={isChatModalOpen}
            onClose={() => setIsChatModalOpen(false)}
          />
        )}
      </div>
    </Layout>
  );
};

export default ChatsPage;
