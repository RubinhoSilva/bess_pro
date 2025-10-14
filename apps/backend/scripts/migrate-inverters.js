const { MongoClient } = require('mongodb');

async function migrateInverters() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db();
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
    
    // 6. Verificar resultados
    const totalInverters = await invertersCollection.countDocuments();
    const withTeamId = await invertersCollection.countDocuments({ teamId: { $exists: true } });
    const withUserId = await invertersCollection.countDocuments({ userId: { $exists: true } });
    
    console.log('\n📊 Resultados da migração:');
    console.log(`   Total de inversores: ${totalInverters}`);
    console.log(`   Com teamId: ${withTeamId}`);
    console.log(`   Com userId (restantes): ${withUserId}`);
    
    if (withUserId === 0) {
      console.log('\n🎉 Migração concluída com sucesso!');
    } else {
      console.log('\n⚠️  Ainda existem inversores com userId. Verifique manualmente.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  migrateInverters()
    .then(() => {
      console.log('✅ Migração de inversores concluída');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha na migração:', error);
      process.exit(1);
    });
}

module.exports = { migrateInverters };