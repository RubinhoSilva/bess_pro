import { Migration } from './MigrationRunner';
import { Db } from 'mongodb';

export class RemoveUserIdAddTeamIdInvertersMigration implements Migration {
  version = '007';
  description = 'Remove userId and add teamId to inverters collection';
  
  async up(db: Db): Promise<void> {
    const invertersCollection = db.collection('inverters');
    
    console.log('🔧 Iniciando migração de inversores: userId -> teamId');
    
    // 1. Adicionar teamId baseado no userId se não existir
    const result1 = await invertersCollection.updateMany(
      { 
        teamId: { $exists: false },
        userId: { $exists: true, $ne: null }
      },
      { 
        $set: { 
          teamId: { $ifNull: ['$userId', 'default-team'] }
        }
      }
    );
    
    console.log(`✅ Atualizados ${result1.modifiedCount} inversores com teamId baseado no userId`);
    
    // 2. Para inversores sem userId, definir teamId padrão
    const result2 = await invertersCollection.updateMany(
      { 
        teamId: { $exists: false },
        userId: { $exists: false }
      },
      { 
        $set: { 
          teamId: 'default-team'
        }
      }
    );
    
    console.log(`✅ Atualizados ${result2.modifiedCount} inversores com teamId padrão`);
    
    // 3. Remover campo userId
    const result3 = await invertersCollection.updateMany(
      { userId: { $exists: true } },
      { 
        $unset: { userId: 1 }
      }
    );
    
    console.log(`✅ Removido userId de ${result3.modifiedCount} inversores`);
    
    // 4. Remover índices antigos baseados em userId
    try {
      await invertersCollection.dropIndex('userId_1');
      console.log('✅ Removido índice userId_1');
    } catch (error) {
      console.log('⚠️  Índice userId_1 não encontrado ou já removido');
    }
    
    try {
      await invertersCollection.dropIndex('userId_1_fabricante_1_modelo_1');
      console.log('✅ Removido índice userId_1_fabricante_1_modelo_1');
    } catch (error) {
      console.log('⚠️  Índice userId_1_fabricante_1_modelo_1 não encontrado ou já removido');
    }
    
    // 5. Criar novos índices baseados em teamId
    await invertersCollection.createIndex({ teamId: 1 });
    console.log('✅ Criado índice teamId_1');
    
    await invertersCollection.createIndex({ teamId: 1, fabricante: 1, modelo: 1 }, { unique: true });
    console.log('✅ Criado índice único teamId_1_fabricante_1_modelo_1');
    
    await invertersCollection.createIndex({ teamId: 1, potenciaSaidaCA: 1 });
    console.log('✅ Criado índice teamId_1_potenciaSaidaCA_1');
    
    console.log('🎉 Migração de inversores concluída com sucesso!');
  }
  
  async down(db: Db): Promise<void> {
    const invertersCollection = db.collection('inverters');
    
    console.log('⚠️  Iniciando rollback da migração de inversores: teamId -> userId');
    
    // Nota: Rollback limitado - não conseguimos recuperar os userIds originais
    // Apenas removemos teamId e recriamos userId com valor padrão
    
    // 1. Adicionar userId padrão baseado no teamId
    await invertersCollection.updateMany(
      { 
        userId: { $exists: false },
        teamId: { $exists: true }
      },
      { 
        $set: { 
          userId: '$teamId'
        }
      }
    );
    
    // 2. Remover teamId
    await invertersCollection.updateMany(
      { teamId: { $exists: true } },
      { 
        $unset: { teamId: 1 }
      }
    );
    
    // 3. Remover índices de teamId
    try {
      await invertersCollection.dropIndex('teamId_1');
      await invertersCollection.dropIndex('teamId_1_fabricante_1_modelo_1');
      await invertersCollection.dropIndex('teamId_1_potenciaSaidaCA_1');
    } catch (error) {
      console.log('⚠️  Alguns índices de teamId não encontrados');
    }
    
    // 4. Recriar índices de userId
    await invertersCollection.createIndex({ userId: 1 });
    await invertersCollection.createIndex({ userId: 1, fabricante: 1, modelo: 1 }, { unique: true });
    
    console.log('⚠️  Rollback concluído (com limitações)');
  }
}