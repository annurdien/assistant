import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Activity, AlertCircle } from 'lucide-react';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.logs.getLogs(100);
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="page-header d-print-none mb-4">
        <div className="row g-2 align-items-center">
          <div className="col">
            <h2 className="page-title">
              Execution Logs
            </h2>
            <div className="text-secondary mt-1">
              View the history of executed commands and their outputs
            </div>
          </div>
          <div className="col-auto ms-auto">
            <button className="btn btn-primary" onClick={loadLogs} disabled={isLoading}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          <div className="d-flex">
            <div><AlertCircle size={24} className="alert-icon" /></div>
            <div>
              <h4 className="alert-title">Failed to Load Logs</h4>
              <div className="text-secondary">{error}</div>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <div className="mt-3 text-secondary">Loading logs...</div>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="empty">
          <div className="empty-img">
            <Activity size={64} className="text-muted" strokeWidth={1.5} />
          </div>
          <p className="empty-title">No Logs Yet</p>
          <p className="empty-subtitle text-secondary">
            Command execution logs will appear here once your scripts are triggered.
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-vcenter card-table table-striped">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Command</th>
                  <th>Status</th>
                  <th>Output</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="text-secondary" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td><span className="badge bg-blue-lt">{log.commandName}</span></td>
                    <td>
                      {log.status === 'SUCCESS' ? (
                        <span className="status status-green">Success</span>
                      ) : (
                        <span className="status status-red">Failed</span>
                      )}
                    </td>
                    <td className="text-secondary" style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.output || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
