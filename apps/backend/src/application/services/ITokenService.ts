export interface ITokenService {
  generateToken(payload: any): Promise<string>;
  generateAccessToken(payload: any): string;
  verifyToken(token: string): Promise<any>;
  refreshToken(refreshToken: string): Promise<string>;
}