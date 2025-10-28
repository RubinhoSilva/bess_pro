import { ICompanyProfileRepository } from "../../../domain/repositories/ICompanyProfileRepository";
import { Result } from "../../common/Result";
import { UpdateCompanyProfileCommand } from "../../dtos/input/company-profile/UpdateCompanyProfileCommand";
import { CompanyProfileResponseDto } from "../../dtos/output/CompanyProfileResponseDto";
import { CompanyProfileMapper } from "../../mappers/CompanyProfileMapper";
import { CompanyProfile } from "../../../domain/entities/CompanyProfile";

export class UpdateCompanyProfileUseCase {
  constructor(
    private companyProfileRepository: ICompanyProfileRepository
  ) {}

  async execute(companyProfileId: string, command: UpdateCompanyProfileCommand): Promise<Result<CompanyProfileResponseDto>> {
    try {
      const companyProfile = await this.companyProfileRepository.findById(companyProfileId);

      if (!companyProfile) {
        return Result.failure('Perfil da empresa não encontrado');
      }

      // Verificar se está tentando alterar o nome para um que já existe
      if (command.companyName && command.companyName !== companyProfile.getCompanyName()) {
        const existingByName = await this.companyProfileRepository.findByCompanyName(command.companyName);
        if (existingByName && existingByName.getId() !== companyProfileId) {
          return Result.failure('Já existe uma empresa com este nome');
        }
      }

      // Verificar se está tentando alterar o CNPJ para um que já existe
      if (command.taxId && command.taxId !== companyProfile.getTaxId()) {
        const existingByTaxId = await this.companyProfileRepository.findByTaxId(command.taxId);
        if (existingByTaxId && existingByTaxId.getId() !== companyProfileId) {
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

      // Aplicar as mudanças
      CompanyProfileMapper.applyUpdateCommand(companyProfile, command);

      // Salvar as mudanças
      await this.companyProfileRepository.update(companyProfile);

      // Retornar a resposta
      const responseDto = CompanyProfileMapper.toResponseDto(companyProfile);
      return Result.success(responseDto);

    } catch (error: any) {
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}