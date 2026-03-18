import { useEffect, useState } from 'react';
import { api, type Command } from '../services/api';
import CommandCard from '../components/CommandCard';
import { TerminalSquare, AlertCircle, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function CommandList() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCommands();
  }, []);

  const loadCommands = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getCommands();
      setCommands(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch commands.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCommand(id);
      setCommands(commands.filter(cmd => cmd.id !== id));
      toast.success('Command deleted successfully');
    } catch (err: any) {
      toast.error(`Error deleting command: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading commands...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-xl mx-auto mt-10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Connection Error</AlertTitle>
        <AlertDescription className="mt-2 text-sm">
          {error}
        </AlertDescription>
        <Button variant="outline" className="mt-4" onClick={loadCommands}>Try Connection Again</Button>
      </Alert>
    );
  }

  if (commands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] max-w-md mx-auto text-center space-y-4 border rounded-xl p-10 bg-background shadow-sm">
        <div className="bg-muted p-4 rounded-full">
          <TerminalSquare className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold tracking-tight">No Commands Found</h3>
        <p className="text-muted-foreground mb-4">
          You haven't created any commands yet. Set up custom logic scripts to govern your WhatsApp bot.
        </p>
        <Button asChild>
          <Link to="/">
            <Plus className="mr-2 h-4 w-4" />
            Create Command
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Commands</h2>
          <p className="text-muted-foreground">
            Manage and configure the response scripts that power your bot.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium">
            Total limits: {commands.length}
          </div>
          <Button asChild>
            <Link to="/">
              <Plus className="mr-2 h-4 w-4" />
              New Command
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {commands.map((cmd) => (
          <CommandCard 
            key={cmd.id}
            command={cmd} 
            onDelete={() => handleDelete(cmd.id)} 
          />
        ))}
      </div>
    </div>
  );
}
