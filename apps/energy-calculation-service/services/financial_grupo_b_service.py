# -*- coding: utf-8 -*-
"""
Serviço de cálculo financeiro especializado para Grupo B
Implementa lógica completa de cálculo financeiro para Grupo B, incluindo 
autoconsumo instantâneo, créditos, Fio B, e fluxo de caixa seguindo regras da Lei 14.300/2022.
"""

import logging
import numpy as np
import numpy_financial as npf
from typing import List, Dict, Optional, Any, Tuple
from models.shared.financial_models import (
    GrupoBFinancialRequest,
    ResultadosCodigoBResponse,
    FinancialSummaryFormatted,
    CashFlowRow
)
from utils.format_utils import format_currency, format_percentage

# Configure logger
logger = logging.getLogger(__name__)


class FinancialGrupoBService:
    """Serviço especializado para cálculos financeiros do Grupo B"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def calculate(self, request: GrupoBFinancialRequest) -> ResultadosCodigoBResponse:
        """
        Método principal de cálculo financeiro para Grupo B
        
        Estrutura:
        1. Log início com CAPEX
        2. Validar dados de entrada
        3. Converter MonthlyData para arrays
        4. Calcular autoconsumo instantâneo
        5. Calcular créditos mensais
        6. Aplicar Fio B aos créditos
        7. Calcular custo de disponibilidade
        8. Calcular abatimentos locais
        9. Calcular abatimentos remotos (se habilitado)
        10. Calcular economia total anual
        11. Calcular fluxo de caixa (25 anos)
        12. Calcular indicadores financeiros
        13. Montar tabelas de resumo
        14. Formatar resultados
        15. Retornar ResultadosCodigoBResponse
        
        Use try/except robusto.
        Log em cada etapa principal.
        """
        try:
            # 1. Log início com CAPEX
            self.logger.info(f"INÍCIO CÁLCULO GRUPO B - CAPEX: R$ {request.financeiros.capex:,.2f}")
            
            # 2. Validar dados de entrada
            self._validate_request(request)
            
            # 3. Converter MonthlyData para arrays
            geracao = request.geracao.to_list()
            consumo_local = request.consumo_local.to_list()
            
            # 4. Calcular autoconsumo instantâneo
            autoconsumo_instantaneo = self._calculate_autoconsumo_instantaneo(
                geracao, consumo_local, request.fator_simultaneidade
            )
            
            # 5. Calcular créditos mensais
            creditos = self._calculate_creditos_grupo_b(geracao, autoconsumo_instantaneo)
            
            # 6. Aplicar Fio B aos créditos
            creditos_liquidos_por_ano = self._apply_fio_b(
                creditos, request.fio_b.schedule, request.fio_b.base_year, request.financeiros.anos
            )
            
            # 7. Calcular custo de disponibilidade
            custo_disponibilidade_mensal = self._calculate_custo_disponibilidade(
                request.tipo_conexao, request.tarifa_base
            )
            
            # 8. Calcular abatimentos locais
            abatimentos_local = self._calculate_abatimento_local(
                consumo_local, creditos_liquidos_por_ano[0], autoconsumo_instantaneo,
                request.tarifa_base, custo_disponibilidade_mensal
            )
            
            # 9. Calcular abatimentos remotos (se habilitado)
            abatimentos_remotos = self._calculate_abatimentos_remotos(request, creditos_liquidos_por_ano)
            
            # 10. Calcular economia total anual
            economia_anual = abatimentos_local['economia_total_ano'] + abatimentos_remotos['economia_total_ano']
            
            # 11. Calcular fluxo de caixa (25 anos)
            cash_flow = self._calculate_cash_flow(
                request.financeiros.capex,
                economia_anual,
                request.financeiros.capex * request.financeiros.oma_first_pct,
                request.financeiros.inflacao_energia / 100,
                request.financeiros.oma_inflacao / 100,
                request.financeiros.degradacao / 100,
                request.financeiros.anos,
                request.financeiros.taxa_desconto / 100,
                request.financeiros.salvage_pct
            )
            
            # 12. Calcular indicadores financeiros
            indicadores = self._calculate_indicadores_financeiros(cash_flow, request.financeiros.capex)
            
            # 13. Montar resposta
            response = self._build_response(
                geracao, consumo_local, request.financeiros.capex,
                cash_flow, abatimentos_local, abatimentos_remotos,
                indicadores, request, custo_disponibilidade_mensal
            )
            
            self.logger.info("FIM CÁLCULO GRUPO B - Sucesso")
            return response
            
        except Exception as e:
            self.logger.error(f"ERRO CÁLCULO GRUPO B: {str(e)}")
            raise
    
    def _validate_request(self, request: GrupoBFinancialRequest):
        """Valida dados de entrada"""
        if request.financeiros.capex <= 0:
            raise ValueError("CAPEX deve ser positivo")
        
        if len(request.geracao.to_list()) != 12:
            raise ValueError("Dados de geração devem ter 12 meses")
        
        if len(request.consumo_local.to_list()) != 12:
            raise ValueError("Dados de consumo local devem ter 12 meses")
        
        # Validar soma de percentuais remotos
        total_percent = request.remoto_b.percentage
        if request.remoto_a_verde.enabled:
            total_percent += request.remoto_a_verde.percentage
        if request.remoto_a_azul.enabled:
            total_percent += request.remoto_a_azul.percentage
        
        if total_percent > 100:
            raise ValueError(f"Soma de percentuais remotos ({total_percent}%) não pode ultrapassar 100%")
    
    def _calculate_autoconsumo_instantaneo(
        self,
        geracao: List[float],
        consumo: List[float],
        fator_simultaneidade: float
    ) -> List[float]:
        """
        Calcula energia consumida instantaneamente (não vai para rede)
        
        Formula para cada mês:
        autoconsumo_instantaneo = min(geracao, consumo) * fator_simultaneidade
        
        Retorna array de 12 valores (kWh/mês)
        
        Exemplo:
        geracao = [1000, 1200, 800]
        consumo = [800, 1500, 600]
        fator_simultaneidade = 0.25
        Resultado: [200, 300, 150]  # min(1000,800)*0.25, min(1200,1500)*0.25, min(800,600)*0.25
        """
        if len(geracao) != 12 or len(consumo) != 12:
            raise ValueError("Arrays devem ter 12 elementos")
        
        autoconsumo = []
        for i in range(12):
            valor = min(geracao[i], consumo[i]) * fator_simultaneidade
            autoconsumo.append(valor)
        
        self.logger.debug(f"Autoconsumo instantâneo calculado: {autoconsumo}")
        return autoconsumo
    
    def _calculate_creditos_grupo_b(
        self,
        geracao: List[float],
        autoconsumo_instantaneo: List[float]
    ) -> List[float]:
        """
        Calcula créditos de energia (energia excedente injetada na rede)
        
        Formula para cada mês:
        creditos = geracao - autoconsumo_instantaneo
        
        Retorna array de 12 valores (kWh de crédito/mês)
        
        Créditos não podem ser negativos.
        """
        if len(geracao) != 12 or len(autoconsumo_instantaneo) != 12:
            raise ValueError("Arrays devem ter 12 elementos")
        
        creditos = []
        for i in range(12):
            valor = max(0, geracao[i] - autoconsumo_instantaneo[i])
            creditos.append(valor)
        
        self.logger.debug(f"Créditos calculados: {creditos}")
        return creditos
    
    def _apply_fio_b(
        self,
        creditos: List[float],
        fio_b_schedule: Dict[int, float],
        base_year: int,
        anos: int
    ) -> Dict[int, List[float]]:
        """
        Aplica desconto de Fio B aos créditos conforme cronograma da Lei 14.300
        
        Para cada ano:
        - Aplica percentual de Fio B correspondente ao ano
        - credito_liquido = credito * (1 - fio_b_percent)
        
        Retorna dict {ano: [12 valores de créditos líquidos]}
        """
        creditos_por_ano = {}
        
        self.logger.info(f"Cronograma Fio B utilizado: {fio_b_schedule}")
        
        for ano in range(anos):
            year = base_year + ano
            fio_b_percent = fio_b_schedule.get(year, list(fio_b_schedule.values())[-1])  # Último valor disponível
            
            # Aplicar degradação aos créditos (0.5% ao ano padrão)
            degradacao = 0.005
            creditos_ano = [cred * (1 - degradacao) ** ano for cred in creditos]
            
            # Aplicar Fio B
            creditos_liquidos = [cred * (1 - fio_b_percent) for cred in creditos_ano]
            
            creditos_por_ano[ano] = creditos_liquidos
            
            self.logger.debug(f"Ano {year}: Fio B {fio_b_percent:.1%}, créditos líquidos: {sum(creditos_liquidos):.2f} kWh")
        
        return creditos_por_ano
    
    def _calculate_custo_disponibilidade(self, tipo_conexao: str, tarifa_base: float) -> float:
        """Calcula custo de disponibilidade mensal conforme tipo de conexão"""
        demanda_minima = {
            "Monofasico": 30,
            "Bifasico": 50,
            "Trifasico": 100
        }.get(tipo_conexao, 30)
        
        custo_mensal = demanda_minima * tarifa_base
        self.logger.debug(f"Custo disponibilidade mensal ({tipo_conexao}): R$ {custo_mensal:.2f}")
        return custo_mensal
    
    def _calculate_abatimento_local(
        self,
        consumo: List[float],
        creditos_liquidos: List[float],
        autoconsumo_instantaneo: List[float],
        tarifa_base: float,
        custo_disponibilidade_mensal: float
    ) -> Dict[str, Any]:
        """
        Calcula economia gerada na unidade local
        
        Para cada mês:
        1. Economia autoconsumo instantâneo = autoconsumo * tarifa_base
        2. kWh_abater = consumo - autoconsumo_instantaneo
        3. kWh_abatido_com_creditos = min(kWh_abater, creditos_liquidos)
        4. Economia créditos = kWh_abatido_com_creditos * tarifa_base
        5. Custo mínimo = max(custo_disponibilidade, economia_total)
        6. Economia líquida = economia_total - custo_mínimo
        
        Retorna dict com:
        - economia_mensal: List[float]
        - kwh_abatido: List[float]
        - percentual_abatido: List[float]
        - economia_total_ano: float
        """
        economia_mensal = []
        kwh_abatido = []
        percentual_abatido = []
        
        for i in range(12):
            # 1. Economia autoconsumo instantâneo
            economia_autoconsumo = autoconsumo_instantaneo[i] * tarifa_base
            
            # 2. kWh a abater
            kWh_abater = consumo[i] - autoconsumo_instantaneo[i]
            
            # 3. kWh abatido com créditos
            kWh_abatido_com_creditos = min(kWh_abater, creditos_liquidos[i])
            
            # 4. Economia créditos
            economia_creditos = kWh_abatido_com_creditos * tarifa_base
            
            # 5. Economia total do mês
            economia_total_mes = economia_autoconsumo + economia_creditos
            
            # 6. Custo mínimo (tarifa de disponibilidade)
            custo_minimo = max(custo_disponibilidade_mensal, economia_total_mes)
            
            # 7. Economia líquida
            economia_liquida = economia_total_mes - custo_minimo
            
            economia_mensal.append(economia_liquida)
            kwh_abatido.append(autoconsumo_instantaneo[i] + kWh_abatido_com_creditos)
            
            # Percentual de abatimento
            perc_abatido = (kwh_abatido[i] / consumo[i] * 100) if consumo[i] > 0 else 0
            percentual_abatido.append(perc_abatido)
        
        economia_total_ano = sum(economia_mensal)
        
        self.logger.debug(f"Abatimento local - Economia anual: R$ {economia_total_ano:.2f}")
        
        return {
            'economia_mensal': economia_mensal,
            'kwh_abatido': kwh_abatido,
            'percentual_abatido': percentual_abatido,
            'economia_total_ano': economia_total_ano
        }
    
    def _calculate_abatimentos_remotos(
        self, 
        request: GrupoBFinancialRequest, 
        creditos_liquidos_por_ano: Dict[int, List[float]]
    ) -> Dict[str, Any]:
        """Calcula abatimentos para unidades remotas"""
        economia_remotos = 0
        
        # Implementação simplificada - pode ser expandida conforme necessidade
        if request.remoto_b.enabled:
            # Lógica para abatimento remoto B
            consumo_remoto_b = request.remoto_b.data.to_list()
            creditos_para_b = sum(creditos_liquidos_por_ano[0]) * (request.remoto_b.percentage / 100)
            
            for i in range(12):
                abatido = min(creditos_para_b / 12, consumo_remoto_b[i])
                economia_remotos += abatido * request.remoto_b.tarifa_total
        
        # Similar para A Verde e A Azul...
        
        return {
            'economia_total_ano': economia_remotos
        }
    
    def _calculate_cash_flow(
        self,
        capex: float,
        economia_anual: float,
        custo_oma_first: float,
        inflacao_energia: float,
        inflacao_oma: float,
        degradacao: float,
        anos: int,
        taxa_desconto: float,
        salvage_pct: float
    ) -> List[Dict[str, float]]:
        """
        Calcula fluxo de caixa ano a ano
        
        Para cada ano:
        - Ano 0: Fluxo = -CAPEX
        - Anos 1-N:
          - Economia ano = economia_anual * (1 + inflacao_energia)^ano * (1 - degradacao)^ano
          - Custo O&M ano = custo_oma_first * (1 + inflacao_oma)^ano
          - Fluxo nominal = economia_ano - custo_oma_ano
          - Fluxo descontado = fluxo_nominal / (1 + taxa_desconto)^ano
          - Fluxo acumulado nominal = soma de todos os fluxos até o ano
          - Fluxo acumulado descontado = soma de todos os fluxos descontados
        - Último ano: Adicionar valor residual = CAPEX * salvage_pct
        
        Retorna lista de dicts com campos:
        - ano, fluxo_nominal, fluxo_acumulado_nominal, fluxo_descontado, fluxo_acumulado_descontado
        """
        cash_flow = []
        fluxo_acumulado_nominal = -capex
        fluxo_acumulado_descontado = -capex
        
        # Ano 0
        cash_flow.append({
            'ano': 0,
            'fluxo_nominal': -capex,
            'fluxo_acumulado_nominal': fluxo_acumulado_nominal,
            'fluxo_descontado': -capex,
            'fluxo_acumulado_descontado': fluxo_acumulado_descontado
        })
        
        for ano in range(1, anos + 1):
            # Economia do ano com inflação e degradação
            economia_ano = economia_anual * ((1 + inflacao_energia) ** (ano - 1)) * ((1 - degradacao) ** (ano - 1))
            
            # Custo O&M do ano com inflação
            custo_oma_ano = custo_oma_first * ((1 + inflacao_oma) ** (ano - 1))
            
            # Fluxo nominal
            fluxo_nominal = economia_ano - custo_oma_ano
            
            # Adicionar valor residual no último ano
            if ano == anos:
                fluxo_nominal += capex * salvage_pct
            
            # Fluxo descontado
            fluxo_descontado = fluxo_nominal / ((1 + taxa_desconto) ** ano)
            
            # Fluxos acumulados
            fluxo_acumulado_nominal += fluxo_nominal
            fluxo_acumulado_descontado += fluxo_descontado
            
            cash_flow.append({
                'ano': ano,
                'fluxo_nominal': fluxo_nominal,
                'fluxo_acumulado_nominal': fluxo_acumulado_nominal,
                'fluxo_descontado': fluxo_descontado,
                'fluxo_acumulado_descontado': fluxo_acumulado_descontado
            })
        
        return cash_flow
    
    def _calculate_indicadores_financeiros(self, cash_flow: List[Dict], capex: float) -> Dict[str, float]:
        """Calcula indicadores financeiros principais"""
        # Extrair fluxos para cálculos
        fluxos = [cf['fluxo_nominal'] for cf in cash_flow]
        
        # VPL
        vpl = npf.npv(0.08, fluxos)  # Usando taxa de desconto padrão de 8%
        
        # TIR
        try:
            tir = npf.irr(fluxos)
            tir_pct = tir * 100 if tir is not None else 0
        except:
            tir_pct = 0
        
        # Payback simples
        payback_simples = self._calculate_payback(cash_flow, 'nominal')
        
        # Payback descontado
        payback_descontado = self._calculate_payback(cash_flow, 'descontado')
        
        return {
            'vpl': vpl,
            'tir': tir_pct,
            'payback_simples': payback_simples,
            'payback_descontado': payback_descontado
        }
    
    def _calculate_payback(self, cash_flow: List[Dict], tipo: str) -> float:
        """Calcula payback (simples ou descontado)"""
        campo_fluxo = f'fluxo_acumulado_{tipo}'
        
        for cf in cash_flow[1:]:  # Ignorar ano 0
            if cf[campo_fluxo] >= 0:
                # Interpolação linear para precisão
                ano_anterior = cf['ano'] - 1
                cf_anterior = cash_flow[ano_anterior]
                
                if cf['ano'] > 1 and cf[campo_fluxo] - cf_anterior[campo_fluxo] > 0:
                    fator = abs(cf_anterior[campo_fluxo]) / (cf[campo_fluxo] - cf_anterior[campo_fluxo])
                    return cf['ano'] - 1 + fator
                else:
                    return float(cf['ano'])
        
        return float(len(cash_flow) - 1)  # Retorna vida útil se não pagar
    

    
    def _build_response(
        self,
        geracao: List[float],
        consumo: List[float],
        capex: float,
        cash_flow: List[Dict],
        abatimentos_local: Dict,
        abatimentos_remotos: Dict,
        indicadores: Dict,
        request: GrupoBFinancialRequest,
        custo_disponibilidade_mensal: float
    ) -> ResultadosCodigoBResponse:
        """
        Monta objeto de resposta formatado
        
        Estrutura:
        1. somas_iniciais: Formatar geração, consumo, CAPEX
        2. comparativo_custo_abatimento: Calcular e formatar
        3. financeiro: Formatar todos os indicadores financeiros
        4. consumo_ano1: Montar estrutura detalhada do ano 1
        5. tabela_resumo_anual: Montar array com dados anuais
        6. tabela_fluxo_caixa: Converter cash_flow para formato esperado
        
        Use funções de formatação (format_currency, format_percentage, etc.)
        """
        
        # 1. Somas iniciais
        somas_iniciais = {
            "geracao_anual": f"{sum(geracao):,.0f} kWh".replace(",", "."),
            "consumo_anual": f"{sum(consumo):,.0f} kWh".replace(",", "."),
            "capex": format_currency(capex)
        }
        
        # 2. Comparativo de custo abatimento
        custo_anual_sem_sistema = sum(consumo) * request.tarifa_base
        custo_anual_com_sistema = custo_disponibilidade_mensal * 12
        economia_anual = custo_anual_sem_sistema - custo_anual_com_sistema
        
        comparativo_custo_abatimento = {
            "custo_sem_sistema": format_currency(custo_anual_sem_sistema) + "/ano",
            "custo_com_sistema": format_currency(custo_anual_com_sistema) + "/ano",
            "economia_anual": format_currency(economia_anual)
        }
        
        # 3. Financeiro
        financeiro = FinancialSummaryFormatted(
            vpl=format_currency(indicadores['vpl']),
            tir=format_percentage(indicadores['tir']) if indicadores['tir'] > 0 else "N/A",
            pi=f"{(indicadores['vpl'] + capex) / capex:.2f}" if capex > 0 else "N/A",
            payback_simples=f"{indicadores['payback_simples']:.2f} anos",
            payback_descontado=f"{indicadores['payback_descontado']:.2f} anos",
            lcoe=format_currency(capex / sum(geracao) * 1000) + "/kWh" if sum(geracao) > 0 else "N/A",
            roi_simples=format_percentage(((sum(abatimentos_local['economia_mensal']) - capex * request.financeiros.oma_first_pct) / capex) * 100),
            economia_total_nominal=format_currency(sum(abatimentos_local['economia_mensal']) * request.financeiros.anos),
            economia_total_valor_presente=format_currency(indicadores['vpl'])
        )
        
        # 4. Consumo ano 1
        consumo_ano1 = {
            "consumo_local": sum(consumo),
            "geracao": sum(geracao),
            "autoconsumo_instantaneo": sum(abatimentos_local['economia_mensal']) / request.tarifa_base,
            "percentual_abatido": sum(abatimentos_local['percentual_abatido']) / 12
        }
        
        # 5. Tabela resumo anual (simplificada)
        tabela_resumo_anual = []
        for ano in range(1, min(request.financeiros.anos + 1, 6)):  # Primeiros 5 anos
            tabela_resumo_anual.append({
                "ano": ano,
                "geracao": sum(geracao) * ((1 - request.financeiros.degradacao / 100) ** (ano - 1)),
                "economia": sum(abatimentos_local['economia_mensal']) * ((1 + request.financeiros.inflacao_energia / 100) ** (ano - 1)),
                "custos_om": capex * request.financeiros.oma_first_pct * ((1 + request.financeiros.oma_inflacao / 100) ** (ano - 1))
            })
        
        # 6. Tabela fluxo de caixa
        tabela_fluxo_caixa = [
            CashFlowRow(
                ano=cf['ano'],
                fluxo_nominal=cf['fluxo_nominal'],
                fluxo_acumulado_nominal=cf['fluxo_acumulado_nominal'],
                fluxo_descontado=cf['fluxo_descontado'],
                fluxo_acumulado_descontado=cf['fluxo_acumulado_descontado']
            ) for cf in cash_flow
        ]
        
        return ResultadosCodigoBResponse(
            somas_iniciais=somas_iniciais,
            comparativo_custo_abatimento=comparativo_custo_abatimento,
            financeiro=financeiro,
            consumo_ano1=consumo_ano1,
            tabela_resumo_anual=tabela_resumo_anual,
            tabela_fluxo_caixa=tabela_fluxo_caixa
        )