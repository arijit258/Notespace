import type { 
  User, 
  UserCreate, 
  Note, 
  NoteCreate, 
  NoteUpdate, 
  Token, 
  LoginCredentials,
  CollaboratorCreate,
  Collaborator,
  ActivityLog
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://notespace-api-backend.onrender.com';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  // Auth endpoints
  async register(data: UserCreate): Promise<{ message: string; user_id: number }> {
    return this.request<{ message: string; user_id: number }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(credentials: LoginCredentials): Promise<Token> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const token = await response.json();
    this.setToken(token.access_token);
    return token;
  }

  logout() {
    this.setToken(null);
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me');
  }

  // Notes endpoints
  async getNotes(search?: string): Promise<Note[]> {
    const query = search ? `?q=${encodeURIComponent(search)}` : '';
    return this.request<Note[]>(`/notes/${query}`);
  }

  async getSharedNotes(): Promise<Note[]> {
    return this.request<Note[]>('/notes/shared');
  }

  async getNote(id: number): Promise<Note> {
    return this.request<Note>(`/notes/${id}`);
  }

  async createNote(data: NoteCreate): Promise<Note> {
    return this.request<Note>('/notes/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNote(id: number, data: NoteUpdate): Promise<Note> {
    return this.request<Note>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: number): Promise<void> {
    return this.request<void>(`/notes/${id}`, {
      method: 'DELETE',
    });
  }

  // Collaboration endpoints
  async shareNote(noteId: number, data: CollaboratorCreate): Promise<Collaborator> {
    return this.request<Collaborator>(`/notes/${noteId}/share`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeCollaborator(noteId: number, collaboratorId: number): Promise<void> {
    return this.request<void>(`/notes/${noteId}/collaborators/${collaboratorId}`, {
      method: 'DELETE',
    });
  }

  async getCollaborators(noteId: number): Promise<Collaborator[]> {
    return this.request<Collaborator[]>(`/notes/${noteId}/collaborators`);
  }

  // Version history
  async getNoteVersions(noteId: number): Promise<Note[]> {
    return this.request<Note[]>(`/notes/${noteId}/versions`);
  }

  async getNoteVersion(noteId: number, version: number): Promise<Note> {
    return this.request<Note>(`/notes/${noteId}/versions/${version}`);
  }

  // Activity logs
  async getNoteActivityLogs(noteId: number): Promise<ActivityLog[]> {
    return this.request<ActivityLog[]>(`/notes/${noteId}/activity`);
  }

  // Users list (for sharing)
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users/');
  }
}

export const api = new ApiClient();
