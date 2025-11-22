import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Lock, Shield, Eye, EyeOff, UserX, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const SecuritySettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [privateAccount, setPrivateAccount] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showReadReceipts, setShowReadReceipts] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPrivacySettings();
    }
  }, [user]);

  const fetchPrivacySettings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('is_private, show_online_status, show_read_receipts')
      .eq('id', user.id)
      .single();

    if (data) {
      setPrivateAccount(data.is_private || false);
      setShowOnlineStatus(data.show_online_status ?? true);
      setShowReadReceipts(data.show_read_receipts ?? true);
    }
  };

  const handlePrivacyToggle = async (field: string, value: boolean) => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user.id);
      
      toast.success('Settings updated');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Failed to update settings');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Account Security</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => navigate('/change-password')}>
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your account password</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">Change</Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => navigate('/security')}>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Active Sessions</p>
                <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">View</Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Privacy Controls</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <UserX className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">Private Account</p>
              </div>
              <p className="text-sm text-muted-foreground">Only approved followers can see your posts</p>
            </div>
            <Switch
              checked={privateAccount}
              onCheckedChange={(checked) => {
                setPrivateAccount(checked);
                handlePrivacyToggle('is_private', checked);
              }}
            />
          </div>
          
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">Show Online Status</p>
              </div>
              <p className="text-sm text-muted-foreground">Let others see when you're online</p>
            </div>
            <Switch
              checked={showOnlineStatus}
              onCheckedChange={(checked) => {
                setShowOnlineStatus(checked);
                handlePrivacyToggle('show_online_status', checked);
              }}
            />
          </div>
          
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <EyeOff className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">Read Receipts</p>
              </div>
              <p className="text-sm text-muted-foreground">Show when you've read messages</p>
            </div>
            <Switch
              checked={showReadReceipts}
              onCheckedChange={(checked) => {
                setShowReadReceipts(checked);
                handlePrivacyToggle('show_read_receipts', checked);
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
