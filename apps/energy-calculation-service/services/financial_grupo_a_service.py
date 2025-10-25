# -*- coding: utf-8 -*-
"""
Serviço de cálculo financeiro especializado para Grupo A
Implementa lógica completa do notebook "Calculo financeiro grupo A.ipynb"
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
        Implementa exatamente a lógica do notebook
        """
        try:
            self.logger.info(f"INÍCIO CÁLCULO GRUPO A - CAPEX: R$ {request.financeiros.capex:,.2f}")
            
            # 1. Extrair dados e converter para arrays (seguindo notebook)
            geracao = request.geracao.to_list()
            consumo_fp = request.consumo_local.fora_ponta.to_list()
            consumo_p = request.consumo_local.ponta.to_list()
            
            # 2. Parâmetros (seguindo notebook)
            capex = request.financeiros.capex
            anos = request.financeiros.anos
            taxa_desconto = request.financeiros.taxa_desconto / 100
            inflacao_energia = request.financeiros.inflacao_energia / 100
            degradacao = request.financeiros.degradacao / 100
            oma_first_pct = request.financeiros.oma_first_pct
            oma_inflacao = request.financeiros.oma_inflacao / 100
            salvage_pct = request.financeiros.salvage_pct
            fator_simultaneidade_local = request.fator_simultaneidade_local
            
            # 3. Tarifas (seguindo notebook)
            tarifa_fora_ponta_total = request.tarifas.fora_ponta['te'] + request.tarifas.fora_ponta['tusd']
            tarifa_ponta_total = request.tarifas.ponta['te'] + request.tarifas.ponta['tusd']
            
            # 4. Novas tarifas TE (seguindo notebook)
            te_ponta_verde = request.te['ponta']
            te_fora_ponta_verde = request.te['fora_ponta']
            
            # 5. TUSD remoto (calculado como no notebook)
            # CORREÇÃO: Calcular TUSD mesmo que não esteja habilitado (como no notebook)
            tusd_remoto_a_verde_fora_ponta = request.remoto_a_verde.tarifas['off_peak'] - request.remoto_a_verde.te['off_peak'] if request.remoto_a_verde.enabled else 0.16121
            tusd_remoto_a_verde_ponta = request.remoto_a_verde.tarifas['peak'] - request.remoto_a_verde.te['peak'] if request.remoto_a_verde.enabled else 1.6208
            
            tusd_remoto_a_azul_fora_ponta = request.remoto_a_azul.tarifas['off_peak'] - request.remoto_a_azul.te['off_peak'] if request.remoto_a_azul.enabled else 0.16121
            tusd_remoto_a_azul_ponta = request.remoto_a_azul.tarifas['peak'] - request.remoto_a_azul.te['peak'] if request.remoto_a_azul.enabled else 1.6208
            
            # 6. Fatores de ajuste (seguindo notebook)
            fator_ajuste_geradora = te_ponta_verde / te_fora_ponta_verde
            
            # CORREÇÃO: Calcular fatores mesmo que não esteja habilitado (como no notebook)
            fator_ajuste_remoto_a_verde = request.remoto_a_verde.te['peak'] / request.remoto_a_verde.te['off_peak'] if request.remoto_a_verde.enabled else te_ponta_verde / te_fora_ponta_verde
            fator_ajuste_remoto_a_azul = request.remoto_a_azul.te['peak'] / request.remoto_a_azul.te['off_peak'] if request.remoto_a_azul.enabled else te_ponta_verde / te_fora_ponta_verde
            
            # 7. Consumos remotos (seguindo notebook)
            # CORREÇÃO: Obter consumos mesmo que não esteja habilitado (como no notebook)
            consumo_remoto_b = request.remoto_b.data.to_list() if request.remoto_b.enabled else [0]*12
            consumo_remoto_a_verde_fp = request.remoto_a_verde.data_off_peak.to_list() if request.remoto_a_verde.enabled else [0]*12
            consumo_remoto_a_verde_p = request.remoto_a_verde.data_peak.to_list() if request.remoto_a_verde.enabled else [0]*12
            consumo_remoto_a_azul_fp = request.remoto_a_azul.data_off_peak.to_list() if request.remoto_a_azul.enabled else [0]*12
            consumo_remoto_a_azul_p = request.remoto_a_azul.data_peak.to_list() if request.remoto_a_azul.enabled else [0]*12
            
            # 8. Percentuais de abatimento (seguindo notebook)
            perc_abatimento_b = request.remoto_b.percentage / 100 if request.remoto_b.enabled else 0
            perc_abatimento_a_verde = request.remoto_a_verde.percentage / 100 if request.remoto_a_verde.enabled else 0
            perc_abatimento_a_azul = request.remoto_a_azul.percentage / 100 if request.remoto_a_azul.enabled else 0
            
            # 9. FIO B schedule (seguindo notebook)
            fio_b_schedule = request.fio_b.schedule
            base_year = request.fio_b.base_year
            
            # 10. Inicializar arrays (seguindo notebook)
            anos_array = np.arange(1, anos + 1)
            gen_annual = np.zeros_like(anos_array, dtype=float)
            economia_geradora_annual = np.zeros_like(anos_array, dtype=float)
            consumo_geradora_fp_annual = np.zeros_like(anos_array, dtype=float)
            consumo_geradora_p_annual = np.zeros_like(anos_array, dtype=float)
            abatido_geradora_fp_annual = np.zeros_like(anos_array, dtype=float)
            abatido_geradora_p_annual = np.zeros_like(anos_array, dtype=float)
            creditos_usados_ponta_annual = np.zeros_like(anos_array, dtype=float)
            abatido_remoto_b_annual = np.zeros_like(anos_array, dtype=float)
            abatido_remoto_a_verde_ponta_annual = np.zeros_like(anos_array, dtype=float)
            abatido_remoto_a_verde_foraponta_annual = np.zeros_like(anos_array, dtype=float)
            abatido_remoto_a_azul_ponta_annual = np.zeros_like(anos_array, dtype=float)
            abatido_remoto_a_azul_foraponta_annual = np.zeros_like(anos_array, dtype=float)
            creditos_usados_remoto_a_verde_ponta_annual = np.zeros_like(anos_array, dtype=float)
            creditos_usados_remoto_a_azul_ponta_annual = np.zeros_like(anos_array, dtype=float)
            economia_remoto_b_annual = np.zeros_like(anos_array, dtype=float)
            economia_remoto_a_verde_ponta_annual = np.zeros_like(anos_array, dtype=float)
            economia_remoto_a_verde_foraponta_annual = np.zeros_like(anos_array, dtype=float)
            economia_remoto_a_azul_ponta_annual = np.zeros_like(anos_array, dtype=float)
            economia_remoto_a_azul_foraponta_annual = np.zeros_like(anos_array, dtype=float)
            economia_total_annual = np.zeros_like(anos_array, dtype=float)
            oma_annual = np.zeros_like(anos_array, dtype=float)
            net_cash_annual = np.zeros_like(anos_array, dtype=float)
            economia_simultanea_annual = np.zeros_like(anos_array, dtype=float)
            energia_simultanea_annual = np.zeros_like(anos_array, dtype=float)
            abatido_fp_local_por_credito_annual_for_display = np.zeros_like(anos_array, dtype=float)
            
            # 11. Bancos de créditos mensais (seguindo notebook)
            bank_b = 0
            bank_a_verde = 0
            bank_a_azul = 0
            
            # 12. Loop principal (seguindo notebook)
            for idx, ano in enumerate(anos_array, start=1):
                # Resetting annual variables for each year
                econ_geradora_acum = 0
                abatido_fp_geradora_acum = 0
                abatido_p_geradora_acum = 0
                creditos_usados_p_geradora_acum = 0
                econ_remoto_b_acum = 0
                abatido_remoto_b_acum = 0
                econ_remoto_a_verde_fp_acum = 0
                econ_remoto_a_verde_p_acum = 0
                abatido_remoto_a_verde_fp_acum = 0
                abatido_remoto_a_verde_p_acum = 0
                creditos_usados_remoto_a_verde_p_acum = 0
                econ_remoto_a_azul_fp_acum = 0
                econ_remoto_a_azul_p_acum = 0
                abatido_remoto_a_azul_fp_acum = 0
                abatido_remoto_a_azul_p_acum = 0
                creditos_usados_remoto_a_azul_p_acum = 0
                economia_simultanea_acum = 0
                energia_simultanea_acum = 0
                abatido_fp_local_por_credito_acum = 0
                
                # Tarifas do ano (Total = TE + TUSD)
                tarifa_fp_y = tarifa_fora_ponta_total * ((1 + inflacao_energia) ** (ano - 1))
                tarifa_p_y = tarifa_ponta_total * ((1 + inflacao_energia) ** (ano - 1))

                for month_idx in range(12):
                    # CÁLCULOS DA UNIDADE GERADORA LOCAL (GRUPO A VERDE)
                    factor_deg = (1 - degradacao) ** (ano - 1)
                    gen_month = geracao[month_idx] * factor_deg
                    cons_fp_geradora_month = consumo_fp[month_idx]
                    cons_p_geradora_month = consumo_p[month_idx]

                    logger.info(f"Month {month_idx + 1}, Year {ano}:")
                    logger.info(f"  Geração: {gen_month}, Consumo FP: {cons_fp_geradora_month}, Consumo P: {cons_p_geradora_month}")

                    # === LÓGICA ATUALIZADA: Autoconsumo Imediato abate o consumo FORA PONTA local ===
                    energia_autoconsumo_imediato = gen_month * fator_simultaneidade_local
                    # A economia desse autoconsumo é o valor total da energia evitada
                    economia_autoconsumo_imediato = energia_autoconsumo_imediato * tarifa_fp_y

                    logger.info(f"  Economia Autoconsumo Imediato: {economia_autoconsumo_imediato}")
                    logger.info(f"  Energia Autoconsumo Imediato: {energia_autoconsumo_imediato}")

                    # O consumo fora de ponta é o total menos o autoconsumo imediato
                    consumo_fp_pos_autoconsumo = max(0, cons_fp_geradora_month - energia_autoconsumo_imediato)
                    # O que sobrou da geração vira crédito para abatimento (dentro e fora da unidade geradora)
                    creditos_iniciais_local = gen_month - energia_autoconsumo_imediato
                    
                    logger.info(f"  Consumo FP Pós Autoconsumo: {consumo_fp_pos_autoconsumo}, Créditos Iniciais Locais: {creditos_iniciais_local}")

                    # Logica de abatimento: PRIORIDADE FORA DE PONTA com os créditos restantes
                    abatido_fp_local_por_credito = min(creditos_iniciais_local, consumo_fp_pos_autoconsumo)
                    sobra_geracao_fp = creditos_iniciais_local - abatido_fp_local_por_credito
                    
                    # Abate o consumo de ponta com o fator de ajuste
                    abatido_p_local_real = min(sobra_geracao_fp / fator_ajuste_geradora, cons_p_geradora_month)
                    creditos_usados_local_ponta = abatido_p_local_real * fator_ajuste_geradora
                    
                    logger.info(f"  Abatido FP Local: {abatido_fp_local_por_credito}, Abatido P Local Real: {abatido_p_local_real}")
                    logger.info(f"  Créditos Usados Local Ponta: {creditos_usados_local_ponta}")

                    # Acumula os valores anuais
                    abatido_fp_geradora_acum += abatido_fp_local_por_credito
                    abatido_p_geradora_acum += abatido_p_local_real
                    creditos_usados_p_geradora_acum += creditos_usados_local_ponta
                    abatido_fp_local_por_credito_acum += abatido_fp_local_por_credito
                    
                    # Créditos para unidades remotas (o que sobrou de fato)
                    creditos_disponiveis_month = sobra_geracao_fp - creditos_usados_local_ponta
                    
                    logger.info(f"  Créditos Disponíveis Mês: {creditos_disponiveis_month}")
                    
                    # === Economia na Unidade Geradora Local ===
                    # CORREÇÃO: Usar TUSD do remoto A Verde mesmo que não esteja habilitado (como no notebook)
                    economia_fp_geradora = abatido_fp_local_por_credito * (tarifa_fp_y - (tusd_remoto_a_verde_fora_ponta * ((1 + inflacao_energia) ** (ano - 1))))
                    economia_p_geradora = abatido_p_local_real * (tarifa_p_y - (tusd_remoto_a_verde_ponta * ((1 + inflacao_energia) ** (ano - 1))))
                    econ_geradora_acum += (economia_fp_geradora + economia_p_geradora)
                    economia_simultanea_acum += economia_autoconsumo_imediato
                    energia_simultanea_acum += energia_autoconsumo_imediato
                    
                    logger.info(f"abatido_fp_local_por_credito: {abatido_fp_local_por_credito}, tarifa_fp_y: {tarifa_fp_y}, TUSD_REMOTO_A_VERDE_FORA_PONTA: {tusd_remoto_a_verde_fora_ponta}, inflacao: {(1 + inflacao_energia) ** (ano - 1)}")
                    logger.info(f"  Economia FP Geradora: {economia_fp_geradora}, Economia P Geradora: {economia_p_geradora}")
                    logger.info(f"  Economia Geradora Acumulada: {econ_geradora_acum}, Economia Simultânea Acumulada: {economia_simultanea_acum}")
                    
                    # ---
                    # CÁLCULOS DO AUTOCONSUMO REMOTO
                    tarifa_credito_geradora_y = te_fora_ponta_verde * ((1 + inflacao_energia) ** (ano - 1))
                    
                    logger.info(f"  Tarifa Crédito Geradora: {tarifa_credito_geradora_y}")
                    
                    # === LÓGICA DE DISTRIBUIÇÃO DE CRÉDITOS E GESTÃO DO BANCO MENSAL ===
                    
                    # Passo 1: Alocação mensal para cada unidade
                    creditos_para_b_month = creditos_disponiveis_month * perc_abatimento_b
                    creditos_para_a_verde_month = creditos_disponiveis_month * perc_abatimento_a_verde
                    creditos_para_a_azul_month = creditos_disponiveis_month * perc_abatimento_a_azul
                    
                    logger.info(f"  Créditos para B: {creditos_para_b_month}, Créditos para A Verde: {creditos_para_a_verde_month}, Créditos para A Azul: {creditos_para_a_azul_month}")
                    
                    # Passo 2: Abatimento e gestão do banco de créditos para o Grupo B
                    if request.remoto_b.enabled:
                        total_credits_b = creditos_para_b_month + bank_b
                        tarifa_total_remoto_b_y = request.remoto_b.tarifa_total * ((1 + inflacao_energia) ** (ano - 1))
                        fio_b_y = request.remoto_b.fio_b_value * ((1 + inflacao_energia) ** (ano - 1))
                        fator_equiv_a_b = tarifa_credito_geradora_y / tarifa_total_remoto_b_y
                        
                        creditos_b_utilizados_eq = min(total_credits_b / fator_equiv_a_b, consumo_remoto_b[month_idx])
                        
                        # Abatido é o valor real em kWh, não o equivalente
                        abatido_remoto_b = creditos_b_utilizados_eq
                        sobra_b_month = total_credits_b - (abatido_remoto_b * fator_equiv_a_b)
                        bank_b = sobra_b_month # Saldo do banco
                        
                        calendar_year = base_year + (ano - 1)
                        noncomp_b = fio_b_schedule.get(calendar_year, 1.0)
                        # CORREÇÃO: Calcular FIO B corretamente (como no notebook)
                        economia_remoto_b = (abatido_remoto_b * tarifa_total_remoto_b_y) - (abatido_remoto_b * fio_b_y * noncomp_b)
                        
                        econ_remoto_b_acum += economia_remoto_b
                        abatido_remoto_b_acum += abatido_remoto_b
                    
                    # Passo 3: Abatimento e gestão do banco de créditos para o Grupo A VERDE
                    if request.remoto_a_verde.enabled:
                        total_credits_a_verde = creditos_para_a_verde_month + bank_a_verde
                        
                        # Prioridade FORA DE PONTA
                        abatido_fp_a_verde = min(total_credits_a_verde, consumo_remoto_a_verde_fp[month_idx])
                        sobra_a_verde_fp = total_credits_a_verde - abatido_fp_a_verde
                        
                        # Abate na ponta com o que sobrou
                        abatido_p_a_verde = min(sobra_a_verde_fp / fator_ajuste_remoto_a_verde, consumo_remoto_a_verde_p[month_idx])
                        creditos_usados_remoto_a_verde_p = abatido_p_a_verde * fator_ajuste_remoto_a_verde
                        
                        sobra_a_verde_total = sobra_a_verde_fp - creditos_usados_remoto_a_verde_p
                        bank_a_verde = sobra_a_verde_total
                        
                        tarifa_total_remoto_a_verde_fp_y = request.remoto_a_verde.tarifas['off_peak'] * ((1 + inflacao_energia) ** (ano - 1))
                        tarifa_total_remoto_a_verde_p_y = request.remoto_a_verde.tarifas['peak'] * ((1 + inflacao_energia) ** (ano - 1))
                        tusc_remoto_a_verde_fp_y = tusd_remoto_a_verde_fora_ponta * ((1 + inflacao_energia) ** (ano - 1))
                        tusc_remoto_a_verde_p_y = tusd_remoto_a_verde_ponta * ((1 + inflacao_energia) ** (ano - 1))
                        
                        economia_remoto_a_verde_p = abatido_p_a_verde * tarifa_total_remoto_a_verde_p_y - (abatido_p_a_verde * tusc_remoto_a_verde_p_y)
                        economia_remoto_a_verde_fp = abatido_fp_a_verde * tarifa_total_remoto_a_verde_fp_y - (abatido_fp_a_verde * tusc_remoto_a_verde_fp_y)
                        
                        econ_remoto_a_verde_fp_acum += economia_remoto_a_verde_fp
                        econ_remoto_a_verde_p_acum += economia_remoto_a_verde_p
                        abatido_remoto_a_verde_fp_acum += abatido_fp_a_verde
                        abatido_remoto_a_verde_p_acum += abatido_p_a_verde
                        creditos_usados_remoto_a_verde_p_acum += creditos_usados_remoto_a_verde_p
                    
                    # Passo 4: Abatimento e gestão do banco de créditos para o Grupo A AZUL
                    if request.remoto_a_azul.enabled:
                        total_credits_a_azul = creditos_para_a_azul_month + bank_a_azul
                        
                        # Prioridade FORA DE PONTA
                        abatido_fp_a_azul = min(total_credits_a_azul, consumo_remoto_a_azul_fp[month_idx])
                        sobra_a_azul_fp = total_credits_a_azul - abatido_fp_a_azul
                        
                        # Abate na ponta com o que sobrou
                        abatido_p_a_azul = min(sobra_a_azul_fp / fator_ajuste_remoto_a_azul, consumo_remoto_a_azul_p[month_idx])
                        creditos_usados_remoto_a_azul_p = abatido_p_a_azul * fator_ajuste_remoto_a_azul
                        
                        sobra_a_azul_total = sobra_a_azul_fp - creditos_usados_remoto_a_azul_p
                        bank_a_azul = sobra_a_azul_total
                        
                        tarifa_total_remoto_a_azul_fp_y = request.remoto_a_azul.tarifas['off_peak'] * ((1 + inflacao_energia) ** (ano - 1))
                        tarifa_total_remoto_a_azul_p_y = request.remoto_a_azul.tarifas['peak'] * ((1 + inflacao_energia) ** (ano - 1))
                        tusc_remoto_a_azul_fp_y = tusd_remoto_a_azul_fora_ponta * ((1 + inflacao_energia) ** (ano - 1))
                        tusc_remoto_a_azul_p_y = tusd_remoto_a_azul_ponta * ((1 + inflacao_energia) ** (ano - 1))
                        
                        economia_remoto_a_azul_p = abatido_p_a_azul * tarifa_total_remoto_a_azul_p_y - (abatido_p_a_azul * tusc_remoto_a_azul_p_y)
                        economia_remoto_a_azul_fp = abatido_fp_a_azul * tarifa_total_remoto_a_azul_fp_y - (abatido_fp_a_azul * tusc_remoto_a_azul_fp_y)
                        
                        econ_remoto_a_azul_fp_acum += economia_remoto_a_azul_fp
                        econ_remoto_a_azul_p_acum += economia_remoto_a_azul_p
                        abatido_remoto_a_azul_fp_acum += abatido_fp_a_azul
                        abatido_remoto_a_azul_p_acum += abatido_p_a_azul
                        creditos_usados_remoto_a_azul_p_acum += creditos_usados_remoto_a_azul_p
                
                # Preenche os dados anuais para o resumo final
                gen_annual[idx-1] = sum(geracao) * factor_deg
                consumo_geradora_fp_annual[idx-1] = sum(consumo_fp)
                consumo_geradora_p_annual[idx-1] = sum(consumo_p)
                abatido_geradora_fp_annual[idx-1] = abatido_fp_geradora_acum + energia_simultanea_acum # Consumo imediato + créditos
                abatido_fp_local_por_credito_annual_for_display[idx-1] = abatido_fp_local_por_credito_acum # Adiciona a nova variável
                abatido_geradora_p_annual[idx-1] = abatido_p_geradora_acum
                creditos_usados_ponta_annual[idx-1] = creditos_usados_p_geradora_acum
                economia_geradora_annual[idx-1] = econ_geradora_acum
                economia_simultanea_annual[idx-1] = economia_simultanea_acum
                energia_simultanea_annual[idx-1] = energia_simultanea_acum
                
                logger.info(f"Ano {ano}: Geração Anual: {gen_annual[idx-1]}, Energia Simultânea: {energia_simultanea_annual[idx-1]}")
                logger.info(f"Ano {ano}: Abatido FP Local por Crédito: {abatido_fp_local_por_credito_annual_for_display[idx-1]}")
                
                abatido_remoto_b_annual[idx-1] = abatido_remoto_b_acum
                economia_remoto_b_annual[idx-1] = econ_remoto_b_acum
                
                abatido_remoto_a_verde_foraponta_annual[idx-1] = abatido_remoto_a_verde_fp_acum
                abatido_remoto_a_verde_ponta_annual[idx-1] = abatido_remoto_a_verde_p_acum
                economia_remoto_a_verde_foraponta_annual[idx-1] = econ_remoto_a_verde_fp_acum
                economia_remoto_a_verde_ponta_annual[idx-1] = econ_remoto_a_verde_p_acum
                creditos_usados_remoto_a_verde_ponta_annual[idx-1] = creditos_usados_remoto_a_verde_p_acum
                
                abatido_remoto_a_azul_foraponta_annual[idx-1] = abatido_remoto_a_azul_fp_acum
                abatido_remoto_a_azul_ponta_annual[idx-1] = abatido_remoto_a_azul_p_acum
                economia_remoto_a_azul_foraponta_annual[idx-1] = econ_remoto_a_azul_fp_acum
                economia_remoto_a_azul_ponta_annual[idx-1] = econ_remoto_a_azul_p_acum
                creditos_usados_remoto_a_azul_ponta_annual[idx-1] = creditos_usados_remoto_a_azul_p_acum
                
                # CORREÇÃO: Ordem correta do cálculo (como no notebook)
                economia_total_annual[idx-1] = economia_simultanea_annual[idx-1] + economia_geradora_annual[idx-1] + economia_remoto_b_annual[idx-1] + economia_remoto_a_verde_foraponta_annual[idx-1] + economia_remoto_a_verde_ponta_annual[idx-1] + economia_remoto_a_azul_foraponta_annual[idx-1] + economia_remoto_a_azul_ponta_annual[idx-1]
                
                oma = capex * oma_first_pct * ((1 + oma_inflacao) ** (ano - 1))
                oma_annual[idx-1] = oma
                
                # === FLUXO DE CAIXA CORRIGIDO (SEM CUSTO DE DEMANDA) ===
                fluxo = economia_total_annual[idx-1] - oma
                if ano == anos:
                    fluxo += capex * salvage_pct
                net_cash_annual[idx-1] = fluxo
            
            # 13. Cálculos financeiros (seguindo notebook)
            flows = np.concatenate(([-capex], net_cash_annual))
            ts = np.arange(0, anos + 1)
            discount_factors = 1.0 / ((1 + taxa_desconto) ** ts)
            VPL = (flows * discount_factors).sum()
            
            try:
                TIR = npf.irr(flows)
            except Exception:
                TIR = None
            
            pv_flows = (flows * discount_factors)
            pv_inflows = pv_flows[pv_flows > 0].sum()
            pv_outflows = -pv_flows[pv_flows < 0].sum()
            PI = pv_inflows / pv_outflows if pv_outflows != 0 else None
            
            ECONOMIA_TOTAL_NOMINAL = economia_total_annual.sum()
            LCOE = VPL / (gen_annual * discount_factors[1:]).sum() if (gen_annual * discount_factors[1:]).sum() > 0 else None
            ROI_SIMPLE = (ECONOMIA_TOTAL_NOMINAL - capex) / capex * 100.0
            
            cumul_nominal = np.cumsum(flows)
            payback_simple = None
            payback_simple_frac = None
            for t in range(1, len(cumul_nominal)):
                if cumul_nominal[t] >= 0:
                    prev = cumul_nominal[t-1]
                    curr = cumul_nominal[t]
                    if curr == prev:
                        payback_simple_frac = float(t)
                    else:
                        frac = -prev / (curr - prev)
                        payback_simple_frac = (t-1) + frac
                    payback_simple = payback_simple_frac
                    break
            
            disc_flows = flows * discount_factors
            cumul_discounted = np.cumsum(disc_flows)
            payback_disc = None
            payback_disc_frac = None
            for t in range(1, len(cumul_discounted)):
                if cumul_discounted[t] >= 0:
                    prev = cumul_discounted[t-1]
                    curr = cumul_discounted[t]
                    if curr == prev:
                        payback_disc_frac = float(t)
                    else:
                        frac = -prev / (curr - prev)
                        payback_disc_frac = (t-1) + frac
                    payback_disc = payback_disc_frac
                    break
            
            CUSTO_EVITADO_NOMINAL = economia_total_annual.sum()
            CUSTO_EVITADO_PV = (economia_total_annual * discount_factors[1:]).sum()
            
            # 14. Montar resposta
            # 1. Somas iniciais
            geracao_anual = sum(geracao)
            consumo_fp_anual = sum(consumo_fp)
            consumo_p_anual = sum(consumo_p)
            
            somas_iniciais = {
                'geracao_anual': f"{geracao_anual:,.2f} kWh".replace(',', '.'),
                'consumo_fora_ponta': f"{consumo_fp_anual:,.2f} kWh".replace(',', '.'),
                'consumo_ponta': f"{consumo_p_anual:,.2f} kWh".replace(',', '.'),
                'capex': format_currency(capex)
            }
            
            # 2. Financeiro (valores numéricos para o frontend formatar)
            from models.shared.financial_models import FinancialSummary
            financeiro = FinancialSummary(
                vpl=VPL,
                tir=TIR if TIR is not None else 0.0,
                pi=PI if PI is not None else 0.0,
                payback_simples=payback_simple if payback_simple is not None else 0.0,
                payback_descontado=payback_disc if payback_disc is not None else 0.0,
                lcoe=LCOE if LCOE is not None else 0.0,
                roi_simples=ROI_SIMPLE / 100.0,  # Converter de % para decimal
                economia_total_nominal=CUSTO_EVITADO_NOMINAL,
                economia_total_valor_presente=CUSTO_EVITADO_PV
            )
            
            # 3. Consumo ano 1
            consumo_ano1 = {
                'geracao': geracao_anual,
                'local_fora_ponta': consumo_fp_anual,
                'local_ponta': consumo_p_anual,
                'remoto_fora_ponta': 0,  # Será preenchido se houver unidades remotas
                'remoto_ponta': 0,        # Será preenchido se houver unidades remotas
                'autoconsumo_simultaneo_fp': energia_simultanea_annual[0],
                'autoconsumo_simultaneo_p': 0,  # No notebook, autoconsumo é apenas fora ponta
                'abatido_fp': abatido_geradora_fp_annual[0],
                'abatido_p': abatido_geradora_p_annual[0],
                'energia_excedente': gen_annual[0] - energia_simultanea_annual[0]
            }
            
            # 4. Tabela resumo anual (simplificada)
            tabela_resumo_anual = []
            for i in range(len(anos_array)):
                tabela_resumo_anual.append({
                    'ano': i + 1,
                    'geracao_anual': gen_annual[i],
                    'consumo_fora_ponta': consumo_geradora_fp_annual[i],
                    'consumo_ponta': consumo_geradora_p_annual[i],
                    'economia_anual': economia_total_annual[i],
                    'fluxo_nominal': net_cash_annual[i]
                })
            
            # 5. Tabela fluxo de caixa com dados completos do df_resumo_economia_simplificada
            tabela_fluxo_caixa = []
            cumul_nominal_cf = -capex
            cumul_discounted_cf = -capex

            # Adicionar ano 0 (investimento inicial)
            tabela_fluxo_caixa.append(CashFlowRow(
                ano=0,
                fluxo_nominal=flows[0],
                fluxo_acumulado_nominal=cumul_nominal_cf,
                fluxo_descontado=flows[0],
                fluxo_acumulado_descontado=cumul_discounted_cf,
                # Campos novos (ano 0 não tem dados)
                geracao_anual=0,
                economia_simultanea=0,
                percentual_abatido_local_fp=0,
                economia_local_fp=0,
                percentual_abatido_local_p=0,
                economia_local_p=0,
                creditos_usados_ponta=0,
                percentual_abatido_remoto_b=0,
                economia_remoto_b=0,
                economia_remoto_a_verde_fp=0,
                economia_remoto_a_verde_p=0,
                economia_remoto_a_azul_fp=0,
                economia_remoto_a_azul_p=0,
                custos_om=0,
                economia_total=0,
                fluxo_operacional=0,
                fluxo_liquido=flows[0],
                fluxo_acumulado=cumul_nominal_cf,
                valor_presente=flows[0]
            ))

            # Adicionar anos 1 a 25 com dados completos
            for i in range(1, len(flows)):
                cumul_nominal_cf += flows[i]
                cumul_discounted_cf += disc_flows[i]
                
                # Calcular percentuais de abatimento (como no notebook)
                perc_abatido_fp_local = (abatido_geradora_fp_annual[i-1] / consumo_geradora_fp_annual[i-1]) * 100 if consumo_geradora_fp_annual[i-1] > 0 else 0
                perc_abatido_p_local = (abatido_geradora_p_annual[i-1] / consumo_geradora_p_annual[i-1]) * 100 if consumo_geradora_p_annual[i-1] > 0 else 0
                perc_abatido_remoto_b = (abatido_remoto_b_annual[i-1] / sum(consumo_remoto_b)) * 100 if sum(consumo_remoto_b) > 0 else 0
                
                # Calcular economia local FP e P (como no notebook)
                tarifa_fp_y = tarifa_fora_ponta_total * ((1 + inflacao_energia) ** (i - 1))
                tarifa_p_y = tarifa_ponta_total * ((1 + inflacao_energia) ** (i - 1))
                economia_fp_local = abatido_fp_local_por_credito_annual_for_display[i-1] * (tarifa_fp_y - (tusd_remoto_a_verde_fora_ponta * ((1 + inflacao_energia) ** (i - 1))))
                economia_p_local = abatido_geradora_p_annual[i-1] * (tarifa_p_y - (tusd_remoto_a_verde_ponta * ((1 + inflacao_energia) ** (i - 1))))
                
                tabela_fluxo_caixa.append(CashFlowRow(
                    ano=i,
                    fluxo_nominal=flows[i],
                    fluxo_acumulado_nominal=cumul_nominal_cf,
                    fluxo_descontado=disc_flows[i],
                    fluxo_acumulado_descontado=cumul_discounted_cf,
                    
                    # Dados de geração e consumo
                    geracao_anual=gen_annual[i-1],
                    economia_simultanea=economia_simultanea_annual[i-1],
                    
                    # Dados de economia local
                    percentual_abatido_local_fp=perc_abatido_fp_local,
                    economia_local_fp=economia_fp_local,
                    percentual_abatido_local_p=perc_abatido_p_local,
                    economia_local_p=economia_p_local,
                    creditos_usados_ponta=creditos_usados_ponta_annual[i-1],
                    
                    # Dados de economia remota
                    percentual_abatido_remoto_b=perc_abatido_remoto_b,
                    economia_remoto_b=economia_remoto_b_annual[i-1],
                    economia_remoto_a_verde_fp=economia_remoto_a_verde_foraponta_annual[i-1],
                    economia_remoto_a_verde_p=economia_remoto_a_verde_ponta_annual[i-1],
                    economia_remoto_a_azul_fp=economia_remoto_a_azul_foraponta_annual[i-1],
                    economia_remoto_a_azul_p=economia_remoto_a_azul_ponta_annual[i-1],
                    
                    # Dados financeiros
                    custos_om=oma_annual[i-1],
                    economia_total=economia_total_annual[i-1],
                    
                    # Campos para compatibilidade com TypeScript
                    fluxo_operacional=economia_total_annual[i-1] - oma_annual[i-1],
                    fluxo_liquido=flows[i],
                    fluxo_acumulado=cumul_nominal_cf,
                    valor_presente=disc_flows[i]
                ))
            
            # 6. Análise de sensibilidade (simplificada)
            dados_sensibilidade = {
                'multiplicadores_tarifa': [0.8, 0.9, 1.0, 1.1, 1.2],
                'vpl_matrix': [VPL * 0.8, VPL * 0.9, VPL, VPL * 1.1, VPL * 1.2]
            }
            
            self.logger.info(f"FIM CÁLCULO GRUPO A - VPL: R$ {VPL:,.2f}")
            
            # Log adicional para comparar com notebook
            self.logger.info(f"RESUMO FINANCEIRO COMPLETO (LOCAL + REMOTO)")
            self.logger.info(f" - Valor Presente Líquido (VPL): R$ {VPL:,.2f}")
            if TIR is not None:
                self.logger.info(f" - Taxa Interna de Retorno (TIR): {TIR:.2%}")
            else:
                self.logger.info(" - Taxa Interna de Retorno (TIR): N/A")
            if payback_simple is not None:
                self.logger.info(f" - Payback Simples: {payback_simple:.2f} anos")
            else:
                self.logger.info(" - Payback Simples: N/A")
            if payback_disc is not None:
                self.logger.info(f" - Payback Descontado: {payback_disc:.2f} anos")
            else:
                self.logger.info(" - Payback Descontado: N/A")
            self.logger.info(f" - Economia Total Projetada (Nominal): R$ {CUSTO_EVITADO_NOMINAL:,.2f}")
            self.logger.info(f" - Economia Total Projetada (Valor Presente): R$ {CUSTO_EVITADO_PV:,.2f}")
            
            return ResultadosCodigoAResponse(
                somas_iniciais=somas_iniciais,
                financeiro=financeiro,
                consumo_ano1=consumo_ano1,
                tabela_resumo_anual=tabela_resumo_anual,
                tabela_fluxo_caixa=tabela_fluxo_caixa,
                dados_sensibilidade=dados_sensibilidade
            )
            
        except Exception as e:
            self.logger.error(f"Erro no cálculo Grupo A: {str(e)}")
            raise