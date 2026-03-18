import { useEffect, useState, useMemo } from 'react';
import { Loader2, Activity } from 'lucide-react';
import { api } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AnalyticsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await api.logs.getLogs(500);
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const { commandStats, statusStats } = useMemo(() => {
    const cmdMap: Record<string, number> = {};
    let successCount = 0;
    let failCount = 0;

    for (const log of logs) {
      cmdMap[log.commandName] = (cmdMap[log.commandName] || 0) + 1;
      if (log.status === 'SUCCESS') successCount++;
      else failCount++;
    }

    const commandStats = Object.entries(cmdMap)
      .map(([name, count]) => ({ name: name || 'Unknown', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const statusStats = [
      { name: 'Success', value: successCount },
      { name: 'Failed', value: failCount }
    ];

    return { commandStats, statusStats };
  }, [logs]);

  const COLORS = ['#10B981', '#EF4444'];

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Visualize command usage and system performance.</p>
        </div>
        <div className="flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium text-sm">
          <Activity className="h-4 w-4" />
          <span>Total Executions: {logs.length}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive border border-destructive/50">
          {error}
        </div>
      )}

      {logs.length === 0 && !error ? (
        <Card className="border-dashed flex items-center justify-center min-h-[40vh] shadow-none bg-muted/30">
          <CardContent className="text-center pt-6">
            <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">Execution data will appear here once your commands are triggered by users.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Commands Chart */}
          <Card className="shadow-sm border-border/60">
            <CardHeader>
              <CardTitle>Top Commands</CardTitle>
              <CardDescription>The 10 most frequently executed commands.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={commandStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.6 }} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.6 }} dx={-10} />
                    <RechartsTooltip cursor={{fill: 'currentColor', opacity: 0.05}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Function Calls" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Success Rate Chart */}
          <Card className="shadow-sm border-border/60">
            <CardHeader>
              <CardTitle>Success Rate</CardTitle>
              <CardDescription>Ratio of successful versus failed command executions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full flex justify-center items-center mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {statusStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
