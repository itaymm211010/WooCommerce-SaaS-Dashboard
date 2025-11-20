/**
 * Coolify API Service
 *
 * This service provides methods to interact with Coolify API
 * for deployments, logs, and application management.
 *
 * @see https://coolify.io/docs/api
 */

import { logger } from "./ProjectLogger";

interface CoolifyConfig {
  baseUrl: string;
  token: string;
}

interface CoolifyApplication {
  uuid: string;
  name: string;
  description?: string;
  git_repository?: string;
  git_branch?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface CoolifyDeployment {
  id: string;
  status: string;
  started_at?: string;
  finished_at?: string;
  logs?: string;
}

interface CoolifyApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class CoolifyService {
  private static instance: CoolifyService;
  private config: CoolifyConfig | null = null;

  private constructor() {
    this.initializeConfig();
  }

  static getInstance(): CoolifyService {
    if (!CoolifyService.instance) {
      CoolifyService.instance = new CoolifyService();
    }
    return CoolifyService.instance;
  }

  private initializeConfig(): void {
    const baseUrl = import.meta.env.VITE_COOLIFY_URL;
    const token = import.meta.env.VITE_COOLIFY_TOKEN;

    if (!baseUrl || !token || token === 'your_coolify_token_here') {
      logger.warning('Coolify API not configured. Please set VITE_COOLIFY_URL and VITE_COOLIFY_TOKEN in .env.local');
      return;
    }

    this.config = { baseUrl, token };
    logger.info('Coolify Service initialized', { context: { baseUrl } });
  }

  private isConfigured(): boolean {
    if (!this.config) {
      logger.error('Coolify API not configured');
      return false;
    }
    return true;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<CoolifyApiResponse<T>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Coolify API not configured. Please check your .env.local file.'
      };
    }

    try {
      const url = `${this.config!.baseUrl}${endpoint}`;

      logger.debug(`Coolify API Request: ${options.method || 'GET'} ${endpoint}`);

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config!.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Coolify API Error', new Error(errorText), {
          context: { status: response.status, endpoint, errorText }
        });

        return {
          success: false,
          error: `API Error (${response.status}): ${errorText}`
        };
      }

      const data = await response.json();

      logger.debug('Coolify API Response received', { context: { endpoint } });

      return {
        success: true,
        data: data as T
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Coolify API Request Failed', error as Error, {
        context: { endpoint }
      });

      return {
        success: false,
        error: `Network error: ${errorMessage}`
      };
    }
  }

  /**
   * Get list of all applications
   * @returns List of applications
   */
  async getApplications(): Promise<CoolifyApiResponse<CoolifyApplication[]>> {
    return this.makeRequest<CoolifyApplication[]>('/api/v1/applications');
  }

  /**
   * Get specific application by UUID
   * @param uuid - Application UUID
   */
  async getApplication(uuid: string): Promise<CoolifyApiResponse<CoolifyApplication>> {
    return this.makeRequest<CoolifyApplication>(`/api/v1/applications/${uuid}`);
  }

  /**
   * Deploy an application
   * @param uuid - Application UUID
   * @param force - Force rebuild (optional)
   */
  async deploy(uuid: string, force: boolean = false): Promise<CoolifyApiResponse<CoolifyDeployment>> {
    logger.info(`Initiating deployment for application: ${uuid}`, {
      context: { uuid, force }
    });

    return this.makeRequest<CoolifyDeployment>('/api/v1/deploy', {
      method: 'POST',
      body: JSON.stringify({ uuid, force })
    });
  }

  /**
   * Get deployment logs for an application
   * @param uuid - Application UUID
   * @param limit - Number of log lines (default: 100)
   */
  async getLogs(uuid: string, limit: number = 100): Promise<CoolifyApiResponse<{ logs: string }>> {
    return this.makeRequest<{ logs: string }>(
      `/api/v1/applications/${uuid}/logs?limit=${limit}`
    );
  }

  /**
   * Get deployment status
   * @param deploymentId - Deployment ID
   */
  async getDeploymentStatus(deploymentId: string): Promise<CoolifyApiResponse<CoolifyDeployment>> {
    return this.makeRequest<CoolifyDeployment>(`/api/v1/deployments/${deploymentId}`);
  }

  /**
   * Stop a running application
   * @param uuid - Application UUID
   */
  async stopApplication(uuid: string): Promise<CoolifyApiResponse<{ message: string }>> {
    logger.info(`Stopping application: ${uuid}`);

    return this.makeRequest<{ message: string }>(`/api/v1/applications/${uuid}/stop`, {
      method: 'POST'
    });
  }

  /**
   * Start a stopped application
   * @param uuid - Application UUID
   */
  async startApplication(uuid: string): Promise<CoolifyApiResponse<{ message: string }>> {
    logger.info(`Starting application: ${uuid}`);

    return this.makeRequest<{ message: string }>(`/api/v1/applications/${uuid}/start`, {
      method: 'POST'
    });
  }

  /**
   * Restart an application
   * @param uuid - Application UUID
   */
  async restartApplication(uuid: string): Promise<CoolifyApiResponse<{ message: string }>> {
    logger.info(`Restarting application: ${uuid}`);

    return this.makeRequest<{ message: string }>(`/api/v1/applications/${uuid}/restart`, {
      method: 'POST'
    });
  }

  /**
   * Check if Coolify API is accessible
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(`${this.config!.baseUrl}/api/health`, {
        headers: {
          'Authorization': `Bearer ${this.config!.token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get the current configuration status
   */
  getConfigStatus(): { configured: boolean; baseUrl?: string } {
    return {
      configured: this.config !== null,
      baseUrl: this.config?.baseUrl
    };
  }
}

// Export singleton instance
export const coolifyService = CoolifyService.getInstance();

// Export types for use in components
export type {
  CoolifyApplication,
  CoolifyDeployment,
  CoolifyApiResponse,
  CoolifyConfig
};
