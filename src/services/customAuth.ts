/**
 * Note Bro Authentication Engine powered by Supabase
 * Provides 100% resilient Email & Password registration and login directly connected to Supabase
 */

import { supabaseAuth, loginWithEmail as supaLogin, registerWithEmail as supaRegister, logoutUser as supaLogout, subscribeToAuth } from './supabase';
import { AuthUser } from '../types';

export type CustomAuthUser = AuthUser;

export const customAuth = {
  getCurrentUser: () => supabaseAuth.getCurrentUser(),
  subscribe: (callback: (user: CustomAuthUser | null) => void) => supabaseAuth.subscribe(callback),
  login: (email: string, pass: string) => supabaseAuth.login(email, pass),
  register: (email: string, pass: string, displayName: string) => supabaseAuth.register(email, pass, displayName),
  logout: () => supabaseAuth.logout(),
};

export async function loginWithEmail(email: string, pass: string): Promise<CustomAuthUser> {
  return await supaLogin(email, pass);
}

export async function registerWithEmail(email: string, pass: string, displayName: string): Promise<CustomAuthUser> {
  return await supaRegister(email, pass, displayName);
}

export async function logoutUser(): Promise<void> {
  await supaLogout();
}

export const signOutUser = logoutUser;

export { subscribeToAuth };
