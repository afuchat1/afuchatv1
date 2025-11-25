import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Users } from 'lucide-react';
import { UserAvatar } from '@/components/avatar/UserAvatar';

interface GroupSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  isAdmin: boolean;
}

export const GroupSettingsSheet = ({ isOpen, onClose, chatId, isAdmin }: GroupSettingsSheetProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadGroupInfo();
    }
  }, [isOpen, chatId]);

  const loadGroupInfo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('name, description, avatar_url')
        .eq('id', chatId)
        .single();

      if (error) throw error;

      if (data) {
        setGroupName(data.name || '');
        setDescription(data.description || '');
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error loading group info:', error);
      toast.error('Failed to load group information');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error('Only group admins can edit group information');
      return;
    }

    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('chats')
        .update({
          name: groupName.trim(),
          description: description.trim() || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chatId);

      if (error) throw error;

      toast.success('Group information updated');
      onClose();
    } catch (error) {
      console.error('Error updating group info:', error);
      toast.error('Failed to update group information');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${chatId}-${Date.now()}.${fileExt}`;
      const filePath = `group-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success('Avatar uploaded');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[540px] p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Group Settings
          </SheetTitle>
          <SheetDescription>
            {isAdmin ? 'Edit group information' : 'View group information'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="px-6 py-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Group Avatar */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Group Avatar</Label>
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      userId={chatId}
                      avatarUrl={avatarUrl}
                      name={groupName}
                      size={80}
                    />
                    {isAdmin && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="gap-2"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4" />
                              Change Avatar
                            </>
                          )}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Group Name */}
                <div className="space-y-3">
                  <Label htmlFor="groupName" className="text-sm font-semibold">
                    Group Name
                  </Label>
                  <Input
                    id="groupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    disabled={!isAdmin}
                    maxLength={50}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    {groupName.length}/50 characters
                  </p>
                </div>

                {/* Group Description */}
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-semibold">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter group description (optional)"
                    disabled={!isAdmin}
                    maxLength={200}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {description.length}/200 characters
                  </p>
                </div>

                {isAdmin && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={onClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 h-12"
                      onClick={handleSave}
                      disabled={saving || !groupName.trim()}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
