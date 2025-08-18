export interface UpdateProfileCommand {
  userId: string;
  name?: string;
  company?: string;
  logoUrl?: string;
}