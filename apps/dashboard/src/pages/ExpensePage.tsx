import { useState, useEffect, useCallback } from 'react';
import { api, formatCurrency, EXPENSE_CATEGORIES, CURRENCIES, type Expense, type ExpenseCategoryTotal } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Wallet, TrendingDown, Tag, CalendarDays } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  Food:          '#f97316',
  Transport:     '#3b82f6',
  Shopping:      '#a855f7',
  Entertainment: '#ec4899',
  Health:        '#22c55e',
  Other:         '#94a3b8',
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

async function fetchCurrency(): Promise<string> {
  try {
    const data = await api.settings.getSettings();
    return (data['EXPENSE_CURRENCY'] as string) || 'IDR';
  } catch {
    return 'IDR';
  }
}

export function ExpensePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [currency, setCurrency] = useState('IDR');
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [byCategory, setByCategory] = useState<ExpenseCategoryTotal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({ amount: '', note: '', category: 'Other' });
  const [submitting, setSubmitting] = useState(false);

  const fmt = useCallback((n: number) => formatCurrency(n, currency), [currency]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cur, data] = await Promise.all([
        fetchCurrency(),
        api.expenses.list({ month, year }),
      ]);
      setCurrency(cur);
      setExpenses(data.expenses);
      setByCategory(data.byCategory);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount.replace(/[^\d.]/g, ''));
    if (!amount || amount <= 0) { toast.error('Amount must be greater than 0'); return; }
    setSubmitting(true);
    try {
      await api.expenses.add({ amount, note: form.note || undefined, category: form.category });
      toast.success('Expense added');
      setForm({ amount: '', note: '', category: 'Other' });
      setDialogOpen(false);
      load();
    } catch {
      toast.error('Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.expenses.delete(id);
      toast.success('Expense deleted');
      load();
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const currencyInfo = CURRENCIES[currency] ?? CURRENCIES['IDR'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track and manage your monthly spending · {currencyInfo.label}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount ({currency})</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder={`e.g. ${currency === 'IDR' ? '50000' : '25.00'}`}
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note">Description</Label>
                <Input
                  id="note"
                  placeholder="e.g. lunch, taxi, groceries"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month / Year filter */}
      <div className="flex gap-3 flex-wrap">
        <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
          <SelectTrigger className="w-40">
            <CalendarDays className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Total Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{fmt(total)}</p>
            <p className="text-xs text-muted-foreground mt-1">{MONTHS[month - 1]} {year}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" /> Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{expenses.length}</p>
            <p className="text-xs text-muted-foreground mt-1">records this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Tag className="h-4 w-4" /> Biggest Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{byCategory[0]?.category ?? '–'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {byCategory[0] ? fmt(byCategory[0].total) : 'no data yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart + list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {byCategory.map(entry => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => fmt(Number(value ?? 0))}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                    iconSize={8}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="space-y-2 mt-2">
              {byCategory.map(c => (
                <div key={c.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[c.category] ?? '#94a3b8' }} />
                    <span className="text-muted-foreground">{c.category}</span>
                  </div>
                  <span className="font-medium tabular-nums">{fmt(c.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expense list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Expense List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Loading...</div>
            ) : expenses.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No expenses this month.<br />
                <span className="text-xs">Click "Add Expense" to start tracking.</span>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {expenses.map(exp => (
                  <div key={exp.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors group">
                    <div
                      className="w-2 h-8 rounded-full flex-shrink-0"
                      style={{ background: CATEGORY_COLORS[exp.category] ?? '#94a3b8' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {exp.note || '(no description)'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">{exp.category}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(exp.createdAt)}</span>
                        {exp.userJid && (
                          <span className="text-xs text-muted-foreground/60 font-mono truncate max-w-[120px]">{exp.userJid}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-foreground tabular-nums">{fmt(exp.amount)}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
                          <AlertDialogDescription>
                            <strong>{exp.note || '(no description)'}</strong> — {fmt(exp.amount)} will be permanently removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(exp.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
