from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
import pvlib
from pvlib import atmosphere, irradiance, pvsystem, modelchain
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="BESS Pro - PVLIB Service",
    description="Microserviço Python para cálculos avançados de sistemas fotovoltaicos usando PVLIB",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure apropriadamente para produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class LocationInput(BaseModel):
    latitude: float
    longitude: float
    altitude: Optional[float] = 0
    timezone: Optional[str] = "America/Sao_Paulo"

class PVSystemInput(BaseModel):
    location: LocationInput
    surface_tilt: Optional[float] = 0  # Inclinação em graus
    surface_azimuth: Optional[float] = 180  # Azimute em graus (180 = Sul)
    module_power: Optional[float] = 550  # Potência do módulo em W
    num_modules: Optional[int] = 1  # Número de módulos
    inverter_efficiency: Optional[float] = 0.96  # Eficiência do inversor
    system_losses: Optional[float] = 0.14  # Perdas do sistema (14%)

class IrradiationResponse(BaseModel):
    monthly_irradiation: List[float]
    annual_irradiation: float
    monthly_ghi: List[float]
    monthly_dni: List[float] 
    monthly_dhi: List[float]
    location: LocationInput
    optimal_tilt: Optional[float]
    optimal_azimuth: Optional[float]

class PVSystemResponse(BaseModel):
    monthly_energy: List[float]  # kWh/mês
    annual_energy: float  # kWh/ano
    monthly_performance_ratio: List[float]
    capacity_factor: float
    specific_yield: float  # kWh/kWp/ano
    system_info: dict

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "BESS Pro PVLIB Service",
        "status": "running",
        "pvlib_version": pvlib.__version__,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "pvlib_version": pvlib.__version__,
        "pandas_version": pd.__version__,
        "numpy_version": np.__version__,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/irradiation", response_model=IrradiationResponse)
async def calculate_irradiation(location: LocationInput):
    """
    Calcula irradiação solar para uma localização usando modelos PVLIB
    """
    try:
        logger.info(f"Calculating irradiation for location: {location.latitude}, {location.longitude}")
        
        # Criar objeto Location do PVLIB
        site = pvlib.location.Location(
            latitude=location.latitude,
            longitude=location.longitude,
            tz=location.timezone,
            altitude=location.altitude
        )
        
        # Gerar dados de clear sky para um ano típico
        times = pd.date_range(
            start='2023-01-01', 
            end='2023-12-31', 
            freq='1H', 
            tz=site.tz
        )
        
        # Calcular irradiação clear sky
        clear_sky = site.get_clearsky(times)
        
        # Calcular médias mensais
        monthly_data = clear_sky.resample('M').mean()
        
        # Converter para kWh/m²/dia
        monthly_ghi = (monthly_data['ghi'] * 24 / 1000).tolist()  # Wh/m²/hora -> kWh/m²/dia
        monthly_dni = (monthly_data['dni'] * 24 / 1000).tolist()
        monthly_dhi = (monthly_data['dhi'] * 24 / 1000).tolist()
        
        # Calcular irradiação total anual
        annual_irradiation = sum(monthly_ghi) * 365 / 12  # Aproximação
        
        # Calcular orientação ótima (simplificado)
        optimal_tilt = abs(location.latitude)
        optimal_azimuth = 180 if location.latitude >= 0 else 0
        
        logger.info(f"Irradiation calculation completed successfully")
        
        return IrradiationResponse(
            monthly_irradiation=monthly_ghi,
            annual_irradiation=annual_irradiation,
            monthly_ghi=monthly_ghi,
            monthly_dni=monthly_dni,
            monthly_dhi=monthly_dhi,
            location=location,
            optimal_tilt=optimal_tilt,
            optimal_azimuth=optimal_azimuth
        )
        
    except Exception as e:
        logger.error(f"Error calculating irradiation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro no cálculo de irradiação: {str(e)}")

def correct_for_horizontal_irradiance(ghi_data, site, surface_tilt, surface_azimuth, times):
    """
    Corrige irradiância horizontal (GHI) para irradiância no plano inclinado (POA)
    usando modelo ERBS para separação e Hay-Davies para transposição
    """
    logger.info("Aplicando correção GHI -> POA para orientação/inclinação zeradas")
    
    # Calcular posição solar
    solar_position = site.get_solarposition(times)
    
    # Usar modelo ERBS para separar GHI em DNI e DHI
    dni_dhi = pvlib.irradiance.erbs(ghi_data, solar_position['zenith'], times)
    
    # Calcular irradiação no plano inclinado usando Hay-Davies
    poa_irradiance = pvlib.irradiance.get_total_irradiance(
        surface_tilt=surface_tilt,
        surface_azimuth=surface_azimuth,
        solar_zenith=solar_position['zenith'],
        solar_azimuth=solar_position['azimuth'],
        dni=dni_dhi['dni'],
        ghi=ghi_data,
        dhi=dni_dhi['dhi'],
        model='haydavies'  # Modelo Hay-Davies para transposição
    )
    
    logger.info("Correção GHI -> POA aplicada com sucesso")
    return poa_irradiance, solar_position

@app.post("/pv-system", response_model=PVSystemResponse)
async def calculate_pv_system(system: PVSystemInput):
    """
    Simula um sistema fotovoltaico completo usando PVLIB com correção GHI->POA
    """
    try:
        logger.info(f"Calculating PV system for location: {system.location.latitude}, {system.location.longitude}")
        logger.info(f"System parameters: tilt={system.surface_tilt}°, azimuth={system.surface_azimuth}°")
        
        # Criar objeto Location do PVLIB
        site = pvlib.location.Location(
            latitude=system.location.latitude,
            longitude=system.location.longitude,
            tz=system.location.timezone,
            altitude=system.location.altitude
        )
        
        # Gerar série temporal para um ano
        times = pd.date_range(
            start='2023-01-01', 
            end='2023-12-31', 
            freq='1H', 
            tz=site.tz
        )
        
        # Obter dados meteorológicos (clear sky como aproximação)
        clear_sky = site.get_clearsky(times)
        
        # Verificar se orientação e inclinação são zeradas (instalação horizontal)
        if system.surface_tilt == 0 and system.surface_azimuth == 0:
            logger.info("Sistema horizontal detectado - aplicando correção GHI->POA")
            # Usar correção para sistemas horizontais
            poa_irradiance, solar_position = correct_for_horizontal_irradiance(
                ghi_data=clear_sky['ghi'],
                site=site,
                surface_tilt=system.surface_tilt,
                surface_azimuth=system.surface_azimuth,
                times=times
            )
        else:
            # Calcular posição solar para sistemas inclinados
            solar_position = site.get_solarposition(times)
            
            # Calcular irradiação no plano inclinado
            poa_irradiance = pvlib.irradiance.get_total_irradiance(
                surface_tilt=system.surface_tilt,
                surface_azimuth=system.surface_azimuth,
                solar_zenith=solar_position['zenith'],
                solar_azimuth=solar_position['azimuth'],
                dni=clear_sky['dni'],
                ghi=clear_sky['ghi'],
                dhi=clear_sky['dhi']
            )
        
        # Modelo simples de temperatura de célula
        cell_temp = pvlib.temperature.faiman(
            poa_global=poa_irradiance['poa_global'],
            temp_air=25,  # Temperatura ambiente constante (simplificação)
            wind_speed=1  # Velocidade do vento constante
        )
        
        # Parâmetros do módulo (genérico)
        module_params = {
            'pdc0': system.module_power,  # Potência nominal
            'gamma_pdc': -0.004,  # Coeficiente de temperatura
        }
        
        # Calcular potência DC
        dc_power = pvlib.pvsystem.pvwatts_dc(
            g_poa_effective=poa_irradiance['poa_global'],
            temp_cell=cell_temp,
            pdc0=module_params['pdc0'] * system.num_modules,
            gamma_pdc=module_params['gamma_pdc']
        )
        
        # Calcular potência AC (com eficiência do inversor)
        ac_power = dc_power * system.inverter_efficiency * (1 - system.system_losses)
        
        # Calcular energia mensal (kWh)
        monthly_energy = (ac_power.resample('M').sum() / 1000).tolist()  # W -> kWh
        annual_energy = sum(monthly_energy)
        
        # Métricas de performance
        total_capacity_kw = (system.module_power * system.num_modules) / 1000
        capacity_factor = annual_energy / (total_capacity_kw * 8760)
        specific_yield = annual_energy / total_capacity_kw
        
        # Performance ratio mensal (simplificado)
        monthly_performance_ratio = [0.85] * 12  # PR constante como aproximação
        
        system_info = {
            "total_capacity_kw": total_capacity_kw,
            "module_power_w": system.module_power,
            "num_modules": system.num_modules,
            "surface_tilt": system.surface_tilt,
            "surface_azimuth": system.surface_azimuth,
            "inverter_efficiency": system.inverter_efficiency,
            "system_losses": system.system_losses
        }
        
        logger.info(f"PV system calculation completed successfully")
        
        return PVSystemResponse(
            monthly_energy=monthly_energy,
            annual_energy=annual_energy,
            monthly_performance_ratio=monthly_performance_ratio,
            capacity_factor=capacity_factor,
            specific_yield=specific_yield,
            system_info=system_info
        )
        
    except Exception as e:
        logger.error(f"Error calculating PV system: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro no cálculo do sistema FV: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8100)