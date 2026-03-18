import { useState } from 'react';
import type { CommandInput } from '../services/api';
import ScriptEditor from './ScriptEditor';
import { Save, X, AlertCircle } from 'lucide-react';

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
    <>
      <div className="page-header d-print-none mb-4">
        <h2 className="page-title">
          {initialData.name ? `Edit /${initialData.name}` : 'Create New Script'}
        </h2>
      </div>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger" role="alert">
                <div className="d-flex">
                  <div>
                    <AlertCircle size={20} className="alert-icon" />
                  </div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label" htmlFor="name">Command Name (ex: eval)</label>
              <input
                id="name"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="expense"
                disabled={isLoading}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="description">Description</label>
              <input
                id="description"
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adds a new expense to the database."
                disabled={isLoading}
              />
            </div>

            <div className="mb-3">
              <div className="form-label">Execution Status</div>
              <label className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="form-check-label">Command Enabled</span>
              </label>
              <small className="form-hint">Toggle whether this script is active in production.</small>
            </div>

            <div className="mb-3">
              <label className="form-label">
                Execution Script
                <span className="form-label-description">
                  Write a function that exports <code>default async function (ctx)</code>
                </span>
              </label>
              <div className="border rounded">
                <ScriptEditor 
                  value={script}
                  onChange={setScript}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-footer d-flex gap-2 justify-content-end mt-4">
              <button 
                type="button" 
                onClick={() => window.history.back()} 
                className="btn btn-secondary"
                disabled={isLoading}
              >
                <X size={18} className="me-2" />
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} className="me-2" />
                    Save Script
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
