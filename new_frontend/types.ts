import { ReactNode } from 'react';

export type AppMode = 'dashboard' | 'hr' | 'analytics' | 'docs' | 'arc_marketplace';

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  timestamp: string;
  content: ReactNode;
  type?: 'text' | 'metrics' | 'file' | 'doc';
}

/** Shown in the header; optional overrides via VITE_APP_USER_* in .env.local */
export interface AppUser {
  displayName: string;
  email: string;
}

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
