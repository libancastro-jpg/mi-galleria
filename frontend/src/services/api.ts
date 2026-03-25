const BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL?.trim() ||
  'https://mi-galleria-backend.onrender.com';

// Callback para manejar logout cuando hay error 401
let onUnauthorized: (() => void) | null = null;

type CacheEntry = {
  data: any;
  timestamp: number;
};

class ApiService {
  private token: string | null = null;

  // 🔥 Cache en memoria (clave = URL completa)
  private cache = new Map<string, CacheEntry>();

  // 🔥 Evita múltiples requests iguales simultáneos
  private pendingRequests = new Map<string, Promise<any>>();

  setToken(token: string | null) {
    this.token = token;
  }

  setOnUnauthorized(callback: () => void) {
    onUnauthorized = callback;
  }

  private buildUrl(endpoint: string) {
    const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const base = BASE_URL.replace(/\/+$/, '');
    return `${base}/api${ep}`;
  }

  private async request(endpoint: string, options: RequestInit = {}, useCache = false) {
    const url = this.buildUrl(endpoint);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const cacheKey = `${options.method || 'GET'}:${url}`;

    // 🔥 1. CACHE (solo GET)
    if (useCache && options.method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 15000) {
        return cached.data;
      }
    }

    // 🔥 2. EVITAR REQUEST DUPLICADO
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 🔥 más corto

    const requestPromise = (async () => {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

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

        // 🔥 Guardar en cache
        if (useCache && options.method === 'GET') {
          this.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
          });
        }

        return data;
      } finally {
        clearTimeout(timeout);
        this.pendingRequests.delete(cacheKey);
      }
    })();

    this.pendingRequests.set(cacheKey, requestPromise);

    return requestPromise;
  }

  async get(endpoint: string, params?: Record<string, string>, useCache = true) {
    let url = endpoint;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url = `${endpoint}?${searchParams.toString()}`;
    }

    return this.request(url, { method: 'GET' }, useCache);
  }

  async post(endpoint: string, data?: any) {
    this.invalidateCache('/aves'); // 🔥 limpiar cache
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any) {
    this.invalidateCache('/aves');
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string) {
    this.invalidateCache('/aves');
    return this.request(endpoint, { method: 'DELETE' });
  }

  // 🔥 limpiar cache relacionada
  invalidateCache(endpointStartsWith: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(endpointStartsWith)) {
        this.cache.delete(key);
      }
    }
  }
}

export const api = new ApiService();