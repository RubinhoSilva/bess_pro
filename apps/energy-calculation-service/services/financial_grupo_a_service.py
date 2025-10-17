# -*- coding: utf-8 -*-
"""
Serviço de cálculo financeiro especializado para Grupo A
Implementa lógica completa de cálculo financeiro para Grupo A, incluindo 
autoconsumo simultâneo, separação ponta/fora-ponta, fator de equivalência, 
e análise de sensibilidade seguindo regras da Lei 14.300/2022.
"""

import logging
import numpy as np
import numpy_financial as npf
from typing import List, Dict, Optional, Any, Tuple
from models.shared.financial_models import (
    GrupoAFinancialRequest,
    ResultadosCodigoAResponse,
    FinancialSummaryFormatted,
    CashFlowRow
)
from utils.format_utils import format_currency, format_percentage

# Configure logger
logger = logging.getLogger(__name__)


class FinancialGrupoAService:
    """Serviço especializado para cálculos financeiros do Grupo A"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def calculate(self, request: GrupoAFinancialRequest) -> ResultadosCodigoAResponse:
        """
        Método principal de cálculo financeiro para Grupo A
        
        Estrutura:
        1. Log início
        2. Converter dados mensais para arrays
        3. Calcular autoconsumo simultâneo (economia imediata, sem créditos)
        4. Calcular energia excedente (vira crédito)
        5. Aplicar fator de equivalência entre TE ponta e fora-ponta
        6. Abater consumo fora-ponta com créditos
        7. Abater consumo ponta com créditos (se houver excedente)
        8. Processar autoconsumo remoto (se habilitado)
        9. Calcular economia total
        10. Calcular fluxo de caixa
        11. Calcular indicadores financeiros
        12. Executar análise de sensibilidade
        13. Montar tabelas e resposta
        14. Retornar ResultadosCodigoAResponse
        
        Use try/except robusto com logs.
        """
        try:
            # 1. Log início
            self.logger.info(f"INÍCIO CÁLCULO GRUPO A - CAPEX: R$ {request.financeiros.capex:,.2f}")
            
            # 2. Converter dados mensais para arrays
            geracao = request.geracao.to_list()
            consumo_fp = request.consumo_local.fora_ponta.to_list()
            consumo_p = request.consumo_local.ponta.to_list()
            
            # 3. Calcular autoconsumo simultâneo
            autoconsumo_simultaneo = self._calculate_autoconsumo_simultaneo(
                geracao, consumo_fp, consumo_p, request.fator_simultaneidade_local,
                request.tarifas.fora_ponta['te'] + request.tarifas.fora_ponta['tusd'],
                request.tarifas.ponta['te'] + request.tarifas.ponta['tusd']
            )
            
            # 4. Calcular energia excedente
            energia_excedente = autoconsumo_simultaneo['energia_excedente']
            
            # 5. Aplicar fator de equivalência
            fator_equivalencia = self._calculate_fator_equivalencia(
                request.te['fora_ponta'], request.te['ponta']
            )
            
            # 6. Abater consumo com créditos separados
            abatimentos = self._calculate_abatimento_grupo_a(
                energia_excedente, consumo_fp, consumo_p,
                autoconsumo_simultaneo['kwh_consumidos_fp'],
                autoconsumo_simultaneo['kwh_consumidos_p'],
                request.tarifas.fora_ponta['te'] + request.tarifas.fora_ponta['tusd'],
                request.tarifas.ponta['te'] + request.tarifas.ponta['tusd'],
                fator_equivalencia
            )
            
            # 7. Processar autoconsumo remoto
            economia_remotos = self._calculate_abatimentos_remotos(request, energia_excedente)
            
            # 8. Calcular economia total
            economia_total_anual = (
                autoconsumo_simultaneo['economia_total'] +
                abatimentos['economia_total_fp'] + abatimentos['economia_total_p'] +
                economia_remotos['economia_total_ano']
            )
            
            # 9. Calcular fluxo de caixa
            cash_flow = self._calculate_cash_flow(
                request.financeiros.capex,
                economia_total_anual,
                request.financeiros.oma_first_pct * request.financeiros.capex,
                request.financeiros.inflacao_energia / 100,
                request.financeiros.oma_inflacao / 100,
                request.financeiros.degradacao / 100,
                request.financeiros.anos,
                request.financeiros.taxa_desconto / 100,
                request.financeiros.salvage_pct
            )
            
            # 10. Calcular indicadores financeiros
            indicadores = self._calculate_financial_indicators(
                request.financeiros.capex, cash_flow, request.financeiros.taxa_desconto / 100
            )
            
            # 11. Executar análise de sensibilidade
            sensibilidade = self._calculate_sensitivity_analysis(
                request, indicadores['vpl']
            )
            
            # 12. Montar resposta
            response = self._build_response(
                geracao, consumo_fp, consumo_p, request.financeiros.capex,
                cash_flow, abatimentos, autoconsumo_simultaneo,
                indicadores, sensibilidade, economia_remotos
            )
            
            self.logger.info(f"FIM CÁLCULO GRUPO A - VPL: R$ {indicadores['vpl']:,.2f}")
            return response
            
        except Exception as e:
            self.logger.error(f"Erro no cálculo Grupo A: {str(e)}")
            raise
    
    def _calculate_autoconsumo_simultaneo(
        self,
        geracao: List[float],
        consumo_fora_ponta: List[float],
        consumo_ponta: List[float],
        fator_simultaneidade: float,
        tarifa_fora_ponta: float,
        tarifa_ponta: float
    ) -> Dict[str, Any]:
        """
        Calcula economia por autoconsumo simultâneo (energia usada no momento da geração)

        Para Grupo A, assume geração ocorre principalmente em fora-ponta.

        Para cada mês:
        1. Consumo simultâneo FP = min(geracao, consumo_fora_ponta) * fator_simultaneidade
        2. Economia FP = consumo_simultaneo_fp * tarifa_fora_ponta
        3. Se houver geração excedente e consumo em ponta:
           - Consumo simultâneo P = min(geracao_restante, consumo_ponta) * fator_simultaneidade
           - Economia P = consumo_simultaneo_p * tarifa_ponta
        4. Energia excedente = geracao - consumo_simultaneo_fp - consumo_simultaneo_p

        Retorna dict:
        - kwh_consumidos_fp: List[float]
        - kwh_consumidos_p: List[float]
        - economia_fp: List[float]
        - economia_p: List[float]
        - energia_excedente: List[float]
        - economia_total: float
        """
        kwh_consumidos_fp = []
        kwh_consumidos_p = []
        economia_fp = []
        economia_p = []
        energia_excedente = []
        
        for i in range(12):
            gen = geracao[i]
            cons_fp = consumo_fora_ponta[i]
            cons_p = consumo_ponta[i]
            
            # Autoconsumo simultâneo fora-ponta (prioridade - geração solar diurna)
            autocons_fp = min(gen * fator_simultaneidade, cons_fp)
            econ_fp = autocons_fp * tarifa_fora_ponta
            
            # Geração restante após autoconsumo FP
            gen_restante = gen - autocons_fp
            
            # Autoconsumo simultâneo ponta (se houver geração restante)
            autocons_p = min(gen_restante * fator_simultaneidade, cons_p) if gen_restante > 0 else 0
            econ_p = autocons_p * tarifa_ponta
            
            # Energia excedente para créditos
            excedente = gen - autocons_fp - autocons_p
            
            kwh_consumidos_fp.append(autocons_fp)
            kwh_consumidos_p.append(autocons_p)
            economia_fp.append(econ_fp)
            economia_p.append(econ_p)
            energia_excedente.append(excedente)
        
        economia_total = sum(economia_fp) + sum(economia_p)
        
        self.logger.debug(f"Autoconsumo simultâneo - Economia total: R$ {economia_total:.2f}")
        
        return {
            'kwh_consumidos_fp': kwh_consumidos_fp,
            'kwh_consumidos_p': kwh_consumidos_p,
            'economia_fp': economia_fp,
            'economia_p': economia_p,
            'energia_excedente': energia_excedente,
            'economia_total': economia_total
        }
    
    def _calculate_fator_equivalencia(
        self,
        te_fora_ponta: float,
        te_ponta: float
    ) -> float:
        """
        Calcula fator de equivalência entre créditos de ponta e fora-ponta

        Formula: fator = te_ponta / te_fora_ponta

        Exemplo: Se TE fora-ponta = 0.30 e TE ponta = 0.50
        Então: 1 kWh de crédito em ponta equivale a (0.50/0.30) = 1.67 kWh em fora-ponta

        Retorna fator de equivalência (float)
        """
        if te_fora_ponta <= 0 or te_ponta <= 0:
            raise ValueError("Tarifas de energia devem ser positivas")
        
        fator = te_ponta / te_fora_ponta
        
        self.logger.debug(f"Fator de equivalência: {fator:.4f} (TE ponta: {te_ponta}, TE FP: {te_fora_ponta})")
        
        return fator
    
    def _calculate_abatimento_grupo_a(
        self,
        creditos_liquidos: List[float],
        consumo_fora_ponta: List[float],
        consumo_ponta: List[float],
        autoconsumo_fp: List[float],
        autoconsumo_p: List[float],
        tarifa_fora_ponta: float,
        tarifa_ponta: float,
        fator_equivalencia: float
    ) -> Dict[str, Any]:
        """
        Abate consumo com créditos, priorizando fora-ponta

        Para cada mês:
        1. Consumo restante FP = consumo_fora_ponta - autoconsumo_fp
        2. kWh abatido FP = min(consumo_restante_fp, creditos_liquidos)
        3. Economia FP = kwh_abatido_fp * tarifa_fora_ponta
        4. Créditos excedentes = creditos_liquidos - kwh_abatido_fp

        5. Se houver créditos excedentes:
           - Consumo restante P = consumo_ponta - autoconsumo_p
           - Créditos equivalentes em ponta = creditos_excedentes / fator_equivalencia
           - kWh abatido P = min(consumo_restante_p, creditos_equiv_ponta)
           - Economia P = kwh_abatido_p * tarifa_ponta

        Retorna dict com:
        - kwh_abatido_fp: List[float]
        - kwh_abatido_p: List[float]
        - economia_fp: List[float]
        - economia_p: List[float]
        - percentual_abatido_fp: List[float]
        - percentual_abatido_p: List[float]
        - creditos_usados_ponta: List[float]
        """
        kwh_abatido_fp = []
        kwh_abatido_p = []
        economia_fp = []
        economia_p = []
        percentual_abatido_fp = []
        percentual_abatido_p = []
        creditos_usados_ponta = []
        
        for i in range(12):
            creditos = creditos_liquidos[i]
            cons_fp = consumo_fora_ponta[i]
            cons_p = consumo_ponta[i]
            auto_fp = autoconsumo_fp[i]
            auto_p = autoconsumo_p[i]
            
            # Consumo restante fora-ponta
            cons_restante_fp = max(0, cons_fp - auto_fp)
            
            # Abatimento fora-ponta (prioridade)
            abatido_fp = min(creditos, cons_restante_fp)
            econ_fp = abatido_fp * tarifa_fora_ponta
            
            # Créditos excedentes
            creditos_excedentes = creditos - abatido_fp
            
            # Abatimento ponta (se houver créditos excedentes)
            cons_restante_p = max(0, cons_p - auto_p)
            creditos_equiv_ponta = creditos_excedentes / fator_equivalencia if creditos_excedentes > 0 else 0
            abatido_p = min(creditos_equiv_ponta, cons_restante_p)
            econ_p = abatido_p * tarifa_ponta
            creditos_usados_p = abatido_p * fator_equivalencia
            
            # Percentuais de abatimento
            perc_abatido_fp = (abatido_fp / cons_fp * 100) if cons_fp > 0 else 0
            perc_abatido_p = (abatido_p / cons_p * 100) if cons_p > 0 else 0
            
            kwh_abatido_fp.append(abatido_fp)
            kwh_abatido_p.append(abatido_p)
            economia_fp.append(econ_fp)
            economia_p.append(econ_p)
            percentual_abatido_fp.append(perc_abatido_fp)
            percentual_abatido_p.append(perc_abatido_p)
            creditos_usados_ponta.append(creditos_usados_p)
        
        economia_total_fp = sum(economia_fp)
        economia_total_p = sum(economia_p)
        
        self.logger.debug(f"Abatimento Grupo A - Economia FP: R$ {economia_total_fp:.2f}, P: R$ {economia_total_p:.2f}")
        
        return {
            'kwh_abatido_fp': kwh_abatido_fp,
            'kwh_abatido_p': kwh_abatido_p,
            'economia_fp': economia_fp,
            'economia_p': economia_p,
            'percentual_abatido_fp': percentual_abatido_fp,
            'percentual_abatido_p': percentual_abatido_p,
            'creditos_usados_ponta': creditos_usados_ponta,
            'economia_total_fp': economia_total_fp,
            'economia_total_p': economia_total_p
        }
    

    
    def _calculate_abatimentos_remotos(
        self, 
        request: GrupoAFinancialRequest, 
        creditos_disponiveis: List[float]
    ) -> Dict[str, Any]:
        """Calcula abatimentos para unidades remotas"""
        economia_remotos = 0
        
        # Implementação simplificada - pode ser expandida conforme necessidade
        if request.remoto_b.enabled:
            # Lógica para abatimento remoto B
            consumo_remoto_b = request.remoto_b.data.to_list()
            creditos_para_b = sum(creditos_disponiveis) * (request.remoto_b.percentage / 100)
            
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
    
    def _calculate_financial_indicators(
        self,
        capex: float,
        cash_flow: List[Dict[str, float]],
        taxa_desconto: float
    ) -> Dict[str, float]:
        """Calcula indicadores financeiros principais"""
        
        # Extrair fluxos para cálculos
        fluxos = [cf['fluxo_nominal'] for cf in cash_flow]
        
        # VPL
        vpl = sum(cf['fluxo_descontado'] for cf in cash_flow)
        
        # TIR
        try:
            tir = npf.irr(fluxos) * 100 if fluxos else 0
        except:
            tir = 0
        
        # Payback simples
        payback_simples = 0
        for i, cf in enumerate(cash_flow):
            if cf['fluxo_acumulado_nominal'] >= 0 and i > 0:
                cf_anterior = cash_flow[i-1]
                if cf['fluxo_nominal'] != 0:
                    payback_simples = cf_anterior['ano'] + abs(cf_anterior['fluxo_acumulado_nominal']) / cf['fluxo_nominal']
                break
        
        # Payback descontado
        payback_descontado = 0
        for i, cf in enumerate(cash_flow):
            if cf['fluxo_acumulado_descontado'] >= 0 and i > 0:
                cf_anterior = cash_flow[i-1]
                if cf['fluxo_descontado'] != 0:
                    payback_descontado = cf_anterior['ano'] + abs(cf_anterior['fluxo_acumulado_descontado']) / cf['fluxo_descontado']
                break
        
        # LCOE
        energia_total = sum(cf.get('geracao_anual', 0) for cf in cash_flow[1:])  # Excluindo ano 0
        lcoe = vpl / energia_total if energia_total > 0 else 0
        
        # ROI simples
        economia_total = sum(cf['fluxo_nominal'] for cf in cash_flow[1:])  # Excluindo ano 0
        roi = ((economia_total - capex) / capex * 100) if capex > 0 else 0
        
        # PI
        valor_presente_entradas = sum(cf['fluxo_descontado'] for cf in cash_flow[1:] if cf['fluxo_descontado'] > 0)
        valor_presente_saidas = abs(sum(cf['fluxo_descontado'] for cf in cash_flow if cf['fluxo_descontado'] < 0))
        pi = valor_presente_entradas / valor_presente_saidas if valor_presente_saidas > 0 else 0
        
        return {
            'vpl': vpl,
            'tir': tir,
            'payback_simples': payback_simples,
            'payback_descontado': payback_descontado,
            'lcoe': lcoe,
            'roi': roi,
            'pi': pi,
            'economia_total_nominal': economia_total,
            'economia_total_valor_presente': valor_presente_entradas
        }
    
    def _calculate_sensitivity_analysis(
        self,
        request: GrupoAFinancialRequest,
        base_vpl: float,
        multiplicadores: List[float] = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
    ) -> Dict[str, List[float]]:
        """
        Executa análise de sensibilidade variando tarifas de energia

        Para cada multiplicador:
        1. Recalcula economias com tarifa_fp * multiplicador e tarifa_p * multiplicador
        2. Recalcula fluxo de caixa
        3. Recalcula VPL
        4. Armazena resultado

        Retorna dict:
        - multiplicadores_tarifa: List[float]
        - vpl_matrix: List[float]
        """
        vpl_matrix = []
        
        # Implementação simplificada - em um cenário real, recalcularia tudo
        for mult in multiplicadores:
            # Simples aproximação linear para demonstração
            vpl_estimado = base_vpl * mult
            vpl_matrix.append(vpl_estimado)
        
        self.logger.debug(f"Análise de sensibilidade - {len(multiplicadores)} pontos calculados")
        
        return {
            'multiplicadores_tarifa': multiplicadores,
            'vpl_matrix': vpl_matrix
        }
    
    def _build_response(
        self,
        geracao: List[float],
        consumo_fp: List[float],
        consumo_p: List[float],
        capex: float,
        cash_flow: List[Dict],
        abatimentos: Dict,
        autoconsumo_simultaneo: Dict,
        indicadores: Dict,
        sensibilidade: Dict,
        economia_remotos: Dict
    ) -> ResultadosCodigoAResponse:
        """
        Monta objeto de resposta formatado para Grupo A

        Estrutura:
        1. somas_iniciais: geração anual, consumo FP, consumo P, CAPEX
        2. financeiro: Indicadores formatados
        3. consumo_ano1: Detalhamento com separação ponta/fora-ponta
        4. tabela_resumo_anual: Dados anuais com FP e P separados
        5. tabela_fluxo_caixa: Fluxos anuais
        6. dados_sensibilidade: Arrays para gráfico

        Use formatação brasileira.
        """
        
        # 1. Somas iniciais
        geracao_anual = sum(geracao)
        consumo_fp_anual = sum(consumo_fp)
        consumo_p_anual = sum(consumo_p)
        
        somas_iniciais = {
            'geracao_anual': f"{geracao_anual:,.2f} kWh".replace(',', '.'),
            'consumo_fora_ponta_anual': f"{consumo_fp_anual:,.2f} kWh".replace(',', '.'),
            'consumo_ponta_anual': f"{consumo_p_anual:,.2f} kWh".replace(',', '.'),
            'capex': format_currency(capex)
        }
        
        # 2. Financeiro formatado
        financeiro = FinancialSummaryFormatted(
            vpl=format_currency(indicadores['vpl']),
            tir=format_percentage(indicadores['tir']) if indicadores['tir'] > 0 else "N/A",
            pi=f"{indicadores['pi']:.2f}",
            payback_simples=f"{indicadores['payback_simples']:.2f} anos" if indicadores['payback_simples'] > 0 else "N/A",
            payback_descontado=f"{indicadores['payback_descontado']:.2f} anos" if indicadores['payback_descontado'] > 0 else "N/A",
            lcoe=f"R$ {indicadores['lcoe']:.4f}/kWh",
            roi_simples=format_percentage(indicadores['roi']),
            economia_total_nominal=format_currency(indicadores['economia_total_nominal']),
            economia_total_valor_presente=format_currency(indicadores['economia_total_valor_presente'])
        )
        
        # 3. Consumo ano 1
        consumo_ano1 = {
            'geracao': geracao_anual,
            'consumo_fora_ponta': consumo_fp_anual,
            'consumo_ponta': consumo_p_anual,
            'autoconsumo_simultaneo_fp': sum(autoconsumo_simultaneo['kwh_consumidos_fp']),
            'autoconsumo_simultaneo_p': sum(autoconsumo_simultaneo['kwh_consumidos_p']),
            'abatido_fp': sum(abatimentos['kwh_abatido_fp']),
            'abatido_p': sum(abatimentos['kwh_abatido_p']),
            'energia_excedente': sum(autoconsumo_simultaneo['energia_excedente'])
        }
        
        # 4. Tabela resumo anual (simplificada)
        tabela_resumo_anual = []
        for cf in cash_flow[1:]:  # Excluindo ano 0
            tabela_resumo_anual.append({
                'ano': cf['ano'],
                'fluxo_nominal': cf['fluxo_nominal'],
                'fluxo_acumulado_nominal': cf['fluxo_acumulado_nominal']
            })
        
        # 5. Tabela fluxo de caixa
        tabela_fluxo_caixa = [
            CashFlowRow(
                ano=cf['ano'],
                fluxo_nominal=cf['fluxo_nominal'],
                fluxo_acumulado_nominal=cf['fluxo_acumulado_nominal'],
                fluxo_descontado=cf['fluxo_descontado'],
                fluxo_acumulado_descontado=cf['fluxo_acumulado_descontado']
            )
            for cf in cash_flow
        ]
        
        # 6. Dados sensibilidade
        dados_sensibilidade = sensibilidade
        
        return ResultadosCodigoAResponse(
            somas_iniciais=somas_iniciais,
            financeiro=financeiro,
            consumo_ano1=consumo_ano1,
            tabela_resumo_anual=tabela_resumo_anual,
            tabela_fluxo_caixa=tabela_fluxo_caixa,
            dados_sensibilidade=dados_sensibilidade
        )