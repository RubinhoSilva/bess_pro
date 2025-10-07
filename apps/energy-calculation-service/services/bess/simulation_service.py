"""
Serviço de simulação de operação de BESS (Battery Energy Storage System)

Este serviço simula a operação horária de um sistema de baterias (8760 horas/ano)
considerando:
- Geração solar horária
- Consumo horário
- Tarifas de energia (ponta/fora-ponta)
- Estratégias de operação (arbitragem, peak shaving, autoconsumo)
- Limites físicos da bateria (SOC, potência, eficiência)

Adaptado da lógica do notebook BESS_PRo_Funcionando_R16.ipynb
"""

import logging
import numpy as np
from typing import Dict, Any, List, Tuple
from datetime import datetime, time
from models.bess.requests import TarifaEnergia, PerfilConsumo

logger = logging.getLogger(__name__)


class BessSimulationService:
    """
    Serviço para simulação de operação de BESS

    Simula o comportamento hora a hora do sistema de baterias,
    otimizando para economia de energia baseado na estratégia escolhida.
    """

    def __init__(self):
        """Inicializa o serviço de simulação BESS"""
        logger.info("Inicializando BessSimulationService")

    def simulate_annual_operation(
        self,
        capacidade_kwh: float,
        potencia_kw: float,
        curva_geracao_solar_w: np.ndarray,  # 8760 valores em W
        curva_consumo_w: np.ndarray,  # 8760 valores em W
        tarifa: TarifaEnergia,
        estrategia: str,
        parametros_bateria: Dict[str, float],
        limite_demanda_kw: float = None
    ) -> Dict[str, Any]:
        """
        Simula operação anual do BESS (8760 horas)

        Args:
            capacidade_kwh: Capacidade nominal da bateria em kWh
            potencia_kw: Potência máxima do inversor em kW
            curva_geracao_solar_w: Array com geração solar horária em W (8760 valores)
            curva_consumo_w: Array com consumo horário em W (8760 valores)
            tarifa: Estrutura tarifária
            estrategia: "arbitragem", "peak_shaving", "auto_consumo", "custom"
            parametros_bateria: {
                "eficiencia_roundtrip": float,  # Ex: 0.90 (90%)
                "soc_inicial": float,  # Ex: 0.5 (50%)
                "soc_min": float,  # Ex: 0.1 (10%)
                "soc_max": float,  # Ex: 1.0 (100%)
                "dod_max": float,  # Ex: 0.9 (90%)
            }
            limite_demanda_kw: Limite de demanda para peak shaving (opcional)

        Returns:
            Dict com métricas da simulação:
            - energia_armazenada_anual_kwh: Total carregado
            - energia_descarregada_anual_kwh: Total descarregado
            - ciclos_equivalentes: Número de ciclos completos
            - economia_anual_reais: Economia total
            - soc_medio_percentual: SOC médio
            - series (opcional): Séries temporais horárias
        """

        logger.info(f"🔋 Iniciando simulação BESS: {capacidade_kwh}kWh, {potencia_kw}kW, estratégia={estrategia}")

        # =====================================================================
        # ETAPA 1: PREPARAÇÃO DOS DADOS
        # =====================================================================

        # Converter potência de W para kW para facilitar cálculos
        # curva_geracao_solar_w está em Watts, dividir por 1000 = kW
        geracao_solar_kw = curva_geracao_solar_w / 1000.0  # Array 8760 valores
        consumo_kw = curva_consumo_w / 1000.0  # Array 8760 valores

        # Extrair parâmetros da bateria
        eficiencia_rt = parametros_bateria.get("eficiencia_roundtrip", 0.90)
        soc_inicial = parametros_bateria.get("soc_inicial", 0.5)
        soc_min = parametros_bateria.get("soc_min", 0.1)
        soc_max = parametros_bateria.get("soc_max", 1.0)

        # Calcular eficiências de carga e descarga
        # Eficiência round-trip = eficiência_carga × eficiência_descarga
        # Assumimos que as duas são iguais: η_carga = η_descarga = sqrt(η_rt)
        eficiencia_carga = np.sqrt(eficiencia_rt)
        eficiencia_descarga = np.sqrt(eficiencia_rt)

        logger.info(f"   Parâmetros: η_rt={eficiencia_rt:.2%}, SOC=[{soc_min:.1%}, {soc_max:.1%}]")

        # =====================================================================
        # ETAPA 2: INICIALIZAÇÃO DAS VARIÁVEIS DE SIMULAÇÃO
        # =====================================================================

        # Arrays para armazenar resultados hora a hora
        n_horas = len(geracao_solar_kw)
        serie_soc = np.zeros(n_horas)  # Estado de carga (0-1)
        serie_potencia_bess = np.zeros(n_horas)  # Potência BESS (+ carga, - descarga)
        serie_potencia_rede = np.zeros(n_horas)  # Potência rede (+ compra, - venda)
        serie_custo_energia = np.zeros(n_horas)  # Custo da energia por hora (R$)

        # Estado inicial da bateria
        soc_atual = soc_inicial  # Começar com 50% de carga (padrão)
        energia_na_bateria_kwh = soc_atual * capacidade_kwh

        # Contadores e acumuladores
        energia_armazenada_total_kwh = 0.0  # Total carregado
        energia_descarregada_total_kwh = 0.0  # Total descarregado
        energia_perdida_kwh = 0.0  # Perdas por eficiência
        custo_total_sem_bess = 0.0  # Custo se não tivesse BESS (baseline)
        custo_total_com_bess = 0.0  # Custo real com BESS
        horas_carga = 0
        horas_descarga = 0
        horas_idle = 0

        logger.info(f"   Simulando {n_horas} horas de operação...")

        # =====================================================================
        # ETAPA 3: LOOP DE SIMULAÇÃO HORÁRIA (8760 ITERAÇÕES)
        # =====================================================================

        for hora in range(n_horas):
            # =================================================================
            # 3.1: Obter dados da hora atual
            # =================================================================

            geracao_hora_kw = geracao_solar_kw[hora]  # Geração PV nesta hora (kW)
            consumo_hora_kw = consumo_kw[hora]  # Consumo nesta hora (kW)

            # Determinar tarifa vigente nesta hora
            # Precisa saber o horário do dia para aplicar ponta/fora-ponta
            hora_do_dia = hora % 24  # 0-23
            tarifa_hora = self._get_tarifa_hora(tarifa, hora_do_dia)

            # =================================================================
            # 3.2: Calcular balanço energético inicial (sem BESS)
            # =================================================================

            # Balanço: Geração - Consumo
            # Se positivo: sobra energia (pode carregar BESS ou vender)
            # Se negativo: falta energia (pode descarregar BESS ou comprar da rede)
            balanco_kw = geracao_hora_kw - consumo_hora_kw

            # =================================================================
            # 3.3: Decidir ação do BESS baseado na estratégia
            # =================================================================

            if estrategia == "arbitragem":
                # Estratégia ARBITRAGEM:
                # - Carregar nas horas de tarifa baixa (fora ponta)
                # - Descarregar nas horas de tarifa alta (ponta)
                acao_bess = self._decisao_arbitragem(
                    tarifa_hora, tarifa, soc_atual, soc_min, soc_max
                )

            elif estrategia == "peak_shaving":
                # Estratégia PEAK SHAVING:
                # - Descarregar quando demanda > limite
                # - Carregar quando sobra energia solar
                acao_bess = self._decisao_peak_shaving(
                    consumo_hora_kw, limite_demanda_kw, balanco_kw, soc_atual, soc_min, soc_max
                )

            elif estrategia == "auto_consumo":
                # Estratégia AUTOCONSUMO:
                # - Carregar com excedente solar
                # - Descarregar quando não há sol suficiente
                acao_bess = self._decisao_autoconsumo(
                    balanco_kw, soc_atual, soc_min, soc_max
                )

            else:
                # Estratégia CUSTOM ou não definida: não opera BESS
                acao_bess = "idle"

            # =================================================================
            # 3.4: Executar ação do BESS
            # =================================================================

            potencia_bess_kw = 0.0  # Potência do BESS nesta hora

            if acao_bess == "carregar":
                # CARREGAR: Tentar carregar bateria

                # Máxima energia que pode ser carregada em 1 hora (kWh)
                # Limitado por: potência do inversor, espaço disponível na bateria
                energia_disponivel_para_carregar = min(
                    potencia_kw,  # Limite do inversor (kW × 1h = kWh)
                    (soc_max - soc_atual) * capacidade_kwh / eficiencia_carga  # Espaço na bateria
                )

                # Verificar quanto de energia sobra para carregar
                # Se balanco_kw > 0: tem excedente solar
                # Se balanco_kw < 0: precisaria comprar da rede para carregar
                if balanco_kw > 0:
                    # Tem excedente solar, usar para carregar
                    energia_a_carregar = min(energia_disponivel_para_carregar, balanco_kw)
                else:
                    # Sem excedente, só carrega se for estratégia que permite (arbitragem)
                    # Compra da rede para carregar (quando tarifa está baixa)
                    if estrategia == "arbitragem":
                        energia_a_carregar = energia_disponivel_para_carregar
                    else:
                        energia_a_carregar = 0.0

                if energia_a_carregar > 0:
                    # Executar carga
                    # Energia efetivamente armazenada (considerando perdas)
                    energia_armazenada = energia_a_carregar * eficiencia_carga
                    energia_na_bateria_kwh += energia_armazenada
                    soc_atual = energia_na_bateria_kwh / capacidade_kwh

                    # Garantir que não ultrapassa SOC máximo
                    if soc_atual > soc_max:
                        soc_atual = soc_max
                        energia_na_bateria_kwh = soc_atual * capacidade_kwh

                    potencia_bess_kw = energia_a_carregar  # Positivo = carregando
                    energia_armazenada_total_kwh += energia_a_carregar
                    energia_perdida_kwh += (energia_a_carregar - energia_armazenada)
                    horas_carga += 1

            elif acao_bess == "descarregar":
                # DESCARREGAR: Tentar descarregar bateria

                # Máxima energia que pode ser descarregada em 1 hora (kWh)
                # Limitado por: potência do inversor, energia disponível na bateria
                energia_disponivel_na_bateria = (soc_atual - soc_min) * capacidade_kwh * eficiencia_descarga
                energia_maxima_descarga = min(
                    potencia_kw,  # Limite do inversor
                    energia_disponivel_na_bateria
                )

                # Quanto de energia precisa?
                # Se balanco_kw < 0: falta energia (consumo > geração)
                if balanco_kw < 0:
                    energia_necessaria = abs(balanco_kw)
                    energia_a_descarregar = min(energia_maxima_descarga, energia_necessaria)
                else:
                    # Se balanco >= 0, não precisa descarregar (mas pode descarregar para vender)
                    if estrategia == "arbitragem":
                        # Descarrega tudo que pode (vender na ponta)
                        energia_a_descarregar = energia_maxima_descarga
                    else:
                        energia_a_descarregar = 0.0

                if energia_a_descarregar > 0:
                    # Executar descarga
                    # Energia retirada da bateria (antes da eficiência)
                    energia_retirada = energia_a_descarregar / eficiencia_descarga
                    energia_na_bateria_kwh -= energia_retirada
                    soc_atual = energia_na_bateria_kwh / capacidade_kwh

                    # Garantir que não fica abaixo do SOC mínimo
                    if soc_atual < soc_min:
                        soc_atual = soc_min
                        energia_na_bateria_kwh = soc_atual * capacidade_kwh

                    potencia_bess_kw = -energia_a_descarregar  # Negativo = descarregando
                    energia_descarregada_total_kwh += energia_a_descarregar
                    energia_perdida_kwh += (energia_retirada - energia_a_descarregar)
                    horas_descarga += 1

            else:
                # IDLE: BESS não faz nada nesta hora
                potencia_bess_kw = 0.0
                horas_idle += 1

            # =================================================================
            # 3.5: Calcular potência da rede resultante
            # =================================================================

            # Balanço final considerando ação do BESS:
            # Rede = Consumo - Geração - Descarga_BESS + Carga_BESS
            # Se positivo: comprando da rede
            # Se negativo: vendendo para a rede
            potencia_rede_kw = consumo_hora_kw - geracao_hora_kw - potencia_bess_kw

            # =================================================================
            # 3.6: Calcular custos
            # =================================================================

            # Custo SEM BESS (baseline): Quanto custaria sem bateria?
            # Se balanco < 0: compra da rede
            # Se balanco > 0: vende para rede (crédito negativo)
            if balanco_kw < 0:
                custo_sem_bess_hora = abs(balanco_kw) * tarifa_hora
            else:
                # Excedente solar: assume crédito de 70% da tarifa (ou 0 se não injetar)
                custo_sem_bess_hora = -balanco_kw * tarifa_hora * 0.7

            custo_total_sem_bess += custo_sem_bess_hora

            # Custo COM BESS: Quanto custa com bateria?
            if potencia_rede_kw > 0:
                # Comprando da rede
                custo_com_bess_hora = potencia_rede_kw * tarifa_hora
            else:
                # Vendendo para rede (crédito)
                custo_com_bess_hora = potencia_rede_kw * tarifa_hora * 0.7

            custo_total_com_bess += custo_com_bess_hora

            # =================================================================
            # 3.7: Armazenar resultados da hora
            # =================================================================

            serie_soc[hora] = soc_atual
            serie_potencia_bess[hora] = potencia_bess_kw
            serie_potencia_rede[hora] = potencia_rede_kw
            serie_custo_energia[hora] = custo_com_bess_hora

        # =====================================================================
        # ETAPA 4: CÁLCULO DE MÉTRICAS FINAIS
        # =====================================================================

        logger.info(f"   Simulação concluída. Processando métricas...")

        # Economia anual: quanto economizou por usar BESS?
        economia_anual_reais = custo_total_sem_bess - custo_total_com_bess

        # Ciclos equivalentes: Total de energia processada / Capacidade
        # 1 ciclo = carregar 100kWh e descarregar 100kWh (se capacidade = 100kWh)
        throughput_total_kwh = (energia_armazenada_total_kwh + energia_descarregada_total_kwh) / 2
        ciclos_equivalentes = throughput_total_kwh / capacidade_kwh

        # SOC médio, mínimo, máximo
        soc_medio = np.mean(serie_soc) * 100  # Converter para %
        soc_minimo = np.min(serie_soc) * 100
        soc_maximo = np.max(serie_soc) * 100

        # Profundidade de descarga média
        dod_medio = 1.0 - soc_medio / 100

        # Taxa de utilização: % de horas que o BESS estava ativo
        utilizacao = ((horas_carga + horas_descarga) / n_horas) * 100

        # Eficiência real observada
        if energia_armazenada_total_kwh > 0:
            eficiencia_real = energia_descarregada_total_kwh / energia_armazenada_total_kwh
        else:
            eficiencia_real = 0.0

        logger.info(f"✅ Simulação BESS finalizada:")
        logger.info(f"   - Ciclos equivalentes: {ciclos_equivalentes:.1f}")
        logger.info(f"   - SOC médio: {soc_medio:.1f}%")
        logger.info(f"   - Economia anual: R$ {economia_anual_reais:,.2f}")
        logger.info(f"   - Utilização: {utilizacao:.1f}%")

        # =====================================================================
        # ETAPA 5: MONTAR RESPOSTA
        # =====================================================================

        return {
            # Parâmetros de entrada (eco)
            "capacidade_kwh": capacidade_kwh,
            "potencia_kw": potencia_kw,
            "estrategia": estrategia,
            "eficiencia_roundtrip": eficiencia_rt,

            # Energia processada
            "energia_armazenada_anual_kwh": round(energia_armazenada_total_kwh, 2),
            "energia_descarregada_anual_kwh": round(energia_descarregada_total_kwh, 2),
            "energia_perdida_kwh": round(energia_perdida_kwh, 2),
            "eficiencia_real": round(eficiencia_real, 4),

            # Estado de carga
            "soc_medio_percentual": round(soc_medio, 2),
            "soc_minimo_percentual": round(soc_minimo, 2),
            "soc_maximo_percentual": round(soc_maximo, 2),

            # Ciclos e degradação
            "ciclos_equivalentes_ano": round(ciclos_equivalentes, 2),
            "profundidade_descarga_media": round(dod_medio, 4),
            "degradacao_estimada_percentual": round(ciclos_equivalentes * 0.01, 2),  # Estimativa simplificada

            # Economia
            "economia_arbitragem_reais": round(economia_anual_reais, 2) if estrategia == "arbitragem" else 0.0,
            "economia_peak_shaving_reais": round(economia_anual_reais, 2) if estrategia == "peak_shaving" else 0.0,
            "economia_total_anual_reais": round(economia_anual_reais, 2),

            # Custos
            "custo_sem_bess_reais": round(custo_total_sem_bess, 2),
            "custo_com_bess_reais": round(custo_total_com_bess, 2),

            # Utilização
            "horas_carga": int(horas_carga),
            "horas_descarga": int(horas_descarga),
            "horas_idle": int(horas_idle),
            "utilizacao_percentual": round(utilizacao, 2),

            # Séries temporais (opcional - pode ser None para economizar banda)
            "series_temporais": {
                "soc_percentual": (serie_soc * 100).tolist(),
                "potencia_bess_kw": serie_potencia_bess.tolist(),
                "potencia_rede_kw": serie_potencia_rede.tolist(),
            } if False else None  # Desabilitado por padrão (muito grande)
        }

    # =========================================================================
    # MÉTODOS AUXILIARES DE DECISÃO
    # =========================================================================

    def _get_tarifa_hora(self, tarifa: TarifaEnergia, hora_do_dia: int) -> float:
        """
        Retorna a tarifa vigente para uma determinada hora do dia

        Args:
            tarifa: Estrutura tarifária
            hora_do_dia: Hora do dia (0-23)

        Returns:
            Tarifa em R$/kWh
        """

        if tarifa.tipo == "branca":
            # Tarifa branca: ponta, intermediária, fora-ponta
            if tarifa.horario_ponta_inicio and tarifa.horario_ponta_fim:
                hora_inicio_ponta = tarifa.horario_ponta_inicio.hour
                hora_fim_ponta = tarifa.horario_ponta_fim.hour

                if hora_inicio_ponta <= hora_do_dia < hora_fim_ponta:
                    return tarifa.tarifa_ponta_kwh

            # Intermediária (se definida)
            if tarifa.tarifa_intermediaria_kwh:
                # Assume intermediária: 16-18h e 21-22h (padrão ANEEL)
                if (16 <= hora_do_dia < 18) or (21 <= hora_do_dia < 22):
                    return tarifa.tarifa_intermediaria_kwh

            # Fora ponta (resto)
            return tarifa.tarifa_fora_ponta_kwh

        else:
            # Convencional, verde, azul: usa tarifa fora-ponta como padrão
            return tarifa.tarifa_fora_ponta_kwh or tarifa.tarifa_ponta_kwh

    def _decisao_arbitragem(
        self,
        tarifa_hora: float,
        tarifa: TarifaEnergia,
        soc_atual: float,
        soc_min: float,
        soc_max: float
    ) -> str:
        """
        Decide ação do BESS para estratégia de ARBITRAGEM

        Lógica:
        - Se tarifa está baixa (fora-ponta): CARREGAR
        - Se tarifa está alta (ponta): DESCARREGAR
        - Respeita limites de SOC

        Returns:
            "carregar", "descarregar" ou "idle"
        """

        # Definir limiar: se tarifa > média, é "cara"
        tarifa_media = (tarifa.tarifa_ponta_kwh + tarifa.tarifa_fora_ponta_kwh) / 2

        if tarifa_hora < tarifa_media:
            # Tarifa baixa: carregar (se tem espaço)
            if soc_atual < soc_max - 0.05:  # Margem de 5%
                return "carregar"
        else:
            # Tarifa alta: descarregar (se tem carga)
            if soc_atual > soc_min + 0.05:
                return "descarregar"

        return "idle"

    def _decisao_peak_shaving(
        self,
        consumo_hora_kw: float,
        limite_demanda_kw: float,
        balanco_kw: float,
        soc_atual: float,
        soc_min: float,
        soc_max: float
    ) -> str:
        """
        Decide ação do BESS para estratégia de PEAK SHAVING

        Lógica:
        - Se consumo > limite: DESCARREGAR para reduzir pico
        - Se sobra solar: CARREGAR
        """

        if limite_demanda_kw and consumo_hora_kw > limite_demanda_kw:
            # Consumo acima do limite: descarregar
            if soc_atual > soc_min + 0.05:
                return "descarregar"

        elif balanco_kw > 0:
            # Sobra energia solar: carregar
            if soc_atual < soc_max - 0.05:
                return "carregar"

        return "idle"

    def _decisao_autoconsumo(
        self,
        balanco_kw: float,
        soc_atual: float,
        soc_min: float,
        soc_max: float
    ) -> str:
        """
        Decide ação do BESS para estratégia de AUTOCONSUMO

        Lógica:
        - Se sobra solar (balanco > 0): CARREGAR
        - Se falta energia (balanco < 0): DESCARREGAR
        """

        if balanco_kw > 0.1:  # Sobra energia
            if soc_atual < soc_max - 0.05:
                return "carregar"

        elif balanco_kw < -0.1:  # Falta energia
            if soc_atual > soc_min + 0.05:
                return "descarregar"

        return "idle"


# Instância singleton
bess_simulation_service = BessSimulationService()
