import React, { useEffect, useState } from 'react';
import { Plus, Trash2, KeyRound, Loader2, Save, X } from 'lucide-react';
import { api, type Secret, type SecretInput } from '../services/api';

export function SecretsPage() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<SecretInput>({ key: '', value: '' });

  useEffect(() => {
    fetchSecrets();
  }, []);

  const fetchSecrets = async () => {
    try {
      setIsLoading(true);
      const data = await api.secret.list();
      setSecrets(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load secrets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, keyName: string) => {
    if (!window.confirm(`Are you sure you want to completely delete the secret for "${keyName}"? This will instantly break any scripts currently depending on it.`)) return;
    
    try {
      await api.secret.delete(id);
      fetchSecrets();
    } catch (err: any) {
      setError(err.message || 'Failed to delete secret');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.secret.create(formData);
      setIsModalOpen(false);
      setFormData({ key: '', value: '' });
      fetchSecrets();
    } catch (err: any) {
      setError(err.message || 'Failed to save secret');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Secure Vault</h1>
          <p className="text-gray-500">Inject encrypted Environment keys (e.g. API Keys) into your sandbox.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Secret</span>
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Resource Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Value Hash</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Last Modified</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {secrets.map((secret) => (
              <tr key={secret.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <KeyRound className="h-5 w-5 text-gray-400" />
                    <span className="font-medium font-mono text-gray-900">{secret.key}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-500">
                  •••••••••••••••••
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {new Date(secret.updatedAt).toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(secret.id, secret.key)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {secrets.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                  Your vault is currently empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">Inject Secure Key</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Key Name</label>
                <input
                  type="text"
                  required
                  placeholder="WEATHER_API_KEY"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 uppercase font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.key}
                  onChange={e => setFormData({ ...formData, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Secret Value</label>
                <input
                  type="password"
                  required
                  placeholder="sk_live_..."
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.value}
                  onChange={e => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Injection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
