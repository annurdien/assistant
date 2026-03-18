import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type CommandInput } from '../services/api';
import CommandForm from '../components/CommandForm';

export default function CommandEditor() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<Partial<CommandInput> | null>(null);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadCommand(id);
    } else {
      // Setup empty defaults
      setInitialData({
        enabled: true,
        script: `export default async function (ctx) {\n  const { input, ai, expense, db, reply } = ctx;\n  // Your execution logic here\\n  return \"Success!\";\n}`
      });
    }
  }, [id, isEditing]);

  const loadCommand = async (commandId: string) => {
    try {
      setIsLoadingGlobal(true);
      setError(null);
      const data = await api.getCommand(commandId);
      setInitialData({
        name: data.name,
        description: data.description || '',
        script: data.script,
        enabled: data.enabled
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load command details.');
    } finally {
      setIsLoadingGlobal(false);
    }
  };

  const handleSubmit = async (data: CommandInput) => {
    setIsSaving(true);
    try {
      if (isEditing && id) {
        await api.updateCommand(id, data);
      } else {
        await api.createCommand(data);
      }
      // Redirect back to Command List
      navigate('/');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingGlobal) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading command details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>
        {isEditing ? 'Edit Command' : 'Create New Command'}
      </h2>
      
      {initialData && (
        <CommandForm 
          initialData={initialData} 
          onSubmit={handleSubmit} 
          isLoading={isSaving} 
        />
      )}
    </div>
  );
}
