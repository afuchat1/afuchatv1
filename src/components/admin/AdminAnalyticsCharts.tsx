import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subMonths, subWeeks } from 'date-fns';

interface AnalyticsData {
  users: any[];
  posts: any[];
  messages: any[];
  giftTransactions: any[];
  acoinTransactions: any[];
  follows: any[];
  postViews: any[];
}

interface AdminAnalyticsChartsProps {
  data: AnalyticsData;
  timeRange: 'week' | 'month' | 'year';
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AdminAnalyticsCharts({ data, timeRange }: AdminAnalyticsChartsProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    let dateRange: Date[];
    let groupByFormat: string;
    
    if (timeRange === 'week') {
      dateRange = eachDayOfInterval({
        start: subDays(now, 7),
        end: now
      });
      groupByFormat = 'MMM d';
    } else if (timeRange === 'month') {
      dateRange = eachDayOfInterval({
        start: subDays(now, 30),
        end: now
      });
      groupByFormat = 'MMM d';
    } else {
      dateRange = eachMonthOfInterval({
        start: subMonths(now, 12),
        end: now
      });
      groupByFormat = 'MMM yyyy';
    }

    const groupData = (items: any[], dateField: string) => {
      return dateRange.map(date => {
        const dateStr = format(date, groupByFormat);
        const count = items.filter(item => {
          const itemDate = new Date(item[dateField]);
          if (timeRange === 'year') {
            return format(itemDate, 'MMM yyyy') === dateStr;
          }
          return format(itemDate, 'MMM d') === dateStr;
        }).length;
        return { date: dateStr, count };
      });
    };

    return {
      users: groupData(data.users, 'created_at'),
      posts: groupData(data.posts, 'created_at'),
      messages: groupData(data.messages, 'sent_at'),
      gifts: groupData(data.giftTransactions, 'created_at'),
      acoins: groupData(data.acoinTransactions, 'created_at'),
      follows: groupData(data.follows, 'created_at'),
    };
  }, [data, timeRange]);

  const combinedActivityData = useMemo(() => {
    return chartData.users.map((item, index) => ({
      date: item.date,
      users: item.count,
      posts: chartData.posts[index]?.count || 0,
      messages: chartData.messages[index]?.count || 0,
      gifts: chartData.gifts[index]?.count || 0,
    }));
  }, [chartData]);

  const engagementPieData = useMemo(() => {
    return [
      { name: 'Posts', value: data.posts.length },
      { name: 'Messages', value: data.messages.length },
      { name: 'Gifts', value: data.giftTransactions.length },
      { name: 'Follows', value: data.follows.length },
    ];
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Platform Activity Over Time */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Platform Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedActivityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area type="monotone" dataKey="users" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="New Users" />
                <Area type="monotone" dataKey="posts" stackId="2" stroke="hsl(183, 100%, 40%)" fill="hsl(183, 100%, 40%)" fillOpacity={0.6} name="Posts" />
                <Area type="monotone" dataKey="messages" stackId="3" stroke="hsl(280, 70%, 50%)" fill="hsl(280, 70%, 50%)" fillOpacity={0.6} name="Messages" />
                <Area type="monotone" dataKey="gifts" stackId="4" stroke="hsl(45, 100%, 50%)" fill="hsl(45, 100%, 50%)" fillOpacity={0.6} name="Gifts" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* User Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">User Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.users}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Engagement Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={engagementPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {engagementPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Posts Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Posts Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.posts}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="count" fill="hsl(183, 100%, 40%)" radius={[4, 4, 0, 0]} name="Posts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gift Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Gift Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.gifts}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="count" fill="hsl(45, 100%, 50%)" radius={[4, 4, 0, 0]} name="Gifts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
