import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MessageSquare, TrendingUp, Activity, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Stats {
  totalUsers: number;
  totalMessages: number;
  totalChats: number;
  activeToday: number;
  messagesLast7Days: { date: string; count: number }[];
  messagesLast30Days: { date: string; count: number }[];
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error) throw error;

      if (!data) {
        toast.error('Access denied: Admin privileges required');
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await fetchStats();
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error('Failed to verify admin access');
      navigate('/');
    }
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-6xl mx-auto">
        <Skeleton className="h-12 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
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
            <p className="text-sm text-muted-foreground">Monitor platform performance and user activity</p>
          </div>
        </div>

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
      </div>
    </div>
  );
};

export default AdminDashboard;
