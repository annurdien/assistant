import { Routes, Route } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './components/app-sidebar';
import CommandList from './pages/CommandList';
import CommandEditor from './pages/CommandEditor';
import CronPage from './pages/CronPage';
import Login from './pages/Login';
import LogsPage from './pages/LogsPage';
import SettingsPage from './pages/SettingsPage';
import { SecretsPage } from './pages/SecretsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

function DashboardLayout() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="assistant-theme">
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 overflow-auto bg-background min-h-screen">
          <div className="flex items-center px-4 py-2 min-h-12 md:hidden bg-card border-b border-border sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="ml-3 font-semibold text-sm tracking-tight text-foreground">Assistant Hub</h1>
          </div>
          <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-6 space-y-4">
            <Routes>
              <Route path="/" element={<CommandEditor />} />
              <Route path="/commands" element={<CommandList />} />
              <Route path="/cron" element={<CronPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/secrets" element={<SecretsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
            </Routes>
          </div>
        </main>
        <Toaster position="top-center" richColors />
      </SidebarProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;
