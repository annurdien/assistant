import { Routes, Route, Link } from 'react-router-dom';
import { Bot, Plus } from 'lucide-react';
import CommandList from './pages/CommandList';
import CommandEditor from './pages/CommandEditor';

function App() {
  return (
    <div className="page">
      <header className="navbar navbar-expand-md d-print-none">
        <div className="container-xl">
          <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <Bot size={24} className="text-primary me-2" />
              Assistant Dashboard
            </Link>
          </h1>
          <div className="navbar-nav flex-row order-md-last">
            <div className="nav-item">
              <Link to="/new" className="btn btn-primary">
                <Plus size={18} className="me-2" />
                New Command
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <div className="page-wrapper">
        <main className="page-body">
          <div className="container-xl">
            <Routes>
              <Route path="/" element={<CommandList />} />
              <Route path="/new" element={<CommandEditor />} />
              <Route path="/commands/:id" element={<CommandEditor />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
