export interface User {
  id: string;
  email: string;
  name: string;
  company: string;
  role: 'super_admin' | 'team_owner' | 'admin' | 'vendedor' | 'viewer';
  teamId?: string;
  status?: 'active' | 'pending' | 'inactive' | 'removed';
  logoUrl?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
