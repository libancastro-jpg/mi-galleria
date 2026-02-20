const BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  "https://mi-galleria-final.cluster-9.preview.emergentcf.cloud";

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
    const url = `${BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (this.token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Si es 401 Unauthorized, forzar logout
    if (response.status === 401) {
      if (onUnauthorized) onUnauthorized();
    }

    // Intentar parsear JSON o mostrar error
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch (e) {
      // Esto evita "JSON Parse error: Unexpected character"
      throw new Error(text || "Respuesta no válida del servidor");
    }
  }

  get(endpoint: string) {
    return this.request(endpoint, { method: "GET" });
  }

  post(endpoint: string, body?: any) {
    return this.request(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put(endpoint: string, body?: any) {
    return this.request(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete(endpoint: string) {
    return this.request(endpoint, { method: "DELETE" });
  }
}

export const apiService = new ApiService();
export default apiService;