export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  company: string;
  role: string;
  teamId?: string;
  status: 'active' | 'pending' | 'inactive' | 'removed';
  logoUrl?: string;
  createdAt: string;
}