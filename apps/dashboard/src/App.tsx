import { Routes, Route, Link } from 'react-router-dom';
import CommandList from './pages/CommandList';
import CommandEditor from './pages/CommandEditor';

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1>Assistant Dashboard</h1>
        </Link>
        <Link to="/new" className="btn btn-primary">
          + New Command
        </Link>
      </header>
      
      <main>
        <Routes>
          <Route path="/" element={<CommandList />} />
          <Route path="/new" element={<CommandEditor />} />
          <Route path="/commands/:id" element={<CommandEditor />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
