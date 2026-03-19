import { useState } from 'react';
import type { CommandInput } from '../services/api';
import ScriptEditor from './ScriptEditor';
import { Save, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CommandFormProps {
  initialData?: Partial<CommandInput>;
  onSubmit: (data: CommandInput) => Promise<void>;
  isLoading: boolean;
  prefix?: string;
}

export default function CommandForm({ initialData = {}, onSubmit, isLoading, prefix = '/' }: CommandFormProps) {
  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [script, setScript] = useState(initialData.script || '');
  const [enabled, setEnabled] = useState(initialData.enabled ?? true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Command name is required.');
    if (!script.trim()) return setError('Command script cannot be empty.');
    try {
      await onSubmit({ name, description, script, enabled });
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    }
  };

  return (
    <Card className="shadow-sm border">
      <CardHeader className="bg-secondary/20 border-b pb-4 mb-4">
        <CardTitle>{initialData.name ? `${prefix}${initialData.name}` : 'Command Configuration'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-semibold">Command Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="analyze_data"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this command do?"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border border-border p-5 shadow-sm bg-muted/30">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Enable Command</Label>
              <p className="text-sm text-muted-foreground">Toggle whether this command is active and can be triggered by users.</p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <Label className="text-base font-semibold">Script</Label>
                <p className="text-sm text-muted-foreground mt-1">The JavaScript code that runs when this command is triggered.</p>
              </div>
              <span className="text-xs font-mono text-muted-foreground bg-muted border border-border px-3 py-1.5 rounded-md shadow-sm hidden sm:block">export default async function (ctx)</span>
            </div>
            <div className="rounded-md border border-border overflow-hidden shadow-sm ring-1 ring-border relative">
              <ScriptEditor 
                value={script}
                onChange={setScript}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-border">
            <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={isLoading} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto px-8">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Command
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
