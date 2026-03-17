import { useState } from 'react';
import type { CommandInput } from '../services/api';
import ScriptEditor from './ScriptEditor';

interface CommandFormProps {
  initialData?: Partial<CommandInput>;
  onSubmit: (data: CommandInput) => Promise<void>;
  isLoading: boolean;
}

export default function CommandForm({ initialData = {}, onSubmit, isLoading }: CommandFormProps) {
  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [script, setScript] = useState(initialData.script || '');
  const [enabled, setEnabled] = useState(initialData.enabled ?? true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend Validation
    if (!name.trim()) {
      return setError('Command name is required.');
    }
    if (!script.trim()) {
      return setError('Execution script is required.');
    }

    try {
      await onSubmit({ name, description, script, enabled });
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="form-group">
        <label className="form-label" htmlFor="name">Command Name (ex: eval)</label>
        <input
          id="name"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="expense"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="description">Description</label>
        <input
          id="description"
          className="form-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Adds a new expense to the database."
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          <div className="form-checkbox">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={isLoading}
            />
            Command Enabled
          </div>
        </label>
      </div>

      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
        <label className="form-label">
          Execution Script
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 400 }}>
            Write a function that exports \`default async function (ctx)\`
          </span>
        </label>
        <ScriptEditor 
          value={script}
          onChange={setScript}
          disabled={isLoading}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button 
          type="button" 
          onClick={() => window.history.back()} 
          className="btn btn-outline"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Command'}
        </button>
      </div>
    </form>
  );
}
