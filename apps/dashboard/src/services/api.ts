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

export const api = {
  async getCommands(): Promise<Command[]> {
    const response = await fetch(`${API_BASE_URL}/commands`);
    if (!response.ok) throw new Error('Failed to fetch commands');
    return response.json();
  },

  async getCommand(id: string): Promise<Command> {
    // We'll emulate getCommand by filtering the list since the backend might not have a GET /commands/:id route specified.
    const commands = await this.getCommands();
    const command = commands.find(c => c.id === id);
    if (!command) throw new Error('Command not found');
    return command;
  },

  async createCommand(data: CommandInput): Promise<Command> {
    const response = await fetch(`${API_BASE_URL}/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create command');
    return response.json();
  },

  async updateCommand(id: string, data: Partial<CommandInput>): Promise<Command> {
    const response = await fetch(`${API_BASE_URL}/commands/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update command');
    return response.json();
  },

  async deleteCommand(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/commands/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete command');
  }
};
