import bcrypt from 'bcryptjs';
import { IPasswordHashService } from '../../application/services/IPasswordHashService';

export class BcryptPasswordHashService implements IPasswordHashService {
  private readonly saltRounds = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const result = await bcrypt.compare(password, hash);
    return result;
  }
}
