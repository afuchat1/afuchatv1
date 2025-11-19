// src/pages/AdminDashboard.tsx

import { useEffect, useState } from 'react'; // CORRECTED SYNTAX
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MessageSquare, TrendingUp, Activity, ArrowLeft, UserCheck, Shield, Trash2, Edit, BarChart3, Users as UsersIcon, AlertTriangle, Lock, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Cell,
} from 'recharts';

interface Stats {
  totalUsers: number;
  totalMessages: number;
  totalChats: number;
  activeToday: number;
  messagesLast7Days: { date: string; count: number }[];
  messagesLast30Days: { date: string; count: number; sma: number | null }[];
  newUsersLast30Days: { date: string; count: number }[];
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

// Helper to calculate simple moving average
const calculateSMA = (data: { date: string; count: number }[], period: number) => {
  return data.map((point, index) => {
    if (index < period - 1) return { ...point, sma: null };
    const slice = data.slice(index - period + 1, index + 1);
    const avg = slice.reduce((sum, p) => sum + p.count, 0) / period;
    return { ...point, sma: parseFloat(avg.toFixed(2)) };
  });
};

// Helper to determine bar color based on day-over-day change
const getColorForBar = (data: { date: string; count: number }[], index: number): string => {
  if (index === 0) return '#4ade80'; 
  
  const currentCount = data[index].count;
  const previousCount = data[index - 1].count;
  
  return currentCount >= previousCount ? '#4ade80' : '#f43f5e'; 
};

// Helper to group items by day and sort them ascending
const groupByDay = (items: any[]) => {
  const groups: { [key: string]: number } = {};
  items?.forEach(item => {
    const date = new Date(item.sent_at || item.created_at).toISOString().split('T')[0];
    groups[date] = (groups[date] || 0) + 1;
  });
  return Object.entries(groups)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime()) 
    .map(([date, count]) => ({ date, count }));
};

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [hasAdminPrivileges, setHasAdminPrivileges] = useState(false); 

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'posts'>('stats');
  const [activityTab, setActivityTab] = useState<'7days' | '30days'>('7days');


  useEffect(() => {
    if (authLoading) return;

    if (user) {
      checkAdminStatusAndLoadData(user.id);
    } else {
      // Not logged in: only fetch public stats
      fetchStats().finally(() => setLoading(false));
      setHasAdminPrivileges(false);
      setUsers([]);
      setPosts([]);
    }
  }, [authLoading, user]);

  const checkAdminStatusAndLoadData = async (userId: string) => {
    try {
      // 1. Check admin status
      const { data, error: queryError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const isAdmin = data?.role === 'admin';
      setHasAdminPrivileges(isAdmin);

      // 2. Fetch data based on role
      if (isAdmin) {
          await Promise.all([fetchStats(), fetchUsers(), fetchPosts()]);
      } else {
          await fetchStats();
      }

    } catch (error) {
      console.error('Error in admin check/data load:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch user count, message count, chat count
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: messageCount } = await supabase.from('messages').select('*', { count: 'exact', head: true });
      const { count: chatCount } = await supabase.from('chats').select('*', { count: 'exact', head: true });

      // Fetch active users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      const { count: activeCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .or(`last_seen.gte.${todayISO},created_at.gte.${todayISO}`);

      // Fetch messages for last 7/30 days and new users
      const last7Days = new Date(); last7Days.setDate(last7Days.getDate() - 7);
      const last30Days = new Date(); last30Days.setDate(last30Days.getDate() - 30);
      
      const { data: messages7Days } = await supabase.from('messages').select('sent_at').gte('sent_at', last7Days.toISOString());
      const { data: messages30Days } = await supabase.from('messages').select('sent_at').gte('sent_at', last30Days.toISOString());
      const { data: newUsers30Days } = await supabase.from('profiles').select('created_at').gte('created_at', last30Days.toISOString());

      const processedMessages30 = groupByDay(messages30Days || []);
      const sma7 = calculateSMA(processedMessages30, 7);

      setStats({
        totalUsers: userCount || 0,
        totalMessages: messageCount || 0,
        totalChats: chatCount || 0,
        activeToday: activeCount || 0,
        messagesLast7Days: groupByDay(messages7Days || []),
        messagesLast30Days: sma7,
        newUsersLast30Days: groupByDay(newUsers30Days || []),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, handle, is_verified, is_organization_verified, created_at')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (roleError) throw roleError;

      const roleMap = new Map(roleData?.map(r => [r.user_id, r.role]));
      const combinedUsers = (profileData || []).map((p: any) => ({
        ...p,
        is_admin: roleMap.get(p.id) === 'admin',
      }));

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setUsers([]);
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
      setPosts([]);
    }
  };

  // --- ADMIN ACTIONS (Disabled if not admin) ---
  const toggleVerification = async (userId: string, type: 'is_verified' | 'is_organization_verified', value: boolean) => {
    if (!hasAdminPrivileges) return toast.error('You do not have permission for this action.');
    const { error } = await supabase.from('profiles').update({ [type]: value }).eq('id', userId);
    if (error) { toast.error(`Failed to ${value ? 'verify' : 'unverify'}`); } else { toast.success(`${value ? 'Verified' : 'Unverified'}!`); fetchUsers(); }
  };

  const toggleAdminRole = async (userId: string, value: boolean) => {
    if (!hasAdminPrivileges) return toast.error('You do not have permission for this action.');
    if (value) {
      const { error } = await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' });
      if (error) { toast.error('Failed to promote admin'); } else { toast.success('Promoted to admin!'); fetchUsers(); }
    } else {
      if (confirm('Demote this user from admin?')) {
        const { error } = await supabase.from('user_roles').update({ role: 'user' }).eq('user_id', userId);
        if (error) { toast.error('Failed to demote admin'); } else { toast.success('Demoted from admin!'); fetchUsers(); }
      }
    }
  };

  const deletePost = async (postId: string) => {
    if (!hasAdminPrivileges) return toast.error('You do not have permission for this action.');
    if (!confirm('Delete this post?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) { toast.error('Failed to delete'); } else { toast.success('Post deleted'); fetchPosts(); }
  };
  // --- END ADMIN ACTIONS ---

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  if (loading) {
    // ... (Skeleton loading UI remains the same)
    return (
      <div className="min-h-screen bg-background p-2 sm:p-4 max-w-6xl mx-auto">
        {/* 🚨 MODIFICATION 1: Changed navigate('/') to navigate(-1) for skeleton */}
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full h-8 w-8 sm:h-10 sm:w-10 mb-4">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 sm:h-32" />
          ))}
        </div>
        <Skeleton className="h-64 sm:h-96" />
      </div>
    );
  }

  // --- RESTRICTED ACCESS VIEW (Non-Admin/Logged Out) ---
  if (!user || !hasAdminPrivileges) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center pt-20">
        <div className="w-full max-w-4xl">
          <div className="flex items-center gap-2 sm:gap-4 mb-6 border-b pb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          
          <Card className={`border-l-4 ${!user ? 'border-red-500' : 'border-yellow-500'} shadow-lg`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                {!user ? <Lock className="h-6 w-6 text-red-500" /> : <AlertTriangle className="h-6 w-6 text-yellow-500" />}
                Access Restricted
              </CardTitle>
              <CardDescription className="text-sm">
                {!user 
                  ? 'You must be logged in to view administrative data.'
                  : 'Your account does not have the required administrator privileges to view or manage user and post data.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-muted-foreground text-sm mb-4">
                You can still view the public **Statistics Tab** below, but management functions are disabled.
               </p>
               <Button onClick={() => navigate('/auth')} variant="secondary" className={!user ? '' : 'hidden'}>
                Go to Login
               </Button>
            </CardContent>
          </Card>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Public Statistics Preview</h2>
            {/* Render the stats content here, as it is non-privileged data */}
            {stats && (
                <Tabs value="stats" className="w-full">
                    <TabsList className="grid grid-cols-3 gap-0 mb-4 h-10">
                        <TabsTrigger value="stats" className="text-xs sm:text-sm py-2" disabled>Stats</TabsTrigger>
                        <TabsTrigger value="users" className="text-xs sm:text-sm py-2" disabled>Users</TabsTrigger>
                        <TabsTrigger value="posts" className="text-xs sm:text-sm py-2" disabled>Posts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="stats">
                      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                        {/* Render Stat Cards */}
                        <Card className="p-2 sm:p-4"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1"><CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle><Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalUsers}</div><p className="text-xs text-muted-foreground">Registered accounts</p></CardContent></Card>
                        <Card className="p-2 sm:p-4"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1"><CardTitle className="text-xs sm:text-sm font-medium">Total Messages</CardTitle><MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalMessages}</div><p className="text-xs text-muted-foreground">All-time messages</p></CardContent></Card>
                        <Card className="p-2 sm:p-4"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1"><CardTitle className="text-xs sm:text-sm font-medium">Total Chats</CardTitle><TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalChats}</div><p className="text-xs text-muted-foreground">Active conversations</p></CardContent></Card>
                        <Card className="p-2 sm:p-4"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1"><CardTitle className="text-xs sm:text-sm font-medium">Active Today</CardTitle><Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl sm:text-2xl font-bold text-foreground">{stats.activeToday}</div><p className="text-xs text-muted-foreground">Users online today</p></CardContent></Card>
                      </div>

                      {/* User Growth Chart */}
                      <Card className="mb-4 sm:mb-6 overflow-hidden">
                        <CardHeader className="p-3 sm:p-4">
                          <CardTitle className="flex items-center gap-2 text-sm sm:text-base"><UsersIcon className="h-3 w-3 sm:h-4 sm:w-4" />User Growth - Last 30 Days</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">Daily new user registrations with trend analysis</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 sm:p-0">
                          <div className="p-2 sm:p-4 bg-gray-900 rounded-b-lg"> 
                            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                              <AreaChart data={stats.newUsersLast30Days || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs><linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0E9F6E" stopOpacity={0.6}/><stop offset="95%" stopColor="#0E9F6E" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.5} />
                                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}/>
                                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#0E9F6E' }}/>
                                <Area type="monotone" dataKey="count" stroke="#0E9F6E" fillOpacity={1} fill="url(#userGrowthGradient)" name="New Users" strokeWidth={3} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                </Tabs>
            )}
            <p className="text-muted-foreground text-sm mt-4">Full table and moderation access is only available to administrators.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- FULL ADMIN VIEW (Only renders if hasAdminPrivileges is true) ---
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full h-8 w-8 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Monitor platform performance and manage users/posts</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/admin/affiliate-requests')}
            className="gap-2"
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Affiliate Requests</span>
          </Button>
        </div>

        {/* Main Tabs (Only visible to admin) */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'stats' | 'users' | 'posts')} className="w-full">
          <TabsList className="grid grid-cols-3 gap-0 mb-4 sm:mb-6 h-10 sm:h-auto">
            <TabsTrigger value="stats" className="text-xs sm:text-sm py-2">Stats</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm py-2">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="posts" className="text-xs sm:text-sm py-2">Posts ({posts.length})</TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats">
            {/* Stats Cards - Mobile Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <Card className="p-2 sm:p-4">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-foreground">{stats?.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Registered accounts</p>
                </CardContent>
              </Card>

              <Card className="p-2 sm:p-4">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Messages</CardTitle>
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-foreground">{stats?.totalMessages}</div>
                  <p className="text-xs text-muted-foreground">All-time messages</p>
                </CardContent>
              </Card>

              <Card className="p-2 sm:p-4">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Chats</CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-foreground">{stats?.totalChats}</div>
                  <p className="text-xs text-muted-foreground">Active conversations</p>
                </CardContent>
              </Card>

              <Card className="p-2 sm:p-4">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Active Today</CardTitle>
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-foreground">{stats?.activeToday}</div>
                  <p className="text-xs text-muted-foreground">Users online today</p>
                </CardContent>
              </Card>
            </div>

            {/* User Growth Chart - Professional Area Chart */}
            <Card className="mb-4 sm:mb-6 overflow-hidden">
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <UsersIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  User Growth - Last 30 Days
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Daily new user registrations with trend analysis</CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-0">
                <div className="p-2 sm:p-4 bg-gray-900 rounded-b-lg"> 
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                    <AreaChart data={stats?.newUsersLast30Days || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0E9F6E" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#0E9F6E" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.5} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        interval="preserveStartEnd"
                        tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      />
                      <YAxis 
                        stroke="#9CA3AF" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <Tooltip 
                        labelFormatter={(label) => `Date: ${label}`}
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }} 
                        itemStyle={{ color: '#0E9F6E' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#0E9F6E" 
                        fillOpacity={1} 
                        fill="url(#userGrowthGradient)" 
                        name="New Users" 
                        strokeWidth={3} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline - Trading-Style Composed Chart */}
            <Tabs value={activityTab} onValueChange={(value) => setActivityTab(value as '7days' | '30days')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-2 sm:mb-4 h-10">
                <TabsTrigger value="7days" className="text-xs sm:text-sm py-2">Last 7 Days</TabsTrigger>
                <TabsTrigger value="30days" className="text-xs sm:text-sm py-2">Last 30 Days</TabsTrigger>
              </TabsList>
              
              <TabsContent value="7days">
                <Card className="overflow-hidden">
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                      Message Activity - Last 7 Days
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Volume and trend with moving average</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 sm:p-0">
                    <div className="p-2 sm:p-4 bg-gray-900 rounded-b-lg"> 
                      <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
                        <ComposedChart data={stats?.messagesLast7Days || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.5} />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            interval="preserveStartEnd"
                            tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          />
                          <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Volume', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 10 }} />
                          <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip 
                            labelFormatter={(label) => `Date: ${label}`}
                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }} 
                            labelStyle={{ color: '#f3f4f6' }}
                          />
                          <Legend verticalAlign="top" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
                          <Bar yAxisId="left" dataKey="count" fill="#f43f5e" name="Volume" barSize={15} /> 
                          <Line yAxisId="right" type="monotone" dataKey="count" stroke="#4ade80" strokeWidth={2} name="Daily" dot={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="30days">
                <Card className="overflow-hidden">
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                      Message Activity - Last 30 Days
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Advanced volume bars (Green/Red) with SMA(7) overlay for trend analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 sm:p-0">
                    <div className="p-2 sm:p-4 bg-gray-900 rounded-b-lg"> 
                      <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
                        <ComposedChart data={stats?.messagesLast30Days || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.5} />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            interval="preserveStartEnd"
                            tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          />
                          <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Volume', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 10 }} />
                          <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Trend', angle: 90, position: 'insideRight', fill: '#9CA3AF', fontSize: 10 }} />
                          <Tooltip 
                            labelFormatter={(label) => `Date: ${label}`}
                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                            labelStyle={{ color: '#f3f4f6' }}
                          />
                          <Legend verticalAlign="top" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
                          
                          {/* Custom Bar for Green/Red logic */}
                          <Bar yAxisId="left" dataKey="count" name="Daily Messages (Volume)" barSize={15}>
                            {stats?.messagesLast30Days?.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={getColorForBar(stats.messagesLast30Days, index)} 
                                opacity={0.9}
                              />
                            ))}
                          </Bar>
                          
                          {/* SMA Line - Clear, solid color for trend */}
                          <Line yAxisId="right" type="monotone" dataKey="sma" stroke="#f59e0b" strokeWidth={2} name="SMA (7-Day Trend)" dot={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Users Tab - Mobile Optimized Table */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-sm sm:text-base">Manage Users</CardTitle>
                <CardDescription className="text-xs sm:text-sm">View and moderate user accounts</CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-0 overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Name</TableHead>
                      <TableHead className="text-xs sm:text-sm">Handle</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Joined</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className="border-b border-border/50">
                        <TableCell className="text-sm font-medium">{u.display_name}</TableCell>
                        <TableCell className="text-xs">@{u.handle}</TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">{formatDate(u.created_at)}</TableCell>
                        <TableCell className="text-xs">
                          {u.is_admin && <Badge variant="secondary" className="mr-1 text-xs">Admin</Badge>}
                          {u.is_verified && <Badge variant="default" className="mr-1 text-xs">Verified</Badge>}
                          {u.is_organization_verified && <Badge variant="outline" className="text-xs">Org</Badge>}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex flex-col sm:flex-row gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs px-2 py-1"
                              onClick={() => toggleVerification(u.id, 'is_verified', !u.is_verified)}
                              disabled={!hasAdminPrivileges}
                            >
                              {u.is_verified ? <Edit className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                              {u.is_verified ? 'Unverify' : 'Verify'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs px-2 py-1"
                              onClick={() => toggleVerification(u.id, 'is_organization_verified', !u.is_organization_verified)}
                              disabled={!hasAdminPrivileges}
                            >
                              {u.is_organization_verified ? <Edit className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                              {u.is_organization_verified ? 'Org Unverify' : 'Org Verify'}
                            </Button>
                            <Button
                              size="sm"
                              variant={u.is_admin ? "destructive" : "secondary"}
                              className="text-xs px-2 py-1"
                              onClick={() => toggleAdminRole(u.id, !u.is_admin)}
                              disabled={!hasAdminPrivileges}
                            >
                              {u.is_admin ? <Edit className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                              {u.is_admin ? 'Demote' : 'Promote'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-xs sm:text-sm">
                          {hasAdminPrivileges ? 'No users found.' : 'You must be an admin to view this table.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab - Mobile Optimized Table */}
          <TabsContent value="posts">
            <Card>
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-sm sm:text-base">Recent Posts</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Moderate recent user posts</CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-0 overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Content</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Author ID</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Date</TableHead>
                      <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((p) => (
                      <TableRow key={p.id} className="border-b border-border/50">
                        <TableCell className="text-xs max-w-[150px] truncate sm:max-w-xs">{p.content}</TableCell>
                        <TableCell className="text-xs font-mono hidden sm:table-cell">{p.author_id.slice(0, 8)}...</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{formatDate(p.created_at)}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="text-xs px-2 py-1"
                            onClick={() => deletePost(p.id)}
                            disabled={!hasAdminPrivileges}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {posts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-xs sm:text-sm">
                          {hasAdminPrivileges ? 'No posts found.' : 'You must be an admin to view this table.'}
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
