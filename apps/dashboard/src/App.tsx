import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Bot, TerminalSquare, List, Settings, LogOut, Clock, KeyRound, Activity } from 'lucide-react';
import CommandList from './pages/CommandList';
import CommandEditor from './pages/CommandEditor';
import CronPage from './pages/CronPage';
import Login from './pages/Login';
import LogsPage from './pages/LogsPage';
import SettingsPage from './pages/SettingsPage';
import { SecretsPage } from './pages/SecretsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="navbar navbar-vertical navbar-expand-lg" data-bs-theme="dark">
      <div className="container-fluid">
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#sidebar-menu" aria-controls="sidebar-menu" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <h1 className="navbar-brand navbar-brand-autodark">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <Bot size={24} className="text-primary me-2" />
            Assistant Admin
          </Link>
        </h1>
        <div className="collapse navbar-collapse" id="sidebar-menu">
          <ul className="navbar-nav pt-lg-3">
            <li className={`nav-item ${isActive('/') && location.pathname !== '/logs' && location.pathname !== '/settings' ? 'active' : ''}`}>
              <Link className="nav-link" to="/">
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  <TerminalSquare size={18} />
                </span>
                <span className="nav-link-title">
                  Commands
                </span>
              </Link>
            </li>
            <li className={`nav-item ${isActive('/logs') ? 'active' : ''}`}>
              <Link className="nav-link" to="/logs">
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  <List size={18} />
                </span>
                <span className="nav-link-title">
                  Logs
                </span>
              </Link>
            </li>
            <li className={`nav-item ${isActive('/cron') ? 'active' : ''}`}>
              <Link className="nav-link" to="/cron">
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  <Clock size={18} />
                </span>
                <span className="nav-link-title">
                  Automation (CRON)
                </span>
              </Link>
            </li>
            <li className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
              <Link className="nav-link" to="/settings">
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  <Settings size={18} />
                </span>
                <span className="nav-link-title">
                  Settings
                </span>
              </Link>
            </li>
            <li className={`nav-item ${isActive('/secrets') ? 'active' : ''}`}>
              <Link className="nav-link" to="/secrets">
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  <KeyRound size={18} />
                </span>
                <span className="nav-link-title">
                  Secure Vault
                </span>
              </Link>
            </li>
            <li className={`nav-item ${isActive('/analytics') ? 'active' : ''}`}>
              <Link className="nav-link" to="/analytics">
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  <Activity size={18} />
                </span>
                <span className="nav-link-title">
                  Analytics
                </span>
              </Link>
            </li>
          </ul>

          <div className="mt-auto p-3">
            <button className="btn btn-danger w-100" onClick={logout}>
              <LogOut size={18} className="me-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MainLayout() {
  return (
    <ProtectedRoute>
      <div className="page">
        <Sidebar />
        <div className="page-wrapper">
          <main className="page-body">
            <div className="container-xl">
              <Routes>
                <Route path="/" element={<CommandList />} />
                <Route path="/new" element={<CommandEditor />} />
                <Route path="/commands/:id" element={<CommandEditor />} />
                <Route path="/cron" element={<CronPage />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/secrets" element={<SecretsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<MainLayout />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
