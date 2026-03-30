const BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL?.trim() ||
  'https://mi-galleria-backend.onrender.com';

// Callback global para manejar logout cuando hay 401 real con token activo
let onUnauthorized: (() => void | Promise<void>) | null = null;

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  setOnUnauthorized(callback: () => void | Promise<void>) {
    onUnauthorized = callback;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const base = BASE_URL.replace(/\/+$/, '');
    const url = `${base}/api${ep}`;

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    };

    // Solo poner Content-Type cuando realmente enviamos body JSON
    if (options.body !== undefined && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const text = await response.text();
      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      // Solo dispara logout si realmente había token activo
      if (response.status === 401 && this.token && onUnauthorized) {
        try {
          await onUnauthorized();
        } catch (logoutError) {
          console.log('Error ejecutando onUnauthorized:', logoutError);
        }
      }

      if (!response.ok) {
        throw new Error(
          typeof data === 'string'
            ? data
            : data?.message || data?.detail || `HTTP ${response.status}`
        );
      }

      return data;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error('La solicitud tardó demasiado. Intenta de nuevo.');
      }

      if (
        String(error?.message || '').includes('Network request failed') ||
        String(error?.message || '').toLowerCase().includes('network')
      ) {
        throw new Error('No se pudo conectar con el servidor.');
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async get(endpoint: string, params?: Record<string, string>) {
    let url = endpoint;

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url = `${endpoint}?${searchParams.toString()}`;
    }

    return this.request(url, { method: 'GET' });
  }

  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();