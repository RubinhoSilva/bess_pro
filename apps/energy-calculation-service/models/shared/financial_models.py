"""
Modelos Pydantic para cálculos financeiros de sistemas fotovoltaicos
Grupo A e Grupo B
"""

from pydantic import BaseModel, Field, field_validator, model_validator, ValidationInfo
from typing import List, Dict, Optional, Any
import re
import logging

# Configurar logger para validação Pydantic
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Adicionar handler para arquivo de log de validação
file_handler = logging.FileHandler('debug_logs/pydantic_validation.log', mode='a')
file_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)


class FinancialInput(BaseModel):
    """Modelo simplificado para entrada de dados financeiros"""
    geracao_mensal: List[float]
    consumo_mensal: List[float]
    tarifa_energia: float
    custo_fio_b: float
    investimento_inicial: float
    taxa_desconto: float
    inflacao_energia: float
    vida_util: int
    degradacao_modulos: float
    fator_simultaneidade: float
    fio_b_schedule: Dict[int, float]
    base_year: int
    custo_om: float
    inflacao_om: float
    autoconsumo_remoto_b: bool = False
    consumo_remoto_b_mensal: List[float] = []
    tarifa_remoto_b: float = 0
    fio_b_remoto_b: float = 0
    perc_creditos_b: float = 0
    autoconsumo_remoto_a_verde: bool = False
    consumo_remoto_a_verde_fp_mensal: List[float] = []
    consumo_remoto_a_verde_p_mensal: List[float] = []
    tarifa_remoto_a_verde_fp: float = 0
    tarifa_remoto_a_verde_p: float = 0
    tusd_remoto_a_verde_fp: float = 0
    tusd_remoto_a_verde_p: float = 0
    te_ponta_a_verde: float = 0
    te_fora_ponta_a_verde: float = 0
    perc_creditos_a_verde: float = 0
    autoconsumo_remoto_a_azul: bool = False
    consumo_remoto_a_azul_fp_mensal: List[float] = []
    consumo_remoto_a_azul_p_mensal: List[float] = []
    tarifa_remoto_a_azul_fp: float = 0
    tarifa_remoto_a_azul_p: float = 0
    tusd_remoto_a_azul_fp: float = 0
    tusd_remoto_a_azul_p: float = 0
    te_ponta_a_azul: float = 0
    te_fora_ponta_a_azul: float = 0
    perc_creditos_a_azul: float = 0
    
    def copy(self):
        """Cria uma cópia do objeto"""
        return FinancialInput(**self.dict())


class CashFlowDetails(BaseModel):
    """Detalhes do fluxo de caixa anual"""
    ano: int
    geracao_anual: float
    economia_energia: float
    custos_om: float
    fluxo_liquido: float
    fluxo_acumulado: float
    valor_presente: float


class FinancialIndicators(BaseModel):
    """Indicadores financeiros"""
    yield_especifico: float
    custo_nivelado_energia: float
    eficiencia_investimento: float
    retorno_sobre_investimento: float


class SensitivityPoint(BaseModel):
    """Ponto de análise de sensibilidade"""
    parametro: float
    vpl: float


class SensitivityAnalysis(BaseModel):
    """Análise de sensibilidade"""
    vpl_variacao_tarifa: List[SensitivityPoint]
    vpl_variacao_inflacao: List[SensitivityPoint]
    vpl_variacao_desconto: List[SensitivityPoint]


class ScenarioAnalysis(BaseModel):
    """Análise de cenários"""
    base: Dict[str, float]
    otimista: Dict[str, float]
    conservador: Dict[str, float]
    pessimista: Dict[str, float]


class AdvancedFinancialResults(BaseModel):
    """Resultados financeiros avançados"""
    vpl: float
    tir: float
    payback_simples: float
    payback_descontado: float
    economia_total_25_anos: float
    economia_anual_media: float
    lucratividade_index: float
    cash_flow: List[CashFlowDetails]
    indicadores: FinancialIndicators
    sensibilidade: SensitivityAnalysis
    cenarios: ScenarioAnalysis


class ProjectFinancialsModel(BaseModel):
    """
    Modelo para parâmetros financeiros do projeto
    
    Contém todos os parâmetros financeiros necessários para análise de viabilidade
    de sistemas fotovoltaicos, incluindo custos, taxas e parâmetros econômicos.
    """
    
    capex: float = Field(..., gt=0, description="Investimento inicial em R$")
    anos: int = Field(default=25, ge=1, le=50, description="Vida útil do projeto em anos")
    taxa_desconto: float = Field(..., ge=0, le=100, description="Taxa de desconto anual em %")
    inflacao_energia: float = Field(..., ge=0, le=100, description="Inflação anual da tarifa de energia em %")
    degradacao: float = Field(default=0.5, ge=0, le=5, description="Taxa de degradação anual dos módulos em %")
    salvage_pct: float = Field(default=0.1, ge=0, le=1, description="Percentual de valor residual no final do projeto")
    oma_first_pct: float = Field(default=0.015, ge=0, le=0.1, description="Percentual de O&M no primeiro ano")
    oma_inflacao: float = Field(default=4.0, ge=0, le=100, description="Inflação anual dos custos de O&M em %")


class MonthlyDataModel(BaseModel):
    """
    Modelo para dados mensais de consumo ou geração
    
    Armazena valores mensais para um ano completo, permitindo análise sazonal
    de consumo e geração de energia.
    """
    
    jan: float = Field(..., ge=0, description="Valor para janeiro em kWh")
    fev: float = Field(..., ge=0, description="Valor para fevereiro em kWh")
    mar: float = Field(..., ge=0, description="Valor para março em kWh")
    abr: float = Field(..., ge=0, description="Valor para abril em kWh")
    mai: float = Field(..., ge=0, description="Valor para maio em kWh")
    jun: float = Field(..., ge=0, description="Valor para junho em kWh")
    jul: float = Field(..., ge=0, description="Valor para julho em kWh")
    ago: float = Field(..., ge=0, description="Valor para agosto em kWh")
    set: float = Field(..., ge=0, description="Valor para setembro em kWh")
    out: float = Field(..., ge=0, description="Valor para outubro em kWh")
    nov: float = Field(..., ge=0, description="Valor para novembro em kWh")
    dez: float = Field(..., ge=0, description="Valor para dezembro em kWh")
    
    @field_validator('*')
    @classmethod
    def validate_non_negative(cls, v, info: ValidationInfo):
        """Valida que todos os valores são não-negativos"""
        logger.debug(f"Validando campo {info.field_name}: valor={v}")
        if v < 0:
            logger.error(f"Valor negativo detectado em {info.field_name}: {v}")
            raise ValueError(f"Valor mensal em {info.field_name} deve ser não-negativo, recebido: {v}")
        logger.debug(f"✓ Campo {info.field_name} validado: {v}")
        return v
    
    def to_list(self) -> List[float]:
        """Converte para lista de valores mensais"""
        return [
            self.jan, self.fev, self.mar, self.abr, self.mai, self.jun,
            self.jul, self.ago, self.set, self.out, self.nov, self.dez
        ]
    
    @classmethod
    def from_list(cls, values: List[float]) -> 'MonthlyDataModel':
        """Cria instância a partir de lista de 12 valores"""
        if len(values) != 12:
            raise ValueError("Lista deve conter exatamente 12 valores mensais")
        
        months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                 'jul', 'ago', 'set', 'out', 'nov', 'dez']
        data = dict(zip(months, values))
        return cls(**data)


class FioBParamsModel(BaseModel):
    """
    Modelo para parâmetros do Fio B (Lei 14.300/2022)
    
    Define o cronograma de compensação do Fio B conforme a legislação,
    permitindo simulação da transição gradual do sistema de compensação.
    """
    
    schedule: Dict[int, float] = Field(..., description="Cronograma de percentual do Fio B não compensado por ano")
    base_year: int = Field(..., description="Ano base para o cronograma")
    
    @field_validator('schedule')
    @classmethod
    def validate_schedule(cls, v):
        """Valida estrutura e valores do cronograma"""
        logger.debug(f"Validando cronograma Fio B: {v}")
        
        if not v:
            logger.error("Cronograma Fio B está vazio")
            raise ValueError("Cronograma não pode ser vazio")
        
        for year, percentage in v.items():
            logger.debug(f"Validando ano {year}: percentual={percentage}")
            if not isinstance(year, int) or year < 2000 or year > 2100:
                logger.error(f"Ano inválido no cronograma: {year}")
                raise ValueError(f"Ano inválido: {year}")
            if not isinstance(percentage, (int, float)) or percentage < 0 or percentage > 1:
                logger.error(f"Percentual inválido para ano {year}: {percentage}")
                raise ValueError(f"Percentual inválido para ano {year}: {percentage}")
        
        logger.debug("✓ Cronograma Fio B validado com sucesso")
        return v


class RemoteConsumptionGrupoBModel(BaseModel):
    """
    Modelo para autoconsumo remoto Grupo B

    Configuração para simulação de autoconsumo remoto para consumidores
    do Grupo B (residencial, rural e outras baixas tensões).
    """

    enabled: bool = Field(default=False, description="Habilitar autoconsumo remoto Grupo B")
    percentage: float = Field(default=0, ge=0, le=100, description="Percentual de créditos destinados ao Grupo B")
    data: Optional[MonthlyDataModel] = Field(default=None, description="Dados de consumo mensal remoto em kWh")
    tarifa_total: float = Field(default=0, ge=0, description="Tarifa total de energia em R$/kWh")
    fio_b_value: float = Field(default=0, ge=0, description="Valor do Fio B em R$/kWh")

    @model_validator(mode='after')
    def validate_enabled_fields(self):
        """Valida que campos obrigatórios estão preenchidos quando enabled=True"""
        if self.enabled:
            if self.percentage <= 0:
                raise ValueError("percentage deve ser maior que 0 quando enabled=True")
            if self.data is None:
                raise ValueError("data é obrigatório quando enabled=True")
            if self.tarifa_total <= 0:
                raise ValueError("tarifa_total deve ser maior que 0 quando enabled=True")
        return self


class RemoteConsumptionGrupoAModel(BaseModel):
    """
    Modelo para autoconsumo remoto Grupo A

    Configuração para simulação de autoconsumo remoto para consumidores
    do Grupo A (média e alta tensão) com tarifação horossazonal.
    """

    enabled: bool = Field(default=False, description="Habilitar autoconsumo remoto Grupo A")
    percentage: float = Field(default=0, ge=0, le=100, description="Percentual de créditos destinados ao Grupo A")
    data_off_peak: Optional[MonthlyDataModel] = Field(default=None, description="Consumo fora ponta mensal em kWh")
    data_peak: Optional[MonthlyDataModel] = Field(default=None, description="Consumo ponta mensal em kWh")
    tarifas: Dict[str, float] = Field(default_factory=lambda: {"off_peak": 0, "peak": 0}, description="Tarifas de energia (off_peak, peak) em R$/kWh")
    tusd: Dict[str, float] = Field(default_factory=lambda: {"off_peak": 0, "peak": 0}, description="TUSD (off_peak, peak) em R$/kWh")
    te: Dict[str, float] = Field(default_factory=lambda: {"off_peak": 0, "peak": 0}, description="TE (off_peak, peak) em R$/kWh")

    @field_validator('tarifas', 'tusd', 'te')
    @classmethod
    def validate_tariff_structure(cls, v, info: ValidationInfo):
        """Valida estrutura dos dicionários de tarifas"""
        logger.debug(f"Validando estrutura de tarifas em {info.field_name}: {v}")
        required_keys = {'off_peak', 'peak'}

        if not isinstance(v, dict):
            logger.error(f"Tarifas em {info.field_name} não é um dicionário: {type(v)}")
            raise ValueError("Tarifas devem ser um dicionário")

        missing_keys = required_keys - set(v.keys())
        if missing_keys:
            logger.error(f"Chaves obrigatórias ausentes em {info.field_name}: {missing_keys}")
            raise ValueError(f"Chaves obrigatórias ausentes: {missing_keys}")

        for key, value in v.items():
            logger.debug(f"Validando tarifa {info.field_name}.{key}: {value}")
            if not isinstance(value, (int, float)) or value < 0:
                logger.error(f"Valor inválido para {info.field_name}.{key}: {value}")
                raise ValueError(f"Valor inválido para {key}: {value}")

        logger.debug(f"✓ Estrutura de tarifas {info.field_name} validada com sucesso")
        return v

    @model_validator(mode='after')
    def validate_enabled_fields(self):
        """Valida que campos obrigatórios estão preenchidos quando enabled=True"""
        if self.enabled:
            if self.percentage <= 0:
                raise ValueError("percentage deve ser maior que 0 quando enabled=True")
            if self.data_off_peak is None:
                raise ValueError("data_off_peak é obrigatório quando enabled=True")
            if self.data_peak is None:
                raise ValueError("data_peak é obrigatório quando enabled=True")
            # Validar que tarifas não são zeradas
            if all(v == 0 for v in self.tarifas.values()):
                raise ValueError("tarifas devem ter valores > 0 quando enabled=True")
            if all(v == 0 for v in self.tusd.values()):
                raise ValueError("tusd devem ter valores > 0 quando enabled=True")
            if all(v == 0 for v in self.te.values()):
                raise ValueError("te devem ter valores > 0 quando enabled=True")
        return self


class ConsumoLocalGrupoAModel(BaseModel):
    """
    Modelo para consumo local Grupo A
    
    Dados de consumo local para consumidores do Grupo A com separação
    entre períodos fora ponta e ponta.
    """
    
    fora_ponta: MonthlyDataModel = Field(..., description="Consumo fora ponta mensal em kWh")
    ponta: MonthlyDataModel = Field(..., description="Consumo ponta mensal em kWh")


class TarifasGrupoAModel(BaseModel):
    """
    Modelo para tarifas Grupo A
    
    Estrutura de tarifas para consumidores do Grupo A incluindo
    tarifas de energia e TUSD.
    """
    
    fora_ponta: Dict[str, float] = Field(..., description="Tarifas fora ponta (te, tusd) em R$/kWh")
    ponta: Dict[str, float] = Field(..., description="Tarifas ponta (te, tusd) em R$/kWh")
    
    @field_validator('fora_ponta', 'ponta')
    @classmethod
    def validate_energy_tariffs(cls, v):
        """Valida estrutura das tarifas de energia"""
        required_keys = {'te', 'tusd'}
        
        if not isinstance(v, dict):
            raise ValueError("Tarifas devem ser um dicionário")
        
        missing_keys = required_keys - set(v.keys())
        if missing_keys:
            raise ValueError(f"Chaves obrigatórias ausentes: {missing_keys}")
        
        return v


class GrupoBFinancialRequest(BaseModel):
    """
    Request para cálculo financeiro Grupo B
    
    Estrutura completa de dados para análise financeira de consumidores
    do Grupo B (residencial, rural e outras baixas tensões).
    """
    
    financeiros: ProjectFinancialsModel = Field(..., description="Parâmetros financeiros do projeto")
    geracao: MonthlyDataModel = Field(..., description="Dados de geração mensal em kWh")
    consumo_local: MonthlyDataModel = Field(..., description="Dados de consumo local mensal em kWh")
    tarifa_base: float = Field(..., gt=0, description="Tarifa base de energia em R$/kWh")
    fio_b_base: float = Field(..., gt=0, description="Valor base do Fio B em R$/kWh")
    tipo_conexao: str = Field(..., pattern=r'^(monofasico|bifasico|trifasico)$', description="Tipo de conexão")
    fator_simultaneidade: float = Field(..., ge=0, le=1, description="Fator de simultaneidade")
    fio_b: FioBParamsModel = Field(..., description="Parâmetros do Fio B")
    remoto_b: RemoteConsumptionGrupoBModel = Field(..., description="Autoconsumo remoto Grupo B")
    remoto_a_verde: RemoteConsumptionGrupoAModel = Field(..., description="Autoconsumo remoto Grupo A Verde")
    remoto_a_azul: RemoteConsumptionGrupoAModel = Field(..., description="Autoconsumo remoto Grupo A Azul")
    
    class Config:
        json_schema_extra = {
            "example": {
                "financeiros": {
                    "capex": 50000.0,
                    "anos": 25,
                    "taxa_desconto": 8.0,
                    "inflacao_energia": 4.5,
                    "degradacao": 0.5,
                    "salvage_pct": 0.1,
                    "oma_first_pct": 0.015,
                    "oma_inflacao": 4.0
                },
                "geracao": {
                    "jan": 450, "fev": 420, "mar": 480, "abr": 460,
                    "mai": 430, "jun": 400, "jul": 410, "ago": 440,
                    "set": 470, "out": 490, "nov": 465, "dez": 455
                },
                "consumo_local": {
                    "jan": 350, "fev": 320, "mar": 380, "abr": 360,
                    "mai": 330, "jun": 300, "jul": 310, "ago": 340,
                    "set": 370, "out": 390, "nov": 365, "dez": 355
                },
                "tarifa_base": 0.85,
                "fio_b_base": 0.2500,
                "tipo_conexao": "Monofasico",
                "fator_simultaneidade": 0.25,
                "fio_b": {
                    "schedule": {2025: 0.45, 2026: 0.60, 2027: 0.75, 2028: 0.90},
                    "base_year": 2025
                },
                "remoto_b": {
                    "enabled": True,
                    "percentage": 40.0,
                    "data": {
                        "jan": 100, "fev": 95, "mar": 105, "abr": 100,
                        "mai": 90, "jun": 85, "jul": 88, "ago": 95,
                        "set": 102, "out": 108, "nov": 98, "dez": 92
                    },
                    "tarifa_total": 0.84,
                    "fio_b_value": 0.25
                },
                "remoto_a_verde": {
                    "enabled": False,
                    "percentage": 30.0,
                    "data_off_peak": {
                        "jan": 50, "fev": 48, "mar": 52, "abr": 50,
                        "mai": 45, "jun": 42, "jul": 44, "ago": 48,
                        "set": 51, "out": 54, "nov": 49, "dez": 46
                    },
                    "data_peak": {
                        "jan": 20, "fev": 19, "mar": 21, "abr": 20,
                        "mai": 18, "jun": 17, "jul": 18, "ago": 19,
                        "set": 20, "out": 22, "nov": 20, "dez": 18
                    },
                    "tarifas": {"off_peak": 0.48, "peak": 2.20},
                    "tusd": {"off_peak": 0.16121, "peak": 1.6208},
                    "te": {"off_peak": 0.34334, "peak": 0.55158}
                },
                "remoto_a_azul": {
                    "enabled": False,
                    "percentage": 30.0,
                    "data_off_peak": {
                        "jan": 50, "fev": 48, "mar": 52, "abr": 50,
                        "mai": 45, "jun": 42, "jul": 44, "ago": 48,
                        "set": 51, "out": 54, "nov": 49, "dez": 46
                    },
                    "data_peak": {
                        "jan": 20, "fev": 19, "mar": 21, "abr": 20,
                        "mai": 18, "jun": 17, "jul": 18, "ago": 19,
                        "set": 20, "out": 22, "nov": 20, "dez": 18
                    },
                    "tarifas": {"off_peak": 0.48, "peak": 2.20},
                    "tusd": {"off_peak": 0.16121, "peak": 1.6208},
                    "te": {"off_peak": 0.34334, "peak": 0.55158}
                }
            }
        }


class GrupoAFinancialRequest(BaseModel):
    """
    Request para cálculo financeiro Grupo A
    
    Estrutura completa de dados para análise financeira de consumidores
    do Grupo A (média e alta tensão) com tarifação horossazonal.
    """
    
    financeiros: ProjectFinancialsModel = Field(..., description="Parâmetros financeiros do projeto")
    geracao: MonthlyDataModel = Field(..., description="Dados de geração mensal em kWh")
    consumo_local: ConsumoLocalGrupoAModel = Field(..., description="Dados de consumo local mensal em kWh")
    tarifas: TarifasGrupoAModel = Field(..., description="Estrutura de tarifas Grupo A")
    te: Dict[str, float] = Field(..., description="TE por período (fora_ponta, ponta) em R$/kWh")
    fator_simultaneidade_local: float = Field(..., ge=0, le=1, description="Fator de simultaneidade local")
    fio_b: FioBParamsModel = Field(..., description="Parâmetros do Fio B")
    remoto_b: RemoteConsumptionGrupoBModel = Field(..., description="Autoconsumo remoto Grupo B")
    remoto_a_verde: RemoteConsumptionGrupoAModel = Field(..., description="Autoconsumo remoto Grupo A Verde")
    remoto_a_azul: RemoteConsumptionGrupoAModel = Field(..., description="Autoconsumo remoto Grupo A Azul")
    
    @field_validator('te')
    @classmethod
    def validate_te_structure(cls, v):
        """Valida estrutura do dicionário TE"""
        required_keys = {'fora_ponta', 'ponta'}
        
        if not isinstance(v, dict):
            raise ValueError("TE deve ser um dicionário")
        
        missing_keys = required_keys - set(v.keys())
        if missing_keys:
            raise ValueError(f"Chaves obrigatórias ausentes no TE: {missing_keys}")
        
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "financeiros": {
                    "capex": 150000.0,
                    "anos": 25,
                    "taxa_desconto": 8.0,
                    "inflacao_energia": 4.5,
                    "degradacao": 0.5,
                    "salvage_pct": 0.1,
                    "oma_first_pct": 0.015,
                    "oma_inflacao": 4.0
                },
                "geracao": {
                    "jan": 1800, "fev": 1680, "mar": 1920, "abr": 1840,
                    "mai": 1720, "jun": 1600, "jul": 1640, "ago": 1760,
                    "set": 1880, "out": 1960, "nov": 1860, "dez": 1820
                },
                "consumo_local": {
                    "fora_ponta": {
                        "jan": 1200, "fev": 1100, "mar": 1300, "abr": 1250,
                        "mai": 1150, "jun": 1050, "jul": 1080, "ago": 1180,
                        "set": 1280, "out": 1350, "nov": 1220, "dez": 1160
                    },
                    "ponta": {
                        "jan": 400, "fev": 380, "mar": 420, "abr": 410,
                        "mai": 390, "jun": 360, "jul": 370, "ago": 400,
                        "set": 430, "out": 450, "nov": 415, "dez": 395
                    }
                },
                "tarifas": {
                    "fora_ponta": {"te": 0.34334, "tusd": 0.16121},
                    "ponta": {"te": 0.55158, "tusd": 1.6208}
                },
                "te": {"fora_ponta": 0.34334, "ponta": 0.55158},
                "fator_simultaneidade_local": 0.35,
                "fio_b": {
                    "schedule": {2025: 0.45, 2026: 0.60, 2027: 0.75, 2028: 0.90},
                    "base_year": 2025
                },
                "remoto_b": {
                    "enabled": True,
                    "percentage": 40.0,
                    "data": {
                        "jan": 300, "fev": 285, "mar": 315, "abr": 300,
                        "mai": 270, "jun": 255, "jul": 264, "ago": 285,
                        "set": 306, "out": 324, "nov": 294, "dez": 276
                    },
                    "tarifa_total": 0.84,
                    "fio_b_value": 0.25
                },
                "remoto_a_verde": {
                    "enabled": False,
                    "percentage": 30.0,
                    "data_off_peak": {
                        "jan": 150, "fev": 144, "mar": 156, "abr": 150,
                        "mai": 135, "jun": 126, "jul": 132, "ago": 144,
                        "set": 153, "out": 162, "nov": 147, "dez": 138
                    },
                    "data_peak": {
                        "jan": 60, "fev": 57, "mar": 63, "abr": 60,
                        "mai": 54, "jun": 51, "jul": 53, "ago": 57,
                        "set": 61, "out": 66, "nov": 59, "dez": 55
                    },
                    "tarifas": {"off_peak": 0.48, "peak": 2.20},
                    "tusd": {"off_peak": 0.16121, "peak": 1.6208},
                    "te": {"off_peak": 0.34334, "peak": 0.55158}
                },
                "remoto_a_azul": {
                    "enabled": False,
                    "percentage": 30.0,
                    "data_off_peak": {
                        "jan": 150, "fev": 144, "mar": 156, "abr": 150,
                        "mai": 135, "jun": 126, "jul": 132, "ago": 144,
                        "set": 153, "out": 162, "nov": 147, "dez": 138
                    },
                    "data_peak": {
                        "jan": 60, "fev": 57, "mar": 63, "abr": 60,
                        "mai": 54, "jun": 51, "jul": 53, "ago": 57,
                        "set": 61, "out": 66, "nov": 59, "dez": 55
                    },
                    "tarifas": {"off_peak": 0.48, "peak": 2.20},
                    "tusd": {"off_peak": 0.16121, "peak": 1.6208},
                    "te": {"off_peak": 0.34334, "peak": 0.55158}
                }
            }
        }


class FinancialSummary(BaseModel):
    """
    Modelo para resumo financeiro com valores brutos
    
    Apresenta os principais indicadores financeiros como valores numéricos
    para processamento e cálculos no backend.
    """
    
    vpl: float = Field(..., description="Valor Presente Líquido em R$")
    tir: float = Field(..., description="Taxa Interna de Retorno (decimal, ex: 0.155 para 15.5%)")
    pi: float = Field(..., description="Índice de lucratividade (decimal)")
    payback_simples: float = Field(..., description="Payback simples em anos")
    payback_descontado: float = Field(..., description="Payback descontado em anos")
    lcoe: float = Field(..., description="LCOE em R$/kWh")
    roi_simples: float = Field(..., description="ROI simples (decimal)")
    economia_total_nominal: float = Field(..., description="Economia total nominal em R$")
    economia_total_valor_presente: float = Field(..., description="Economia total valor presente em R$")


class FinancialSummaryFormatted(BaseModel):
    """
    Modelo para resumo financeiro formatado
    
    Apresenta os principais indicadores financeiros com formatação
    brasileira para exibição em relatórios e interfaces.
    """
    
    vpl: str = Field(..., description="Valor Presente Líquido formatado (R$ 123.456,78)")
    tir: str = Field(..., description="Taxa Interna de Retorno formatada (15,50% ou N/A)")
    pi: str = Field(..., description="Índice de lucratividade formatado (1,25)")
    payback_simples: str = Field(..., description="Payback simples formatado (5,23 anos)")
    payback_descontado: str = Field(..., description="Payback descontado formatado (7,85 anos)")
    lcoe: str = Field(..., description="LCOE formatado (R$ 0,45/kWh)")
    roi_simples: str = Field(..., description="ROI simples formatado (25,50%)")
    economia_total_nominal: str = Field(..., description="Economia total nominal formatada")
    economia_total_valor_presente: str = Field(..., description="Economia total valor presente formatada")


class CashFlowRow(BaseModel):
    """
    Modelo para linha da tabela de fluxo de caixa
    
    Representa os dados financeiros de um ano específico no fluxo
    de caixa do projeto.
    """
    
    ano: int = Field(..., description="Ano da análise")
    fluxo_nominal: float = Field(..., description="Fluxo de caixa nominal em R$")
    fluxo_acumulado_nominal: float = Field(..., description="Fluxo acumulado nominal em R$")
    fluxo_descontado: float = Field(..., description="Fluxo de caixa descontado em R$")
    fluxo_acumulado_descontado: float = Field(..., description="Fluxo acumulado descontado em R$")


class ResultadosCodigoBResponse(BaseModel):
    """
    Modelo de response para resultados Grupo B
    
    Estrutura completa de resposta para cálculos financeiros do
    Grupo B incluindo todos os indicadores e tabelas detalhadas.
    """
    
    somas_iniciais: Dict[str, str] = Field(..., description="Somas iniciais formatadas")
    comparativo_custo_abatimento: Dict[str, str] = Field(..., description="Comparativo de custos formatado")
    financeiro: FinancialSummary = Field(..., description="Resumo financeiro com valores brutos")
    consumo_ano1: Dict[str, Any] = Field(..., description="Dados de consumo do primeiro ano")
    tabela_resumo_anual: List[Dict[str, Any]] = Field(..., description="Tabela resumo anual")
    tabela_fluxo_caixa: List[CashFlowRow] = Field(..., description="Tabela de fluxo de caixa")
    
    class Config:
        json_schema_extra = {
            "example": {
                "somas_iniciais": {
                    "geracao_anual": "5.400 kWh",
                    "consumo_local_anual": "4.200 kWh",
                    "excedente_anual": "1.200 kWh"
                },
                "comparativo_custo_abatimento": {
                    "custo_sem_sistema": "R$ 4.284,00/ano",
                    "custo_com_sistema": "R$ 1.071,00/ano",
                    "economia_anual": "R$ 3.213,00"
                },
                "financeiro": {
                    "vpl": "R$ 45.678,90",
                    "tir": "12,50%",
                    "pi": "1,85",
                    "payback_simples": "6,23 anos",
                    "payback_descontado": "8,45 anos",
                    "lcoe": "R$ 0,42/kWh",
                    "roi_simples": "85,50%",
                    "economia_total_nominal": "R$ 80.325,00",
                    "economia_total_valor_presente": "R$ 45.678,90"
                },
                "consumo_ano1": {
                    "consumo_local": 4200,
                    "geracao": 5400,
                    "excedente": 1200,
                    "autoconsumo": 1050,
                    "injetado_rede": 4350
                },
                "tabela_resumo_anual": [
                    {
                        "ano": 1,
                        "geracao": 5400,
                        "economia": 3213,
                        "custos_om": 750,
                        "fluxo_liquido": 2463
                    }
                ],
                "tabela_fluxo_caixa": [
                    {
                        "ano": 1,
                        "fluxo_nominal": 2463,
                        "fluxo_acumulado_nominal": 2463,
                        "fluxo_descontado": 2280,
                        "fluxo_acumulado_descontado": 2280
                    }
                ]
            }
        }


class ResultadosCodigoAResponse(BaseModel):
    """
    Modelo de response para resultados Grupo A
    
    Estrutura completa de resposta para cálculos financeiros do
    Grupo A incluindo análise de sensibilidade.
    """
    
    somas_iniciais: Dict[str, str] = Field(..., description="Somas iniciais formatadas")
    financeiro: FinancialSummaryFormatted = Field(..., description="Resumo financeiro formatado")
    consumo_ano1: Dict[str, Any] = Field(..., description="Dados de consumo do primeiro ano")
    tabela_resumo_anual: List[Dict[str, Any]] = Field(..., description="Tabela resumo anual")
    tabela_fluxo_caixa: List[CashFlowRow] = Field(..., description="Tabela de fluxo de caixa")
    dados_sensibilidade: Dict[str, List[float]] = Field(..., description="Dados de análise de sensibilidade")
    
    class Config:
        json_schema_extra = {
            "example": {
                "somas_iniciais": {
                    "geracao_anual": "21.600 kWh",
                    "consumo_local_anual": "19.200 kWh",
                    "excedente_anual": "2.400 kWh"
                },
                "financeiro": {
                    "vpl": "R$ 125.678,90",
                    "tir": "15,80%",
                    "pi": "1,92",
                    "payback_simples": "5,45 anos",
                    "payback_descontado": "7,23 anos",
                    "lcoe": "R$ 0,38/kWh",
                    "roi_simples": "92,50%",
                    "economia_total_nominal": "R$ 320.400,00",
                    "economia_total_valor_presente": "R$ 125.678,90"
                },
                "consumo_ano1": {
                    "consumo_local_fora_ponta": 14400,
                    "consumo_local_ponta": 4800,
                    "geracao": 21600,
                    "excedente": 2400,
                    "autoconsumo": 19200,
                    "injetado_rede": 2400
                },
                "tabela_resumo_anual": [
                    {
                        "ano": 1,
                        "geracao": 21600,
                        "economia": 12852,
                        "custos_om": 2250,
                        "fluxo_liquido": 10602
                    }
                ],
                "tabela_fluxo_caixa": [
                    {
                        "ano": 1,
                        "fluxo_nominal": 10602,
                        "fluxo_acumulado_nominal": 10602,
                        "fluxo_descontado": 9817,
                        "fluxo_acumulado_descontado": 9817
                    }
                ],
                "dados_sensibilidade": {
                    "vpl_variacao_tarifa": [95678.90, 125678.90, 155678.90],
                    "vpl_variacao_inflacao": [115678.90, 125678.90, 135678.90],
                    "vpl_variacao_desconto": [145678.90, 125678.90, 105678.90]
                }
            }
        }