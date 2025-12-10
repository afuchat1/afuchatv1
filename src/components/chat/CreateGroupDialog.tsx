import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Crown } from 'lucide-react';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (groupId: string) => void;
}

export const CreateGroupDialog = ({ isOpen, onClose, onGroupCreated }: CreateGroupDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isPremium } = usePremiumStatus();
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!isPremium) {
      toast.error('Premium required to create groups');
      navigate('/premium');
      onClose();
      return;
    }

    if (!user || !groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      // Create group chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          name: groupName.trim(),
          is_group: true,
          created_by: user.id,
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('chat_members')
        .insert({
          chat_id: chat.id,
          user_id: user.id,
          is_admin: true,
        });

      if (memberError) throw memberError;

      toast.success('Group created successfully');
      onGroupCreated(chat.id);
      setGroupName('');
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Create Group
            {!isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
          </DialogTitle>
          <DialogDescription>
            {isPremium 
              ? 'Create a new group chat to communicate with multiple people'
              : 'Premium subscription required to create groups'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleCreateGroup();
                }
              }}
              autoFocus
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            className="flex-1"
            disabled={loading || !groupName.trim()}
          >
            {loading ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};