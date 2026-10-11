import type {
  ApiErrorResponse,
  DocumentResponse,
  QuizConfigRequest,
  QuizResponse,
  QuizSubmissionResult,
  SessionResponse,
  SubmitQuizRequest
} from '@quizbuzz/shared';

class ApiClient {
  private baseUrl = '/api/v1';
  private sessionId: string | null = null;

  constructor() {
    // Restore session ID from sessionStorage if available
    this.sessionId = sessionStorage.getItem('quizbuzz_session_id');
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  setSessionId(id: string | null) {
    this.sessionId = id;
    if (id) {
      sessionStorage.setItem('quizbuzz_session_id', id);
    } else {
      sessionStorage.removeItem('quizbuzz_session_id');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>)
    };

    if (this.sessionId) {
      headers['X-Session-ID'] = this.sessionId;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errorData: ApiErrorResponse;
      try {
        errorData = await res.json();
      } catch {
        errorData = {
          error: {
            code: 'INTERNAL_ERROR',
            message: `Request failed with status ${res.status}`
          }
        };
      }

      if (errorData.error?.code === 'SESSION_EXPIRED' || errorData.error?.code === 'SESSION_NOT_FOUND') {
        this.setSessionId(null);
      }

      throw errorData;
    }

    return res.json() as Promise<T>;
  }

  async createSession(): Promise<SessionResponse> {
    const data = await this.request<SessionResponse>('/sessions', {
      method: 'POST'
    });
    this.setSessionId(data.sessionId);
    return data;
  }

  async deleteSession(): Promise<void> {
    if (!this.sessionId) return;
    try {
      await this.request('/sessions/current', { method: 'DELETE' });
    } finally {
      this.setSessionId(null);
    }
  }

  async uploadDocument(file: File): Promise<DocumentResponse> {
    if (!this.sessionId) {
      await this.createSession();
    }

    const formData = new FormData();
    formData.append('file', file);

    return this.request<DocumentResponse>('/documents', {
      method: 'POST',
      body: formData
    });
  }

  async getCurrentDocument(): Promise<DocumentResponse> {
    return this.request<DocumentResponse>('/documents/current');
  }

  async deleteDocument(): Promise<void> {
    return this.request('/documents/current', { method: 'DELETE' });
  }

  async generateQuiz(config: QuizConfigRequest): Promise<QuizResponse> {
    return this.request<QuizResponse>('/quizzes', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }

  async getCurrentQuiz(): Promise<QuizResponse> {
    return this.request<QuizResponse>('/quizzes/current');
  }

  async submitQuiz(payload: SubmitQuizRequest): Promise<QuizSubmissionResult> {
    return this.request<QuizSubmissionResult>('/quizzes/current/submit', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async deleteQuiz(): Promise<void> {
    return this.request('/quizzes/current', { method: 'DELETE' });
  }
}

export const api = new ApiClient();
