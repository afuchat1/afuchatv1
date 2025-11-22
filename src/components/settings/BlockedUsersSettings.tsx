import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserX, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BlockedUser {
  id: string;
  blocked_id: string;
  blocked_at: string;
  profiles: {
    display_name: string;
    handle: string;
    avatar_url: string | null;
  };
}

export const BlockedUsersSettings = () => {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null);

  useEffect(() => {
    if (user) {
      fetchBlockedUsers();
    }
  }, [user]);

  const fetchBlockedUsers = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          id,
          blocked_id,
          blocked_at,
          blocked_profile:profiles!blocked_users_blocked_id_fkey (
            display_name,
            handle,
            avatar_url
          )
        `)
        .eq('blocker_id', user.id)
        .order('blocked_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        ...item,
        profiles: item.blocked_profile
      }));
      
      setBlockedUsers(transformedData as any);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      toast.error('Failed to load blocked users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!selectedUser) return;

    setUnblockingUserId(selectedUser.blocked_id);
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('id', selectedUser.id);

      if (error) throw error;

      setBlockedUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      toast.success('User unblocked successfully');
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    } finally {
      setUnblockingUserId(null);
      setShowUnblockConfirm(false);
      setSelectedUser(null);
    }
  };

  const filteredUsers = blockedUsers.filter(blockedUser =>
    blockedUser.profiles.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blockedUser.profiles.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UserX className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Blocked Users</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Blocked users cannot send you messages, view your posts, or interact with you
        </p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search blocked users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No blocked users found' : 'You haven\'t blocked anyone'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((blockedUser) => (
              <div
                key={blockedUser.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={blockedUser.profiles.avatar_url || undefined} />
                    <AvatarFallback>
                      {blockedUser.profiles.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{blockedUser.profiles.display_name}</p>
                    <p className="text-sm text-muted-foreground">@{blockedUser.profiles.handle}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Blocked {new Date(blockedUser.blocked_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(blockedUser);
                    setShowUnblockConfirm(true);
                  }}
                  disabled={unblockingUserId === blockedUser.blocked_id}
                >
                  {unblockingUserId === blockedUser.blocked_id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Unblocking...
                    </>
                  ) : (
                    'Unblock'
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="space-y-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">What happens when you block someone:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>They can't see your posts or profile</li>
            <li>They can't send you messages or chat requests</li>
            <li>They can't see your comments or replies</li>
            <li>You won't see their posts or activity</li>
            <li>Existing conversations will be hidden</li>
          </ul>
        </div>
      </Card>

      <AlertDialog open={showUnblockConfirm} onOpenChange={setShowUnblockConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock {selectedUser?.profiles.display_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This user will be able to see your posts, send you messages, and interact with your content again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUser(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblock}>Unblock</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
