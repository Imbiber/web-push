const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async register(email: string, password: string, name?: string) {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile() {
    return this.request('/api/v1/auth/profile');
  }

  // Project endpoints
  async getProjects() {
    return this.request('/api/v1/projects');
  }

  async getProject(id: string) {
    return this.request(`/api/v1/projects/${id}`);
  }

  async createProject(name: string) {
    return this.request('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async updateProject(id: string, name: string) {
    return this.request(`/api/v1/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  }

  async deleteProject(id: string) {
    return this.request(`/api/v1/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Subscription endpoints
  async getSubscriptions(projectId: string, page = 1, limit = 50, filters?: any) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    return this.request(`/api/v1/admin/${projectId}/subscriptions?${params.toString()}`);
  }

  async getSubscription(projectId: string, subscriptionId: string) {
    return this.request(`/api/v1/admin/${projectId}/subscriptions/${subscriptionId}`);
  }

  // Notification endpoints
  async sendNotification(projectId: string, data: any) {
    return this.request(`/api/v1/${projectId}/notifications/send`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getNotifications(projectId: string, page = 1, limit = 50) {
    return this.request(
      `/api/v1/${projectId}/notifications?page=${page}&limit=${limit}`
    );
  }

  async getNotification(projectId: string, notificationId: string) {
    return this.request(`/api/v1/${projectId}/notifications/${notificationId}`);
  }

  async getNotificationStats(projectId: string, notificationId: string) {
    return this.request(`/api/v1/${projectId}/notifications/${notificationId}/stats`);
  }

  async getAnalytics(projectId: string) {
    return this.request(`/api/v1/${projectId}/analytics`);
  }
}

export const apiClient = new ApiClient(API_URL);
export default apiClient;
