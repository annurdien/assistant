import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type CommandInput } from '../services/api';
import CommandForm from '../components/CommandForm';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

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
      setInitialData({
        enabled: true,
        script: `export default async function (ctx) {\n  const { input, ai, expense, db, reply } = ctx;\n  // Your execution logic here\n  return "Success!";\n}`
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
      navigate('/commands');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingGlobal) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading command details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-xl mx-auto mt-10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="mt-2 text-sm">{error}</AlertDescription>
        <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/commands')}>Return to Commands</Button>
      </Alert>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        {isEditing && (
          <Button variant="ghost" size="icon" onClick={() => navigate('/commands')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isEditing ? 'Edit Command' : 'Create Command'}
          </h2>
          <p className="text-muted-foreground text-sm">
            Write the JavaScript code that will execute when this command is triggered.
          </p>
        </div>
      </div>
      
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
