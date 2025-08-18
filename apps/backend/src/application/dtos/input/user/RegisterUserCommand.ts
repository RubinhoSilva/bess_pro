export interface RegisterUserCommand {
  email: string;
  password: string;
  name: string;
  company?: string;
  role?: string;
}