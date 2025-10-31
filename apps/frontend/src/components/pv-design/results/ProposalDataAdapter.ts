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

    // Validação de dados essenciais
    if (!energyData?.energyBills?.length && !energyData?.energyBillsA?.length) {
      console.warn('adaptStoreToProposal: Nenhuma conta de energia encontrada. Usando valores padrão.');
    }

    if (!customerData?.tarifaEnergiaB && !customerData?.tarifaEnergiaPontaA) {
      console.warn('adaptStoreToProposal: Nenhuma tarifa de energia encontrada. Usando valores padrão.');
    }

    console.log('adaptStoreToProposal - Estrutura de dados:', {
      hasEnergyBills: !!(energyData?.energyBills?.length),
      hasEnergyBillsA: !!(energyData?.energyBillsA?.length),
      grupoTarifario: customerData?.grupoTarifario,
      tarifaEnergiaB: customerData?.tarifaEnergiaB,
      tarifaEnergiaPontaA: customerData?.tarifaEnergiaPontaA,
      tarifaEnergiaForaPontaA: customerData?.tarifaEnergiaForaPontaA
    });

    // Dados do cliente
    const cliente: ClienteData = {
      nome: customerData?.customer?.name || customerData?.name || "Cliente não informado",
      endereco: this.formatEndereco(customerData),
      consumoMensal: this.formatConsumoMensal(energyData, customerData),
      tarifaMedia: this.formatTarifaMedia(customerData)
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
      // Removidos campos redundantes: valorTotal e economiaAnual
      // Agora usando apenas valores numéricos: valorInvestimento e economiaAnualBruta
      entrada: this.formatEntrada(budgetData),
      parcelas: this.formatParcelas(budgetData),
      validade: "30 dias"
    };

    // Dados técnicos resumo
    const dadosTecnicosResumo = this.extractDadosTecnicosResumo(calculationResults);

    // Dados técnicos performance
    const dadosTecnicosPerformance = this.extractDadosTecnicosPerformance(calculationResults);

    // Dados técnicos mensais
    const dadosTecnicosMensal = this.extractDadosTecnicosMensal(calculationResults, energyData);

    // Valor do investimento
    const valorInvestimento = this.extractValorInvestimento(budgetData);

    // Economia anual bruta
    const economiaAnualBruta = this.extractEconomiaAnualBruta(calculationResults);

    // Métricas financeiras
    const metricasFinanceiras = this.extractMetricasFinanceiras(calculationResults);

    // Dados de fluxo de caixa
    const dadosFluxoCaixa = this.extractDadosFluxoCaixa(calculationResults);

    return {
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
    
    // Verificar se os dados estão aninhados em customerData.customer
    const customer = customerData.customer || customerData;
    
    const parts = [
      customer.address,
      customer.number,
      customer.complement,
      customer.neighborhood || customer.district,
      customer.city,
      customer.state
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : "Endereço não informado";
  }

  /**
   * Formata o consumo mensal
   */
  private static formatConsumoMensal(energyData: any, customerData: any): string {
    if (!energyData) {
      console.warn('formatConsumoMensal: energyData é nulo ou indefinido');
      return "0";
    }
    
    let consumoTotal = 0;
    const grupoTarifario = customerData?.grupoTarifario || 'B';
    
    console.log('formatConsumoMensal - Grupo tarifário:', grupoTarifario);
    console.log('formatConsumoMensal - energyBills:', energyData?.energyBills);
    console.log('formatConsumoMensal - energyBillsA:', energyData?.energyBillsA);
    
    // Calcular consumo total baseado no grupo tarifário
    if (grupoTarifario === 'A') {
      // Grupo A: somar ponta + fora ponta
      if (energyData?.energyBillsA?.length > 0) {
        energyData.energyBillsA.forEach((bill: any) => {
          if (bill.consumoMensalPonta && bill.consumoMensalForaPonta) {
            const consumoPonta = bill.consumoMensalPonta.reduce((sum: number, val: number) => sum + val, 0);
            const consumoForaPonta = bill.consumoMensalForaPonta.reduce((sum: number, val: number) => sum + val, 0);
            consumoTotal += consumoPonta + consumoForaPonta;
            console.log(`Conta Grupo A - Ponta: ${consumoPonta}, Fora Ponta: ${consumoForaPonta}`);
          }
        });
      } else {
        console.warn('formatConsumoMensal: Nenhuma conta Grupo A encontrada');
      }
    } else {
      // Grupo B: usar consumoMensal diretamente
      if (energyData?.energyBills?.length > 0) {
        energyData.energyBills.forEach((bill: any) => {
          if (bill.consumoMensal) {
            const consumo = bill.consumoMensal.reduce((sum: number, val: number) => sum + val, 0);
            consumoTotal += consumo;
            console.log(`Conta Grupo B - Consumo: ${consumo}`);
          }
        });
      } else {
        console.warn('formatConsumoMensal: Nenhuma conta Grupo B encontrada');
      }
    }
    
    // Calcular média mensal
    const consumoMensalMedio = consumoTotal / 12;
    console.log(`formatConsumoMensal - Total anual: ${consumoTotal}, Média mensal: ${consumoMensalMedio}`);
    
    // Usar valor padrão se o consumo for zero
    if (consumoMensalMedio === 0) {
      console.warn('formatConsumoMensal: Consumo médio é zero, usando valor padrão');
      return grupoTarifario === 'A' ? "2000" : "500";
    }
    
    return consumoMensalMedio.toFixed(0);
  }

  /**
   * Formata a tarifa média
   */
  private static formatTarifaMedia(customerData: any): string {
    if (!customerData) {
      console.warn('formatTarifaMedia: customerData é nulo ou indefinido');
      return "0.00";
    }
    
    let tarifaMedia = 0;
    const grupoTarifario = customerData?.grupoTarifario || 'B';
    
    console.log('formatTarifaMedia - Grupo tarifário:', grupoTarifario);
    console.log('formatTarifaMedia - tarifaEnergiaB:', customerData?.tarifaEnergiaB);
    console.log('formatTarifaMedia - tarifaEnergiaPontaA:', customerData?.tarifaEnergiaPontaA);
    console.log('formatTarifaMedia - tarifaEnergiaForaPontaA:', customerData?.tarifaEnergiaForaPontaA);
    
    // Calcular tarifa média baseado no grupo tarifário
    if (grupoTarifario === 'A') {
      // Grupo A: média ponderada das tarifas ponta e fora ponta
      const tarifaPonta = customerData.tarifaEnergiaPontaA || 0;
      const tarifaForaPonta = customerData.tarifaEnergiaForaPontaA || 0;
      // Considerando proporção típica de 30% ponta e 70% fora ponta
      tarifaMedia = (tarifaPonta * 0.3) + (tarifaForaPonta * 0.7);
      console.log(`formatTarifaMedia - Grupo A - Ponta: ${tarifaPonta}, Fora Ponta: ${tarifaForaPonta}, Média: ${tarifaMedia}`);
    } else {
      // Grupo B: usar tarifa de energia diretamente
      tarifaMedia = customerData.tarifaEnergiaB || 0;
      console.log(`formatTarifaMedia - Grupo B - Tarifa: ${tarifaMedia}`);
    }
    
    // Usar valor padrão se a tarifa for zero
    if (tarifaMedia === 0) {
      console.warn('formatTarifaMedia: Tarifa média é zero, usando valor padrão');
      return grupoTarifario === 'A' ? "0.85" : "0.75";
    }
    
    return tarifaMedia.toFixed(2);
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
   * Extrai dados técnicos resumo
   */
  private static extractDadosTecnicosResumo(calculationResults: any): Record<string, string> {
    if (!calculationResults) return {};
    
    const dados: Record<string, string> = {};
    
    // Potência Total DC
    const potenciaDC = calculationResults.potenciaPico || calculationResults.potenciaSistema || 0;
    dados["potencia_total_dc"] = `${potenciaDC.toFixed(2)} kWp`;
    
    // Geração DC (Teórica)
    const geracaoDC = calculationResults.geracaoDcAnual ||
                      calculationResults.energiaDcAnualKwh ||
                      calculationResults.geracaoAnual ||
                      calculationResults.energiaAnualKwh ||
                      (calculationResults.potenciaTotalKwp || 0) * 1500 || 0;
    dados["geracao_dc_teorica"] = `${geracaoDC.toFixed(0)} kWh/ano`;

    // Geração AC (Final)
    const geracaoAC = calculationResults.energiaAnualKwh ||
                     calculationResults.geracaoAnual ||
                     geracaoDC * 0.85; // Estimativa de 85% de eficiência
    dados["geracao_ac_final"] = `${geracaoAC.toFixed(0)} kWh/ano`;

    // Consumo Anual
    const consumoAnual = calculationResults.consumoAnual ||
                        calculationResults.consumoAnualKwh || 0;
    dados["consumo_anual"] = `${consumoAnual.toFixed(0)} kWh/ano`;
    
    // Yield Específico
    const yieldEspecifico = calculationResults.yield || calculationResults.yieldEspecifico || 1500;
    dados["yield_especifico"] = `${yieldEspecifico.toFixed(1)} kWh/kWp`;
    
    // Performance Ratio (PR)
    const pr = calculationResults.performanceRatio || calculationResults.pr || 85;
    dados["performance_ratio"] = `${pr.toFixed(1)} %`;
    
    // Fator de Capacidade
    const fatorCapacidade = calculationResults.fatorCapacidade || 21;
    dados["fator_capacidade"] = `${fatorCapacidade.toFixed(1)} %`;
    
    // Fonte de Dados (fixo conforme solicitado)
    dados["fonte_dados"] = "2014-2020 (6 anos)";
    
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
   * CORREÇÃO: Agora extrai dados de consumo do energyData em vez de calculationResults.consumoMensal
   * que não existe na estrutura de dados. Suporta Grupo B e Grupo A (ponta e fora ponta).
   */
  private static extractDadosTecnicosMensal(calculationResults: any, energyData?: any): MensalData[] {
    if (!calculationResults) return [];
    
    const mensalData: MensalData[] = [];
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    // Extrair consumo mensal do energyData (Grupo B)
    let consumoMensal = Array(12).fill(0);
    if (energyData?.energyBills?.length > 0 && energyData.energyBills[0]?.consumoMensal) {
      consumoMensal = energyData.energyBills[0].consumoMensal;
    }
    
    // Se não houver dados do Grupo B, tentar extrair do Grupo A
    if (consumoMensal.every(v => v === 0) && energyData?.energyBillsA?.length > 0) {
      consumoMensal = Array(12).fill(0);
      energyData.energyBillsA.forEach((bill: any) => {
        if (bill.consumoMensalPonta && bill.consumoMensalForaPonta) {
          for (let i = 0; i < 12; i++) {
            consumoMensal[i] += (bill.consumoMensalPonta[i] || 0) + (bill.consumoMensalForaPonta[i] || 0);
          }
        }
      });
    }
    
    // Adicionar consumo remoto do Grupo A (se existir)
    if (energyData?.energyBillsARemoto?.length > 0) {
      energyData.energyBillsARemoto.forEach((bill: any) => {
        if (bill.consumoMensalPonta && bill.consumoMensalForaPonta) {
          for (let i = 0; i < 12; i++) {
            consumoMensal[i] += (bill.consumoMensalPonta[i] || 0) + (bill.consumoMensalForaPonta[i] || 0);
          }
        }
      });
    }
    
    // Validar estrutura de dados de consumo
    const validarDadosConsumo = (consumo: number[], fonte: string): boolean => {
      if (!Array.isArray(consumo) || consumo.length !== 12) {
        console.error(`Dados de consumo inválidos de ${fonte}: esperado array com 12 valores`);
        return false;
      }
      
      if (consumo.some((v: any) => typeof v !== 'number' || isNaN(v))) {
        console.error(`Dados de consumo inválidos de ${fonte}: valores não numéricos encontrados`);
        return false;
      }
      
      if (consumo.some(v => v < 0)) {
        console.error(`Dados de consumo inválidos de ${fonte}: valores negativos encontrados`);
        return false;
      }
      
      return true;
    };
    
    // Validar dados de consumo
    if (!validarDadosConsumo(consumoMensal, 'energyData')) {
      console.warn('Dados de consumo inválidos detectados. Usando valores padrão para demonstração.');
      // Usar valores padrão realistas para demonstração
      consumoMensal = [400, 380, 420, 390, 410, 380, 400, 420, 390, 410, 380, 400];
    }
    
    // Validar consumo total anual
    const consumoAnual = consumoMensal.reduce((sum: number, val: number) => sum + val, 0);
    if (consumoAnual === 0) {
      console.warn('Consumo anual total é zero. Verifique os dados de consumo.');
    }
    
    // Validar consistência com geração (se disponível)
    if (calculationResults?.geracaoEstimadaMensal) {
      const geracaoAnual = calculationResults.geracaoEstimadaMensal.reduce((sum: number, val: number) => sum + val, 0);
      const razaoGeracaoConsumo = geracaoAnual / consumoAnual;
      
      if (consumoAnual > 0 && razaoGeracaoConsumo > 10) {
        console.warn(`Razão geração/consumo muito alta (${razaoGeracaoConsumo.toFixed(2)}). Verifique os dados.`);
      } else if (consumoAnual > 0 && razaoGeracaoConsumo < 0.1) {
        console.warn(`Razão geração/consumo muito baixa (${razaoGeracaoConsumo.toFixed(2)}). Verifique os Dados.`);
      }
    }
    
    // Se houver dados de geração mensal
    if (calculationResults.geracaoEstimadaMensal && calculationResults.geracaoEstimadaMensal.length === 12) {
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
      
      meses.forEach((mes, index) => {
        mensalData.push({
          mes: mes,
          consumo: consumoMensal[index] || 0,
          geracao: geracaoMensalMedia,
          diferenca: geracaoMensalMedia - (consumoMensal[index] || 0)
        });
      });
    }
    
    return mensalData;
  }

  /**
   * Extrai o valor do investimento
   */
  private static extractValorInvestimento(budgetData: any): number {
    if (!budgetData) return 0;
    
    // Tentar obter o valor total calculado
    const subtotal = (budgetData.custoEquipamento || 0) +
                   (budgetData.custoMateriais || 0) +
                   (budgetData.custoMaoDeObra || 0);
    const bdi = budgetData.bdi || 0;
    const total = subtotal * (1 + bdi / 100);
    
    // Verificar múltiplas estruturas possíveis
    return total ||
           budgetData.totalInvestment ||
           budgetData.valorTotal ||
           budgetData.custoTotal ||
           0;
  }

  /**
   * Extrai a economia anual bruta
   */
  private static extractEconomiaAnualBruta(calculationResults: any): number {
    if (!calculationResults) return 0;
    
    // Tentar obter do advancedFinancial primeiro
    if (calculationResults.advancedFinancial?.economiaTotal25Anos) {
      return calculationResults.advancedFinancial.economiaTotal25Anos / 25; // Média anual
    }
    
    // Tentar obter de outras estruturas
    return calculationResults.economiaAnualEstimada ||
           calculationResults.economiaAnualMedia ||
           calculationResults.economiaProjetada ||
           calculationResults.economiaAnualBruta ||
           calculationResults.financialResults?.economiaAnual ||
           0;
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
      console.log('extractMetricasFinanceiras - advancedFinancial:', advancedFinancial);

      return {
        vpl: advancedFinancial.vpl || 0,
        tir: advancedFinancial.tir || 0,
        indiceLucratividade: advancedFinancial.pi || 0,
        paybackSimples: advancedFinancial.paybackSimples || 0,
        paybackDescontado: advancedFinancial.paybackDescontado || 0,
        lcoe: advancedFinancial.lcoe || 0,
        roiSimples: advancedFinancial.roiSimples || 0,
        economiaTotalNominal: advancedFinancial.economiaTotal25Anos || 0,
        economiaTotalPresente: advancedFinancial.economiaTotalPresente || 0
      };
    }
    
    // Se não houver advancedFinancial, tenta obter dos resultados diretos
    // Verificar múltiplas estruturas possíveis
    const vpl = calculationResults.vpl ||
                calculationResults.financialResults?.vpl ||
                calculationResults.advancedFinancial?.vpl || 0;
                
    const tir = calculationResults.tir ||
                calculationResults.financialResults?.tir ||
                calculationResults.advancedFinancial?.tir || 0;
    
    const indiceLucratividade = calculationResults.pi ||
                                calculationResults.financialResults?.pi ||
                                calculationResults.advancedFinancial?.pi;

    const paybackSimples = calculationResults.paybackSimples ||
                           calculationResults.payback ||
                           calculationResults.financialResults?.paybackSimples ||
                           calculationResults.advancedFinancial?.paybackSimples || 0;
    
    const paybackDescontado = calculationResults.paybackDescontado ||
                             calculationResults.financialResults?.paybackDescontado ||
                             calculationResults.advancedFinancial?.paybackDescontado || 0;
    
    const lcoe = calculationResults.lcoe ||
                calculationResults.custoNiveladoEnergia ||
                calculationResults.financialResults?.lcoe ||
                calculationResults.advancedFinancial?.lcoe || 0;
    
    const roiSimples = calculationResults.roiSimples ||
                      calculationResults.roi ||
                      calculationResults.financialResults?.roiSimples ||
                      calculationResults.advancedFinancial?.roiSimples || 0;
    
    const economiaTotal25Anos = calculationResults.economiaTotal25Anos ||
                               calculationResults.economiaTotalNominal ||
                               calculationResults.financialResults?.economiaTotal25Anos ||
                               calculationResults.advancedFinancial?.economiaTotal25Anos || 0;
    
    const economiaTotalPresente = calculationResults.economiaTotalPresente ||
                                  calculationResults.financialResults?.economiaTotalPresente ||
                                  calculationResults.advancedFinancial?.economiaTotalPresente || 0;
    
    return {
      vpl: vpl || 0,
      tir: tir || 0,
      indiceLucratividade: indiceLucratividade || 0,
      paybackSimples: paybackSimples || 0,
      paybackDescontado: paybackDescontado || 0,
      lcoe: lcoe || 0,
      roiSimples: roiSimples || 0,
      economiaTotalNominal: economiaTotal25Anos || 0,
      economiaTotalPresente: economiaTotalPresente || 0
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
    
    // Tentar obter de outras estruturas possíveis
    if (calculationResults.financialResults?.cashFlow && calculationResults.financialResults.cashFlow.length > 0) {
      return calculationResults.financialResults.cashFlow.map((item: any) => ({
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
    const nomeCliente = customerData?.customer?.name || customerData?.name || "proposta";
    const dataAtual = new Date().toISOString().split('T')[0];
    const timestamp = new Date().getTime();
    return `proposta-${nomeCliente.replace(/\s+/g, '-')}-${dataAtual}-${timestamp}.pdf`;
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
      vpl: 0,
      tir: 0,
      indiceLucratividade: 0,
      paybackSimples: 0,
      paybackDescontado: 0,
      lcoe: 0,
      roiSimples: 0,
      economiaTotalNominal: 0,
      economiaTotalPresente: 0
    };
  }
}

export default ProposalDataAdapter;