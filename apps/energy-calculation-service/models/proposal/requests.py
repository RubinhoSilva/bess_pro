from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class EmpresaData(BaseModel):
    """Dados da empresa geradora da proposta"""
    nome: str = Field(..., description="Nome da empresa")
    cnpj: str = Field(..., description="CNPJ da empresa")
    contato: str = Field(..., description="Informações de contato")
    missao: Optional[str] = Field(None, description="Missão da empresa")
    fundacao: Optional[str] = Field(None, description="Ano de fundação")
    projetos_concluidos: Optional[str] = Field(None, description="Número de projetos concluídos")
    potencia_total: Optional[str] = Field(None, description="Potência total instalada")
    clientes_satisfeitos: Optional[str] = Field(None, description="Clientes satisfeitos")
    observacoes: Optional[str] = Field(None, description="Observações adicionais")

class ClienteData(BaseModel):
    """Dados do cliente"""
    nome: str = Field(..., description="Nome do cliente")
    endereco: str = Field(..., description="Endereço completo")
    consumo_mensal: str = Field(..., description="Consumo mensal médio")
    tarifa_media: str = Field(..., description="Tarifa média atual")

class SistemaData(BaseModel):
    """Dados do sistema proposto"""
    potencia_pico: str = Field(..., description="Potência de pico (kWp)")
    modulos: str = Field(..., description="Descrição dos módulos")
    inversor: str = Field(..., description="Descrição do inversor")
    geracao_estimada: str = Field(..., description="Geração estimada mensal")
    garantia_modulos: str = Field(..., description="Garantia dos módulos")

class FinanceiroData(BaseModel):
    """Dados financeiros principais"""
    entrada: Optional[str] = Field(None, description="Valor de entrada")
    parcelas: Optional[str] = Field(None, description="Condições de parcelamento")
    validade: str = Field(..., description="Validade da proposta")

class MetricasFinanceirasData(BaseModel):
    """Métricas financeiras detalhadas"""
    vpl: float = Field(..., description="Valor Presente Líquido")
    tir: float = Field(..., description="Taxa Interna de Retorno")
    indice_lucratividade: float = Field(..., description="Índice de Lucratividade")
    payback_simples: float = Field(..., description="Payback Simples")
    payback_descontado: float = Field(..., description="Payback Descontado")
    lcoe: float = Field(..., description="Custo de Energia (LCOE)")
    roi_simples: float = Field(..., description="ROI Simples")
    economia_total_nominal: float = Field(..., description="Economia Total Projetada (Nominal)")
    economia_total_presente: float = Field(..., description="Economia Total Projetada (Presente)")

class FluxoCaixaData(BaseModel):
    """Dados de fluxo de caixa"""
    ano: int = Field(..., description="Ano")
    fc_nominal: float = Field(..., description="Fluxo de Caixa Nominal")
    fc_acum_nominal: float = Field(..., description="Fluxo Acumulado Nominal")
    fc_descontado: float = Field(..., description="Fluxo de Caixa Descontado")
    fc_acum_descontado: float = Field(..., description="Fluxo Acumulado Descontado")

class PerformanceData(BaseModel):
    """Dados de performance técnica"""
    inversor_mppt: str = Field(..., description="Inversor/MPPT")
    kwp: str = Field(..., description="Potência em kWp")
    geracao_anual: str = Field(..., description="Geração anual (kWh)")
    yield_especifico: str = Field(..., description="Yield específico (kWh/kWp)")
    pr: str = Field(..., description="Performance Ratio (%)")

class MensalData(BaseModel):
    """Dados mensais de geração vs consumo"""
    mes: str = Field(..., description="Mês")
    consumo: float = Field(..., description="Consumo (kWh)")
    geracao: float = Field(..., description="Geração (kWh)")
    diferenca: float = Field(..., description="Diferença (kWh)")

class ProposalRequest(BaseModel):
    """Request principal para geração de proposta"""
    # Dados básicos
    empresa: EmpresaData = Field(..., description="Dados da empresa")
    cliente: ClienteData = Field(..., description="Dados do cliente")
    sistema: SistemaData = Field(..., description="Dados do sistema")
    financeiro: FinanceiroData = Field(..., description="Dados financeiros principais")
    
    # Dados técnicos
    dados_tecnicos_resumo: Dict[str, str] = Field(default_factory=dict, description="Resumo técnico")
    dados_tecnicos_performance: List[PerformanceData] = Field(default_factory=list, description="Performance técnica")
    dados_tecnicos_mensal: List[MensalData] = Field(default_factory=list, description="Dados mensais")
    
    # Dados financeiros detalhados
    valor_investimento: float = Field(..., description="Valor do investimento (CAPEX)")
    economia_anual_bruta: float = Field(..., description="Economia anual bruta")
    metricas_financeiras: MetricasFinanceirasData = Field(..., description="Métricas financeiras")
    dados_fluxo_caixa: List[FluxoCaixaData] = Field(default_factory=list, description="Fluxo de caixa")
    
    # Configurações
    logo_url: Optional[str] = Field(None, description="URL do logo da empresa")
    nome_arquivo: Optional[str] = Field(None, description="Nome do arquivo PDF")