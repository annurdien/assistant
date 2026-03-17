/**
 * SDK client for @assistant/sdk.
 */

import { type Result } from '@assistant/core';

export interface ClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

export class AssistantClient {
  private readonly config: Required<ClientConfig>;

  constructor(config: ClientConfig) {
    this.config = {
      timeout: 10_000,
      ...config,
    };
  }

  getConfig(): Readonly<Required<ClientConfig>> {
    return this.config;
  }

  /** Placeholder for an SDK API call. */
  async ping(): Promise<Result<{ latency: number }>> {
    const start = Date.now();
    // TODO: implement real HTTP call
    await Promise.resolve();
    return { success: true, data: { latency: Date.now() - start } };
  }
}
