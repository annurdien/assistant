import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Activity, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const data = await api.logs.getLogs(100);
      setLogs(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch logs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Command Logs</h2>
          <p className="text-muted-foreground">
            View the history of executed commands and their outputs.
          </p>
        </div>
        <Button onClick={loadLogs} disabled={isLoading} variant="outline" size="sm">
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {isLoading && logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Retrieving logs...</p>
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted p-4 rounded-full mb-4">
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Logs Found</h3>
            <p className="text-muted-foreground max-w-sm">Command execution logs will appear here once your commands are triggered.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="h-[600px] w-full rounded-md border-0">
            <Table>
              <TableHeader className="sticky top-0 bg-secondary/80 backdrop-blur-sm shadow-sm z-10 border-b">
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[150px]">Command</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Output</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{log.commandName}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.status?.toUpperCase() === 'SUCCESS' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 shadow-none">Success</Badge>
                      ) : (
                        <Badge variant="destructive" className="shadow-none">Failed</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[400px]">
                      <div className="truncate font-mono text-sm text-foreground/80" title={log.output || '-'}>
                        {log.output || '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
