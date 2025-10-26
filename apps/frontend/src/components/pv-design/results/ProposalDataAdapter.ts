import { 
  ProposalRequest, 
  EmpresaData, 
  ClienteData, 
  SistemaData, 
  FinanceiroData,
  PerformanceData,
  MensalData,
  MetricasFinanceirasData,
  FluxoCaixaData
} from '@/services/proposalService';

// Interface para os dados do store
interface StoreData {
  customerData: any;
  energyData: any;
  systemData: any;
  budgetData: any;
  resultsData: any;
  systemSummaryData: any;
  aggregatedRoofData: any;
}

// Classe para adaptar dados do store para o formato da API
export class ProposalDataAdapter {
  /**
   * Converte os dados do store para o formato esperado pela API
   */
  static adaptStoreToProposal(storeData: StoreData): ProposalRequest {
    const {
      customerData,
      energyData,
      systemData,
      budgetData,
      resultsData,
      systemSummaryData,
      aggregatedRoofData
    } = storeData;

    const calculationResults = resultsData?.calculationResults || {};

    // Dados da empresa (valores padrão, podem ser configurados)
    const empresa: EmpresaData = {
      nome: "Solar Tech Brasil",
      cnpj: "12.345.678/0001-90",
      contato: "(11) 99999-9999 | contato@solarbrasil.com.br",
      missao: "Transformar energia solar em realidade para todos os brasileiros",
      fundacao: "2019",
      projetosConcluidos: "500+",
      potenciaTotal: "10 MWp instalados",
      clientesSatisfeitos: "99% de aprovação",
      observacoes: "Equipe especializada com certificação internacional"
    };

    // Dados do cliente
    const cliente: ClienteData = {
      nome: customerData?.name || "Cliente não informado",
      endereco: this.formatEndereco(customerData),
      consumoMensal: this.formatConsumoMensal(energyData),
      tarifaMedia: this.formatTarifaMedia(energyData)
    };

    // Dados do sistema
    const sistema: SistemaData = {
      potenciaPico: this.formatPotenciaPico(systemSummaryData),
      modulos: this.formatModulos(systemSummaryData),
      inversor: this.formatInversor(systemSummaryData),
      geracaoEstimada: this.formatGeracaoEstimada(systemSummaryData),
      garantiaModulos: "25 anos"
    };

    // Dados financeiros
    const financeiro: FinanceiroData = {
      valorTotal: this.formatValorTotal(budgetData),
      entrada: this.formatEntrada(budgetData),
      parcelas: this.formatParcelas(budgetData),
      validade: "30 dias",
      economiaAnual: this.formatEconomiaAnual(calculationResults)
    };

    // Dados técnicos resumo
    const dadosTecnicosResumo = this.extractDadosTecnicosResumo(calculationResults);

    // Dados técnicos performance
    const dadosTecnicosPerformance = this.extractDadosTecnicosPerformance(calculationResults);

    // Dados técnicos mensais
    const dadosTecnicosMensal = this.extractDadosTecnicosMensal(calculationResults);

    // Valor do investimento
    const valorInvestimento = this.extractValorInvestimento(budgetData);

    // Economia anual bruta
    const economiaAnualBruta = this.extractEconomiaAnualBruta(calculationResults);

    // Métricas financeiras
    const metricasFinanceiras = this.extractMetricasFinanceiras(calculationResults);

    // Dados de fluxo de caixa
    const dadosFluxoCaixa = this.extractDadosFluxoCaixa(calculationResults);

    return {
      empresa,
      cliente,
      sistema,
      financeiro,
      dadosTecnicosResumo,
      dadosTecnicosPerformance,
      dadosTecnicosMensal,
      valorInvestimento,
      economiaAnualBruta,
      metricasFinanceiras,
      dadosFluxoCaixa,
      logoUrl: undefined, // Pode ser configurado depois
      nomeArquivo: this.generateFileName(customerData)
    };
  }

  /**
   * Formata o endereço do cliente
   */
  private static formatEndereco(customerData: any): string {
    if (!customerData) return "Endereço não informado";
    
    const parts = [
      customerData.address,
      customerData.number,
      customerData.complement,
      customerData.neighborhood,
      customerData.city,
      customerData.state
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : "Endereço não informado";
  }

  /**
   * Formata o consumo mensal
   */
  private static formatConsumoMensal(energyData: any): string {
    if (!energyData) return "0 kWh/mês";
    
    const consumo = energyData.monthlyConsumption || energyData.consumoMensal || 0;
    return `${consumo} kWh/mês`;
  }

  /**
   * Formata a tarifa média
   */
  private static formatTarifaMedia(energyData: any): string {
    if (!energyData) return "R$ 0.00 / kWh";
    
    const tarifa = energyData.averageTariff || energyData.tarifaMedia || 0;
    return `R$ ${tarifa.toFixed(2)} / kWh`;
  }

  /**
   * Formata a potência de pico
   */
  private static formatPotenciaPico(systemSummaryData: any): string {
    if (!systemSummaryData) return "0 kWp";
    
    const potencia = systemSummaryData.potenciaPico || 0;
    return `${potencia.toFixed(2)} kWp`;
  }

  /**
   * Formata os módulos
   */
  private static formatModulos(systemSummaryData: any): string {
    if (!systemSummaryData) return "0x Painéis";
    
    const numeroModulos = systemSummaryData.numeroModulos || 0;
    const potenciaModulo = systemSummaryData.selectedModule?.potencia ||
                        systemSummaryData.selectedModule?.potenciaNominal ||
                        systemSummaryData.selectedModule?.power || 550; // valor padrão
    
    return `${numeroModulos}x Painéis ${potenciaModulo}Wp`;
  }

  /**
   * Formata o inversor
   */
  private static formatInversor(systemSummaryData: any): string {
    if (!systemSummaryData?.selectedInverters || systemSummaryData.selectedInverters.length === 0) {
      return "1x Inversor Padrão";
    }
    
    const inversores = systemSummaryData.selectedInverters.map((inv: any) => {
      const potencia = inv.potencia || inv.potenciaNominal || inv.potenciaNominalAC || 7.5; // valor padrão
      const marca = inv.marca || inv.brand || inv.manufacturer || "Marca";
      const modelo = inv.modelo || inv.model || inv.name || "Modelo";
      return `${potencia}kW ${marca} ${modelo}`;
    });
    
    return inversores.join(', ');
  }

  /**
   * Formata a geração estimada
   */
  private static formatGeracaoEstimada(systemSummaryData: any): string {
    if (!systemSummaryData) return "0 kWh/mês";
    
    const geracaoAnual = systemSummaryData.geracaoEstimadaAnual || 0;
    const geracaoMensal = geracaoAnual / 12;
    
    return `${geracaoMensal.toFixed(0)} kWh/mês`;
  }

  /**
   * Formata o valor total
   */
  private static formatValorTotal(budgetData: any): string {
    if (!budgetData) return "R$ 0,00";
    
    const valor = budgetData.totalInvestment || budgetData.valorTotal || 0;
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
  }

  /**
   * Formata a entrada
   */
  private static formatEntrada(budgetData: any): string {
    if (!budgetData) return "R$ 0,00";
    
    const valorTotal = budgetData.totalInvestment || budgetData.valorTotal || 0;
    const entradaPercentual = budgetData.entradaPercentual || 20;
    const entradaValor = valorTotal * (entradaPercentual / 100);
    
    return `R$ ${entradaValor.toFixed(2).replace('.', ',')}`;
  }

  /**
   * Formata as parcelas
   */
  private static formatParcelas(budgetData: any): string {
    if (!budgetData) return "1x de R$ 0,00";
    
    const valorTotal = budgetData.totalInvestment || budgetData.valorTotal || 0;
    const entradaPercentual = budgetData.entradaPercentual || 20;
    const numeroParcelas = budgetData.numeroParcelas || 12;
    
    const entradaValor = valorTotal * (entradaPercentual / 100);
    const valorFinanciado = valorTotal - entradaValor;
    const valorParcela = valorFinanciado / numeroParcelas;
    
    return `${numeroParcelas}x de R$ ${valorParcela.toFixed(2).replace('.', ',')}`;
  }

  /**
   * Formata a economia anual
   */
  private static formatEconomiaAnual(calculationResults: any): string {
    if (!calculationResults) return "R$ 0,00";
    
    const economia = calculationResults.economiaAnualEstimada || 
                    calculationResults.economiaAnualMedia || 
                    calculationResults.economiaProjetada || 
                    0;
    
    return `R$ ${economia.toFixed(2).replace('.', ',')}`;
  }

  /**
   * Extrai dados técnicos resumo
   */
  private static extractDadosTecnicosResumo(calculationResults: any): Record<string, string> {
    if (!calculationResults) return {};
    
    const dados: Record<string, string> = {};
    
    // Potência Total DC
    const potenciaDC = calculationResults.potenciaPico || calculationResults.potenciaSistema || 0;
    dados["Potência Total DC"] = `${potenciaDC.toFixed(2)} kWp`;
    
    // Geração DC (Teórica)
    const geracaoDC = calculationResults.geracaoAnual || 0;
    dados["Geração DC (Teórica)"] = `${geracaoDC.toFixed(0)} kWh/ano`;
    
    // Geração AC (Final)
    const geracaoAC = calculationResults.geracaoAnual * 0.85; // Estimativa de 85% de eficiência
    dados["Geração AC (Final)"] = `${geracaoAC.toFixed(0)} kWh/ano`;
    
    // Consumo Anual
    const consumoAnual = calculationResults.consumoAnual || 0;
    dados["Consumo Anual"] = `${consumoAnual.toFixed(0)} kWh/ano`;
    
    // Yield Específico
    const yieldEspecifico = calculationResults.yield || calculationResults.yieldEspecifico || 1500;
    dados["Yield Específico"] = `${yieldEspecifico.toFixed(1)} kWh/kWp`;
    
    // Performance Ratio (PR)
    const pr = calculationResults.performanceRatio || calculationResults.pr || 85;
    dados["Performance Ratio (PR)"] = `${pr.toFixed(1)} %`;
    
    // Fator de Capacidade
    const fatorCapacidade = calculationResults.fatorCapacidade || 21;
    dados["Fator de Capacidade"] = `${fatorCapacidade.toFixed(1)} %`;
    
    return dados;
  }

  /**
   * Extrai dados técnicos de performance
   */
  private static extractDadosTecnicosPerformance(calculationResults: any): PerformanceData[] {
    if (!calculationResults) return [];
    
    const performanceData: PerformanceData[] = [];
    
    // Se houver dados de inversores selecionados
    if (calculationResults.selectedInverters && calculationResults.selectedInverters.length > 0) {
      calculationResults.selectedInverters.forEach((inversor: any, index: number) => {
        const kwp = inversor.potencia || inversor.potenciaNominal || 0;
        const geracaoAnual = kwp * 1500; // Estimativa de 1500 kWh/kWp/ano
        const yieldEspecifico = 1500;
        const pr = 85;
        
        performanceData.push({
          inversorMppt: `INV-0${index + 1} (${kwp}kW)`,
          kwp: kwp.toFixed(2),
          geracaoAnual: geracaoAnual.toFixed(0),
          yieldEspecifico: yieldEspecifico.toFixed(1),
          pr: pr.toFixed(1)
        });
      });
    } else {
      // Dados padrão se não houver inversores
      const kwp = calculationResults.potenciaPico || 0;
      const geracaoAnual = kwp * 1500;
      
      performanceData.push({
        inversorMppt: `INV-01 (${kwp.toFixed(1)}kW) (Total)`,
        kwp: kwp.toFixed(2),
        geracaoAnual: geracaoAnual.toFixed(0),
        yieldEspecifico: "1500.0",
        pr: "85.0"
      });
    }
    
    return performanceData;
  }

  /**
   * Extrai dados técnicos mensais
   */
  private static extractDadosTecnicosMensal(calculationResults: any): MensalData[] {
    if (!calculationResults) return [];
    
    const mensalData: MensalData[] = [];
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    // Se houver dados de geração mensal
    if (calculationResults.geracaoEstimadaMensal && calculationResults.geracaoEstimadaMensal.length === 12) {
      const consumoMensal = calculationResults.consumoMensal || Array(12).fill(0);
      
      calculationResults.geracaoEstimadaMensal.forEach((geracao: number, index: number) => {
        const consumo = consumoMensal[index] || 0;
        const diferenca = geracao - consumo;
        
        mensalData.push({
          mes: meses[index],
          consumo: consumo,
          geracao: geracao,
          diferenca: diferenca
        });
      });
    } else {
      // Dados padrão se não houver dados mensais
      const geracaoAnual = calculationResults.geracaoAnual || 0;
      const geracaoMensalMedia = geracaoAnual / 12;
      const consumoMensalMedia = geracaoMensalMedia * 0.9; // 90% da geração
      
      meses.forEach((mes, index) => {
        mensalData.push({
          mes: mes,
          consumo: consumoMensalMedia,
          geracao: geracaoMensalMedia,
          diferenca: geracaoMensalMedia - consumoMensalMedia
        });
      });
    }
    
    return mensalData;
  }

  /**
   * Extrai o valor do investimento
   */
  private static extractValorInvestimento(budgetData: any): number {
    if (!budgetData) return 35000; // valor padrão para teste
    
    return budgetData.totalInvestment ||
           budgetData.valorTotal ||
           budgetData.custoTotal ||
           35000; // valor padrão para teste
  }

  /**
   * Extrai a economia anual bruta
   */
  private static extractEconomiaAnualBruta(calculationResults: any): number {
    if (!calculationResults) return 12780; // valor padrão para teste
    
    return calculationResults.economiaAnualEstimada ||
           calculationResults.economiaAnualMedia ||
           calculationResults.economiaProjetada ||
           calculationResults.economiaAnualBruta ||
           12780; // valor padrão para teste
  }

  /**
   * Extrai métricas financeiras
   */
  private static extractMetricasFinanceiras(calculationResults: any): MetricasFinanceirasData {
    if (!calculationResults) {
      return this.getDefaultMetricasFinanceiras();
    }
    
    // Tenta obter do advancedFinancial primeiro
    const advancedFinancial = calculationResults.advancedFinancial;
    if (advancedFinancial) {
      return {
        vpl: this.formatCurrency(advancedFinancial.vpl),
        tir: this.formatPercentage(advancedFinancial.tir),
        indiceLucratividade: this.formatNumber(advancedFinancial.indiceLucratividade),
        paybackSimples: this.formatYears(advancedFinancial.paybackSimples),
        paybackDescontado: this.formatYears(advancedFinancial.paybackDescontado),
        lcoe: this.formatCurrencyPerKWh(advancedFinancial.custoNiveladoEnergia),
        roiSimples: this.formatPercentage(advancedFinancial.roiSimples),
        economiaTotalNominal: this.formatCurrency(advancedFinancial.economiaTotalNominal),
        economiaTotalPresente: this.formatCurrency(advancedFinancial.economiaTotalPresente)
      };
    }
    
    // Se não houver advancedFinancial, usa os dados diretos
    return {
      vpl: this.formatCurrency(calculationResults.vpl),
      tir: this.formatPercentage(calculationResults.tir),
      indiceLucratividade: this.formatNumber(calculationResults.indiceLucratividade),
      paybackSimples: this.formatYears(calculationResults.paybackSimples || calculationResults.payback),
      paybackDescontado: this.formatYears(calculationResults.paybackDescontado),
      lcoe: this.formatCurrencyPerKWh(calculationResults.lcoe),
      roiSimples: this.formatPercentage(calculationResults.roi),
      economiaTotalNominal: this.formatCurrency(calculationResults.economiaTotal25Anos),
      economiaTotalPresente: this.formatCurrency(calculationResults.economiaTotalPresente)
    };
  }

  /**
   * Extrai dados de fluxo de caixa
   */
  private static extractDadosFluxoCaixa(calculationResults: any): FluxoCaixaData[] {
    if (!calculationResults) return [];
    
    // Tenta obter do advancedFinancial primeiro
    const advancedFinancial = calculationResults.advancedFinancial;
    if (advancedFinancial?.cashFlow && advancedFinancial.cashFlow.length > 0) {
      return advancedFinancial.cashFlow.map((item: any) => ({
        ano: item.ano || 0,
        fcNominal: item.fcNominal || item.fluxoNominal || 0,
        fcAcumNominal: item.fcAcumNominal || item.fluxoAcumuladoNominal || 0,
        fcDescontado: item.fcDescontado || item.fluxoDescontado || 0,
        fcAcumDescontado: item.fcAcumDescontado || item.fluxoAcumuladoDescontado || 0
      }));
    }
    
    // Se não houver advancedFinancial, tenta do fluxoCaixa direto
    if (calculationResults.fluxoCaixa && calculationResults.fluxoCaixa.length > 0) {
      return calculationResults.fluxoCaixa.map((item: any) => ({
        ano: item.ano || 0,
        fcNominal: item.fcNominal || item.fluxoNominal || 0,
        fcAcumNominal: item.fcAcumNominal || item.fluxoAcumuladoNominal || 0,
        fcDescontado: item.fcDescontado || item.fluxoDescontado || 0,
        fcAcumDescontado: item.fcAcumDescontado || item.fluxoAcumuladoDescontado || 0
      }));
    }
    
    // Se não houver dados de fluxo de caixa, retorna array vazio
    return [];
  }

  /**
   * Gera nome do arquivo
   */
  private static generateFileName(customerData: any): string {
    const nomeCliente = customerData?.name || "proposta";
    const dataAtual = new Date().toISOString().split('T')[0];
    return `proposta-${nomeCliente.replace(/\s+/g, '-')}-${dataAtual}.pdf`;
  }

  /**
   * Formata valor monetário
   */
  private static formatCurrency(value: any): string {
    if (value === undefined || value === null) return "R$ 0,00";
    return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
  }

  /**
   * Formata percentual
   */
  private static formatPercentage(value: any): string {
    if (value === undefined || value === null) return "0.0%";
    return `${Number(value).toFixed(1)}%`;
  }

  /**
   * Formata número
   */
  private static formatNumber(value: any): string {
    if (value === undefined || value === null) return "0.0";
    return Number(value).toFixed(1);
  }

  /**
   * Formata anos
   */
  private static formatYears(value: any): string {
    if (value === undefined || value === null) return "0.0 anos";
    return `${Number(value).toFixed(1)} anos`;
  }

  /**
   * Formata currency por kWh
   */
  private static formatCurrencyPerKWh(value: any): string {
    if (value === undefined || value === null) return "R$ 0.00/kWh";
    return `R$ ${Number(value).toFixed(2)}/kWh`;
  }

  /**
   * Retorna métricas financeiras padrão
   */
  private static getDefaultMetricasFinanceiras(): MetricasFinanceirasData {
    return {
      vpl: "R$ 0,00",
      tir: "0.0%",
      indiceLucratividade: "0.0",
      paybackSimples: "0.0 anos",
      paybackDescontado: "0.0 anos",
      lcoe: "R$ 0.00/kWh",
      roiSimples: "0.0%",
      economiaTotalNominal: "R$ 0,00",
      economiaTotalPresente: "R$ 0,00"
    };
  }
}

export default ProposalDataAdapter;