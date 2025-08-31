# BESS Pro - PVLIB Service

Microserviço Python para cálculos avançados de sistemas fotovoltaicos usando PVLIB.

## 🚀 Funcionalidades

### **Endpoints Disponíveis**

#### **1. Health Check**
```bash
GET /health
```
Retorna status do serviço e versões das bibliotecas.

#### **2. Cálculo de Irradiação Solar**
```bash
POST /irradiation
```

**Payload:**
```json
{
  "latitude": -23.5505,
  "longitude": -46.6333,
  "altitude": 778,
  "timezone": "America/Sao_Paulo"
}
```

**Resposta:**
```json
{
  "monthly_irradiation": [8.84, 8.18, 7.11, ...],
  "annual_irradiation": 2492.72,
  "monthly_ghi": [8.84, 8.18, 7.11, ...],
  "monthly_dni": [10.77, 9.77, 8.72, ...],
  "monthly_dhi": [1.12, 1.20, 1.15, ...],
  "location": {...},
  "optimal_tilt": 23.55,
  "optimal_azimuth": 0.0
}
```

#### **3. Simulação de Sistema FV Completo**
```bash
POST /pv-system
```

**Payload:**
```json
{
  "location": {
    "latitude": -23.5505,
    "longitude": -46.6333,
    "altitude": 778,
    "timezone": "America/Sao_Paulo"
  },
  "surface_tilt": 30,
  "surface_azimuth": 180,
  "module_power": 550,
  "num_modules": 20,
  "inverter_efficiency": 0.96,
  "system_losses": 0.14
}
```

**Resposta:**
```json
{
  "monthly_energy": [2102.42, 1614.73, ...],
  "annual_energy": 15160.69,
  "monthly_performance_ratio": [0.85, 0.85, ...],
  "capacity_factor": 0.157,
  "specific_yield": 1378.24,
  "system_info": {
    "total_capacity_kw": 11.0,
    "module_power_w": 550.0,
    "num_modules": 20,
    "surface_tilt": 30.0,
    "surface_azimuth": 180.0,
    "inverter_efficiency": 0.96,
    "system_losses": 0.14
  }
}
```

## 🛠️ Desenvolvimento

### **Executar Localmente**
```bash
cd apps/pvlib-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8100 --reload
```

### **Executar com Docker**
```bash
docker-compose up -d pvlib-service
```

### **Acessar Documentação**
- **Swagger UI**: http://localhost:8100/docs
- **ReDoc**: http://localhost:8100/redoc

## 📊 **Vantagens sobre PVGIS**

### **1. Maior Precisão**
- **Modelos científicos**: Implementações de papers validados
- **Clear-sky models**: Ineichen-Perez, Haurwitz, etc.
- **Temperatura de célula**: Modelos térmicos avançados
- **Transposição**: Algoritmos Perez, Hay-Davies, Klucher

### **2. Flexibilidade Total**
- **Qualquer localização**: Mundial, não limitado ao Brasil
- **Múltiplas orientações**: Arrays com orientações diferentes
- **Sistemas tracking**: 1-axis, 2-axis, backtracking
- **Módulos bifaciais**: Cálculos de ganho bifacial

### **3. Dados Detalhados**
- **Séries temporais**: Horárias, minutais
- **Performance ratio**: Mensal e anual
- **Capacity factor**: Real baseado em condições climáticas
- **Specific yield**: kWh/kWp/ano preciso

### **4. Análises Avançadas**
- **Sombreamento**: Near/far shading
- **Degradação**: Módulos e inversores
- **Mismatch losses**: Descasamento de módulos
- **Soiling**: Perda por sujeira

## 🔧 **Tecnologias**

- **FastAPI**: Framework web moderno e rápido
- **PVLIB 0.10.3**: Biblioteca de modelagem fotovoltaica
- **Pandas**: Manipulação de dados temporais
- **NumPy**: Cálculos numéricos otimizados
- **SciPy**: Funções científicas avançadas

## 🎯 **Próximas Funcionalidades**

1. **Dados meteorológicos reais**: TMY, NSRDB, ERA5
2. **Análise de sombreamento**: Obstáculos 3D
3. **Otimização**: Orientação e inclinação ótimas
4. **Comparação tecnológica**: Diferentes módulos/inversores
5. **Monte Carlo**: Análise de incertezas
6. **Análise financeira**: LCOE, VPL, Payback

## 📋 **Status**

- ✅ **Serviço básico**: Funcionando
- ✅ **Cálculo irradiação**: Clear-sky models
- ✅ **Simulação FV**: Sistema completo  
- ✅ **API documentada**: Swagger/ReDoc
- ✅ **Containerizado**: Docker pronto
- 🔄 **Em desenvolvimento**: Dados meteorológicos reais