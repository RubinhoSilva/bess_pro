/**
 * Mapper class for converting financial analysis data to DTOs
 * Follows the same pattern as other mappers in the application
 */
export class FinancialAnalysisMapper {
  /**
   * Maps financial analysis data to a response DTO
   * @param financialAnalysis - The financial analysis data to map
   * @returns The response DTO
   */
  static toResponseDto(financialAnalysis: any): any {
    if (!financialAnalysis) {
      return null;
    }

    return {
      vpl: financialAnalysis.vpl || financialAnalysis.npv || 0,
      tir: financialAnalysis.tir || financialAnalysis.irr || 0,
      payback: financialAnalysis.payback || financialAnalysis.paybackPeriod || 0,
      economiaTotal: financialAnalysis.economiaTotal || financialAnalysis.totalSavings || 0,
      fluxoCaixa: financialAnalysis.fluxoCaixa || [],
      isViable: financialAnalysis.isViable ?? (financialAnalysis.vpl > 0),
    };
  }

  /**
   * Maps a list of financial analysis data to response DTOs
   * @param financialAnalyses - The list of financial analysis data to map
   * @returns The list of response DTOs
   */
  static toResponseDtoList(financialAnalyses: any[]): any[] {
    if (!financialAnalyses || financialAnalyses.length === 0) {
      return [];
    }

    return financialAnalyses.map(analysis => this.toResponseDto(analysis));
  }

  /**
   * Maps financial analysis data to a detailed response DTO with additional computed fields
   * @param financialAnalysis - The financial analysis data to map
   * @returns The detailed response DTO
   */
  static toDetailedResponseDto(financialAnalysis: any): any {
    const baseDto = this.toResponseDto(financialAnalysis);
    
    return {
      ...baseDto,
      // Additional computed fields
      roi: financialAnalysis.vpl > 0 ? 'positive' : 'negative',
      profitabilityIndex: financialAnalysis.vpl > 0 ? 
        (financialAnalysis.vpl / Math.abs(financialAnalysis.vpl)) : 0,
    };
  }

  /**
   * Maps request data to financial analysis object
   * @param data - The request data to map
   * @returns The financial analysis object
   */
  static fromRequestDto(data: any): any {
    return {
      vpl: data.vpl || data.npv || 0,
      tir: data.tir || data.irr || 0,
      payback: data.payback || data.paybackPeriod || 0,
      economiaTotal: data.economiaTotal || data.totalSavings || 0,
      fluxoCaixa: data.fluxoCaixa || [],
      isViable: data.isViable ?? (data.vpl > 0),
    };
  }
}