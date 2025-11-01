import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MessageSquare, TrendingUp, Activity, ArrowLeft, UserCheck, Shield, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface Stats {
  totalUsers: number;
  totalMessages: number;
  totalChats: number;
  activeToday: number;
  messagesLast7Days: { date: string; count: number }[];
  messagesLast30Days: { date: string; count: number }[];
}

interface User {
  id: string;
  display_name: string;
  handle: string;
  is_verified?: boolean;
  is_organization_verified?: boolean;
  is_admin?: boolean;
  created_at: string;
}

interface Post {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'posts'>('stats');

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      // Fallback to direct query for reliability (no RPC needed)
      const { data, error: queryError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (queryError) throw queryError;
      if (!data || data.role !== 'admin') {
        toast.error('Access denied: Admin privileges required');
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await fetchAllData();
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error('Failed to verify admin access');
      navigate('/');
    }
  };

  const fetchAllData = async () => {
    await Promise.all([fetchStats(), fetchUsers(), fetchPosts()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      // Fetch user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch message count
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      // Fetch chat count
      const { count: chatCount } = await supabase
        .from('chats')
        .select('*', { count: 'exact', head: true });

      // Fetch active users today (including new joins)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      
      const { count: activeCount, error: activeError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .or(`last_seen.gte.${todayISO},created_at.gte.${todayISO}`);

      if (activeError) throw activeError;
      const activeTodayCount = activeCount || 0;

      // Fetch messages for last 7 days
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      
      const { data: messages7Days, error: err7 } = await supabase
        .from('messages')
        .select('sent_at')
        .gte('sent_at', last7Days.toISOString());

      if (err7) throw err7;

      // Fetch messages for last 30 days
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      
      const { data: messages30Days, error: err30 } = await supabase
        .from('messages')
        .select('sent_at')
        .gte('sent_at', last30Days.toISOString());

      if (err30) throw err30;

      // Group messages by day and sort descending (newest first)
      const groupByDay = (messages: any[]) => {
        const groups: { [key: string]: number } = {};
        messages?.forEach(msg => {
          const date = new Date(msg.sent_at).toLocaleDateString();
          groups[date] = (groups[date] || 0) + 1;
        });
        return Object.entries(groups)
          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())  // Descending
          .map(([date, count]) => ({ date, count }));
      };

      setStats({
        totalUsers: userCount || 0,
        totalMessages: messageCount || 0,
        totalChats: chatCount || 0,
        activeToday: activeTodayCount,
        messagesLast7Days: groupByDay(messages7Days || []),
        messagesLast30Days: groupByDay(messages30Days || [])
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: userData, error } = await supabase
        .from('profiles')
        .select(`
          id, display_name, handle, is_verified, is_organization_verified, created_at,
          user_roles(role)
        `);

      if (error) throw error;

      setUsers(
        (userData || []).map((u: any) => ({
          ...u,
          is_admin: u.user_roles?.role === 'admin',
        }))
      );
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchPosts = async () => {
    try {
      const { data: postData, error } = await supabase
        .from('posts')
        .select('id, content, author_id, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(postData || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    }
  };

  const toggleVerification = async (userId: string, type: 'is_verified' | 'is_organization_verified', value: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ [type]: value })
      .eq('id', userId);

    if (error) {
      toast.error(`Failed to ${value ? 'verify' : 'unverify'}`);
    } else {
      toast.success(`${value ? 'Verified' : 'Unverified'}!`);
      fetchUsers(); // Refresh
    }
  };

  const toggleAdminRole = async (userId: string, value: boolean) => {
    if (value) {
      // Promote to admin
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: 'admin' });
      if (error) {
        toast.error('Failed to promote admin');
      } else {
        toast.success('Promoted to admin!');
        fetchUsers();
      }
    } else {
      // Demote (set to 'user')
      if (confirm('Demote this user from admin?')) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: 'user' })
          .eq('user_id', userId);
        if (error) {
          toast.error('Failed to demote admin');
        } else {
          toast.success('Demoted from admin!');
          fetchUsers();
        }
      }
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Post deleted');
      fetchPosts();
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-6xl mx-auto">
        <Skeleton className="h-12 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Monitor platform performance and manage users/posts</p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats?.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Registered accounts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats?.totalMessages}</div>
                  <p className="text-xs text-muted-foreground">All-time messages</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats?.totalChats}</div>
                  <p className="text-xs text-muted-foreground">Active conversations</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats?.activeToday}</div>
                  <p className="text-xs text-muted-foreground">Users online today</p>
                </CardContent>
              </Card>
            </div>

            {/* Activity Timeline */}
            <Tabs defaultValue="7days" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="7days">Last 7 Days</TabsTrigger>
                <TabsTrigger value="30days">Last 30 Days</TabsTrigger>
              </TabsList>
              
              <TabsContent value="7days">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Message Activity - Last 7 Days</CardTitle>
                    <CardDescription>Daily message count over the past week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats?.messagesLast7Days.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No messages in the last 7 days</p>
                    ) : (
                      <div className="space-y-2">
                        {stats?.messagesLast7Days.map(({ date, count }) => (
                          <div key={date} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium text-foreground">{date}</span>
                            <Badge variant="secondary">{count} messages</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="30days">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Message Activity - Last 30 Days</CardTitle>
                    <CardDescription>Daily message count over the past month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats?.messagesLast30Days.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No messages in the last 30 days</p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {stats?.messagesLast30Days.map(({ date, count }) => (
                          <div key={date} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium text-foreground">{date}</span>
                            <Badge variant="secondary">{count} messages</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Manage Users</CardTitle>
                <CardDescription>View and moderate user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Handle</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.display_name}</TableCell>
                        <TableCell>@{u.handle}</TableCell>
                        <TableCell>{formatDate(u.created_at)}</TableCell>
                        <TableCell>
                          {u.is_admin && <Badge variant="secondary" className="mr-1">Admin</Badge>}
                          {u.is_verified && <Badge variant="default" className="mr-1">Verified</Badge>}
                          {u.is_organization_verified && <Badge variant="outline">Org</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleVerification(u.id, 'is_verified', !u.is_verified)}
                            >
                              {u.is_verified ? <Edit className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                              {u.is_verified ? 'Unverify' : 'Verify'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleVerification(u.id, 'is_organization_verified', !u.is_organization_verified)}
                            >
                              {u.is_organization_verified ? <Edit className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                              {u.is_organization_verified ? 'Org Unverify' : 'Org Verify'}
                            </Button>
                            <Button
                              size="sm"
                              variant={u.is_admin ? "destructive" : "secondary"}
                              onClick={() => toggleAdminRole(u.id, !u.is_admin)}
                            >
                              {u.is_admin ? <Edit className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                              {u.is_admin ? 'Demote Admin' : 'Promote Admin'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
                <CardDescription>Moderate recent user posts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Author ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="max-w-xs truncate">{p.content}</TableCell>
                        <TableCell className="font-mono text-xs">{p.author_id.slice(0, 8)}...</TableCell>
                        <TableCell>{formatDate(p.created_at)}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => deletePost(p.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {posts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No posts found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
