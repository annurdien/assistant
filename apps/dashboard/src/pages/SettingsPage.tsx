import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../services/api';
import type { WhitelistEntry } from '../services/api';
import { Save, Loader2, Server, KeyRound, MessageSquare, Shield, Trash2, Plus, Users, User, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    AI_API_KEY: '',
    AI_MODEL: 'gemini-2.5-flash',
    WA_COMMAND_PREFIX: '/',
    WA_MAINTENANCE_MODE: 'false',
    WA_REPLY_UNKNOWN: 'false',
    EXPENSE_CURRENCY: 'IDR',
  });
  
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingWhitelist, setIsAddingWhitelist] = useState(false);

  // Form for adding new whitelist entry
  const [newJid, setNewJid] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [settingsData, whitelistData] = await Promise.all([
        api.settings.getSettings(),
        api.whitelist.list()
      ]);
      setSettings(prev => ({ ...prev, ...settingsData }));
      setWhitelist(whitelistData);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch settings data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
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

  const handleAddWhitelist = async (e: FormEvent) => {
    e.preventDefault();
    if (!newJid.trim()) {
      toast.error('JID is required.');
      return;
    }

    setIsAddingWhitelist(true);
    try {
      const entry = await api.whitelist.add({ jid: newJid.trim(), name: newName.trim() || undefined });
      setWhitelist(prev => [entry, ...prev.filter(x => x.jid !== entry.jid)]);
      setNewJid('');
      setNewName('');
      toast.success('Added to whitelist.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add whitelist entry.');
    } finally {
      setIsAddingWhitelist(false);
    }
  };

  const handleDeleteWhitelist = async (id: string) => {
    try {
      await api.whitelist.delete(id);
      setWhitelist(prev => prev.filter(x => x.id !== id));
      toast.success('Removed from whitelist.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete whitelist entry.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        <p className="text-muted-foreground text-sm font-medium">Loading settings & data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure AI parameters, global WhatsApp logic responses, and administrative access.
        </p>
      </div>

      <Tabs defaultValue="general" className="flex flex-col md:flex-row gap-6 w-full">
        <div className="w-full md:w-64 flex-shrink-0">
          <TabsList className="flex flex-col h-auto w-full items-start justify-start bg-transparent space-y-1 p-0">
            <TabsTrigger 
              value="general" 
              className="w-full justify-start data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-4 py-2.5 flex gap-2"
            >
              <Server className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger 
              value="ai" 
              className="w-full justify-start data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-4 py-2.5 flex gap-2"
            >
              <KeyRound className="h-4 w-4" />
              AI Configuration
            </TabsTrigger>
            <TabsTrigger 
              value="wa" 
              className="w-full justify-start data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-4 py-2.5 flex gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              WhatsApp Webhook
            </TabsTrigger>
            <TabsTrigger 
              value="whitelist" 
              className="w-full justify-start data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-4 py-2.5 flex gap-2"
            >
              <Shield className="h-4 w-4" />
              Access Whitelist
            </TabsTrigger>
            <TabsTrigger 
              value="expense" 
              className="w-full justify-start data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-4 py-2.5 flex gap-2"
            >
              <Wallet className="h-4 w-4" />
              Expense Tracker
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 w-full min-w-0 pb-12">
          {/* GENERAL */}
          <TabsContent value="general" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-6 animate-in fade-in-50 duration-500">
            <Card className="shadow-sm border-border/50">
              <CardHeader className="bg-muted/10 border-b border-border/50">
                <CardTitle>Maintenance & Health</CardTitle>
                <CardDescription>Global system flags and operational status.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex flex-row items-center justify-between rounded-lg border border-destructive/30 p-4 shadow-sm bg-destructive/5">
                  <div className="space-y-1 pr-6">
                    <Label className="font-semibold text-base text-destructive">Maintenance Mode</Label>
                    <p className="text-[13px] text-destructive/80 font-medium">
                      Suspends processing of all incoming WhatsApp messages. Highly recommended when performing core system upgrades.
                    </p>
                  </div>
                  <Switch 
                    checked={settings.WA_MAINTENANCE_MODE === 'true'}
                    onCheckedChange={(c) => handleChange('WA_MAINTENANCE_MODE', c ? 'true' : 'false')}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/50 pt-6 flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* AI CONFIG */}
          <TabsContent value="ai" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-6 animate-in fade-in-50 duration-500">
            <Card className="shadow-sm border-border/50">
              <CardHeader className="bg-muted/10 border-b border-border/50">
                <CardTitle>AI Configuration</CardTitle>
                <CardDescription>Configure core language models and API authentication.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey" className="font-semibold text-sm">Gemini API Key</Label>
                    <Input 
                      id="apiKey"
                      type="password" 
                      placeholder="AIzaSy..." 
                      className="font-mono bg-muted/20"
                      value={settings.AI_API_KEY || ''}
                      onChange={(e) => handleChange('AI_API_KEY', e.target.value)}
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
              <CardFooter className="border-t border-border/50 pt-6 flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* WA WEBHOOK */}
          <TabsContent value="wa" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-6 animate-in fade-in-50 duration-500">
            <Card className="shadow-sm border-border/50">
              <CardHeader className="bg-muted/10 border-b border-border/50">
                <CardTitle>Messaging Parameters</CardTitle>
                <CardDescription>Configure how the webhook interprets and responds to WhatsApp events.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="prefix" className="font-semibold text-sm">Command Prefix</Label>
                  <Input 
                    id="prefix"
                    type="text" 
                    placeholder="/" 
                    className="font-mono bg-muted/20"
                    value={settings.WA_COMMAND_PREFIX || '/'}
                    onChange={(e) => handleChange('WA_COMMAND_PREFIX', e.target.value)}
                  />
                  <p className="text-[13px] text-muted-foreground">
                    Prefix character required to trigger interactive commands.
                  </p>
                </div>

                <div className="flex flex-row items-center justify-between rounded-lg border border-border p-4 shadow-sm bg-muted/10">
                  <div className="space-y-1 pr-6">
                    <Label className="font-semibold text-base">Reply to Unknown Commands</Label>
                    <p className="text-[13px] text-muted-foreground">
                      Sends a polite error message if an authorized user triggers a command that doesn't exist.
                    </p>
                  </div>
                  <Switch 
                    checked={settings.WA_REPLY_UNKNOWN === 'true'}
                    onCheckedChange={(c) => handleChange('WA_REPLY_UNKNOWN', c ? 'true' : 'false')}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/50 pt-6 flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* WHITELIST */}
          <TabsContent value="whitelist" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-6 animate-in fade-in-50 duration-500">
            <Card className="shadow-sm border-border/50 overflow-hidden">
              <CardHeader className="bg-muted/10 border-b border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Access Whitelist</CardTitle>
                    <CardDescription>Manage authorized WhatsApp JIDs (numbers & groups) allowed to interact with the bot.</CardDescription>
                  </div>
                  {whitelist.length === 0 && (
                    <div className="text-xs bg-amber-500/10 text-amber-600 px-3 py-1.5 rounded-full font-medium border border-amber-500/20 whitespace-nowrap">
                      Global Access Enabled (No Whitelist)
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <div className="p-4 border-b border-border/50 bg-background">
                <form onSubmit={handleAddWhitelist} className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="space-y-1.5 flex-1 w-full">
                    <Label htmlFor="newJid" className="text-[13px]">WhatsApp JID or Number</Label>
                    <Input 
                      id="newJid" 
                      placeholder="628123456789 or 1234-5678@g.us" 
                      value={newJid}
                      onChange={(e) => setNewJid(e.target.value)}
                      className="font-mono text-sm shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1 w-full">
                    <Label htmlFor="newName" className="text-[13px]">Alias / Name (Optional)</Label>
                    <Input 
                      id="newName" 
                      placeholder="e.g. Sales Group, John Doe" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="text-sm shadow-sm"
                    />
                  </div>
                  <Button type="submit" disabled={isAddingWhitelist || !newJid.trim()} className="w-full sm:w-auto mt-2 sm:mt-0 shadow-sm">
                    {isAddingWhitelist ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
                    Add Entry
                  </Button>
                </form>
              </div>

              {whitelist.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[80px]">Type</TableHead>
                      <TableHead>WhatsApp JID</TableHead>
                      <TableHead>Alias / Name</TableHead>
                      <TableHead className="w-[80px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whitelist.map((entry) => {
                      const isGroup = entry.jid.endsWith('@g.us');
                      return (
                        <TableRow key={entry.id} className="group">
                          <TableCell>
                            <div className="flex justify-center items-center w-8 h-8 rounded-full bg-muted/50 border border-border">
                              {isGroup ? <Users className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm font-medium">{entry.jid}</TableCell>
                          <TableCell className="text-muted-foreground">{entry.name || '—'}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                              onClick={() => handleDeleteWhitelist(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium">Whitelist is Empty</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Since there are no entries in the whitelist, the bot will respond to <strong>any</strong> WhatsApp number globally. Add an entry to restrict access.
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* EXPENSE */}
          <TabsContent value="expense" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-6 animate-in fade-in-50 duration-500">
            <Card className="shadow-sm border-border/50">
              <CardHeader className="bg-muted/10 border-b border-border/50">
                <CardTitle>Expense Tracker</CardTitle>
                <CardDescription>Configure currency and display preferences for the expense tracker.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="currency" className="font-semibold text-sm">Currency</Label>
                  <Select
                    value={settings.EXPENSE_CURRENCY || 'IDR'}
                    onValueChange={(val) => handleChange('EXPENSE_CURRENCY', val)}
                  >
                    <SelectTrigger id="currency" className="bg-muted/20">
                      <SelectValue placeholder="Select currency..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDR">🇮🇩 Indonesian Rupiah (IDR)</SelectItem>
                      <SelectItem value="USD">🇺🇸 US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">🇪🇺 Euro (EUR)</SelectItem>
                      <SelectItem value="SGD">🇸🇬 Singapore Dollar (SGD)</SelectItem>
                      <SelectItem value="MYR">🇲🇾 Malaysian Ringgit (MYR)</SelectItem>
                      <SelectItem value="JPY">🇯🇵 Japanese Yen (JPY)</SelectItem>
                      <SelectItem value="GBP">🇬🇧 British Pound (GBP)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[13px] text-muted-foreground">
                    All amounts on the expense page and in WhatsApp replies will be formatted in this currency.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/50 pt-6 flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
