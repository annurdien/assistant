import React, { useEffect, useState } from 'react';
import { Plus, Trash2, KeyRound, Loader2, Save } from 'lucide-react';
import { api, type Secret, type SecretInput } from '../services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner';

export function SecretsPage() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<SecretInput>({ key: '', value: '' });

  useEffect(() => {
    fetchSecrets();
  }, []);

  const fetchSecrets = async () => {
    try {
      setIsLoading(true);
      const data = await api.secret.list();
      setSecrets(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load secrets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.secret.delete(id);
      fetchSecrets();
      toast.success('Secret deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete secret');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.secret.create(formData);
      setIsModalOpen(false);
      setFormData({ key: '', value: '' });
      fetchSecrets();
      toast.success('Secret saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save secret');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys & Secrets</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage secure environment variables and 3rd-party API keys.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add API Key</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add a new Secret</DialogTitle>
              <DialogDescription>
                This value will be securely encrypted and accessible in your scripts via <code>ctx.env.MY_KEY</code>.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="key" className="font-semibold">Key Name</Label>
                <Input
                  id="key"
                  type="text"
                  required
                  placeholder="WEATHER_API_KEY"
                  className="uppercase font-mono text-sm"
                  value={formData.key}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="val" className="font-semibold">Secret Value</Label>
                <Input
                  id="val"
                  type="password"
                  required
                  placeholder="sk_live_..."
                  className="font-mono text-sm"
                  value={formData.value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Secret
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden shadow-sm border-border/60">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          </div>
        ) : secrets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-muted p-5 rounded-full mb-6">
              <KeyRound className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Secrets Found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">You haven't added any API keys or runtime secrets yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 font-semibold text-foreground/80">Key Name</TableHead>
                <TableHead className="font-semibold text-foreground/80">Value</TableHead>
                <TableHead className="font-semibold text-foreground/80">Last Updated</TableHead>
                <TableHead className="text-right font-semibold text-foreground/80 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {secrets.map((secret) => (
                <TableRow key={secret.id} className="hover:bg-muted/15 transition-colors group">
                  <TableCell className="py-5 font-mono font-medium text-sm flex items-center space-x-3">
                    <KeyRound className="h-4 w-4 text-amber-500" />
                    <span>{secret.key}</span>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground tracking-widest font-bold">
                    ••••••••••••••••
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm font-mono">
                    {new Date(secret.updatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:text-destructive hover:bg-destructive/10 text-muted-foreground transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to completely delete the secret for <strong>"{secret.key}"</strong>? This will instantly break any scripts depending on it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          {/* @ts-ignore */}
                          <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={() => handleDelete(secret.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
