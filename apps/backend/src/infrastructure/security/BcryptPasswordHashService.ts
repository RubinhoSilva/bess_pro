import bcrypt from 'bcryptjs';
import { IPasswordHashService } from '../../application/services/IPasswordHashService';

export class BcryptPasswordHashService implements IPasswordHashService {
  private readonly saltRounds = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    console.log('🔑 Password verification:');
    console.log('Password:', password);
    console.log('Hash:', hash);
    const result = await bcrypt.compare(password, hash);
    console.log('Result:', result);
    return result;
  }
}
