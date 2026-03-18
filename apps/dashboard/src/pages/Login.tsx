import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Lock, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeProvider } from '../components/theme-provider';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { token } = await api.auth.login(username, password);
      login(token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="assistant-theme">
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/[0.02] via-transparent to-transparent" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative w-full max-w-sm mx-4">
          {/* Logo area */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <MessageSquare className="w-7 h-7 text-primary-foreground" fill="currentColor" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Assistant</h1>
          </div>

          {/* Login Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-2xl shadow-black/50 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2 text-xs">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="admin"
                    className="pl-8 h-9 bg-background border-border/60 focus-visible:ring-primary/50 text-sm"
                    value={username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-8 h-9 bg-background border-border/60 focus-visible:ring-primary/50 text-sm"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-9 mt-2 text-sm font-medium" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground/50 mt-6">
            &copy; {new Date().getFullYear()} Assistant
          </p>
        </div>
      </div>
    </ThemeProvider>
  );
}
