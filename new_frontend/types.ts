import { ReactNode } from 'react';
import type { UserResource } from '@clerk/types';

export type AppMode = 'dashboard' | 'hr' | 'analytics' | 'docs';

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  timestamp: string;
  content: ReactNode; // Can be text or complex components
  type?: 'text' | 'metrics' | 'file';
}

export type User = UserResource;

export interface PersonProfile {
  id: string;
  name: string;
  title: string;
  department?: string | null;
  email?: string | null;
  location?: string | null;
  phone?: string | null;
  skills?: string[];
  manager?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

export interface AuthState {
  user: User | null;
  session: unknown | null;
  loading: boolean;
}
