import { ICompanyProfileRepository } from "../../../domain/repositories/ICompanyProfileRepository";
import { Result } from "../../common/Result";
import { CreateCompanyProfileCommand } from "../../dtos/input/company-profile/CreateCompanyProfileCommand";
import { CompanyProfileResponseDto } from "../../dtos/output/CompanyProfileResponseDto";
import { CompanyProfileMapper } from "../../mappers/CompanyProfileMapper";
import { CompanyProfile } from "../../../domain/entities/CompanyProfile";

export class CreateCompanyProfileUseCase {
  constructor(
    private companyProfileRepository: ICompanyProfileRepository
  ) {}

  async execute(command: CreateCompanyProfileCommand): Promise<Result<CompanyProfileResponseDto>> {
    try {
      // Validações básicas
      if (!command.companyName || command.companyName.trim().length === 0) {
        return Result.failure('Nome da empresa é obrigatório');
      }

      // Verificar se já existe uma empresa com o mesmo nome
      const existingByName = await this.companyProfileRepository.findByCompanyName(command.companyName);
      if (existingByName) {
        return Result.failure('Já existe uma empresa com este nome');
      }

      // Verificar se já existe uma empresa com o mesmo CNPJ
      if (command.taxId) {
        const existingByTaxId = await this.companyProfileRepository.findByTaxId(command.taxId);
        if (existingByTaxId) {
          return Result.failure('Já existe uma empresa com este CNPJ');
        }

        // Validar formato do CNPJ
        if (!CompanyProfile.validateTaxId(command.taxId)) {
          return Result.failure('CNPJ inválido');
        }
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

      // Criar o perfil da empresa
      const companyProfile = CompanyProfileMapper.createCommandToDomain(command);

      // Salvar no repositório
      await this.companyProfileRepository.create(companyProfile);

      // Retornar a resposta
      const responseDto = CompanyProfileMapper.toResponseDto(companyProfile);
      return Result.success(responseDto);

    } catch (error: any) {
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}