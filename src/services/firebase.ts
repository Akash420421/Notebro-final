import { supabaseAuth, loginWithEmail, registerWithEmail, logoutUser, signOutUser, subscribeToAuth } from './supabase';
import { AuthUser } from '../types';

export type User = AuthUser;

export {
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  signOutUser,
  subscribeToAuth,
};

export const firebaseAuth = {
  getCurrentUser: () => supabaseAuth.getCurrentUser(),
  subscribe: (callback: (user: AuthUser | null) => void) => supabaseAuth.subscribe(callback),
  login: (email: string, pass: string) => supabaseAuth.login(email, pass),
  register: (email: string, pass: string, displayName: string) => supabaseAuth.register(email, pass, displayName),
  logout: () => supabaseAuth.logout(),
};
