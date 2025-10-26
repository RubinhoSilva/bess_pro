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
    FinancialSummary,
    FinancialSummaryFormatted,
    CashFlowRow
)
from utils.format_utils import format_currency, format_percentage

# Configure logger detalhado
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

class FinancialGrupoBService:
    """Serviço especializado para cálculos financeiros do Grupo B"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def calculate(self, request: GrupoBFinancialRequest) -> ResultadosCodigoBResponse:
        """
        Método principal de cálculo financeiro para Grupo B
        
        Implementa lógica completa do notebook com loops aninhados (ano × mês)
        e banco de créditos persistente.
        """
        try:
            self.logger.info(f"INÍCIO CÁLCULO GRUPO B - CAPEX: R${request.financeiros.capex:.2f}")
            self._validate_request(request)
            
            # Extrair dados de entrada
            geracao_monthly = np.array(request.geracao.to_list())
            consumo_local_monthly = np.array(request.consumo_local.to_list())
            
            # Extrair dados remotos se habilitados
            consumo_remoto_b_monthly = np.array(request.remoto_b.data.to_list()) if request.remoto_b.enabled else np.zeros(12)
            consumo_remoto_a_verde_fp_monthly = np.array(request.remoto_a_verde.data_off_peak.to_list()) if request.remoto_a_verde.enabled else np.zeros(12)
            consumo_remoto_a_verde_p_monthly = np.array(request.remoto_a_verde.data_peak.to_list()) if request.remoto_a_verde.enabled else np.zeros(12)
            consumo_remoto_a_azul_fp_monthly = np.array(request.remoto_a_azul.data_off_peak.to_list()) if request.remoto_a_azul.enabled else np.zeros(12)
            consumo_remoto_a_azul_p_monthly = np.array(request.remoto_a_azul.data_peak.to_list()) if request.remoto_a_azul.enabled else np.zeros(12)
            
            # Demanda mínima por tipo de conexão
            demanda_minima = {
                "monofasico": 30,
                "bifasico": 50,
                "trifasico": 100
            }.get(request.tipo_conexao, 30)
            
            # Inicialização de variáveis
            anos = range(1, request.financeiros.anos + 1)
            flows = np.zeros(request.financeiros.anos + 1)
            flows[0] = -request.financeiros.capex
            disc_flows = np.zeros(request.financeiros.anos + 1)
            disc_flows[0] = -request.financeiros.capex
            
            # Listas para armazenamento dos resultados anuais
            gen_annual = np.zeros(request.financeiros.anos)
            autoconsumo_instantaneo_annual = np.zeros(request.financeiros.anos)
            autoconsumo_abatido_annual = np.zeros(request.financeiros.anos)
            abatido_remoto_b_annual = np.zeros(request.financeiros.anos)
            abatido_remoto_a_verde_foraponta_annual = np.zeros(request.financeiros.anos)
            abatido_remoto_a_verde_ponta_annual = np.zeros(request.financeiros.anos)
            abatido_remoto_a_azul_foraponta_annual = np.zeros(request.financeiros.anos)
            abatido_remoto_a_azul_ponta_annual = np.zeros(request.financeiros.anos)
            economia_geradora_annual = np.zeros(request.financeiros.anos)
            economia_remoto_b_annual = np.zeros(request.financeiros.anos)
            economia_remoto_a_verde_foraponta_annual = np.zeros(request.financeiros.anos)
            economia_remoto_a_verde_ponta_annual = np.zeros(request.financeiros.anos)
            economia_remoto_a_azul_foraponta_annual = np.zeros(request.financeiros.anos)
            economia_remoto_a_azul_ponta_annual = np.zeros(request.financeiros.anos)
            economia_total_annual = np.zeros(request.financeiros.anos)
            oma_annual = np.zeros(request.financeiros.anos)
            
            # Nova variável para o banco de créditos (em kWh)
            banco_creditos = 0.0
            
            # Loop principal: ano a ano
            for idx, ano in enumerate(anos, start=1):
                self.logger.debug(f"Calculando ano {ano}...")
                
                # Nova variável para o banco de créditos (em kWh)
                banco_creditos_mes_inicial = banco_creditos

                logger.info(f"  Banco de créditos no início do ano: {banco_creditos_mes_inicial:.2f} kWh")
                
                # Inicialização das variáveis mensais para acumular no ano
                autoconsumo_instantaneo_mensal_acumulado = 0
                autoconsumo_abatido_mensal_acumulado = 0
                abatido_remoto_b_mensal_acumulado = 0
                abatido_remoto_a_verde_foraponta_mensal_acumulado = 0
                abatido_remoto_a_verde_ponta_mensal_acumulado = 0
                abatido_remoto_a_azul_foraponta_mensal_acumulado = 0
                abatido_remoto_a_azul_ponta_mensal_acumulado = 0
                
                # Inflação e degradação
                gen_mes_base = geracao_monthly * ((1 - request.financeiros.degradacao / 100) ** (ano - 1))
                tarifa_base_mes = request.tarifa_base * ((1 + request.financeiros.inflacao_energia / 100) ** (idx - 1))
                
                logger.info(f"  Tarifa base no ano {ano}: R$ {tarifa_base_mes:.4f} /kWh")
                logger.info(f"  Geração mensal no ano {ano} (kWh): {gen_mes_base}")

                # Fio B e custos de O&M
                noncomp_b = request.fio_b.schedule.get(request.fio_b.base_year + (ano - 1), 1.0)
                noncomp_a = 1.0
                fio_b_y = request.fio_b_base * ((1 + request.financeiros.inflacao_energia / 100) ** (idx - 1))
                
                logger.info(f"  Fio B no ano {ano}: R$ {fio_b_y:.4f} /kWh, Não Comp.: {noncomp_b:.4f}")

                # Loop aninhado: mês a mês
                for mes in range(12):
                    logger.info(f"    Mês {mes + 1}:")

                    # Geração e Consumo do Mês
                    gen_m = gen_mes_base[mes]
                    consumo_local_m = consumo_local_monthly[mes]

                    logger.info(f"      Geração no mês: {gen_m:.2f} kWh")
                    logger.info(f"      Consumo local no mês: {consumo_local_m:.2f} kWh")
                    
                    # 1. AUTOCONSUMO LOCAL
                    # Autoconsumo Instantâneo (o que não gera crédito nem custo)
                    autoconsumo_instantaneo_m = min(gen_m * request.fator_simultaneidade, consumo_local_m)

                    logger.info(f"      Autoconsumo instantâneo no mês: {autoconsumo_instantaneo_m:.2f} kWh")

                    # Energia injetada na rede
                    injetado_m = gen_m - autoconsumo_instantaneo_m

                    logger.info(f"      Energia injetada no mês: {injetado_m:.2f} kWh")
                    
                    # Consumo restante a ser abatido (com créditos)
                    consumo_restante_local_m = consumo_local_m - autoconsumo_instantaneo_m

                    logger.info(f"      Consumo restante a ser abatido no mês: {consumo_restante_local_m:.2f} kWh")
                    
                    # Abate o consumo restante com a energia injetada no próprio mês
                    abatido_com_injetado_m = min(injetado_m, consumo_restante_local_m)

                    logger.info(f"      Abatido com energia injetada no mês: {abatido_com_injetado_m:.2f} kWh")
                    
                    # Atualiza a energia injetada e o consumo restante
                    injetado_liquido_m = injetado_m - abatido_com_injetado_m
                    consumo_a_abater_com_creditos_m = consumo_restante_local_m - abatido_com_injetado_m
                    
                    logger.info(f"      Energia injetada líquida no mês (créditos gerados): {injetado_liquido_m:.2f} kWh")
                    logger.info(f"      Consumo a abater com créditos no mês: {consumo_a_abater_com_creditos_m:.2f} kWh")

                    # Abate o consumo restante com o banco de créditos
                    abatido_com_credito_m = min(consumo_a_abater_com_creditos_m, banco_creditos)
                    banco_creditos -= abatido_com_credito_m

                    logger.info(f"      Abatido com créditos do banco no mês: {abatido_com_credito_m:.2f} kWh")
                    logger.info(f"      Banco de créditos após abatimento no mês: {banco_creditos:.2f} kWh")
                    
                    # O total abatido na unidade geradora é a soma do abatido no mês com o abatido do banco de créditos
                    autoconsumo_abatido_m = abatido_com_injetado_m + abatido_com_credito_m

                    logger.info(f"      Autoconsumo abatido total no mês: {autoconsumo_abatido_m:.2f} kWh")
                    
                    # Atualiza o banco de créditos com o excedente do mês
                    banco_creditos += injetado_liquido_m

                    logger.info(f"      Banco de créditos no final do mês após adição do excedente: {banco_creditos:.2f} kWh")
                    
                    # 2. ABATIMENTO DE UNIDADES REMOTAS
                    # NOTA: No notebook, quando as unidades remotas estão desabilitadas,
                    # os percentuais ainda são definidos mas não são usados
                    
                    # Créditos disponíveis para as unidades remotas no final do mês
                    # Só calcula se houver pelo menos uma unidade remota habilitada
                    if request.remoto_b.enabled or request.remoto_a_verde.enabled or request.remoto_a_azul.enabled:
                        creditos_disponiveis = banco_creditos * (1 - request.remoto_b.percentage - request.remoto_a_verde.percentage - request.remoto_a_azul.percentage)
                        
                        # Créditos para cada grupo remoto
                        creditos_para_b = banco_creditos * request.remoto_b.percentage if request.remoto_b.enabled else 0
                        creditos_para_a_verde = banco_creditos * request.remoto_a_verde.percentage if request.remoto_a_verde.enabled else 0
                        creditos_para_a_azul = banco_creditos * request.remoto_a_azul.percentage if request.remoto_a_azul.enabled else 0
                    else:
                        creditos_disponiveis = banco_creditos
                        creditos_para_b = 0
                        creditos_para_a_verde = 0
                        creditos_para_a_azul = 0
                    
                    abatido_remoto_b_m = 0
                    abatido_remoto_a_verde_foraponta_m = 0
                    abatido_remoto_a_verde_ponta_m = 0
                    abatido_remoto_a_azul_foraponta_m = 0
                    abatido_remoto_a_azul_ponta_m = 0
                    
                    if request.remoto_b.enabled:
                        consumo_remoto_b_m = consumo_remoto_b_monthly[mes]
                        creditos_b_utilizados = min(creditos_para_b, consumo_remoto_b_m)
                        banco_creditos -= creditos_b_utilizados
                        abatido_remoto_b_m = creditos_b_utilizados
                    
                    if request.remoto_a_verde.enabled:
                        consumo_fp_a_verde_m = consumo_remoto_a_verde_fp_monthly[mes]
                        consumo_p_a_verde_m = consumo_remoto_a_verde_p_monthly[mes]
                        
                        # Fatores de equivalência mensais
                        tarifa_total_remoto_a_verde_fp_m = request.remoto_a_verde.tarifas["off_peak"] * ((1 + request.financeiros.inflacao_energia / 100) ** (idx - 1))
                        tarifa_total_remoto_a_verde_p_m = request.remoto_a_verde.tarifas["peak"] * ((1 + request.financeiros.inflacao_energia / 100) ** (idx - 1))
                        fator_equiv_b_a_verde_fp = tarifa_base_mes / tarifa_total_remoto_a_verde_fp_m
                        fator_equiv_b_a_verde_p = tarifa_base_mes / tarifa_total_remoto_a_verde_p_m
                        
                        creditos_restantes = creditos_para_a_verde
                        
                        # Prioridade de abatimento: FORA DE PONTA primeiro
                        abatido_fp = min(creditos_restantes * fator_equiv_b_a_verde_fp, consumo_fp_a_verde_m)
                        creditos_restantes -= abatido_fp / fator_equiv_b_a_verde_fp
                        
                        # Em seguida, PONTA
                        abatido_p = min(creditos_restantes * fator_equiv_b_a_verde_p, consumo_p_a_verde_m)
                        
                        abatido_remoto_a_verde_foraponta_m = abatido_fp
                        abatido_remoto_a_verde_ponta_m = abatido_p
                        banco_creditos -= (abatido_fp / fator_equiv_b_a_verde_fp) + (abatido_p / fator_equiv_b_a_verde_p)
                    
                    if request.remoto_a_azul.enabled:
                        consumo_fp_a_azul_m = consumo_remoto_a_azul_fp_monthly[mes]
                        consumo_p_a_azul_m = consumo_remoto_a_azul_p_monthly[mes]
                        
                        # Fatores de equivalência mensais
                        tarifa_total_remoto_a_azul_fp_m = request.remoto_a_azul.tarifas["off_peak"] * ((1 + request.financeiros.inflacao_energia / 100) ** (idx - 1))
                        tarifa_total_remoto_a_azul_p_m = request.remoto_a_azul.tarifas["peak"] * ((1 + request.financeiros.inflacao_energia / 100) ** (idx - 1))
                        fator_equiv_b_a_azul_fp = tarifa_base_mes / tarifa_total_remoto_a_azul_fp_m
                        fator_equiv_b_a_azul_p = tarifa_base_mes / tarifa_total_remoto_a_azul_p_m
                        
                        creditos_restantes = creditos_para_a_azul
                        
                        # Prioridade de abatimento: FORA DE PONTA primeiro
                        abatido_fp = min(creditos_restantes * fator_equiv_b_a_azul_fp, consumo_fp_a_azul_m)
                        creditos_restantes -= abatido_fp / fator_equiv_b_a_azul_fp
                        
                        # Em seguida, PONTA
                        abatido_p = min(creditos_restantes * fator_equiv_b_a_azul_p, consumo_p_a_azul_m)
                        
                        abatido_remoto_a_azul_foraponta_m = abatido_fp
                        abatido_remoto_a_azul_ponta_m = abatido_p
                        banco_creditos -= (abatido_fp / fator_equiv_b_a_azul_fp) + (abatido_p / fator_equiv_b_a_azul_p)
                    
                    # 3. ACUMULADORES MENSAIS
                    autoconsumo_instantaneo_mensal_acumulado += autoconsumo_instantaneo_m
                    autoconsumo_abatido_mensal_acumulado += autoconsumo_abatido_m
                    abatido_remoto_b_mensal_acumulado += abatido_remoto_b_m
                    abatido_remoto_a_verde_foraponta_mensal_acumulado += abatido_remoto_a_verde_foraponta_m
                    abatido_remoto_a_verde_ponta_mensal_acumulado += abatido_remoto_a_verde_ponta_m
                    abatido_remoto_a_azul_foraponta_mensal_acumulado += abatido_remoto_a_azul_foraponta_m
                    abatido_remoto_a_azul_ponta_mensal_acumulado += abatido_remoto_a_azul_ponta_m
                
                # FIM DO LOOP MENSAL
                
                logger.info(f"  Banco de créditos no final do ano {ano}: {banco_creditos:.2f} kWh")
                logger.info(f"  Acumulados do ano {ano}:")
                logger.info(f"    Autoconsumo instantâneo anual: {autoconsumo_instantaneo_mensal_acumulado:.2f} kWh")
                logger.info(f"    Autoconsumo abatido anual: {autoconsumo_abatido_mensal_acumulado:.2f} kWh")
                logger.info(f"    Abatido remoto B anual: {abatido_remoto_b_mensal_acumulado:.2f} kWh")
                logger.info(f"    Abatido remoto A Verde fora ponta anual: {abatido_remoto_a_verde_foraponta_mensal_acumulado:.2f} kWh")
                logger.info(f"    Abatido remoto A Verde ponta anual: {abatido_remoto_a_verde_ponta_mensal_acumulado:.2f} kWh")
                logger.info(f"    Abatido remoto A Azul fora ponta anual: {abatido_remoto_a_azul_foraponta_mensal_acumulado:.2f} kWh")
                logger.info(f"    Abatido remoto A Azul ponta anual: {abatido_remoto_a_azul_ponta_mensal_acumulado:.2f} kWh")

                # Cálculos Anuais a partir dos acumuladores
                gen_annual[idx - 1] = np.sum(gen_mes_base)

                logger.info(f"  Geração anual no ano {ano}: {gen_annual[idx - 1]:.2f} kWh")

                # Abatimento local
                autoconsumo_instantaneo_annual[idx - 1] = autoconsumo_instantaneo_mensal_acumulado
                autoconsumo_abatido_annual[idx - 1] = autoconsumo_abatido_mensal_acumulado

                logger.info(f"  Autoconsumo instantâneo anual no ano {ano}: {autoconsumo_instantaneo_annual[idx - 1]:.2f} kWh")
                logger.info(f"  Autoconsumo abatido anual no ano {ano}: {autoconsumo_abatido_annual[idx - 1]:.2f} kWh")
                
                # Abatimento Remoto
                abatido_remoto_b_annual[idx - 1] = abatido_remoto_b_mensal_acumulado
                abatido_remoto_a_verde_foraponta_annual[idx - 1] = abatido_remoto_a_verde_foraponta_mensal_acumulado
                abatido_remoto_a_verde_ponta_annual[idx - 1] = abatido_remoto_a_verde_ponta_mensal_acumulado
                abatido_remoto_a_azul_foraponta_annual[idx - 1] = abatido_remoto_a_azul_foraponta_mensal_acumulado
                abatido_remoto_a_azul_ponta_annual[idx - 1] = abatido_remoto_a_azul_ponta_mensal_acumulado
                
                logger.info(f"  Abatido remoto B anual no ano {ano}: {abatido_remoto_b_annual[idx - 1]:.2f} kWh")
                logger.info(f"  Abatido remoto A Verde fora ponta anual no ano {ano}: {abatido_remoto_a_verde_foraponta_annual[idx - 1]:.2f} kWh")
                logger.info(f"  Abatido remoto A Verde ponta anual no ano {ano}: {abatido_remoto_a_verde_ponta_annual[idx - 1]:.2f} kWh")
                logger.info(f"  Abatido remoto A Azul fora ponta anual no ano {ano}: {abatido_remoto_a_azul_foraponta_annual[idx - 1]:.2f} kWh")
                logger.info(f"  Abatido remoto A Azul ponta anual no ano {ano}: {abatido_remoto_a_azul_ponta_annual[idx - 1]:.2f} kWh")

                # Cálculo das Economias Anuais
                # Economia Unidade Geradora Local (Grupo B)
                abatido_total_local = autoconsumo_instantaneo_annual[idx - 1] + autoconsumo_abatido_annual[idx-1]
                
                logger.info(f"  Abatido total na unidade geradora no ano {ano}: {abatido_total_local:.2f} kWh")

                # Custo de Abatimento Fio B ou Demanda Mínima (o maior)
                custo_fio_b_ano = autoconsumo_abatido_annual[idx - 1] * request.fio_b_base * noncomp_b
                custo_disponibilidade_ano = demanda_minima * tarifa_base_mes * 12
                maior_custo_abatimento = max(custo_fio_b_ano, custo_disponibilidade_ano)

                logger.info(f"  Custo de abatimento Fio B no ano {ano}: R$ {custo_fio_b_ano:.2f}")
                logger.info(f"  Custo de disponibilidade no ano {ano}: R$ {custo_disponibilidade_ano:.2f}")
                logger.info(f"  Maior custo de abatimento no ano {ano}: R$ {maior_custo_abatimento:.2f}")

                economia_geradora_annual[idx-1] = (abatido_total_local * tarifa_base_mes) - maior_custo_abatimento

                logger.info(f"  Economia geradora anual no ano {ano}: R$ {economia_geradora_annual[idx-1]:.2f}")

                # Economia Unidade Remoto Grupo B
                economia_remoto_b_annual[idx-1] = (abatido_remoto_b_annual[idx - 1] * tarifa_base_mes) - (abatido_remoto_b_annual[idx-1] * fio_b_y * noncomp_b)
                
                logger.info(f"  Economia remoto B anual no ano {ano}: R$ {economia_remoto_b_annual[idx-1]:.2f}")

                # Economia Unidade Remoto Grupo A Verde
                if request.remoto_a_verde.enabled:
                    tarifa_total_remoto_a_verde_fp_y = request.remoto_a_verde.tarifas["off_peak"] * ((1 + request.financeiros.inflacao_energia / 100) ** (idx - 1))
                    tarifa_total_remoto_a_verde_p_y = request.remoto_a_verde.tarifas["peak"] * ((1 + request.financeiros.inflacao_energia / 100) ** (idx - 1))
                    tusc_remoto_a_verde_fp_y = request.remoto_a_verde.tusd["off_peak"] * ((1 + request.financeiros.inflacao_energia / 100) ** (idx - 1))
                    tusc_remoto_a_verde_p_y = request.remoto_a_verde.tusd["peak"] * ((1 + request.financeiros.inflacao_energia / 100) ** (idx - 1))
                    
                    economia_remoto_a_verde_foraponta_annual[idx - 1] = abatido_remoto_a_verde_foraponta_annual[idx-1] * tarifa_total_remoto_a_verde_fp_y - (abatido_remoto_a_verde_foraponta_annual[idx-1] * tusc_remoto_a_verde_fp_y * noncomp_a)
                    economia_remoto_a_verde_ponta_annual[idx - 1] = abatido_remoto_a_verde_ponta_annual[idx-1] * tarifa_total_remoto_a_verde_p_y - (abatido_remoto_a_verde_ponta_annual[idx-1] * tusc_remoto_a_verde_p_y * noncomp_a)
                
                # Economia Unidade Remoto Grupo A Azul
                if request.remoto_a_azul.enabled:
                    tarifa_total_remoto_a_azul_fp_y = request.remoto_a_azul.tarifas["off_peak"] * ((1 + request.financeiros.inflacao_energia / 100) ** (idx - 1))
                    tarifa_total_remoto_a_azul_p_y = request.remoto_a_azul.tarifas["peak"] * ((1 + request.financeiros.inflacao_energia / 100) ** (idx - 1))
                    tusc_remoto_a_azul_fp_y = request.remoto_a_azul.tusd["off_peak"] * ((1 + request.financeiros.inflacao_energia / 100) ** (idx - 1))
                    tusc_remoto_a_azul_p_y = request.remoto_a_azul.tusd["peak"] * ((1 + request.financeiros.inflacao_energia / 100) ** (idx - 1))
                    
                    economia_remoto_a_azul_foraponta_annual[idx - 1] = abatido_remoto_a_azul_foraponta_annual[idx-1] * tarifa_total_remoto_a_azul_fp_y - (abatido_remoto_a_azul_foraponta_annual[idx-1] * tusc_remoto_a_azul_fp_y * noncomp_a)
                    economia_remoto_a_azul_ponta_annual[idx - 1] = abatido_remoto_a_azul_ponta_annual[idx-1] * tarifa_total_remoto_a_azul_p_y - (abatido_remoto_a_azul_ponta_annual[idx-1] * tusc_remoto_a_azul_p_y * noncomp_a)
                
                # Economia Total e Fluxo de Caixa
                economia_total_annual[idx - 1] = (economia_geradora_annual[idx - 1] + economia_remoto_b_annual[idx-1] +
                                                economia_remoto_a_verde_foraponta_annual[idx-1] + economia_remoto_a_verde_ponta_annual[idx-1] +
                                                economia_remoto_a_azul_foraponta_annual[idx-1] + economia_remoto_a_azul_ponta_annual[idx-1])
                
                logger.info(f"  Economia total anual no ano {ano}: R$ {economia_total_annual[idx-1]:.2f}")

                oma_annual[idx - 1] = request.financeiros.capex * request.financeiros.oma_first_pct * ((1 + request.financeiros.oma_inflacao / 100) ** (idx-1))
                flow_y = economia_total_annual[idx - 1] - oma_annual[idx-1]

                logger.info(f"  O&M anual no ano {ano}: R$ {oma_annual[idx-1]:.2f}")
                logger.info(f"  Fluxo de caixa antes do salvamento no ano {ano}: R$ {flow_y:.2f}")
                
                if ano == request.financeiros.anos:
                    flow_y += request.financeiros.capex * request.financeiros.salvage_pct
                    logger.info(f"  Adicionando salvamento ao fluxo de caixa no ano {ano}: R$ {request.financeiros.capex * request.financeiros.salvage_pct:.2f}")
                
                flows[idx] = flow_y
                disc_flows[idx] = flow_y / ((1 + request.financeiros.taxa_desconto / 100)**(idx))

                logger.info(f"  Fluxo de caixa descontado no ano {ano}: R$ {disc_flows[idx]:.2f}")

                #TODO No codigo do notebook nós temos essas 2 linhas abaixo
                # pv_gen_annual[idx-1] = gen_annual[idx-1] / ((1 + request.financeiros.taxa_desconto/100)**(idx))
                # pv_oma_annual[idx-1] = oma_annual[idx-1] / ((1 + request.financeiros.taxa_desconto/100)**(idx))

                # logger.info(f"  Geração anual em valor presente no ano {ano}: R$ {pv_gen_annual[idx-1]:.2f}")
                # logger.info(f"  O&M anual em valor presente no ano {ano}: R$ {pv_oma_annual[idx-1]:.2f}")

            # Cálculo do VPL e do Payback
            VPL = npf.npv(request.financeiros.taxa_desconto / 100, flows)
            TIR = npf.irr(flows)

            logger.info(f"VPL calculado: R$ {VPL:.2f}")
            logger.info(f"TIR calculada: {TIR*100:.2f} %")
            
            # CORREÇÃO DO CÁLCULO DE PAYBACK SIMPLES E DESCONTADO
            cumul_nominal = np.cumsum(flows)
            cumul_discounted = np.cumsum(disc_flows)

            logger.info(f"Cumulativo Nominal: {cumul_nominal}")
            logger.info(f"Cumulativo Descontado: {cumul_discounted}")
            
            payback_nominal = 0
            for i in range(1, len(cumul_nominal)):
                if cumul_nominal[i] >= 0:
                    prev_cumul = cumul_nominal[i-1]
                    current_flow = flows[i]
                    payback_nominal = i - 1 + abs(prev_cumul) / current_flow
                    logger.info(f"Payback simples no ano {ano}: {payback_nominal:.2f} anos")
                    break
            
            payback_descontado = 0
            for i in range(1, len(cumul_discounted)):
                if cumul_discounted[i] >= 0:
                    prev_cumul_disc = cumul_discounted[i-1]
                    current_flow_disc = disc_flows[i]
                    payback_descontado = i - 1 + abs(prev_cumul_disc) / current_flow_disc
                    logger.info(f"Payback descontado no ano {ano}: {payback_descontado:.2f} anos")
                    break
            
            # NOVOS CÁLCULOS FINANCEIROS
            total_pv_economies = np.sum(disc_flows[1:])
            pi = total_pv_economies / request.financeiros.capex

            logger.info(f"Valor Presente Líquido das economias calculado: R$ {total_pv_economies:.2f}")
            logger.info(f"Índice de lucratividade (PI) calculado: {pi:.2f}")
            
            pv_gen_annual = gen_annual / ((1 + request.financeiros.taxa_desconto / 100)**np.arange(1, request.financeiros.anos + 1))
            pv_oma_annual = oma_annual / ((1 + request.financeiros.taxa_desconto / 100)**np.arange(1, request.financeiros.anos + 1))

            total_pv_gen = np.sum(pv_gen_annual)
            total_pv_oma = np.sum(pv_oma_annual)
            lcoe = (request.financeiros.capex + total_pv_oma - (request.financeiros.capex * request.financeiros.salvage_pct / (1 + request.financeiros.taxa_desconto / 100)**(request.financeiros.anos))) / total_pv_gen
            roi_simples = (np.sum(economia_total_annual) - np.sum(oma_annual)) / request.financeiros.capex

            logger.info(f"Calculado Índice de Lucratividade (PI): {pi:.2f}")
            logger.info(f"Calculado LCOE: R$ {lcoe:.2f} /kWh")
            logger.info(f"Calculado Retorno sobre Investimento (ROI) Simples: {roi_simples*100:.2f}%")
            logger.info(f"Calculado Economia Total Projetada (Nominal): R$ {np.sum(economia_total_annual):.2f}")
            logger.info(f"Calculado Economia Total Projetada (Valor Presente): R$ {total_pv_economies:.2f}")

            logger.info(flows)
            
            # Montar resposta
            response = self._build_response(
                geracao_monthly.tolist(),
                consumo_local_monthly.tolist(),
                request.financeiros.capex,
                flows.tolist(),
                cumul_nominal.tolist(),
                cumul_discounted.tolist(),
                {
                    'vpl': VPL,
                    'tir': TIR * 100 if TIR is not None else 0,
                    'pi': pi,
                    'payback_simples': payback_nominal,
                    'payback_descontado': payback_descontado,
                    'lcoe': lcoe,
                    'roi_simples': roi_simples * 100,
                    'economia_total_nominal': np.sum(economia_total_annual),
                    'economia_total_valor_presente': total_pv_economies
                },
                {
                    'gen_annual': gen_annual.tolist(),
                    'autoconsumo_instantaneo_annual': autoconsumo_instantaneo_annual.tolist(),
                    'autoconsumo_abatido_annual': autoconsumo_abatido_annual.tolist(),
                    'abatido_remoto_b_annual': abatido_remoto_b_annual.tolist(),
                    'abatido_remoto_a_verde_foraponta_annual': abatido_remoto_a_verde_foraponta_annual.tolist(),
                    'abatido_remoto_a_verde_ponta_annual': abatido_remoto_a_verde_ponta_annual.tolist(),
                    'abatido_remoto_a_azul_foraponta_annual': abatido_remoto_a_azul_foraponta_annual.tolist(),
                    'abatido_remoto_a_azul_ponta_annual': abatido_remoto_a_azul_ponta_annual.tolist(),
                    'economia_geradora_annual': economia_geradora_annual.tolist(),
                    'economia_remoto_b_annual': economia_remoto_b_annual.tolist(),
                    'economia_remoto_a_verde_foraponta_annual': economia_remoto_a_verde_foraponta_annual.tolist(),
                    'economia_remoto_a_verde_ponta_annual': economia_remoto_a_verde_ponta_annual.tolist(),
                    'economia_remoto_a_azul_foraponta_annual': economia_remoto_a_azul_foraponta_annual.tolist(),
                    'economia_remoto_a_azul_ponta_annual': economia_remoto_a_azul_ponta_annual.tolist(),
                    'economia_total_annual': economia_total_annual.tolist(),
                    'oma_annual': oma_annual.tolist()
                },
                request,
                demanda_minima * request.tarifa_base
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
        
        if total_percent > 1:
            raise ValueError(f"Soma de percentuais remotos ({total_percent}%) não pode ultrapassar 100%")
    
    
    def _build_response(
        self,
        geracao: List[float],
        consumo: List[float],
        capex: float,
        flows: List[float],
        cumul_nominal: List[float],
        cumul_discounted: List[float],
        indicadores: Dict,
        dados_anuais: Dict,
        request: GrupoBFinancialRequest,
        custo_disponibilidade_mensal: float
    ) -> ResultadosCodigoBResponse:
        """
        Monta objeto de resposta formatado com base nos cálculos do notebook
        """
        
        # 1. Somas iniciais
        somas_iniciais = {
            "geracao_anual": f"{sum(geracao):,.0f} kWh".replace(",", "."),
            "consumo_anual": f"{sum(consumo):,.0f} kWh".replace(",", "."),
            "capex": format_currency(capex)
        }
        
        # 2. Comparativo de custo abatimento (Ano 1)
        custo_fio_b_ano1 = dados_anuais['autoconsumo_abatido_annual'][0] * request.fio_b_base * request.fio_b.schedule.get(request.fio_b.base_year, 1.0)
        custo_disponibilidade_ano1 = custo_disponibilidade_mensal * 12
        
        comparativo_custo_abatimento = {
            "custo_fio_b": format_currency(custo_fio_b_ano1),
            "custo_disponibilidade": format_currency(custo_disponibilidade_ano1),
            "maior_custo": format_currency(max(custo_fio_b_ano1, custo_disponibilidade_ano1))
        }
        
        # 3. Financeiro
        financeiro = FinancialSummary(
            vpl=float(indicadores['vpl']),
            tir=float(indicadores['tir']) / 100 if indicadores['tir'] > 0 else 0.0,
            pi=float(indicadores['pi']),
            payback_simples=float(indicadores['payback_simples']),
            payback_descontado=float(indicadores['payback_descontado']),
            lcoe=float(indicadores['lcoe']),
            roi_simples=float(indicadores['roi_simples']) / 100,
            economia_total_nominal=float(indicadores['economia_total_nominal']),
            economia_total_valor_presente=float(indicadores['economia_total_valor_presente'])
        )
        
        # 4. Consumo ano 1
        consumo_ano1 = {
            "consumo_local": sum(consumo),
            "geracao": dados_anuais['gen_annual'][0],
            "autoconsumo_instantaneo": dados_anuais['autoconsumo_instantaneo_annual'][0],
            "autoconsumo_abatido": dados_anuais['autoconsumo_abatido_annual'][0],
            "percentual_abatido": ((dados_anuais['autoconsumo_instantaneo_annual'][0] + dados_anuais['autoconsumo_abatido_annual'][0]) / sum(consumo)) * 100 if sum(consumo) > 0 else 0,
            "abatido_remoto_b": dados_anuais['abatido_remoto_b_annual'][0] if request.remoto_b.enabled else 0,
            "abatido_remoto_a_verde_fp": dados_anuais['abatido_remoto_a_verde_foraponta_annual'][0] if request.remoto_a_verde.enabled else 0,
            "abatido_remoto_a_verde_p": dados_anuais['abatido_remoto_a_verde_ponta_annual'][0] if request.remoto_a_verde.enabled else 0,
            "abatido_remoto_a_azul_fp": dados_anuais['abatido_remoto_a_azul_foraponta_annual'][0] if request.remoto_a_azul.enabled else 0,
            "abatido_remoto_a_azul_p": dados_anuais['abatido_remoto_a_azul_ponta_annual'][0] if request.remoto_a_azul.enabled else 0
        }
        
        # 5. Tabela resumo anual (primeiros 5 anos para visualização)
        tabela_resumo_anual = []
        for ano in range(min(5, request.financeiros.anos)):
            idx = ano
            perc_abatido_local = ((dados_anuais['autoconsumo_instantaneo_annual'][idx] + dados_anuais['autoconsumo_abatido_annual'][idx]) / sum(consumo)) * 100 if sum(consumo) > 0 else 0
            
            tabela_resumo_anual.append({
                "ano": ano + 1,
                "geracao": dados_anuais['gen_annual'][idx],
                "percentual_abatido_local": perc_abatido_local,
                "economia_local": dados_anuais['economia_geradora_annual'][idx],
                "economia_remoto_b": dados_anuais['economia_remoto_b_annual'][idx],
                "economia_remoto_a_verde_fp": dados_anuais['economia_remoto_a_verde_foraponta_annual'][idx],
                "economia_remoto_a_verde_p": dados_anuais['economia_remoto_a_verde_ponta_annual'][idx],
                "economia_remoto_a_azul_fp": dados_anuais['economia_remoto_a_azul_foraponta_annual'][idx],
                "economia_remoto_a_azul_p": dados_anuais['economia_remoto_a_azul_ponta_annual'][idx],
                "custos_om": dados_anuais['oma_annual'][idx],
                "economia_total": dados_anuais['economia_total_annual'][idx]
            })
        
        # 6. Tabela fluxo de caixa
        tabela_fluxo_caixa = []
        for ano in range(len(flows)):
            tabela_fluxo_caixa.append(
                CashFlowRow(
                    ano=ano,
                    fluxo_nominal=flows[ano],
                    fluxo_acumulado_nominal=cumul_nominal[ano],
                    fluxo_descontado=cumul_discounted[ano] if ano < len(cumul_discounted) else flows[ano] / ((1 + request.financeiros.taxa_desconto / 100)**ano),
                    fluxo_acumulado_descontado=cumul_discounted[ano] if ano < len(cumul_discounted) else sum(flows[:ano+1] / np.array([(1 + request.financeiros.taxa_desconto / 100)**i for i in range(ano+1)]))
                )
            )
        
        return ResultadosCodigoBResponse(
            somas_iniciais=somas_iniciais,
            comparativo_custo_abatimento=comparativo_custo_abatimento,
            financeiro=financeiro,
            consumo_ano1=consumo_ano1,
            tabela_resumo_anual=tabela_resumo_anual,
            tabela_fluxo_caixa=tabela_fluxo_caixa
        )