import { KanbanColumnModel } from '../mongodb/schemas/KanbanColumnSchema';
import { TeamModel } from '../mongodb/schemas/TeamSchema';
import { UserModel } from '../mongodb/schemas/UserSchema';

export async function seedKanbanColumns() {
  console.log('🌱 Seeding Kanban columns...');

  try {
    // Buscar todos os teams existentes
    const teams = await TeamModel.find({});
    
    if (teams.length === 0) {
      console.log('⚠️  No teams found, skipping Kanban column seeding');
      return;
    }

    // Colunas padrão baseadas no sistema antigo
    const defaultColumns = [
      { name: 'Lead Recebido', key: 'LEAD_RECEBIDO', position: 0, isDefault: true },
      { name: 'Pré-qualificação', key: 'PRE_QUALIFICACAO', position: 1, isDefault: true },
      { name: 'Proposta Enviada', key: 'PROPOSTA_ENVIADA', position: 2, isDefault: true },
      { name: 'Documentação Recebida', key: 'DOCUMENTACAO_RECEBIDA', position: 3, isDefault: true },
      { name: 'Projeto Aprovado', key: 'PROJETO_APROVADO', position: 4, isDefault: true },
      { name: 'Instalação Agendada', key: 'INSTALACAO_AGENDADA', position: 5, isDefault: true },
      { name: 'Sistema Entregue', key: 'SISTEMA_ENTREGUE', position: 6, isDefault: true },
      { name: 'Quarentena', key: 'QUARENTENA', position: 7, isDefault: true },
    ];

    let totalSeeded = 0;
    
    for (const team of teams) {
      // Verificar se o team já tem colunas
      const existingColumnsCount = await KanbanColumnModel.countDocuments({ teamId: team._id });
      
      if (existingColumnsCount === 0) {
        console.log(`📋 Creating default columns for team: ${team.name}`);
        
        // Criar colunas para o team
        const columnsToCreate = defaultColumns.map(col => ({
          teamId: team._id,
          name: col.name,
          key: col.key,
          position: col.position,
          isDefault: col.isDefault,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await KanbanColumnModel.insertMany(columnsToCreate);
        totalSeeded += columnsToCreate.length;
        
        console.log(`✅ Created ${columnsToCreate.length} columns for team ${team.name}`);
      } else {
        console.log(`📋 Team ${team.name} already has ${existingColumnsCount} columns, skipping...`);
      }
    }

    console.log(`🎉 Kanban columns seeding completed! Total columns created: ${totalSeeded}`);
    return true;

  } catch (error) {
    console.error('❌ Error seeding Kanban columns:', error);
    throw error;
  }
}