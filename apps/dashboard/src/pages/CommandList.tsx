import { useEffect, useState } from 'react';
import { api, type Command } from '../services/api';
import CommandCard from '../components/CommandCard';

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
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading your commands...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" style={{ textAlign: 'center', marginTop: '2rem' }}>
        <h3>Failed to load</h3>
        <p>{error}</p>
        <button onClick={loadCommands} className="btn btn-outline" style={{ marginTop: '1rem' }}>
          Try Again
        </button>
      </div>
    );
  }

  if (commands.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Commands Yet</h3>
        <p>You haven't defined any execution commands. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Active Commands ({commands.length})</h2>
      <div className="command-grid">
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
