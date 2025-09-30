"""
Modelos para cálculos financeiros de sistemas fotovoltaicos
"""

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional

class FinancialInput(BaseModel):
    """Dados de entrada para análise financeira"""
    
    # Investimento
    investimento_inicial: float = Field(..., description="Investimento inicial em R$")
    
    # Geração e consumo
    geracao_mensal: List[float] = Field(..., description="Geração mensal em kWh (12 valores)")
    consumo_mensal: List[float] = Field(..., description="Consumo mensal em kWh (12 valores)")
    
    # Tarifas
    tarifa_energia: float = Field(..., description="Tarifa de energia em R$/kWh")
    custo_fio_b: float = Field(..., description="Custo do fio B em R$/kWh")
    
    # Parâmetros temporais
    vida_util: int = Field(default=25, description="Vida útil do sistema em anos")
    taxa_desconto: float = Field(default=8.0, description="Taxa de desconto anual em %")
    inflacao_energia: float = Field(default=4.5, description="Inflação da tarifa de energia em %")
    
    # Parâmetros opcionais
    degradacao_modulos: float = Field(default=0.5, description="Degradação anual dos módulos em %")
    custo_om: float = Field(default=0, description="Custo anual de O&M em R$")
    inflacao_om: float = Field(default=4.0, description="Inflação dos custos de O&M em %")
    
    # Simultaneidade
    fator_simultaneidade: float = Field(default=0.25, description="Fator de simultaneidade (autoconsumo instantâneo)")
    
    # Lei 14.300
    fio_b_schedule: Dict[int, float] = Field(default={2025: 0.45, 2026: 0.60, 2027: 0.75, 2028: 0.90}, description="Cronograma Lei 14.300 - % Fio B não compensado")
    base_year: int = Field(default=2025, description="Ano base para cronograma Lei 14.300")
    
    # Autoconsumo remoto Grupo B
    autoconsumo_remoto_b: bool = Field(default=False, description="Habilitar autoconsumo remoto Grupo B")
    consumo_remoto_b_mensal: List[float] = Field(default=[0.0] * 12, description="Consumo remoto Grupo B mensal em kWh")
    tarifa_remoto_b: float = Field(default=0.84, description="Tarifa remoto Grupo B em R$/kWh")
    fio_b_remoto_b: float = Field(default=0.25, description="Fio B remoto Grupo B em R$/kWh")
    perc_creditos_b: float = Field(default=0.40, description="% créditos destinados ao Grupo B")
    
    # Autoconsumo remoto Grupo A Verde
    autoconsumo_remoto_a_verde: bool = Field(default=False, description="Habilitar autoconsumo remoto Grupo A Verde")
    consumo_remoto_a_verde_fp_mensal: List[float] = Field(default=[0.0] * 12, description="Consumo remoto A Verde fora ponta mensal em kWh")
    consumo_remoto_a_verde_p_mensal: List[float] = Field(default=[0.0] * 12, description="Consumo remoto A Verde ponta mensal em kWh")
    tarifa_remoto_a_verde_fp: float = Field(default=0.48, description="Tarifa remoto A Verde fora ponta em R$/kWh")
    tarifa_remoto_a_verde_p: float = Field(default=2.20, description="Tarifa remoto A Verde ponta em R$/kWh")
    tusd_remoto_a_verde_fp: float = Field(default=0.16121, description="TUSD remoto A Verde fora ponta em R$/kWh")
    tusd_remoto_a_verde_p: float = Field(default=1.6208, description="TUSD remoto A Verde ponta em R$/kWh")
    te_ponta_a_verde: float = Field(default=0.55158, description="TE ponta A Verde em R$/kWh")
    te_fora_ponta_a_verde: float = Field(default=0.34334, description="TE fora ponta A Verde em R$/kWh")
    perc_creditos_a_verde: float = Field(default=0.30, description="% créditos destinados ao A Verde")
    
    # Autoconsumo remoto Grupo A Azul
    autoconsumo_remoto_a_azul: bool = Field(default=False, description="Habilitar autoconsumo remoto Grupo A Azul")
    consumo_remoto_a_azul_fp_mensal: List[float] = Field(default=[0.0] * 12, description="Consumo remoto A Azul fora ponta mensal em kWh")
    consumo_remoto_a_azul_p_mensal: List[float] = Field(default=[0.0] * 12, description="Consumo remoto A Azul ponta mensal em kWh")
    tarifa_remoto_a_azul_fp: float = Field(default=0.48, description="Tarifa remoto A Azul fora ponta em R$/kWh")
    tarifa_remoto_a_azul_p: float = Field(default=2.20, description="Tarifa remoto A Azul ponta em R$/kWh")
    tusd_remoto_a_azul_fp: float = Field(default=0.16121, description="TUSD remoto A Azul fora ponta em R$/kWh")
    tusd_remoto_a_azul_p: float = Field(default=1.6208, description="TUSD remoto A Azul ponta em R$/kWh")
    te_ponta_a_azul: float = Field(default=0.55158, description="TE ponta A Azul em R$/kWh")
    te_fora_ponta_a_azul: float = Field(default=0.34334, description="TE fora ponta A Azul em R$/kWh")
    perc_creditos_a_azul: float = Field(default=0.30, description="% créditos destinados ao A Azul")
    
    # Tarifa branca (opcional)
    tarifa_branca: Optional[Dict[str, float]] = Field(None, description="Tarifas por horário")
    modalidade_tarifaria: str = Field(default="convencional", description="Modalidade tarifária")
    
    @validator('perc_creditos_a_azul')
    def validate_percentuais_somam_100(cls, v, values):
        """
        Valida que soma dos percentuais de distribuicao de creditos e 100%
        """
        perc_b = values.get('perc_creditos_b', 0)
        perc_verde = values.get('perc_creditos_a_verde', 0)
        total = perc_b + perc_verde + v

        # Tolerancia de 1% para evitar problemas de precisao float
        if abs(total - 1.0) > 0.01:
            raise ValueError(
                "Soma dos percentuais de creditos deve ser 100%. "
                "Configuracao atual: "
                "Grupo B = {:.1f}%, "
                "Grupo A Verde = {:.1f}%, "
                "Grupo A Azul = {:.1f}% "
                "-> Total = {:.1f}%".format(
                    perc_b * 100,
                    perc_verde * 100,
                    v * 100,
                    total * 100
                )
            )

        return v

class CashFlowDetails(BaseModel):
    """Detalhes do fluxo de caixa anual"""
    
    ano: int = Field(..., description="Ano da análise")
    geracao_anual: float = Field(..., description="Geração anual em kWh")
    economia_energia: float = Field(..., description="Economia com energia em R$")
    custos_om: float = Field(..., description="Custos de O&M em R$")
    fluxo_liquido: float = Field(..., description="Fluxo de caixa líquido em R$")
    fluxo_acumulado: float = Field(..., description="Fluxo de caixa acumulado em R$")
    valor_presente: float = Field(..., description="Valor presente do fluxo em R$")

class SensitivityPoint(BaseModel):
    """Ponto de análise de sensibilidade"""
    
    parametro: float = Field(..., description="Valor do parâmetro")
    vpl: float = Field(..., description="VPL resultante em R$")

class FinancialIndicators(BaseModel):
    """Indicadores financeiros de performance"""
    
    yield_especifico: float = Field(..., description="Yield específico em kWh/kW/R$1000")
    custo_nivelado_energia: float = Field(..., description="LCOE em R$/kWh")
    eficiencia_investimento: float = Field(..., description="Eficiência do investimento em %")
    retorno_sobre_investimento: float = Field(..., description="ROI em %")

class SensitivityAnalysis(BaseModel):
    """Análise de sensibilidade"""
    
    vpl_variacao_tarifa: List[SensitivityPoint] = Field(..., description="Sensibilidade à variação da tarifa")
    vpl_variacao_inflacao: List[SensitivityPoint] = Field(..., description="Sensibilidade à inflação")
    vpl_variacao_desconto: List[SensitivityPoint] = Field(..., description="Sensibilidade à taxa de desconto")

class ScenarioAnalysis(BaseModel):
    """Análise de cenários"""
    
    base: Dict = Field(..., description="Cenário base")
    otimista: Dict = Field(..., description="Cenário otimista")
    conservador: Dict = Field(..., description="Cenário conservador")
    pessimista: Dict = Field(..., description="Cenário pessimista")

class AdvancedFinancialResults(BaseModel):
    """Resultado completo da análise financeira"""
    
    # Indicadores principais
    vpl: float = Field(..., description="Valor Presente Líquido em R$")
    tir: float = Field(..., description="Taxa Interna de Retorno em %")
    payback_simples: float = Field(..., description="Payback simples em anos")
    payback_descontado: float = Field(..., description="Payback descontado em anos")
    
    # Métricas de economia
    economia_total_25_anos: float = Field(..., description="Economia total em 25 anos em R$")
    economia_anual_media: float = Field(..., description="Economia anual média em R$")
    lucratividade_index: float = Field(..., description="Índice de lucratividade")
    
    # Fluxo de caixa detalhado
    cash_flow: List[CashFlowDetails] = Field(..., description="Fluxo de caixa detalhado")
    
    # Indicadores de performance
    indicadores: FinancialIndicators = Field(..., description="Indicadores de performance")
    
    # Análises complementares
    sensibilidade: SensitivityAnalysis = Field(..., description="Análise de sensibilidade")
    cenarios: ScenarioAnalysis = Field(..., description="Análise de cenários")