import mongoose from 'mongoose';
import { seedAdminUser } from '../database/migrations/002_seed_admin_user';

async function seedAdmin() {
  try {
    // Conectar ao MongoDB
    const mongoUrl = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://admin:bess123456@mongodb:27017/bess_pro?authSource=admin';
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Executar seed do admin
    await seedAdminUser();
    console.log('🎉 Admin seeding completed successfully!');

    // Criar team para o admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    
    // Verificar se a conexão está estabelecida
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    
    const User = mongoose.connection.db.collection('users');
    const Team = mongoose.connection.db.collection('teams');
    
    const adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      // Verificar se já existe um team para este admin
      const existingTeam = await Team.findOne({ ownerId: adminUser._id });
      
      if (!existingTeam) {
        // Criar team para o admin
        const newTeam = await Team.insertOne({
          name: 'BESS Pro Team',
          description: 'Time principal da BESS Pro',
          ownerId: adminUser._id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Associar o usuário ao team
        await User.updateOne(
          { _id: adminUser._id },
          { 
            teamId: newTeam.insertedId,
            updatedAt: new Date()
          }
        );
        
        console.log('✅ Team created and associated with admin user');
      } else {
        // Garantir que o usuário tenha o teamId correto
        if (!adminUser.teamId) {
          await User.updateOne(
            { _id: adminUser._id },
            { 
              teamId: existingTeam._id,
              updatedAt: new Date()
            }
          );
          console.log('✅ Admin user associated with existing team');
        } else {
          console.log('ℹ️ Admin user already has a team');
        }
      }
    }
    
    console.log('🎉 Admin and team seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedAdmin();
}

export { seedAdmin };

