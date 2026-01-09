// User types
export interface User {
  id: number;
  email: string;
  is_active: boolean;
}

export interface UserCreate {
  email: string;
  password: string;
}

// Note types
export interface Note {
  id: number;
  title: string;
  content: string;
  version?: number;
  owner_id: number;
  created_at: string;
  updated_at: string;
  shared_with?: Collaborator[];
}

export interface NoteCreate {
  title: string;
  content: string;
}

export interface NoteUpdate {
  title?: string;
  content?: string;
}

// Collaborator types
export interface Collaborator {
  id: number;
  note_id: number;
  user_id: number;
  role: 'viewer' | 'editor';
  user?: User;
}

export interface CollaboratorCreate {
  email: string;
  role: 'viewer' | 'editor';
}

// Activity Log types
export interface ActivityLog {
  id: number;
  note_id: number;
  user_id: number;
  action: string;
  details?: string;
  timestamp: string;
}

// Auth types
export interface Token {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}
