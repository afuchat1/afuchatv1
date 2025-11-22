import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
import { Separator } from '@/components/ui/separator';

export const DataPrivacySettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDownloadingData, setIsDownloadingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleDownloadData = async () => {
    if (!user) {
      toast.error('You must be signed in to download your data');
      return;
    }

    setIsDownloadingData(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please sign in again.');
        return;
      }

      const response = await fetch(
        'https://rhnsjqqtdzlkvqazfcbg.supabase.co/functions/v1/export-user-data',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `afuchat-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Your data has been downloaded successfully!');
    } catch (error) {
      console.error('Error downloading data:', error);
      toast.error('Failed to download data. Please try again.');
    } finally {
      setIsDownloadingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error('You must be signed in');
      return;
    }

    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please sign in again.');
        return;
      }

      const response = await fetch(
        'https://rhnsjqqtdzlkvqazfcbg.supabase.co/functions/v1/delete-user-account',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      toast.success('Account deleted successfully');
      
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again.');
      setIsDeletingAccount(false);
      setDeleteConfirmText('');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Download Your Data</h3>
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground mb-4">
              Export all your data including posts, messages, and activity
            </p>
            <Button
              variant="outline"
              onClick={handleDownloadData}
              disabled={isDownloadingData}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloadingData ? 'Preparing...' : 'Download Data'}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground p-4 bg-muted/50 rounded-lg">
            <p className="font-medium mb-2">What's included:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Profile information</li>
              <li>Posts and replies</li>
              <li>Messages from your chats</li>
              <li>Followers and following</li>
              <li>Tips and gifts sent/received</li>
              <li>Achievements and activity log</li>
              <li>Game scores and shop purchases</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Data Rights</h3>
        </div>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Access your personal data</li>
            <li>Request data correction</li>
            <li>Request data deletion</li>
            <li>Export your data in portable format</li>
            <li>Object to data processing</li>
          </ul>
        </div>
      </Card>

      <Separator className="my-8" />

      <Card className="p-6 border-destructive/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold text-destructive">Danger Zone</h3>
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <p className="font-semibold mb-2 text-destructive">Delete Account</p>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete My Account
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>This will permanently delete your account and all associated data including:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Your profile and posts</li>
                <li>All messages and chats</li>
                <li>Followers and following</li>
                <li>Tips, gifts, and purchases</li>
              </ul>
              <p className="font-semibold text-destructive">This action cannot be undone!</p>
              <div className="space-y-2">
                <p className="text-sm">Type <strong>DELETE</strong> to confirm:</p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="font-mono"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
