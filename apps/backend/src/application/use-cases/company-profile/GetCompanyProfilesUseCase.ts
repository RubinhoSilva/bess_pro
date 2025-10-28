import { ICompanyProfileRepository } from "../../../domain/repositories/ICompanyProfileRepository";
import { Result } from "../../common/Result";
import { CompanyProfileListResponseDto } from "../../dtos/output/CompanyProfileResponseDto";
import { CompanyProfileMapper } from "../../mappers/CompanyProfileMapper";

export class GetCompanyProfilesUseCase {
  constructor(
    private companyProfileRepository: ICompanyProfileRepository
  ) {}

  async execute(
    page: number = 1,
    pageSize: number = 10,
    activeOnly: boolean = true,
    searchTerm?: string
  ): Promise<Result<CompanyProfileListResponseDto>> {
    try {
      // Validações básicas
      if (page < 1) {
        return Result.failure('Página deve ser maior que 0');
      }

      if (pageSize < 1 || pageSize > 100) {
        return Result.failure('Tamanho da página deve estar entre 1 e 100');
      }

      let result;

      if (searchTerm && searchTerm.trim().length > 0) {
        // Busca com termo de pesquisa
        result = await this.companyProfileRepository.searchWithPagination(
          searchTerm.trim(),
          page,
          pageSize,
          activeOnly
        );
      } else {
        // Busca paginada normal
        result = await this.companyProfileRepository.findWithPagination(
          page,
          pageSize,
          activeOnly
        );
      }

      const responseDto = CompanyProfileMapper.toListResponseDto(
        result.companyProfiles,
        result.total,
        page,
        pageSize
      );

      return Result.success(responseDto);

    } catch (error: any) {
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }

  async executeAll(activeOnly: boolean = true): Promise<Result<CompanyProfileListResponseDto>> {
    try {
      const companyProfiles = await this.companyProfileRepository.findAll(activeOnly);

      const responseDto = CompanyProfileMapper.toListResponseDto(
        companyProfiles,
        companyProfiles.length,
        1,
        companyProfiles.length
      );

      return Result.success(responseDto);

    } catch (error: any) {
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}