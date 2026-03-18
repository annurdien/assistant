import { useEffect, useState } from 'react';
import { api, type Command } from '../services/api';
import CommandCard from '../components/CommandCard';
import { TerminalSquare, AlertCircle } from 'lucide-react';

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
    } catch (err: any) {
      alert(`Error deleting command: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="page page-center">
        <div className="container-tight py-4 text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="mt-3 text-secondary">Loading your commands...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <div className="d-flex">
          <div>
            <AlertCircle size={24} className="alert-icon" />
          </div>
          <div>
            <h4 className="alert-title">Failed to Load</h4>
            <div className="text-secondary">{error}</div>
            <div className="mt-3">
              <button onClick={loadCommands} className="btn btn-danger">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (commands.length === 0) {
    return (
      <div className="empty">
        <div className="empty-img">
          <TerminalSquare size={64} className="text-muted" strokeWidth={1.5} />
        </div>
        <p className="empty-title">No Commands Yet</p>
        <p className="empty-subtitle text-secondary">
          You haven't defined any execution scripts. Set up custom logic that runs dynamically when messaged.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header d-print-none mb-4">
        <div className="row g-2 align-items-center">
          <div className="col">
            <h2 className="page-title">
              Command Center
            </h2>
            <div className="text-secondary mt-1">
              Manage, debug, and configure dynamic response scripts that execute securely in a sandboxed V8 environment.
            </div>
          </div>
          <div className="col-auto ms-auto d-print-none">
            <div className="text-secondary mt-1">
              Active Scripts ({commands.length})
            </div>
          </div>
        </div>
      </div>
      
      <div className="row row-cards">
        {commands.map((cmd) => (
          <div className="col-md-6 col-lg-4" key={cmd.id}>
            <CommandCard 
              command={cmd} 
              onDelete={() => handleDelete(cmd.id)} 
            />
          </div>
        ))}
      </div>
    </>
  );
}
