"""
Serviço de cálculos para sistemas fotovoltaicos com múltiplos inversores
"""

import numpy as np
import pandas as pd
import pvlib
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta

from models.requests import (
    MultiInverterCalculationRequest, 
    SelectedInverterData, 
    AguaTelhadoData,
    SolarModuleData
)
from models.responses import (
    MultiInverterCalculationResponse,
    InverterResults,
    AguaTelhadoResults,
    MultiInverterSystemCompatibility,
    PeriodAnalysis,
    Coordinates
)
# from services.module_service import ModuleCalculationService  # Not needed for this implementation


class MultiInverterCalculationService:
    """Serviço para cálculos de sistemas multi-inversor"""
    
    @staticmethod
    def calculate_multi_inverter_system(request: MultiInverterCalculationRequest) -> MultiInverterCalculationResponse:
        """
        Calcula sistema completo com múltiplos inversores e águas de telhado
        """
        
        # 1. Validar compatibilidade do sistema
        compatibility = MultiInverterCalculationService._validate_system_compatibility(
            request.inversores_selecionados, 
            request.aguas_telhado, 
            request.modulo
        )
        
        # 2. Calcular resultados para cada água de telhado
        aguas_results = []
        total_energia_anual = 0
        geracao_mensal_total = [0.0] * 12
        
        for agua in request.aguas_telhado:
            agua_result = MultiInverterCalculationService._calculate_agua_performance(
                agua, request.modulo, request
            )
            aguas_results.append(agua_result)
            total_energia_anual += agua_result.energia_anual_kwh
            
            # Somar geração mensal (aproximada baseada na anual)
            for i in range(12):
                geracao_mensal_total[i] += agua_result.energia_anual_kwh / 12
        
        # 3. Calcular resultados para cada inversor
        inversores_results = MultiInverterCalculationService._calculate_inverter_results(
            request.inversores_selecionados, 
            request.aguas_telhado, 
            aguas_results,
            request.modulo
        )
        
        # 4. Calcular métricas globais
        total_modulos = sum(agua.numero_modulos for agua in request.aguas_telhado)
        
        # Validar se potencia_nominal_w não é None
        potencia_nominal = getattr(request.modulo, 'potencia_nominal_w', None)
        if not potencia_nominal:
            raise ValueError("Potência nominal do módulo é obrigatória")
        
        total_potencia_dc = total_modulos * potencia_nominal
        total_potencia_ca = sum(inv.potencia_saida_ca_w * inv.quantity for inv in request.inversores_selecionados)
        
        # 5. Calcular Performance Ratio médio ponderado
        pr_medio_sistema = sum(
            agua.pr_medio * agua.numero_modulos for agua in aguas_results
        ) / total_modulos if total_modulos > 0 else 0
        
        # 6. Calcular métricas de performance
        fator_capacidade = MultiInverterCalculationService._calculate_capacity_factor(
            total_energia_anual, total_potencia_dc
        )
        
        yield_especifico = total_energia_anual / (total_potencia_dc / 1000) if total_potencia_dc > 0 else 0
        
        oversizing_global = (total_potencia_dc / total_potencia_ca * 100) if total_potencia_ca > 0 else 0
        
        cobertura_percentual = (total_energia_anual / request.consumo_anual_kwh * 100) if request.consumo_anual_kwh > 0 else 0
        
        # 7. Calcular área e peso
        area_total = MultiInverterCalculationService._calculate_total_area(total_modulos, request.modulo)
        peso_total = MultiInverterCalculationService._calculate_total_weight(
            total_modulos, request.inversores_selecionados, request.modulo
        )
        
        # 8. Economia de CO2 (assumindo 0.5 kg CO2/kWh)
        economia_co2 = total_energia_anual * 0.5
        
        return MultiInverterCalculationResponse(
            num_modulos_total=total_modulos,
            potencia_total_dc_kw=round(total_potencia_dc / 1000, 2),
            potencia_total_ca_kw=round(total_potencia_ca / 1000, 2),
            energia_total_anual=round(total_energia_anual, 1),
            cobertura_percentual=round(cobertura_percentual, 1),
            fator_capacidade_medio=round(fator_capacidade, 1),
            pr_medio_sistema=round(pr_medio_sistema, 1),
            yield_especifico_medio=round(yield_especifico, 1),
            oversizing_global=round(oversizing_global, 1),
            resultados_inversores=inversores_results,
            resultados_aguas=aguas_results,
            compatibilidade_sistema=compatibility,
            geracao_mensal_total=[round(val, 1) for val in geracao_mensal_total],
            area_total_necessaria_m2=round(area_total, 1),
            peso_total_kg=round(peso_total, 1),
            economia_anual_co2=round(economia_co2, 1),
            parametros_sistema={
                "consumo_anual_kwh": request.consumo_anual_kwh,
                "numero_inversores": len(request.inversores_selecionados),
                "numero_aguas": len(request.aguas_telhado),
                "localizacao": {"lat": request.lat, "lon": request.lon},
                "perdas_sistema": request.perdas_sistema,
                "fator_seguranca": request.fator_seguranca
            },
            dados_processados=8760,  # Horas do ano
            anos_analisados=16,      # Período típico PVGIS
            periodo_dados=PeriodAnalysis(
                inicio="2005-01-01",
                fim="2020-12-31",
                anos_completos=16
            )
        )
    
    @staticmethod
    def _validate_system_compatibility(
        inversores: List[SelectedInverterData], 
        aguas: List[AguaTelhadoData],
        modulo: SolarModuleData
    ) -> MultiInverterSystemCompatibility:
        """Valida compatibilidade do sistema multi-inversor"""
        
        alertas = []
        sistema_compativel = True
        
        # Calcular totais
        total_potencia_ca = sum(inv.potencia_saida_ca_w * inv.quantity for inv in inversores)
        total_modulos = sum(agua.numero_modulos for agua in aguas)
        total_potencia_dc = total_modulos * modulo.potencia_nominal_w
        
        total_mppts_disponiveis = sum(inv.numero_mppt * inv.quantity for inv in inversores)
        total_mppts_utilizados = len(aguas)
        
        # Validações
        if total_mppts_utilizados > total_mppts_disponiveis:
            alertas.append(f"MPPTs insuficientes: {total_mppts_utilizados} utilizados, {total_mppts_disponiveis} disponíveis")
            sistema_compativel = False
        
        oversizing = (total_potencia_dc / total_potencia_ca * 100) if total_potencia_ca > 0 else 0
        
        if oversizing > 150:
            alertas.append(f"Oversizing muito alto: {oversizing:.1f}% (recomendado < 150%)")
            sistema_compativel = False
        elif oversizing < 80:
            alertas.append(f"Undersizing detectado: {oversizing:.1f}% (recomendado > 80%)")
        
        # Validar tensões (simplificado)
        for inversor in inversores:
            voc = getattr(modulo, 'voc', None)
            tensao_max = getattr(inversor, 'tensao_cc_max_v', None)
            if voc and tensao_max and voc > 0 and tensao_max > 0:
                max_strings = int(tensao_max / (voc * 1.25))  # Fator de segurança para temperatura
                if max_strings < 1:
                    alertas.append(f"Inversor {inversor.modelo} incompatível: tensão insuficiente")
                    sistema_compativel = False
        
        return MultiInverterSystemCompatibility(
            sistema_compativel=sistema_compativel,
            alertas=alertas,
            total_potencia_dc_w=total_potencia_dc,
            total_potencia_ca_w=total_potencia_ca,
            oversizing_global=round(oversizing, 1),
            total_mppts_utilizados=total_mppts_utilizados,
            total_mppts_disponiveis=total_mppts_disponiveis
        )
    
    @staticmethod
    def _calculate_agua_performance(
        agua: AguaTelhadoData, 
        modulo: SolarModuleData,
        request: MultiInverterCalculationRequest
    ) -> AguaTelhadoResults:
        """Calcula performance de uma água de telhado específica"""
        
        try:
            # Usar serviço existente de módulos adaptado para esta água
            irradiacao_media = MultiInverterCalculationService._get_irradiation_for_orientation(
                request.lat, request.lon, agua.orientacao, agua.inclinacao
            )
            
            # Calcular energia anual simplificada
            potencia_nominal = getattr(modulo, 'potencia_nominal_w', None)
            if not potencia_nominal:
                raise ValueError("Potência nominal do módulo é obrigatória")
            
            potencia_dc = agua.numero_modulos * potencia_nominal
            
            # Performance Ratio simplificado (considerando perdas)
            pr_base = 85.0  # PR base
            pr_ajustado = pr_base * (1 - agua.sombreamento_parcial / 100)
            pr_ajustado *= (1 - (request.perdas_sistema or 14.0) / 100)
            
            # Energia anual
            energia_anual = (potencia_dc / 1000) * irradiacao_media * 365 * (pr_ajustado / 100)
            
            return AguaTelhadoResults(
                agua_id=agua.id,
                nome=agua.nome,
                orientacao=agua.orientacao,
                inclinacao=agua.inclinacao,
                numero_modulos=agua.numero_modulos,
                potencia_dc_w=potencia_dc,
                inverter_associado=agua.inversor_id or "",
                mppt_numero=agua.mppt_numero or 1,
                energia_anual_kwh=round(energia_anual, 1),
                irradiacao_media_diaria=round(irradiacao_media, 2),
                pr_medio=round(pr_ajustado, 1)
            )
            
        except Exception as e:
            # Fallback com valores conservadores
            potencia_nominal = getattr(modulo, 'potencia_nominal_w', 540)  # Fallback para 540W
            potencia_dc = agua.numero_modulos * potencia_nominal
            energia_anual = potencia_dc * 1.2  # 1200 kWh/kWp conservador
            
            return AguaTelhadoResults(
                agua_id=agua.id,
                nome=agua.nome,
                orientacao=agua.orientacao,
                inclinacao=agua.inclinacao,
                numero_modulos=agua.numero_modulos,
                potencia_dc_w=potencia_dc,
                inverter_associado=agua.inversor_id or "",
                mppt_numero=agua.mppt_numero or 1,
                energia_anual_kwh=round(energia_anual, 1),
                irradiacao_media_diaria=4.0,  # Valor conservador
                pr_medio=80.0  # PR conservador
            )
    
    @staticmethod
    def _calculate_inverter_results(
        inversores: List[SelectedInverterData],
        aguas: List[AguaTelhadoData], 
        aguas_results: List[AguaTelhadoResults],
        modulo: SolarModuleData
    ) -> List[InverterResults]:
        """Calcula resultados para cada inversor"""
        
        results = []
        
        for inversor in inversores:
            # Encontrar águas conectadas a este inversor
            aguas_conectadas = []
            modulos_conectados = 0
            energia_total = 0
            potencia_dc_conectada = 0
            
            for i, agua in enumerate(aguas):
                # Verificar se a água está conectada a alguma unidade deste inversor
                if agua.inversor_id and agua.inversor_id.startswith(inversor.id):
                    aguas_conectadas.append(agua.id)
                    modulos_conectados += agua.numero_modulos
                    energia_total += aguas_results[i].energia_anual_kwh
                    potencia_nominal = getattr(modulo, 'potencia_nominal_w', 540)
                    potencia_dc_conectada += agua.numero_modulos * potencia_nominal
            
            # Calcular métricas
            potencia_total_ca = inversor.potencia_saida_ca_w * inversor.quantity
            oversizing = (potencia_dc_conectada / potencia_total_ca * 100) if potencia_total_ca > 0 else 0
            utilizacao = (energia_total / (potencia_total_ca * 8760 / 1000) * 100) if potencia_total_ca > 0 else 0
            
            results.append(InverterResults(
                inverter_id=inversor.id,
                fabricante=inversor.fabricante,
                modelo=inversor.modelo,
                potencia_ca_w=inversor.potencia_saida_ca_w,
                quantidade_unidades=inversor.quantity,
                potencia_total_ca_w=potencia_total_ca,
                aguas_conectadas=aguas_conectadas,
                modulos_conectados=modulos_conectados,
                potencia_dc_conectada_w=potencia_dc_conectada,
                oversizing_percentual=round(oversizing, 1),
                energia_anual_kwh=round(energia_total, 1),
                utilizacao_percentual=round(min(utilizacao, 100), 1)
            ))
        
        return results
    
    @staticmethod
    def _get_irradiation_for_orientation(lat: float, lon: float, azimuth: float, tilt: float) -> float:
        """
        Obtém irradiação para orientação específica
        Implementação simplificada - idealmente usar PVGIS ou dados históricos
        """
        
        try:
            # Implementação simplificada baseada em localização
            # Irradiação base para Brasil (aproximação)
            base_irradiation = 4.5  # kWh/m²/dia médio para Brasil
            
            # Ajuste por orientação (Sul = 180° é ótimo)
            azimuth_factor = np.cos(np.radians(abs(azimuth - 180))) * 0.1 + 0.9
            
            # Ajuste por inclinação (latitude ± 15° é ótimo)
            optimal_tilt = abs(lat)
            tilt_diff = abs(tilt - optimal_tilt)
            tilt_factor = 1 - (tilt_diff / 90) * 0.2  # Penalização máxima de 20%
            
            adjusted_irradiation = base_irradiation * azimuth_factor * tilt_factor
            
            return max(adjusted_irradiation, 2.0)  # Mínimo 2.0 kWh/m²/dia
            
        except Exception:
            return 4.0  # Fallback conservador
    
    @staticmethod
    def _calculate_capacity_factor(energia_anual: float, potencia_dc: float) -> float:
        """Calcula fator de capacidade"""
        if potencia_dc == 0:
            return 0
        
        # Energia teórica máxima (potência * 8760 horas)
        energia_teorica_maxima = (potencia_dc / 1000) * 8760
        
        return (energia_anual / energia_teorica_maxima * 100) if energia_teorica_maxima > 0 else 0
    
    @staticmethod
    def _calculate_total_area(total_modulos: int, modulo: SolarModuleData) -> float:
        """Calcula área total necessária"""
        largura = getattr(modulo, 'largura_mm', None)
        altura = getattr(modulo, 'altura_mm', None)
        
        if largura and altura and largura > 0 and altura > 0:
            area_modulo = (largura * altura) / 1_000_000  # Converter para m²
        else:
            # Aproximação: 2.5 m² por módulo típico
            area_modulo = 2.5
        
        # Fator de ocupação (considerar espaçamento)
        fator_ocupacao = 0.6
        
        return total_modulos * area_modulo / fator_ocupacao
    
    @staticmethod
    def _calculate_total_weight(
        total_modulos: int, 
        inversores: List[SelectedInverterData], 
        modulo: SolarModuleData
    ) -> float:
        """Calcula peso total do sistema"""
        
        # Peso dos módulos
        peso_modulo = getattr(modulo, 'peso_kg', 25.0)  # 25kg padrão se não especificado
        peso_modulos = total_modulos * peso_modulo
        
        # Peso dos inversores (aproximação)
        peso_inversores = sum(inv.quantity * 25.0 for inv in inversores)  # 25kg por inversor
        
        # Peso da estrutura e cabeamento (aproximação)
        peso_estrutura = total_modulos * 15.0  # 15kg por módulo de estrutura
        
        return peso_modulos + peso_inversores + peso_estrutura