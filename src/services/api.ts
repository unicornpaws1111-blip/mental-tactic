import {
  Article,
  Category,
  MediaItem,
  Product,
  HomepageSettings,
  DonationSettings,
  WebsiteSettings,
  DashboardStats,
  AuthStatus,
  User,
} from '../types';

const TOKEN_KEY = 'mental_tactic_admin_token';

export const authStorage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },
  clearToken: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

// Resolve API base URL: defaults to current origin (relative /api), with optional VITE_API_URL override
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function buildUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${cleanEndpoint}`;
}

const safeFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    return window.fetch(input, init);
  }
  return fetch(input, init);
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Only set application/json if there is a request body (e.g. POST, PUT, PATCH)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = buildUrl(endpoint);
  let response: Response;
  try {
    response = await safeFetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    const error: any = new Error(err?.message || 'Network request failed');
    error.isNetworkError = true;
    throw error;
  }

  const contentType = response.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else if (!contentType || !contentType.includes('application/json')) {
    // If an API request receives non-JSON (e.g. HTML fallback from SPA rewrite), throw clear error
    if (endpoint.startsWith('/api/')) {
      const error: any = new Error(`API endpoint ${endpoint} returned non-JSON response.`);
      error.status = response.status || 502;
      error.isNonJson = true;
      throw error;
    }
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data as T;
}

export const api = {
  // Public Data (Aggregated)
  getPublicData: async (): Promise<{
    homepage: HomepageSettings;
    articles: Article[];
    products: Product[];
    donations: DonationSettings;
    settings: WebsiteSettings;
  }> => {
    return request('/api/public/data');
  },

  // Auth
  getAuthStatus: async (): Promise<AuthStatus> => {
    return request<AuthStatus>('/api/auth/status');
  },

  setupAdmin: async (credentials: { email: string; username?: string; password: string }): Promise<{ token: string; user: User }> => {
    const res = await request<{ message: string; token: string; user: User }>('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res && typeof res === 'object' && 'token' in res && typeof res.token === 'string') {
      authStorage.setToken(res.token);
    }
    return res;
  },

  getAuthConfig: async (): Promise<{ googleClientId: string; firebase?: any }> => {
    return request<{ googleClientId: string; firebase?: any }>('/api/auth/config');
  },

  register: async (credentials: { email: string; username: string; password: string }): Promise<{ token: string; user: User }> => {
    const res = await request<{ message: string; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res && typeof res === 'object' && 'token' in res && typeof res.token === 'string') {
      authStorage.setToken(res.token);
    }
    return res;
  },

  loginWithGoogle: async (credential: string): Promise<{ token: string; user: User } | null> => {
    try {
      const res = await request<{ message: string; token: string; user: User }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
      if (res && typeof res === 'object' && 'token' in res && typeof res.token === 'string') {
        authStorage.setToken(res.token);
        return res;
      }
      return null;
    } catch (err) {
      console.warn('Backend loginWithGoogle unavailable:', err);
      return null;
    }
  },

  login: async (credentials: { email: string; password: string }): Promise<{ token: string; user: User }> => {
    const res = await request<{ message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res && typeof res === 'object' && 'token' in res && typeof res.token === 'string') {
      authStorage.setToken(res.token);
    }
    return res;
  },

  logout: async (): Promise<void> => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore logout network errors
    } finally {
      authStorage.clearToken();
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    return request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    return request<DashboardStats>('/api/dashboard/stats');
  },

  // Articles
  getArticles: async (params?: { search?: string; category?: string; status?: string; sort?: string; admin?: boolean }): Promise<{ articles: Article[] }> => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.admin) query.set('admin', '1');

    const qs = query.toString();
    return request<{ articles: Article[] }>(`/api/articles${qs ? `?${qs}` : ''}`);
  },

  getArticle: async (slugOrId: string): Promise<{ article: Article }> => {
    return request<{ article: Article }>(`/api/articles/${encodeURIComponent(slugOrId)}`);
  },

  createArticle: async (articleData: Partial<Article>): Promise<{ message: string; article: Article }> => {
    return request<{ message: string; article: Article }>('/api/articles', {
      method: 'POST',
      body: JSON.stringify(articleData),
    });
  },

  updateArticle: async (id: string, articleData: Partial<Article>): Promise<{ message: string; article: Article }> => {
    return request<{ message: string; article: Article }>(`/api/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(articleData),
    });
  },

  toggleArticleStatus: async (id: string): Promise<{ message: string; article: Article }> => {
    return request<{ message: string; article: Article }>(`/api/articles/${id}/status`, {
      method: 'PATCH',
    });
  },

  deleteArticle: async (id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/api/articles/${id}`, {
      method: 'DELETE',
    });
  },

  // Categories
  getCategories: async (): Promise<{ categories: Category[] }> => {
    return request<{ categories: Category[] }>('/api/categories');
  },

  createCategory: async (categoryData: { name: string; slug?: string; description?: string; image?: string }): Promise<{ message: string; category: Category }> => {
    return request<{ message: string; category: Category }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  updateCategory: async (id: string, categoryData: Partial<Category>): Promise<{ message: string; category: Category }> => {
    return request<{ message: string; category: Category }>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  deleteCategory: async (id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Media
  getMedia: async (search?: string): Promise<{ media: MediaItem[] }> => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<{ media: MediaItem[] }>(`/api/media${qs}`);
  },

  uploadMedia: async (file: File): Promise<{ message: string; media: MediaItem }> => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ message: string; media: MediaItem }>('/api/media/upload', {
      method: 'POST',
      body: formData,
    });
  },

  deleteMedia: async (id: string, force = false): Promise<{ message: string }> => {
    const qs = force ? '?force=true' : '';
    return request<{ message: string }>(`/api/media/${id}${qs}`, {
      method: 'DELETE',
    });
  },

  // Products
  getProducts: async (): Promise<{ products: Product[] }> => {
    return request<{ products: Product[] }>('/api/products');
  },

  createProduct: async (productData: Partial<Product>): Promise<{ message: string; product: Product }> => {
    return request<{ message: string; product: Product }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  updateProduct: async (id: string, productData: Partial<Product>): Promise<{ message: string; product: Product }> => {
    return request<{ message: string; product: Product }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  deleteProduct: async (id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/api/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Homepage Settings
  getHomepageSettings: async (): Promise<{ homepage: HomepageSettings }> => {
    return request<{ homepage: HomepageSettings }>('/api/homepage');
  },

  updateHomepageSettings: async (settings: Partial<HomepageSettings>): Promise<{ message: string; homepage: HomepageSettings }> => {
    return request<{ message: string; homepage: HomepageSettings }>('/api/homepage', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Donation Settings
  getDonationSettings: async (): Promise<{ donations: DonationSettings }> => {
    return request<{ donations: DonationSettings }>('/api/donations');
  },

  updateDonationSettings: async (settings: Partial<DonationSettings>): Promise<{ message: string; donations: DonationSettings }> => {
    return request<{ message: string; donations: DonationSettings }>('/api/donations', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Website Settings
  getWebsiteSettings: async (): Promise<{ settings: WebsiteSettings }> => {
    return request<{ settings: WebsiteSettings }>('/api/settings');
  },

  updateWebsiteSettings: async (settings: Partial<WebsiteSettings>): Promise<{ message: string; settings: WebsiteSettings }> => {
    return request<{ message: string; settings: WebsiteSettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};
