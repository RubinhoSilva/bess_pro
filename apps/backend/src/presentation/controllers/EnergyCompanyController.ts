import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { IEnergyCompanyRepository } from '../../domain/repositories/IEnergyCompanyRepository';
import { CreateEnergyCompanyUseCase, CreateEnergyCompanyInput } from '../../application/use-cases/energy-company/CreateEnergyCompanyUseCase';
import { EnergyCompanySeeder } from '../../infrastructure/database/seeds/EnergyCompanySeeder';

export class EnergyCompanyController extends BaseController {
  constructor(private energyCompanyRepository: IEnergyCompanyRepository) {
    super();
  }

  // GET /energy-companies - Listar todas as concessionárias ativas
  async getActiveEnergyCompanies(req: Request, res: Response): Promise<void> {
    try {
      const energyCompanies = await this.energyCompanyRepository.findActiveCompanies();
      this.ok(res, energyCompanies);
    } catch (error: any) {
      this.internalServerError(res, `Erro ao buscar concessionárias: ${error.message}`);
    }
  }

  // GET /energy-companies/all - Listar todas as concessionárias (admin)
  async getAllEnergyCompanies(req: Request, res: Response): Promise<void> {
    try {
      const energyCompanies = await this.energyCompanyRepository.findAll();
      this.ok(res, energyCompanies);
    } catch (error: any) {
      this.internalServerError(res, `Erro ao buscar concessionárias: ${error.message}`);
    }
  }

  // GET /energy-companies/state/:state - Buscar por estado
  async getEnergyCompaniesByState(req: Request, res: Response): Promise<void> {
    try {
      const { state } = req.params;
      
      if (!state || state.length !== 2) {
        this.badRequest(res, 'Estado deve ser informado no formato de 2 letras (ex: SP)');
        return;
      }

      const energyCompanies = await this.energyCompanyRepository.findByState(state.toUpperCase());
      this.ok(res, energyCompanies);
    } catch (error: any) {
      this.internalServerError(res, `Erro ao buscar concessionárias: ${error.message}`);
    }
  }

  // GET /energy-companies/:id - Buscar por ID
  async getEnergyCompanyById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const energyCompany = await this.energyCompanyRepository.findById(id);
      
      if (!energyCompany) {
        this.notFound(res, 'Concessionária não encontrada');
        return;
      }

      this.ok(res, energyCompany);
    } catch (error: any) {
      this.internalServerError(res, `Erro ao buscar concessionária: ${error.message}`);
    }
  }

  // POST /energy-companies - Criar nova concessionária (admin)
  async createEnergyCompany(req: Request, res: Response): Promise<void> {
    try {
      const input: CreateEnergyCompanyInput = req.body;

      // Validações básicas
      if (!input.name || !input.acronym || !input.region || !input.states) {
        this.badRequest(res, 'Nome, acrônimo, região e estados são obrigatórios');
        return;
      }

      if (!Array.isArray(input.states) || input.states.length === 0) {
        this.badRequest(res, 'Pelo menos um estado deve ser informado');
        return;
      }

      const createUseCase = new CreateEnergyCompanyUseCase(this.energyCompanyRepository);
      const energyCompany = await createUseCase.execute(input);

      this.created(res, energyCompany);
    } catch (error: any) {
      if (error.message.includes('já existe')) {
        this.conflict(res, error.message);
      } else {
        this.internalServerError(res, `Erro ao criar concessionária: ${error.message}`);
      }
    }
  }

  // PUT /energy-companies/:id - Atualizar concessionária (admin)
  async updateEnergyCompany(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Verificar se existe
      const existing = await this.energyCompanyRepository.findById(id);
      if (!existing) {
        this.notFound(res, 'Concessionária não encontrada');
        return;
      }

      // Validar estados se fornecidos
      if (updateData.states) {
        if (!Array.isArray(updateData.states) || updateData.states.length === 0) {
          this.badRequest(res, 'Pelo menos um estado deve ser informado');
          return;
        }
        
        const validStates = updateData.states.every((state: string) => 
          /^[A-Z]{2}$/.test(state.toUpperCase())
        );
        if (!validStates) {
          this.badRequest(res, 'Estados devem ser informados no formato de 2 letras (ex: SP, RJ, MG)');
          return;
        }
        
        updateData.states = updateData.states.map((state: string) => state.toUpperCase());
      }

      const updatedCompany = await this.energyCompanyRepository.update(id, updateData);
      
      if (!updatedCompany) {
        this.internalServerError(res, 'Erro ao atualizar concessionária');
        return;
      }

      this.ok(res, updatedCompany);
    } catch (error: any) {
      this.internalServerError(res, `Erro ao atualizar concessionária: ${error.message}`);
    }
  }

  // DELETE /energy-companies/:id - Excluir concessionária (admin)
  async deleteEnergyCompany(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar se existe
      const existing = await this.energyCompanyRepository.findById(id);
      if (!existing) {
        this.notFound(res, 'Concessionária não encontrada');
        return;
      }

      const deleted = await this.energyCompanyRepository.delete(id);
      
      if (!deleted) {
        this.internalServerError(res, 'Erro ao excluir concessionária');
        return;
      }

      this.ok(res, { message: 'Concessionária excluída com sucesso' });
    } catch (error: any) {
      this.internalServerError(res, `Erro ao excluir concessionária: ${error.message}`);
    }
  }

  // POST /energy-companies/seed - Executar seeder (admin)
  async seedEnergyCompanies(req: Request, res: Response): Promise<void> {
    try {
      await EnergyCompanySeeder.seed();
      this.ok(res, { message: 'Concessionárias populadas com sucesso', count: 19 });
    } catch (error: any) {
      this.internalServerError(res, `Erro ao popular concessionárias: ${error.message}`);
    }
  }
}