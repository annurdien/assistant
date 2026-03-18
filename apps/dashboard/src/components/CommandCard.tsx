import type { Command } from '../services/api';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, Code2, Play } from 'lucide-react';

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
          <Code2 size={20} className={command.enabled ? "text-primary me-2" : "text-secondary me-2"} />
          /{command.name}
        </h3>
        <div className="card-actions">
          {command.enabled ? (
            <span className="badge bg-green text-green-fg">
              <Play size={10} fill="currentColor" className="me-1" /> Active
            </span>
          ) : (
            <span className="badge bg-red text-red-fg">Disabled</span>
          )}
        </div>
      </div>
      
      <div className="card-body">
        <p className="text-secondary">
          {command.description || <span className="text-muted fst-italic">No description provided.</span>}
        </p>
      </div>
      
      <div className="card-footer d-flex justify-content-end gap-2">
        <Link to={`/commands/${command.id}`} className="btn btn-outline-primary">
          <Edit2 size={16} className="me-2" />
          Edit
        </Link>
        <button onClick={handleDelete} className="btn btn-outline-danger">
          <Trash2 size={16} className="me-2" />
          Delete
        </button>
      </div>
    </div>
  );
}
