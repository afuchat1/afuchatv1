import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Shield, ShieldOff, BadgeCheck, BadgeX, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getCountryFlag } from '@/lib/countryFlags';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface User {
  id: string;
  display_name: string;
  handle: string;
  phone_number: string | null;
  country: string | null;
  avatar_url: string | null;
  xp: number;
  acoin: number;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
}

interface AdminUserManagementProps {
  users: User[];
  onRefresh: () => void;
}

export function AdminUserManagement({ users, onRefresh }: AdminUserManagementProps) {
  const [confirmAction, setConfirmAction] = useState<{ type: string; userId: string; userName: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: string, userId: string) => {
    setLoading(true);
    try {
      switch (action) {
        case 'verify':
          await supabase.from('profiles').update({ is_verified: true }).eq('id', userId);
          toast.success('User verified successfully');
          break;
        case 'unverify':
          await supabase.from('profiles').update({ is_verified: false }).eq('id', userId);
          toast.success('User verification removed');
          break;
        case 'makeAdmin':
          await supabase.from('profiles').update({ is_admin: true }).eq('id', userId);
          await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' });
          toast.success('Admin privileges granted');
          break;
        case 'removeAdmin':
          await supabase.from('profiles').update({ is_admin: false }).eq('id', userId);
          await supabase.from('user_roles').delete().eq('user_id', userId);
          toast.success('Admin privileges removed');
          break;
        case 'delete':
          const { error } = await supabase.functions.invoke('delete-user-account', {
            body: { userId }
          });
          if (error) throw error;
          toast.success('User account deleted');
          break;
      }
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Handle</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Nexa</TableHead>
              <TableHead>ACoin</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{user.display_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate max-w-[100px]">{user.display_name || 'Unknown'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">@{user.handle}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{user.phone_number || '-'}</TableCell>
                <TableCell>
                  {user.country ? (
                    <span className="flex items-center gap-1">
                      <span>{getCountryFlag(user.country)}</span>
                      <span className="text-xs">{user.country}</span>
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell>{user.xp?.toLocaleString() || 0}</TableCell>
                <TableCell>{user.acoin?.toLocaleString() || 0}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.is_admin && <Badge variant="destructive" className="text-xs">Admin</Badge>}
                    {user.is_verified && <Badge className="text-xs bg-primary">Verified</Badge>}
                    {!user.is_admin && !user.is_verified && (
                      <Badge variant="secondary" className="text-xs">User</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user.is_verified ? (
                        <DropdownMenuItem onClick={() => handleAction('unverify', user.id)}>
                          <BadgeX className="h-4 w-4 mr-2" />
                          Remove Verification
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleAction('verify', user.id)}>
                          <BadgeCheck className="h-4 w-4 mr-2" />
                          Verify User
                        </DropdownMenuItem>
                      )}
                      {user.is_admin ? (
                        <DropdownMenuItem onClick={() => setConfirmAction({ type: 'removeAdmin', userId: user.id, userName: user.display_name })}>
                          <ShieldOff className="h-4 w-4 mr-2" />
                          Remove Admin
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => setConfirmAction({ type: 'makeAdmin', userId: user.id, userName: user.display_name })}>
                          <Shield className="h-4 w-4 mr-2" />
                          Make Admin
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => setConfirmAction({ type: 'delete', userId: user.id, userName: user.display_name })}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'delete' && `Are you sure you want to permanently delete ${confirmAction?.userName}'s account? This cannot be undone.`}
              {confirmAction?.type === 'makeAdmin' && `Are you sure you want to give ${confirmAction?.userName} admin privileges?`}
              {confirmAction?.type === 'removeAdmin' && `Are you sure you want to remove admin privileges from ${confirmAction?.userName}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmAction && handleAction(confirmAction.type, confirmAction.userId)}
              disabled={loading}
              className={confirmAction?.type === 'delete' ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              {loading ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
