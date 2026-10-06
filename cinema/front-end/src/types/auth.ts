
export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
}

export interface AuthResponse {
  user: User;
}

export interface VerifyEmailResponse {
  user: User;
}

export interface MessageResponse {
  message: string;
}