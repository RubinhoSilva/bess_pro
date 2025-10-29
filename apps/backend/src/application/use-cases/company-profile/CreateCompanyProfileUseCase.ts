import { ICompanyProfileRepository } from "../../../domain/repositories/ICompanyProfileRepository";
import { ITeamRepository } from "../../../domain/repositories/ITeamRepository";
import { Result } from "../../common/Result";
import { CreateCompanyProfileCommand } from "../../dtos/input/company-profile/CreateCompanyProfileCommand";
import { CompanyProfileResponseDto } from "../../dtos/output/CompanyProfileResponseDto";
import { CompanyProfileMapper } from "../../mappers/CompanyProfileMapper";
import { CompanyProfile } from "../../../domain/entities/CompanyProfile";

export class CreateCompanyProfileUseCase {
  constructor(
    private companyProfileRepository: ICompanyProfileRepository,
    private teamRepository: ITeamRepository
  ) {}

  async execute(teamId: string, command: CreateCompanyProfileCommand): Promise<Result<CompanyProfileResponseDto>> {
    try {
      // Verificar se Team já tem CompanyProfile
      const existingCompanyProfile = await this.companyProfileRepository.findByTeamId(teamId);
      if (existingCompanyProfile) {
        return Result.failure('Team já possui um perfil de empresa cadastrado');
      }

      // Validações básicas
      if (!command.companyName || command.companyName.trim().length === 0) {
        return Result.failure('Nome da empresa é obrigatório');
      }

      // Verificar se já existe uma empresa com o mesmo nome
      const existingByName = await this.companyProfileRepository.findByCompanyName(command.companyName);
      if (existingByName) {
        return Result.failure('Já existe uma empresa com este nome');
      }

      // Validar email se fornecido
      if (command.email && !CompanyProfile.validateEmail(command.email)) {
        return Result.failure('Email inválido');
      }
      
      // Validar telefone se fornecido
      if (command.phone && !CompanyProfile.validatePhone(command.phone)) {
        return Result.failure('Telefone inválido');
      }

      // Validar CEP se fornecido
      if (command.zipCode && !CompanyProfile.validateZipCode(command.zipCode)) {
        return Result.failure('CEP inválido');
      }

      // Criar o perfil da empresa com teamId
      const companyProfile = CompanyProfile.create({
        companyName: command.companyName,
        tradingName: command.tradingName,
        taxId: command.taxId,
        stateRegistration: command.stateRegistration,
        municipalRegistration: command.municipalRegistration,
        phone: command.phone,
        email: command.email,
        logoUrl: command.logoUrl,
        logoPath: command.logoPath,
        website: command.website,
        address: command.address,
        city: command.city,
        state: command.state,
        zipCode: command.zipCode,
        country: command.country,
        isActive: command.isActive,
        teamId: teamId // teamId vem do token, não do command
      });

      // Salvar no repositório
      const createdCompanyProfile = await this.companyProfileRepository.create(companyProfile);

      // Atualizar Team com companyProfileId
      const team = await this.teamRepository.findById(teamId);
      if (team) {
        team.setCompanyProfile(createdCompanyProfile.getId());
        await this.teamRepository.update(team.getId(), team);
      }

      // Retornar a resposta
      const responseDto = CompanyProfileMapper.toResponseDto(createdCompanyProfile);
      return Result.success(responseDto);

    } catch (error: any) {
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}