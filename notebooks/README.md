# Notebooks de Validação - PVLIB Service

Este diretório contém notebooks Jupyter para testar e validar todos os cálculos do **pvlib-service**, desde a obtenção de dados PVGIS até análises financeiras avançadas.

## 📚 Notebooks Disponíveis

### **00_setup_environment.ipynb** 
🏗️ **Setup e Configuração**
- Instalação de dependências (PVLIB, pandas, matplotlib, etc.)
- Verificação do ambiente
- Teste de conectividade com PVGIS
- Configurações globais

**Execute PRIMEIRO!**

### **01_pvgis_data_analysis.ipynb**
🌐 **Análise de Dados PVGIS**
- Busca de dados meteorológicos do PVGIS
- Processamento de dados horários
- Cálculo de médias mensais
- Visualizações de irradiação solar
- Validação das funções `PvgisService`

### **02_module_calculations.ipynb**
⚡ **Cálculos de Módulos Fotovoltaicos**
- Dimensionamento de sistemas PV
- Simulação com PVLIB ModelChain
- Cálculo de geração energética
- Análise de performance
- Validação das funções `ModuleService`

### **03_financial_analysis.ipynb**
💰 **Análise Financeira Avançada**
- Cálculo de VPL, TIR, Payback
- Fluxo de caixa detalhado (25 anos)
- Análise de sensibilidade
- Análise de cenários
- Validação das funções `FinancialCalculationService`

## 🚀 Como Usar

### **1. Preparar Ambiente**
```bash
cd notebooks/
jupyter notebook 00_setup_environment.ipynb
```

### **2. Executar Sequência**
1. **Setup**: `00_setup_environment.ipynb`
2. **PVGIS**: `01_pvgis_data_analysis.ipynb`
3. **Módulos**: `02_module_calculations.ipynb`
4. **Financeiro**: `03_financial_analysis.ipynb`

### **3. Personalizar Dados**
Em cada notebook, edite as variáveis na seção **"Dados de Entrada"**:

```python
# Exemplo - PVGIS
LATITUDE = -23.5505  # São Paulo
LONGITUDE = -46.6333
TILT = 23
AZIMUTH = 0

# Exemplo - Módulos  
CONSUMO_ANUAL_KWH = 6000
MODULO = {
    'fabricante': 'Canadian Solar',
    'potencia_nominal_w': 540,
    # ...
}

# Exemplo - Financeiro
CUSTO_POR_KWP = 4500  # R$/kWp
TARIFA_ENERGIA = 0.85  # R$/kWh
TAXA_DESCONTO = 8.0    # %
```

## 📊 Saídas dos Notebooks

### **Dados Salvos** (`/data/`)
- `pvgis_hourly_data.csv` - Dados horários PVGIS
- `pvgis_monthly_data.json` - Médias mensais
- `module_calculation_results.json` - Resultados do dimensionamento
- `financial_analysis_results.json` - Análise financeira completa
- `cash_flow_analysis.csv` - Fluxo de caixa detalhado

### **Relatórios** (`/reports/`)
- `relatorio_financeiro.txt` - Resumo executivo
- Gráficos e visualizações

### **Visualizações Geradas**
- 📈 Irradiação solar mensal
- ⚡ Geração vs consumo
- 💰 Fluxo de caixa acumulado
- 📊 Análise de sensibilidade
- 🎭 Comparação de cenários

## 🔍 Validação dos Cálculos

### **PVGIS Service**
✅ Busca de dados meteorológicos  
✅ Processamento de séries temporais  
✅ Cálculo de médias mensais  
✅ Tratamento de dados inválidos  

### **Module Service**
✅ Dimensionamento automático  
✅ Simulação PVLIB ModelChain  
✅ Aplicação de perdas do sistema  
✅ Cálculo de métricas (yield, PR, CF)  

### **Financial Service**
✅ VPL, TIR, Payback  
✅ Fluxo de caixa com inflação  
✅ Degradação de módulos  
✅ Análise de sensibilidade  
✅ Cenários múltiplos  

## 🛠️ Dependências

### **Python Packages**
- `pvlib >= 0.10.3` - Modelagem fotovoltaica
- `pandas` - Manipulação de dados
- `numpy` - Computação numérica  
- `matplotlib` - Gráficos
- `seaborn` - Visualizações estatísticas
- `requests` - API calls PVGIS
- `jupyter` - Ambiente notebook

### **APIs Externas**
- **PVGIS** - Dados meteorológicos europeus
- **PVLIB Database** - Parâmetros de módulos/inversores

## 🎯 Casos de Uso

### **1. Validação de Algoritmos**
- Testar mudanças nos cálculos
- Comparar resultados com referências
- Debug de problemas específicos

### **2. Análise de Sensibilidade**
- Impacto de diferentes parâmetros
- Cenários otimista/pessimista
- Validação de premissas

### **3. Benchmarking**
- Comparar com outros softwares
- Validar contra casos conhecidos
- Teste de performance

### **4. Desenvolvimento**
- Prototipar novas funcionalidades
- Testar integrações
- Documentar comportamentos

## 📋 Checklist de Validação

Antes de usar os cálculos em produção:

- [ ] **PVGIS**: Dados meteorológicos corretos
- [ ] **Módulos**: Geração compatível com fabricante  
- [ ] **Performance**: Yield específico realista
- [ ] **Financial**: VPL coerente com mercado
- [ ] **Sensibilidade**: Variações dentro do esperado
- [ ] **Cenários**: Resultados plausíveis

## 🤝 Contribuindo

Para adicionar novos testes:

1. Crie um novo notebook seguindo o padrão
2. Use as funções existentes como base
3. Documente os casos de teste
4. Inclua visualizações relevantes
5. Salve dados para próximos notebooks

## 📞 Suporte

Para dúvidas sobre os notebooks:
- Consulte a documentação do PVLIB
- Verifique os comentários no código
- Compare com resultados conhecidos

---

**🎯 Objetivo**: Garantir que todos os cálculos do pvlib-service sejam precisos, confiáveis e validados contra referências reconhecidas.