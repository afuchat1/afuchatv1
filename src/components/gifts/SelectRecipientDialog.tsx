import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Loader2 } from 'lucide-react';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { BusinessBadge } from '@/components/BusinessBadge';
import { AffiliatedBadge } from '@/components/AffiliatedBadge';

interface Profile {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_organization_verified: boolean;
  is_business_mode: boolean;
  affiliated_business_id: string | null;
}

interface SelectRecipientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRecipient: (recipient: { id: string; name: string }) => void;
}

export const SelectRecipientDialog = ({
  open,
  onOpenChange,
  onSelectRecipient,
}: SelectRecipientDialogProps) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSuggestedProfiles();
    } else {
      setSearch('');
      setProfiles([]);
    }
  }, [open]);

  useEffect(() => {
    if (search.length > 0) {
      searchProfiles();
    } else if (open) {
      fetchSuggestedProfiles();
    }
  }, [search]);

  const fetchSuggestedProfiles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Get users that the current user follows
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .limit(10);

      if (followingData && followingData.length > 0) {
        const followingIds = followingData.map(f => f.following_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', followingIds)
          .neq('id', user.id)
          .limit(10);

        setProfiles(profilesData || []);
      } else {
        // If not following anyone, show recent profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        setProfiles(profilesData || []);
      }
    } catch (error) {
      console.error('Error fetching suggested profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchProfiles = async () => {
    if (!user || search.length === 0) return;

    try {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .or(`handle.ilike.%${search}%,display_name.ilike.%${search}%`)
        .limit(20);

      setProfiles(data || []);
    } catch (error) {
      console.error('Error searching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfile = (profile: Profile) => {
    onSelectRecipient({
      id: profile.id,
      name: profile.display_name,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Recipient</DialogTitle>
          <DialogDescription>
            Choose someone to send this gift to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or handle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {search ? 'No users found' : 'No suggestions available'}
              </div>
            ) : (
              profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {profile.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold truncate text-sm">
                        {profile.display_name}
                      </p>
                      {profile.is_verified && <VerifiedBadge size="sm" />}
                      {profile.is_organization_verified && <BusinessBadge size="sm" />}
                      {profile.affiliated_business_id && <AffiliatedBadge size="sm" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      @{profile.handle}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
