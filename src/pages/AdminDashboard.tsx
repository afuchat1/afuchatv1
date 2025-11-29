import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MessageSquare, Package, Activity, ArrowLeft, Shield, Gift, Coins, TrendingUp, Database, Globe, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { getCountryFlag } from '@/lib/countryFlags';

interface DashboardStats {
  totalUsers: number;
  totalMessages: number;
  totalChats: number;
  totalPosts: number;
  totalGiftTransactions: number;
  totalAcoinTransactions: number;
  totalPremiumUsers: number;
  totalVerifiedUsers: number;
  totalStories: number;
  totalGroups: number;
}

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAdminPrivileges, setHasAdminPrivileges] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Detailed data states
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [giftTransactions, setGiftTransactions] = useState<any[]>([]);
  const [acoinTransactions, setAcoinTransactions] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      checkAdminStatusAndLoadData(user.id);
    } else {
      setLoading(false);
      setHasAdminPrivileges(false);
    }
  }, [authLoading, user]);

  const checkAdminStatusAndLoadData = async (userId: string) => {
    try {
      // Check admin status
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const isAdmin = data?.role === 'admin';
      setHasAdminPrivileges(isAdmin);

      if (isAdmin) {
        await Promise.all([
          fetchStats(),
          fetchUsers(),
          fetchMessages(),
          fetchChats(),
          fetchPosts(),
          fetchGiftTransactions(),
          fetchAcoinTransactions(),
          fetchSubscriptions(),
          fetchStories(),
        ]);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [
        usersCount,
        messagesCount,
        chatsCount,
        postsCount,
        giftsCount,
        acoinsCount,
        premiumCount,
        verifiedCount,
        storiesCount,
        groupsCount,
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('chats').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('gift_transactions').select('*', { count: 'exact', head: true }),
        supabase.from('acoin_transactions').select('*', { count: 'exact', head: true }),
        supabase.from('subscription_plans').select('user_id', { count: 'exact', head: true }).not('expires_at', 'lt', new Date().toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('stories').select('*', { count: 'exact', head: true }),
        supabase.from('chats').select('*', { count: 'exact', head: true }).eq('is_group', true),
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalMessages: messagesCount.count || 0,
        totalChats: chatsCount.count || 0,
        totalPosts: postsCount.count || 0,
        totalGiftTransactions: giftsCount.count || 0,
        totalAcoinTransactions: acoinsCount.count || 0,
        totalPremiumUsers: premiumCount.count || 0,
        totalVerifiedUsers: verifiedCount.count || 0,
        totalStories: storiesCount.count || 0,
        totalGroups: groupsCount.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, handle, phone_number, country, avatar_url, xp, acoin, is_verified, is_admin, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, encrypted_content, sender_id, chat_id, sent_at, profiles!messages_sender_id_fkey(display_name, handle)')
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('id, name, is_group, created_at, created_by, profiles!chats_created_by_fkey(display_name, handle)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, content, author_id, view_count, created_at, profiles!posts_author_id_fkey(display_name, handle)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchGiftTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('gift_transactions')
        .select('id, gift_id, sender_id, receiver_id, xp_cost, message, created_at, gifts(name, emoji)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setGiftTransactions(data || []);
    } catch (error) {
      console.error('Error fetching gift transactions:', error);
    }
  };

  const fetchAcoinTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('acoin_transactions')
        .select('id, user_id, transaction_type, amount, created_at, profiles(display_name, handle)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAcoinTransactions(data || []);
    } catch (error) {
      console.error('Error fetching acoin transactions:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, user_id, plan_name, price, starts_at, expires_at, profiles(display_name, handle)')
        .not('expires_at', 'lt', new Date().toISOString())
        .order('starts_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('id, user_id, media_type, view_count, created_at, expires_at, profiles(display_name, handle)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleString();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!user || !hasAdminPrivileges) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center pt-20">
        <div className="w-full max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          
          <Card className="border-l-4 border-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-red-500" />
                Access Restricted
              </CardTitle>
              <CardDescription>
                {!user 
                  ? 'You must be logged in to view this page.'
                  : 'Your account does not have administrator privileges.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user && (
                <Button onClick={() => navigate('/auth')}>
                  Go to Login
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Complete platform overview and management</p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/business-dashboard')}
            className="gap-2"
          >
            <Briefcase className="h-4 w-4" />
            Business Dashboard
          </Button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalVerifiedUsers} verified
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMessages}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalChats} chats
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPosts}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalStories} stories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Gift Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalGiftTransactions}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  ACoin Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAcoinTransactions}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalPremiumUsers} premium
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Data Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2 h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="chats">Chats</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="gifts">Gifts</TabsTrigger>
            <TabsTrigger value="acoin">ACoin</TabsTrigger>
            <TabsTrigger value="subscriptions">Premium</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Activity Overview</CardTitle>
                <CardDescription>Real-time statistics across all features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">Groups</p>
                        <p className="text-sm text-muted-foreground">Active group chats</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{stats?.totalGroups || 0}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">Stories</p>
                        <p className="text-sm text-muted-foreground">Active stories</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{stats?.totalStories || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Users ({users.length})</CardTitle>
                <CardDescription>All registered platform users with complete data</CardDescription>
              </CardHeader>
              <CardContent>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.display_name}</TableCell>
                          <TableCell>@{user.handle}</TableCell>
                          <TableCell>{user.phone_number || 'N/A'}</TableCell>
                          <TableCell>
                            {user.country ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-lg">{getCountryFlag(user.country)}</span>
                                <span>{user.country}</span>
                              </div>
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell>{user.xp}</TableCell>
                          <TableCell>{user.acoin}</TableCell>
                          <TableCell>
                            {user.is_verified && <Badge variant="secondary">Verified</Badge>}
                            {user.is_admin && <Badge>Admin</Badge>}
                          </TableCell>
                          <TableCell className="text-xs">{formatDate(user.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Messages ({messages.length})</CardTitle>
                <CardDescription>Latest platform messages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sender</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Chat ID</TableHead>
                        <TableHead>Sent At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((msg: any) => (
                        <TableRow key={msg.id}>
                          <TableCell>{msg.profiles?.display_name || 'Unknown'}</TableCell>
                          <TableCell className="max-w-xs truncate">{msg.encrypted_content}</TableCell>
                          <TableCell className="text-xs">{msg.chat_id.substring(0, 8)}...</TableCell>
                          <TableCell className="text-xs">{formatDate(msg.sent_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chats ({chats.length})</CardTitle>
                <CardDescription>All chats and groups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chats.map((chat: any) => (
                        <TableRow key={chat.id}>
                          <TableCell>{chat.name || 'Direct Chat'}</TableCell>
                          <TableCell>
                            <Badge variant={chat.is_group ? 'default' : 'secondary'}>
                              {chat.is_group ? 'Group' : 'Direct'}
                            </Badge>
                          </TableCell>
                          <TableCell>{chat.profiles?.display_name || 'Unknown'}</TableCell>
                          <TableCell className="text-xs">{formatDate(chat.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Posts ({posts.length})</CardTitle>
                <CardDescription>Latest platform posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Author</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post: any) => (
                        <TableRow key={post.id}>
                          <TableCell>{post.profiles?.display_name || 'Unknown'}</TableCell>
                          <TableCell className="max-w-md truncate">{post.content}</TableCell>
                          <TableCell>{post.view_count}</TableCell>
                          <TableCell className="text-xs">{formatDate(post.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gifts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gift Transactions ({giftTransactions.length})</CardTitle>
                <CardDescription>Recent gift exchanges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gift</TableHead>
                        <TableHead>Sender ID</TableHead>
                        <TableHead>Receiver ID</TableHead>
                        <TableHead>Cost (Nexa)</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Sent At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {giftTransactions.map((txn: any) => (
                        <TableRow key={txn.id}>
                          <TableCell>
                            {txn.gifts?.emoji} {txn.gifts?.name}
                          </TableCell>
                          <TableCell className="text-xs">{txn.sender_id.substring(0, 8)}...</TableCell>
                          <TableCell className="text-xs">{txn.receiver_id.substring(0, 8)}...</TableCell>
                          <TableCell>{txn.xp_cost}</TableCell>
                          <TableCell className="max-w-xs truncate">{txn.message || 'No message'}</TableCell>
                          <TableCell className="text-xs">{formatDate(txn.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acoin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ACoin Transactions ({acoinTransactions.length})</CardTitle>
                <CardDescription>Recent ACoin activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {acoinTransactions.map((txn: any) => (
                        <TableRow key={txn.id}>
                          <TableCell>{txn.profiles?.display_name || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{txn.transaction_type}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{txn.amount}</TableCell>
                          <TableCell className="text-xs">{formatDate(txn.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Subscriptions ({subscriptions.length})</CardTitle>
                <CardDescription>Users with premium access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Expires</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((sub: any) => (
                        <TableRow key={sub.id}>
                          <TableCell>{sub.profiles?.display_name || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge>{sub.plan_name}</Badge>
                          </TableCell>
                          <TableCell>{sub.price} ACoin</TableCell>
                          <TableCell className="text-xs">{formatDate(sub.starts_at)}</TableCell>
                          <TableCell className="text-xs">{formatDate(sub.expires_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
