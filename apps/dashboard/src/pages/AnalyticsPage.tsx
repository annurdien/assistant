import { useEffect, useState, useMemo } from 'react';
import { Loader2, Activity } from 'lucide-react';
import { api } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';

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
      .slice(0, 10); // Top 10

    const statusStats = [
      { name: 'Success', value: successCount },
      { name: 'Failed', value: failCount }
    ];

    return { commandStats, statusStats };
  }, [logs]);

  const COLORS = ['#10B981', '#EF4444']; // Green for success, Red for fail

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Analytics Engine</h1>
          <p className="text-gray-500">Visualize command execution telemetries and operational quotas.</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium text-sm">
          <Activity className="h-4 w-4" />
          <span>Total Executions: {logs.length}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {logs.length === 0 && !error ? (
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">No Analytics Yet</h3>
          <p className="mt-1 text-gray-500">Wait for users to execute commands to populate visual charts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Commands Chart */}
          <div className="rounded-lg border bg-white shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Commands Triggers</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commandStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip cursor={{fill: '#f4f4f5'}} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Executions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Success Rate Chart */}
          <div className="rounded-lg border bg-white shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Global Success Rate</h3>
            <div className="h-80 w-full flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {statusStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
