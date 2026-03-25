const BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL?.trim() ||
  'https://mi-galleria-backend.onrender.com';

// Callback para manejar logout cuando hay error 401
let onUnauthorized: (() => void) | null = null;

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  setOnUnauthorized(callback: () => void) {
    onUnauthorized = callback;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const base = BASE_URL.replace(/\/+$/, '');
    const url = `${base}/api${ep}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      // Si expira o es inválido el token
      if (response.status === 401) {
        if (onUnauthorized) onUnauthorized();
      }

      const text = await response.text();
      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!response.ok) {
        throw new Error(
          typeof data === 'string'
            ? data
            : data?.message || data?.detail || `HTTP ${response.status}`
        );
      }

      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  async get(endpoint: string, params?: Record<string, string>) {
    let url = endpoint;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url = `${endpoint}?${searchParams.toString()}`;
    }

    return this.request(url, { method: 'GET' });
  }

  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();