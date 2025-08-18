import { UserId } from '../value-objects/UserId';

export interface RefreshTokenProps {
  id?: string;
  userId: string;
  token: string;
  expiresAt: Date;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class RefreshToken {
  private constructor(
    private readonly id: string,
    private readonly userId: UserId,
    private readonly token: string,
    private readonly expiresAt: Date,
    private readonly deviceInfo: string,
    private readonly ipAddress: string,
    private readonly userAgent: string,
    private readonly createdAt: Date = new Date(),
    private isRevoked: boolean = false
  ) {}

  static create(props: RefreshTokenProps): RefreshToken {
    const id = props.id || crypto.randomUUID();
    const userId = UserId.create(props.userId);

    if (!props.token || props.token.trim().length === 0) {
      throw new Error('Token é obrigatório');
    }

    if (!props.expiresAt || props.expiresAt <= new Date()) {
      throw new Error('Data de expiração deve ser futura');
    }

    return new RefreshToken(
      id,
      userId,
      props.token,
      props.expiresAt,
      props.deviceInfo || 'Unknown Device',
      props.ipAddress || 'Unknown IP',
      props.userAgent || 'Unknown User Agent',
      new Date(),
      false
    );
  }

  static generateToken(): string {
    // Gerar token seguro de 32 bytes em hexadecimal
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static createExpirationDate(daysFromNow: number = 30): Date {
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + daysFromNow);
    return expiration;
  }

  revoke(): void {
    this.isRevoked = true;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isRevoked && !this.isExpired();
  }

  belongsToUser(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  isSameDevice(deviceInfo: string, ipAddress: string, userAgent: string): boolean {
    return this.deviceInfo === deviceInfo && 
           this.ipAddress === ipAddress && 
           this.userAgent === userAgent;
  }

  // Getters
  getId(): string { return this.id; }
  getUserId(): UserId { return this.userId; }
  getToken(): string { return this.token; }
  getExpiresAt(): Date { return this.expiresAt; }
  getDeviceInfo(): string { return this.deviceInfo; }
  getIpAddress(): string { return this.ipAddress; }
  getUserAgent(): string { return this.userAgent; }
  getCreatedAt(): Date { return this.createdAt; }
  getIsRevoked(): boolean { return this.isRevoked; }
}