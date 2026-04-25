// ==========================================
// AirOps AI — API Client Service
// Communicates with the Express backend
// ==========================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ChatResponse {
  response: string;
  conversationId?: string;
  security: {
    piiMasked: boolean;
    jailbreakDetected: boolean;
    guardrailsPassed: boolean;
    violations: Array<{ rule: string; severity: string }>;
  };
}

interface VoiceSessionResponse {
  clientSecret: string;
  sessionId: string;
  expiresAt: number;
}

interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  timestamp: string;
  security: {
    piiMasking: boolean;
    safetyInjection: boolean;
    outputGuardrails: boolean;
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Health check
  async health(): Promise<HealthResponse> {
    return this.request('/api/health');
  }

  // Chat
  async sendMessage(message: string, conversationId?: string, pnr?: string): Promise<ChatResponse> {
    return this.request('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId, pnr }),
    });
  }

  // Voice
  async createVoiceSession(): Promise<VoiceSessionResponse> {
    return this.request('/api/voice/session', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }
}

export const api = new ApiClient(API_URL);
