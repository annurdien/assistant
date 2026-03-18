import React, { useState, useEffect } from 'react';
import { Play, Square, Trash2, Plus, Edit, Clock } from 'lucide-react';
import { api, type CronJob, type Command } from '../services/api';

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [commands, setCommands] = useState<Command[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [error, setError] = useState('');
  
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
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenModal = (job?: CronJob) => {
    setError('');
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await api.cron.updateJob(editingJob.id, formData);
      } else {
        await api.cron.createJob(formData);
      }
      handleCloseModal();
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save cron job');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this scheduled job?')) return;
    try {
      await api.cron.deleteJob(id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete job');
    }
  };

  const handleToggleState = async (job: CronJob) => {
    try {
      await api.cron.updateJob(job.id, { enabled: !job.enabled });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle job state');
    }
  };

  return (
    <>
      <div className="page-header d-print-none mb-4">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title d-flex align-items-center">
              <Clock className="me-2 text-primary" />
              Automated Tasks (CRON)
            </h2>
            <div className="text-muted mt-1">Schedule scripts to execute asynchronously and message users directly</div>
          </div>
          <div className="col-auto ms-auto d-print-none">
            <div className="btn-list">
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <Plus size={18} className="me-2" />
                Create Job
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-vcenter card-table table-striped">
              <thead>
                <tr>
                  <th>Command Target</th>
                  <th>Schedule (CRON)</th>
                  <th>Target JID (Phone)</th>
                  <th>Status</th>
                  <th className="w-1"></th>
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">
                      No automated jobs scheduled yet.
                    </td>
                  </tr>
                ) : (
                  jobs.map(job => (
                    <tr key={job.id}>
                      <td>
                        <div className="font-weight-medium">{job.commandName}</div>
                        <div className="text-muted text-xs">{job.id.substring(0,8)}...</div>
                      </td>
                      <td>
                        <code className="text-azure">{job.schedule}</code>
                      </td>
                      <td>
                        <div className="text-muted">{job.targetJid}</div>
                      </td>
                      <td>
                        {job.enabled ? 
                          <span className="badge bg-success-lt">Active</span> : 
                          <span className="badge bg-danger-lt">Paused</span>}
                      </td>
                      <td>
                        <div className="btn-group">
                          <button 
                            className="btn btn-icon btn-outline-secondary btn-sm"
                            onClick={() => handleToggleState(job)}
                            title={job.enabled ? "Pause Timer" : "Resume Timer"}
                          >
                            {job.enabled ? <Square size={16} /> : <Play size={16} />}
                          </button>
                          <button 
                            className="btn btn-icon btn-outline-primary btn-sm mx-1"
                            onClick={() => handleOpenModal(job)}
                            title="Edit Job"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="btn btn-icon btn-outline-danger btn-sm"
                            onClick={() => handleDelete(job.id)}
                            title="Delete Job"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal wrapper using pure Bootstrap syntax without full JS module loading restrictions */}
      {isModalOpen && (
        <>
          <div className="modal modal-blur fade show" style={{ display: 'block' }} tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">{editingJob ? 'Edit CRON Job' : 'Create New CRON Job'}</h5>
                    <button type="button" className="btn-close" onClick={handleCloseModal} aria-label="Close"></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Script Command</label>
                      <select 
                        className="form-select" 
                        value={formData.commandId}
                        onChange={e => setFormData({...formData, commandId: e.target.value})}
                        required
                      >
                        <option value="" disabled>Select a command to execute...</option>
                        {commands.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <small className="form-hint">The command executed by the VM when the timer fires.</small>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">CRON Schedule</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={formData.schedule}
                        onChange={e => setFormData({...formData, schedule: e.target.value})}
                        placeholder="0 8 * * *"
                        required
                      />
                      <small className="form-hint">Standard cron expression (e.g., <code>0 8 * * *</code> for daily at 8AM).</small>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Target JID (Recipient Phone)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={formData.targetJid}
                        onChange={e => setFormData({...formData, targetJid: e.target.value})}
                        placeholder="62812345678"
                        required
                      />
                      <small className="form-hint">The WhatsApp number that will receive the execution output.</small>
                    </div>

                    <div className="mb-3">
                       <label className="form-check form-switch cursor-pointer">
                         <input 
                           className="form-check-input" 
                           type="checkbox" 
                           checked={formData.enabled}
                           onChange={e => setFormData({...formData, enabled: e.target.checked})}
                         />
                         <span className="form-check-label">Enable immediate polling for this job</span>
                       </label>
                    </div>

                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-link link-secondary" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary ms-auto">
                      Save Job Timer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </>
  );
}
