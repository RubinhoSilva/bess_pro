export interface ResetPasswordCommand {
  token: string;
  email: string;
  newPassword: string;
}