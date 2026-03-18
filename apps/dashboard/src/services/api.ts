export interface Command {
  id: string;
  name: string;
  description?: string;
  script: string;
  enabled: boolean;
  createdAt: string;
}

export type CommandInput = Omit<Command, 'id' | 'createdAt'>;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Basic unauthorized handler
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('unauthorized'));
  }

  return response;
}

export const api = {
  async getCommands(): Promise<Command[]> {
    const response = await fetchWithAuth(`/commands`);
    if (!response.ok) throw new Error('Failed to fetch commands');
    return response.json();
  },

  async getCommand(id: string): Promise<Command> {
    const response = await fetchWithAuth(`/commands/${id}`);
    if (!response.ok) throw new Error('Command not found');
    return response.json();
  },

  async createCommand(data: CommandInput): Promise<Command> {
    const response = await fetchWithAuth(`/commands`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create command');
    return response.json();
  },

  async updateCommand(id: string, data: Partial<CommandInput>): Promise<Command> {
    const response = await fetchWithAuth(`/commands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update command');
    return response.json();
  },

  async deleteCommand(id: string): Promise<void> {
    const response = await fetchWithAuth(`/commands/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete command');
  },

  auth: {
    async login(username: string, password: string): Promise<{ token: string }> {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Login failed');
      }
      return response.json();
    },
    async verify(): Promise<any> {
      const response = await fetchWithAuth('/auth/me');
      if (!response.ok) throw new Error('Invalid token');
      return response.json();
    }
  },

  settings: {
    async getSettings(): Promise<Record<string, string>> {
      const response = await fetchWithAuth('/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
    async updateSettings(data: Record<string, string>): Promise<void> {
      const response = await fetchWithAuth('/settings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update settings');
    }
  },

  logs: {
    async getLogs(limit: number = 50): Promise<any[]> {
      const response = await fetchWithAuth(`/logs?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json();
    }
  }
};
