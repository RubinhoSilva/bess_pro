import { UserModel } from '../mongodb/schemas/UserSchema';
import bcrypt from 'bcryptjs';

export async function seedAdminUser(): Promise<void> {
  console.log('Seeding admin user...');

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
    console.log('✅ Admin user created');
  } else {
    console.log('ℹ️ Admin user already exists');
  }
}
