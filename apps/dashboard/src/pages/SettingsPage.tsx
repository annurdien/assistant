import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Save, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    AI_API_KEY: '',
    AI_MODEL: 'gemini-2.5-flash',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.settings.getSettings();
      // Merge with defaults
      setSettings(prev => ({ ...prev, ...data }));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      await api.settings.updateSettings(settings);
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header d-print-none mb-4">
        <div className="row g-2 align-items-center">
          <div className="col">
            <h2 className="page-title">
              System Settings
            </h2>
            <div className="text-secondary mt-1">
              Configure AI providers, API keys, and global preferences.
            </div>
          </div>
        </div>
      </div>

      <div className="row row-cards">
        <div className="col-12">
          <form className="card" onSubmit={handleSave}>
            <div className="card-header">
              <h3 className="card-title">AI Configuration</h3>
            </div>
            
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <div className="d-flex">
                    <div><AlertCircle size={24} className="alert-icon" /></div>
                    <div>{error}</div>
                  </div>
                </div>
              )}
              {successMsg && (
                <div className="alert alert-success" role="alert">
                  {successMsg}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label required">Gemini API Key</label>
                <div>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="Enter your Google AI API Key" 
                    value={settings.AI_API_KEY || ''}
                    onChange={(e) => handleChange('AI_API_KEY', e.target.value)}
                  />
                  <small className="form-hint">
                    This key will be used dynamically by the Worker Service when evaluating <code>ctx.ai.ask()</code> calls.
                  </small>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label required">Gemini Model</label>
                <div>
                  <select 
                    className="form-select" 
                    value={settings.AI_MODEL || 'gemini-2.5-flash'}
                    onChange={(e) => handleChange('AI_MODEL', e.target.value)}
                  >
                    <option value="gemini-3.1-flash-lite-preview">gemini-3.1-flash-lite-preview</option>
                    <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
                    <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
                    <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                    <option value="gemini-3-pro-preview">gemini-3-pro-preview</option>
                    <option value="gemini-3-flash-preview">gemini-3-flash-preview</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="card-footer text-end">
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? <span className="spinner-border spinner-border-sm me-2" role="status"></span> : <Save size={18} className="me-2" />}
                Save Configuration
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
