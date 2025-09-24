# Compatibilidade de String - Sistema Fotovoltaico

## Visão Geral

O sistema de **compatibilidade de string** no BessPro analisa se a configuração de módulos fotovoltaicos é compatível com o inversor selecionado, calculando automaticamente a melhor distribuição de strings e verificando limitações técnicas.

## Como Funciona

### 1. **Verificação de Tensão**
```python
if modulo.vmpp and inversor.tensao_cc_max_v:
    compatibilidade_tensao = modulo.vmpp <= inversor.tensao_cc_max_v
```

**Análise:** Verifica se a tensão do módulo no ponto de máxima potência (Vmpp) não excede a tensão DC máxima suportada pelo inversor.

**Exemplo:**
- Módulo: 41.8V (Vmpp)
- Inversor: 600V (tensão máxima)
- ✅ **Compatível** (41.8V ≤ 600V)

### 2. **Cálculo de Strings Recomendadas**
```python
strings_recomendadas = 1
modulos_por_string = num_modules

if inversor.numero_mppt and inversor.strings_por_mppt:
    max_strings = inversor.numero_mppt * inversor.strings_por_mppt
    if num_modules > max_strings:
        strings_recomendadas = min(max_strings, num_modules)
        modulos_por_string = int(np.ceil(num_modules / strings_recomendadas))
```

**Lógica:**
- Calcula o número máximo de strings que o inversor suporta
- Se o número de módulos excede essa capacidade, distribui os módulos entre as strings disponíveis
- Arredonda para cima para garantir que todos os módulos sejam incluídos

**Exemplo:**
- 13 módulos total
- Inversor: 2 MPPTs × 2 strings/MPPT = 4 strings máximo
- Resultado: 4 strings com 4 módulos cada (último com 1 módulo)

### 3. **Utilização Real do Inversor (com Oversizing)**
```python
# Potência nominal dos módulos
potencia_nominal_modulos_kw = (num_modules * modulo.potencia_nominal_w) / 1000

# Potência real considerando perdas típicas (fator 0.8)
potencia_real_modulos_kw = potencia_nominal_modulos_kw * 0.8

# Utilização baseada na potência real
utilizacao_inversor = (potencia_real_modulos_kw / potencia_inversor_kw) * 100
```

**Perdas Consideradas:**
- 🌡️ **Temperatura** (10-15%): Módulos operam acima dos 25°C STC
- 🌫️ **Sombreamento** (2-5%): Sombras parciais durante o dia  
- ⚡ **Mismatch** (2-3%): Diferenças entre módulos
- 🧹 **Sujeira** (3-5%): Acúmulo de poeira
- 🔌 **Cabeamento CC** (2-3%): Resistência dos cabos
- 🔄 **Inversor** (2-4%): Eficiência típica 96-98%

**Total das perdas:** ~20% (por isso o fator 0.8)

### 4. **Oversizing Percentual**
```python
oversizing_percentual = (potencia_nominal_modulos_kw / potencia_inversor_kw) * 100
```

**Finalidade:** Mostra o ratio entre potência DC nominal e capacidade do inversor.

**Oversizing Recomendado:** 110-125% para compensar perdas naturais.

## Exemplo Prático

**Configuração:**
- **Módulos:** 13 × Canadian Solar 540W = 7.02 kWp
- **Inversor:** WEG 5000W (2 MPPTs, 2 strings/MPPT)

**Resultados:**
```json
{
  "compatibilidade_tensao": true,
  "strings_recomendadas": 4,
  "modulos_por_string": 4,
  "utilizacao_inversor": 112.3,    // Potência real com perdas
  "oversizing_percentual": 140.4,  // Potência nominal vs inversor
  "margem_seguranca": 0.0          // 100% - utilização
}
```

**Interpretação:**
- ✅ **Tensão compatível** com o inversor
- 📊 **4 strings** distribuídas nos 2 MPPTs (2 strings por MPPT)
- ⚡ **112.3% utilização real** (considerando perdas de 20%)
- 📈 **140.4% oversizing nominal** (adequado para sistemas fotovoltaicos)
- ⚠️ **0% margem** (sistema bem dimensionado no limite)

## Onde Visualizar

No frontend, estas informações aparecem na seção **"Compatibilidade do Sistema"** com:
- Indicador visual de compatibilidade de tensão
- Número de strings recomendadas
- Utilização real do inversor
- Percentual de oversizing
- Dica educativa sobre oversizing recomendado

---

**Arquivo:** `apps/pvlib-service/services/module_service.py:284-332`  
**Interface:** `apps/frontend/src/components/pv-design/form-sections/SystemSummary.tsx`