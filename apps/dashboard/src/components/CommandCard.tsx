import type { Command } from '../services/api';
import { Link } from 'react-router-dom';

interface CommandCardProps {
  command: Command;
  onDelete: (id: string) => void;
}

export default function CommandCard({ command, onDelete }: CommandCardProps) {
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the command "${command.name}"?`)) {
      onDelete(command.id);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          /{command.name}
          {command.enabled ? (
            <span className="badge badge-success">Enabled</span>
          ) : (
            <span className="badge badge-danger">Disabled</span>
          )}
        </h3>
      </div>
      
      <p className="card-desc">
        {command.description || <span style={{ opacity: 0.5 }}>No description provided.</span>}
      </p>
      
      <div className="card-actions">
        <Link to={`/commands/${command.id}`} className="btn btn-outline">
          Edit
        </Link>
        <button onClick={handleDelete} className="btn btn-danger">
          Delete
        </button>
      </div>
    </div>
  );
}
