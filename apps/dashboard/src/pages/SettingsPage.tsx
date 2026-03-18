import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    AI_API_KEY: '',
    AI_MODEL: 'gemini-2.5-flash',
    WA_ALLOWED_NUMBERS: '',
    WA_COMMAND_PREFIX: '/',
    WA_MAINTENANCE_MODE: 'false',
    WA_REPLY_UNKNOWN: 'false'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await api.settings.getSettings();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await api.settings.updateSettings(settings);
      toast.success('System settings saved successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        <p className="text-muted-foreground text-sm font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure AI parameters, global WhatsApp logic responses, and administrative access.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="shadow-sm border-border/50">
          <CardHeader className="bg-muted/10 border-b border-border/50">
            <CardTitle>AI Configuration</CardTitle>
            <CardDescription>Configure core AI models and API authentication.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form id="ai-form" onSubmit={handleSave} className="space-y-6">

              <div className="space-y-2">
                <Label htmlFor="apiKey" className="font-semibold text-sm">Gemini API Key</Label>
                <Input 
                  id="apiKey"
                  type="password" 
                  placeholder="AIzaSy..." 
                  className="font-mono bg-muted/20"
                  value={settings.AI_API_KEY || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('AI_API_KEY', e.target.value)}
                />
                <p className="text-[13px] text-muted-foreground">
                  The primary authentication key for Vertex routing and Knowledge Base vector creation.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="font-semibold text-sm">Language Model</Label>
                <Select 
                  value={settings.AI_MODEL || 'gemini-2.5-flash'}
                  onValueChange={(val) => handleChange('AI_MODEL', val)}
                >
                  <SelectTrigger className="font-mono bg-muted/20">
                    <SelectValue placeholder="Select LLM model..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-3.1-flash-lite-preview">gemini-3.1-flash-lite-preview</SelectItem>
                    <SelectItem value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</SelectItem>
                    <SelectItem value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</SelectItem>
                    <SelectItem value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</SelectItem>
                    <SelectItem value="gemini-3-pro-preview">gemini-3-pro-preview</SelectItem>
                    <SelectItem value="gemini-3-flash-preview">gemini-3-flash-preview</SelectItem>
                    <SelectItem value="gemini-2.5-flash">gemini-2.5-flash</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[13px] text-muted-foreground">
                  Select which model the assistant should use natively to generate answers.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="bg-muted/10 border-b border-border/50">
            <CardTitle>WhatsApp Webhook Settings</CardTitle>
            <CardDescription>Configure messaging parameters and security thresholds.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form id="wa-form" onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="whitelist" className="font-semibold text-sm">Allowed Numbers (Whitelist)</Label>
                  <Input 
                    id="whitelist"
                    type="text" 
                    placeholder="6281234, 1555" 
                    className="font-mono bg-muted/20"
                    value={settings.WA_ALLOWED_NUMBERS || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('WA_ALLOWED_NUMBERS', e.target.value)}
                  />
                  <p className="text-[13px] text-muted-foreground">
                    Comma separated numbers. Only these numbers can interact. Leave blank to allow anyone.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prefix" className="font-semibold text-sm">Command Prefix</Label>
                  <Input 
                    id="prefix"
                    type="text" 
                    placeholder="/" 
                    className="font-mono bg-muted/20"
                    value={settings.WA_COMMAND_PREFIX || '/'}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('WA_COMMAND_PREFIX', e.target.value)}
                  />
                  <p className="text-[13px] text-muted-foreground">
                    Prefix character required to trigger interactive commands.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-row items-center justify-between rounded-lg border border-border p-4 shadow-sm bg-muted/30 hover:bg-muted/40 transition-colors">
                  <div className="space-y-1">
                    <Label className="font-semibold text-base">Reply to Unknown Commands</Label>
                    <p className="text-[13px] text-muted-foreground">
                      Sends a polite error message if a user triggers a command that doesn't exist.
                    </p>
                  </div>
                  <Switch 
                    checked={settings.WA_REPLY_UNKNOWN === 'true'}
                    onCheckedChange={(c) => handleChange('WA_REPLY_UNKNOWN', c ? 'true' : 'false')}
                  />
                </div>

                <div className="flex flex-row items-center justify-between rounded-lg border border-destructive/30 p-4 shadow-sm bg-destructive/5 hover:bg-destructive/10 transition-colors">
                  <div className="space-y-1">
                    <Label className="font-semibold text-base text-destructive">Maintenance Mode</Label>
                    <p className="text-[13px] text-destructive/80 font-medium">
                      Suspends processing of all incoming messages. Useful when performing system upgrades.
                    </p>
                  </div>
                  <Switch 
                    checked={settings.WA_MAINTENANCE_MODE === 'true'}
                    onCheckedChange={(c) => handleChange('WA_MAINTENANCE_MODE', c ? 'true' : 'false')}
                  />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2 pb-8">
          <Button onClick={handleSave} disabled={isSaving} size="lg" className="w-full sm:w-auto px-8">
            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
