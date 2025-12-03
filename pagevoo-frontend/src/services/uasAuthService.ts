/**
 * UAS Auth Service
 *
 * Handles all User Access System authentication for end-users on published sites.
 * This is separate from the admin auth (api.ts) - this is for website visitors.
 */

import React from 'react';
import axios, { type AxiosInstance } from 'axios';

// Types
export interface UasUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  group_id: number;
  group?: {
    id: number;
    name: string;
    slug: string;
    hierarchy_level: number;
    permissions: Record<string, boolean>;
  };
  status: 'pending' | 'active' | 'suspended';
  email_verified: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface UasSession {
  expires_at: string;
  remember_me: boolean;
}

export interface SecurityQuestion {
  id: number;
  question: string;
}

export interface UasAuthState {
  isAuthenticated: boolean;
  user: UasUser | null;
  session: UasSession | null;
  loading: boolean;
}

// Storage keys
const UAS_SESSION_TOKEN_KEY = 'uas_session_token';
const UAS_USER_KEY = 'uas_user';

class UasAuthService {
  private client: AxiosInstance;
  private listeners: Set<(state: UasAuthState) => void> = new Set();
  private state: UasAuthState = {
    isAuthenticated: false,
    user: null,
    session: null,
    loading: true,
  };

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add session token to requests
    this.client.interceptors.request.use((config) => {
      const token = this.getSessionToken();
      if (token) {
        config.headers['X-Session-Token'] = token;
      }
      return config;
    });

    // Initialize from storage
    this.initializeFromStorage();
  }

  private initializeFromStorage() {
    const token = localStorage.getItem(UAS_SESSION_TOKEN_KEY);
    const userStr = localStorage.getItem(UAS_USER_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.state = {
          isAuthenticated: true,
          user,
          session: null,
          loading: true,
        };
        // Validate session with server
        this.validateSession();
      } catch {
        this.clearSession();
      }
    } else {
      this.state.loading = false;
    }
  }

  private async validateSession() {
    try {
      const response = await this.getCurrentUser();
      this.state = {
        isAuthenticated: true,
        user: response.user,
        session: response.session,
        loading: false,
      };
      localStorage.setItem(UAS_USER_KEY, JSON.stringify(response.user));
      this.notifyListeners();
    } catch {
      this.clearSession();
    }
  }

  private getSessionToken(): string | null {
    return localStorage.getItem(UAS_SESSION_TOKEN_KEY);
  }

  private setSession(token: string, user: UasUser, session?: UasSession) {
    localStorage.setItem(UAS_SESSION_TOKEN_KEY, token);
    localStorage.setItem(UAS_USER_KEY, JSON.stringify(user));
    this.state = {
      isAuthenticated: true,
      user,
      session: session || null,
      loading: false,
    };
    this.notifyListeners();
  }

  private clearSession() {
    localStorage.removeItem(UAS_SESSION_TOKEN_KEY);
    localStorage.removeItem(UAS_USER_KEY);
    this.state = {
      isAuthenticated: false,
      user: null,
      session: null,
      loading: false,
    };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: UasAuthState) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.state);
    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }

  getState(): UasAuthState {
    return this.state;
  }

  // ==================== REGISTRATION ====================

  /**
   * Step 1: Initiate registration - sends verification email
   */
  async initiateRegistration(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): Promise<{ message: string; token?: string }> {
    const response = await this.client.post('/v1/uas-auth/register', data);
    return response.data;
  }

  /**
   * Step 2: Verify email token
   */
  async verifyEmail(token: string): Promise<{
    message: string;
    email: string;
    security_questions: SecurityQuestion[];
  }> {
    const response = await this.client.post('/v1/uas-auth/verify-email', { token });
    return response.data;
  }

  /**
   * Step 3: Complete registration with security answers
   */
  async completeRegistration(data: {
    token: string;
    security_answers: Array<{ question_id: number; answer: string }>;
  }): Promise<{ message: string; user: UasUser }> {
    const response = await this.client.post('/v1/uas-auth/complete-registration', data);
    return response.data;
  }

  // ==================== LOGIN / LOGOUT ====================

  /**
   * Login
   */
  async login(data: {
    email: string;
    password: string;
    remember_me?: boolean;
  }): Promise<{ message: string; user: UasUser; session_token: string; expires_at: string }> {
    const response = await this.client.post('/v1/uas-auth/login', data);
    const { user, session_token, expires_at } = response.data;

    this.setSession(session_token, user, {
      expires_at,
      remember_me: data.remember_me || false,
    });

    return response.data;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await this.client.post('/v1/uas-auth/logout');
    } catch {
      // Even if API fails, clear local session
    }
    this.clearSession();
  }

  /**
   * Get current user from session
   */
  async getCurrentUser(): Promise<{ user: UasUser; session: UasSession }> {
    const response = await this.client.get('/v1/uas-auth/me');
    return response.data;
  }

  // ==================== PASSWORD RESET ====================

  /**
   * Step 1: Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ message: string; token?: string }> {
    const response = await this.client.post('/v1/uas-auth/forgot-password', { email });
    return response.data;
  }

  /**
   * Step 2: Verify reset token
   */
  async verifyResetToken(token: string): Promise<{
    message: string;
    security_questions: Array<{ id: number; question: string }>;
  }> {
    const response = await this.client.post('/v1/uas-auth/verify-reset-token', { token });
    return response.data;
  }

  /**
   * Step 3: Verify security questions
   */
  async verifySecurityQuestions(data: {
    token: string;
    answers: Array<{ question_id: number; answer: string }>;
  }): Promise<{ message: string }> {
    const response = await this.client.post('/v1/uas-auth/verify-security-questions', data);
    return response.data;
  }

  /**
   * Step 4: Reset password
   */
  async resetPassword(data: {
    token: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> {
    const response = await this.client.post('/v1/uas-auth/reset-password', data);
    return response.data;
  }

  // ==================== SECURITY QUESTIONS ====================

  /**
   * Get all available security questions
   */
  async getSecurityQuestions(): Promise<SecurityQuestion[]> {
    const response = await this.client.get('/v1/uas-auth/security-questions');
    return response.data;
  }

  // ==================== HELPER METHODS ====================

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    if (!this.state.user?.group?.permissions) return false;
    return this.state.user.group.permissions[permission] === true;
  }

  /**
   * Check if user is in a specific group
   */
  isInGroup(groupSlug: string): boolean {
    return this.state.user?.group?.slug === groupSlug;
  }

  /**
   * Check if user has admin-level access (hierarchy level 1)
   */
  isAdmin(): boolean {
    return this.state.user?.group?.hierarchy_level === 1;
  }

  /**
   * Get user's display name
   */
  getDisplayName(): string {
    if (!this.state.user) return 'Guest';
    if (this.state.user.display_name) return this.state.user.display_name;
    return `${this.state.user.first_name} ${this.state.user.last_name}`;
  }
}

// Export singleton instance
export const uasAuth = new UasAuthService();

// React hook for UAS auth state
export function useUasAuth(): UasAuthState {
  const [state, setState] = React.useState<UasAuthState>(uasAuth.getState());

  React.useEffect(() => {
    return uasAuth.subscribe(setState);
  }, []);

  return state;
}
