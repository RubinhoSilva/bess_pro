import { UserModel } from '../mongodb/schemas/UserSchema';
import bcrypt from 'bcryptjs';

export async function seedAdminUser(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const adminExists = await UserModel.findOne({ email: adminEmail });
  
  if (!adminExists) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    const adminUser = new UserModel({
      email: adminEmail,
      passwordHash,
      name: 'Administrador',
      company: 'BESS Pro',
      role: 'super_admin',
    });

    await adminUser.save();
  } else {
    // SEMPRE garantir que o admin@gmail.com tenha role super_admin
    if (adminExists.role !== 'super_admin') {
      await UserModel.updateOne(
        { email: adminEmail },
        { 
          role: 'super_admin',
          name: 'Administrador',
          company: 'BESS Pro'
        }
      );
    }
  }
}
