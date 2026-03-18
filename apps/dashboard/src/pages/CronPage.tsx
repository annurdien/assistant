import React, { useState, useEffect } from 'react';
import { Play, Square, Trash2, Plus, Edit, Clock, Loader2 } from 'lucide-react';
import { api, type CronJob, type Command } from '../services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [commands, setCommands] = useState<Command[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  
  const [formData, setFormData] = useState({
    commandId: '',
    schedule: '0 8 * * *',
    targetJid: '',
    enabled: true
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [jobsData, cmdsData] = await Promise.all([
         api.cron.getJobs(),
         api.getCommands()
      ]);
      setJobs(jobsData);
      setCommands(cmdsData);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenModal = (job?: CronJob) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        commandId: job.commandId,
        schedule: job.schedule,
        targetJid: job.targetJid,
        enabled: job.enabled
      });
    } else {
      setEditingJob(null);
      setFormData({
        commandId: commands.length > 0 ? commands[0].id : '',
        schedule: '0 8 * * *',
        targetJid: '',
        enabled: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await api.cron.updateJob(editingJob.id, formData);
        toast.success("Job updated successfully.");
      } else {
        await api.cron.createJob(formData);
        toast.success("Job created successfully.");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save cron job');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.cron.deleteJob(id);
      toast.success("Job deleted successfully.");
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete job');
    }
  };

  const handleToggleState = async (job: CronJob) => {
    try {
      await api.cron.updateJob(job.id, { enabled: !job.enabled });
      toast.success(`Job ${!job.enabled ? 'activated' : 'paused'} successfully.`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle job state');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Scheduled Jobs
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage automated background tasks and recurring messages.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create Job</span>
        </Button>
      </div>

      <Card className="overflow-hidden shadow-sm border-border/60">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="bg-muted p-5 rounded-full mb-6">
              <Clock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Scheduled Jobs</h3>
            <p className="text-muted-foreground text-sm max-w-sm">Create automated tasks to run commands on a recurring schedule.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 font-semibold text-foreground/80">Command</TableHead>
                <TableHead className="font-semibold text-foreground/80">Schedule (CRON)</TableHead>
                <TableHead className="font-semibold text-foreground/80">Destination Number</TableHead>
                <TableHead className="font-semibold text-foreground/80">Status</TableHead>
                <TableHead className="text-right font-semibold text-foreground/80 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map(job => (
                <TableRow key={job.id} className="hover:bg-muted/15 transition-colors group">
                  <TableCell className="py-4">
                    <div className="font-medium">{job.commandName}</div>
                    <div className="text-xs font-mono text-muted-foreground mt-0.5">{job.id.substring(0,8)}...</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono bg-muted/40 px-2 py-0.5 text-xs text-primary">{job.schedule}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm text-muted-foreground tracking-wide">{job.targetJid}</div>
                  </TableCell>
                  <TableCell>
                    {job.enabled ? 
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-transparent shadow-none">Active</Badge> : 
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 shadow-none border-transparent">Paused</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end items-center gap-1 pr-4">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className={`h-8 w-8 transition-opacity ${job.enabled ? "text-amber-600 hover:text-amber-700 hover:bg-amber-100/50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/50"}`}
                        onClick={() => handleToggleState(job)}
                        title={job.enabled ? "Halt Interval" : "Unfreeze Interval"}
                      >
                        {job.enabled ? <Square size={16} /> : <Play size={16} />}
                      </Button>
                      <Button 
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-primary transition-opacity"
                        onClick={() => handleOpenModal(job)}
                        title="Edit Architecture"
                      >
                        <Edit size={16} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive hover:bg-destructive/10 text-destructive/80 transition-opacity">
                            <Trash2 size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Scheduled Job?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove the automated job. Scripts will no longer execute autonomously on the schedule.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            {/* @ts-ignore */}
                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={() => handleDelete(job.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingJob ? 'Edit Scheduled Job' : 'Create Scheduled Job'}</DialogTitle>
            <DialogDescription>
              Run commands automatically on a recurring schedule.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="font-semibold text-sm">Target Command</Label>
              <Select 
                value={formData.commandId} 
                onValueChange={(val) => setFormData({...formData, commandId: val})}
                required
              >
                <SelectTrigger className="w-full font-mono text-sm">
                  <SelectValue placeholder="Select a command to run..." />
                </SelectTrigger>
                <SelectContent>
                  {commands.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="font-mono text-sm">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[13px] text-muted-foreground mt-1">Defines exactly which script gets triggered dynamically.</p>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-sm">CRON Schedule</Label>
              <Input 
                required
                value={formData.schedule}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, schedule: e.target.value})}
                placeholder="0 8 * * *"
                className="font-mono bg-muted/20"
              />
              <p className="text-[13px] text-muted-foreground mt-1">Accepts standard POSIX format (e.g. `0 * * * *` is hourly).</p>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-sm">Target WhatsApp Number</Label>
              <Input 
                required
                value={formData.targetJid}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, targetJid: e.target.value})}
                placeholder="62812345678"
                className="font-mono bg-muted/20"
              />
              <p className="text-[13px] text-muted-foreground mt-1">The destination phone number to send the output.</p>
            </div>

            <div className="flex flex-row items-center justify-between rounded-lg border border-border p-4 shadow-sm bg-muted/30">
              <div className="space-y-1">
                <Label className="text-sm font-semibold">Enable Job</Label>
              </div>
              <Switch
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({...formData, enabled: checked})}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Scheduled Job
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
