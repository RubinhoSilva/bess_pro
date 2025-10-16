"""
Utilitários para manipulação de dados mensais

Funções para conversão, validação e operações com dados mensais
de consumo e geração de energia.
"""

from typing import Dict, List, Union
import logging

logger = logging.getLogger(__name__)

# Ordem padrão dos meses para conversões
MONTH_ORDER = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

# Nomes completos dos meses para validação
MONTH_NAMES = {
    'jan': 'janeiro',
    'fev': 'fevereiro', 
    'mar': 'março',
    'abr': 'abril',
    'mai': 'maio',
    'jun': 'junho',
    'jul': 'julho',
    'ago': 'agosto',
    'set': 'setembro',
    'out': 'outubro',
    'nov': 'novembro',
    'dez': 'dezembro'
}


def monthly_data_to_array(data: Dict[str, Union[float, int]]) -> List[float]:
    """
    Converte dicionário MonthlyData para array de 12 valores
    
    Args:
        data: Dicionário com dados mensais (chaves: jan, fev, mar, ..., dez)
        
    Returns:
        Lista de 12 valores float na ordem cronológica (janeiro a dezembro)
        
    Raises:
        ValueError: Se o dicionário não contiver todos os meses obrigatórios
                    ou se algum valor não for numérico
        
    Example:
        >>> data = {'jan': 100, 'fev': 95, 'mar': 110, 'abr': 105,
        ...         'mai': 90, 'jun': 85, 'jul': 88, 'ago': 95,
        ...         'set': 102, 'out': 108, 'nov': 98, 'dez': 92}
        >>> monthly_data_to_array(data)
        [100.0, 95.0, 110.0, 105.0, 90.0, 85.0, 88.0, 95.0, 102.0, 108.0, 98.0, 92.0]
    """
    if not isinstance(data, dict):
        raise ValueError("Dados devem ser um dicionário")
    
    # Verificar se todos os meses obrigatórios estão presentes
    missing_months = set(MONTH_ORDER) - set(data.keys())
    if missing_months:
        raise ValueError(f"Meses obrigatórios ausentes: {', '.join(missing_months)}")
    
    # Verificar se todos os valores são numéricos
    array = []
    for month in MONTH_ORDER:
        value = data[month]
        if not isinstance(value, (int, float)):
            raise ValueError(f"Valor para {month} ({MONTH_NAMES[month]}) deve ser numérico, recebido: {type(value)}")
        
        # Converter para float e validar que não é negativo
        float_value = float(value)
        if float_value < 0:
            raise ValueError(f"Valor para {month} ({MONTH_NAMES[month]}) não pode ser negativo: {float_value}")
        
        array.append(float_value)
    
    return array


def array_to_monthly_data(arr: List[Union[float, int]]) -> Dict[str, float]:
    """
    Converte array de 12 valores para dicionário MonthlyData
    
    Args:
        arr: Lista com exatamente 12 valores numéricos
        
    Returns:
        Dicionário com chaves dos meses (jan, fev, mar, ..., dez)
        
    Raises:
        ValueError: Se o array não tiver exatamente 12 elementos
                    ou se algum valor não for numérico
        
    Example:
        >>> arr = [100, 95, 110, 105, 90, 85, 88, 95, 102, 108, 98, 92]
        >>> array_to_monthly_data(arr)
        {'jan': 100.0, 'fev': 95.0, 'mar': 110.0, 'abr': 105.0,
         'mai': 90.0, 'jun': 85.0, 'jul': 88.0, 'ago': 95.0,
         'set': 102.0, 'out': 108.0, 'nov': 98.0, 'dez': 92.0}
    """
    if not isinstance(arr, (list, tuple)):
        raise ValueError("Dados devem ser uma lista ou tupla")
    
    if len(arr) != 12:
        raise ValueError(f"Array deve ter exatamente 12 elementos, recebido: {len(arr)}")
    
    # Validar e converter valores
    monthly_data = {}
    for i, (month, value) in enumerate(zip(MONTH_ORDER, arr)):
        if not isinstance(value, (int, float)):
            raise ValueError(f"Valor na posição {i} ({month}) deve ser numérico, recebido: {type(value)}")
        
        float_value = float(value)
        if float_value < 0:
            raise ValueError(f"Valor para {month} ({MONTH_NAMES[month]}) não pode ser negativo: {float_value}")
        
        monthly_data[month] = float_value
    
    return monthly_data


def validate_monthly_data(data: Dict[str, Union[float, int]]) -> bool:
    """
    Valida estrutura de dados mensais
    
    Args:
        data: Dicionário com dados mensais para validação
        
    Returns:
        True se os dados são válidos, False caso contrário
        
    Example:
        >>> data = {'jan': 100, 'fev': 95, 'mar': 110, 'abr': 105,
        ...         'mai': 90, 'jun': 85, 'jul': 88, 'ago': 95,
        ...         'set': 102, 'out': 108, 'nov': 98, 'dez': 92}
        >>> validate_monthly_data(data)
        True
    """
    try:
        # Tenta converter para array, que faz todas as validações necessárias
        monthly_data_to_array(data)
        return True
    except (ValueError, TypeError) as e:
        logger.warning(f"Validação de dados mensais falhou: {e}")
        return False


def sum_monthly_data(data: Dict[str, Union[float, int]]) -> float:
    """
    Soma todos os valores mensais para obter total anual
    
    Args:
        data: Dicionário com dados mensais
        
    Returns:
        Soma anual de todos os meses
        
    Raises:
        ValueError: Se os dados forem inválidos
        
    Example:
        >>> data = {'jan': 100, 'fev': 95, 'mar': 110, 'abr': 105,
        ...         'mai': 90, 'jun': 85, 'jul': 88, 'ago': 95,
        ...         'set': 102, 'out': 108, 'nov': 98, 'dez': 92}
        >>> sum_monthly_data(data)
        1168.0
    """
    try:
        array = monthly_data_to_array(data)
        return sum(array)
    except ValueError as e:
        raise ValueError(f"Não foi possível somar dados mensais: {e}")


def get_monthly_average(data: Dict[str, Union[float, int]]) -> float:
    """
    Calcula média mensal dos dados
    
    Args:
        data: Dicionário com dados mensais
        
    Returns:
        Média mensal dos valores
        
    Raises:
        ValueError: Se os dados forem inválidos
        
    Example:
        >>> data = {'jan': 100, 'fev': 95, 'mar': 110, 'abr': 105,
        ...         'mai': 90, 'jun': 85, 'jul': 88, 'ago': 95,
        ...         'set': 102, 'out': 108, 'nov': 98, 'dez': 92}
        >>> get_monthly_average(data)
        97.33333333333333
    """
    try:
        total = sum_monthly_data(data)
        return total / 12.0
    except ValueError as e:
        raise ValueError(f"Não foi possível calcular média mensal: {e}")


def get_max_month(data: Dict[str, Union[float, int]]) -> tuple:
    """
    Retorna o mês e valor máximo
    
    Args:
        data: Dicionário com dados mensais
        
    Returns:
        Tupla (mês, valor) do mês com maior valor
        
    Raises:
        ValueError: Se os dados forem inválidos
        
    Example:
        >>> data = {'jan': 100, 'fev': 95, 'mar': 110, 'abr': 105,
        ...         'mai': 90, 'jun': 85, 'jul': 88, 'ago': 95,
        ...         'set': 102, 'out': 108, 'nov': 98, 'dez': 92}
        >>> get_max_month(data)
        ('mar', 110.0)
    """
    try:
        array = monthly_data_to_array(data)
        max_value = max(array)
        max_index = array.index(max_value)
        max_month = MONTH_ORDER[max_index]
        return max_month, max_value
    except ValueError as e:
        raise ValueError(f"Não foi possível encontrar mês máximo: {e}")


def get_min_month(data: Dict[str, Union[float, int]]) -> tuple:
    """
    Retorna o mês e valor mínimo
    
    Args:
        data: Dicionário com dados mensais
        
    Returns:
        Tupla (mês, valor) do mês com menor valor
        
    Raises:
        ValueError: Se os dados forem inválidos
        
    Example:
        >>> data = {'jan': 100, 'fev': 95, 'mar': 110, 'abr': 105,
        ...         'mai': 90, 'jun': 85, 'jul': 88, 'ago': 95,
        ...         'set': 102, 'out': 108, 'nov': 98, 'dez': 92}
        >>> get_min_month(data)
        ('jun', 85.0)
    """
    try:
        array = monthly_data_to_array(data)
        min_value = min(array)
        min_index = array.index(min_value)
        min_month = MONTH_ORDER[min_index]
        return min_month, min_value
    except ValueError as e:
        raise ValueError(f"Não foi possível encontrar mês mínimo: {e}")


def scale_monthly_data(data: Dict[str, Union[float, int]], factor: float) -> Dict[str, float]:
    """
    Multiplica todos os valores mensais por um fator
    
    Args:
        data: Dicionário com dados mensais
        factor: Fator de multiplicação
        
    Returns:
        Novo dicionário com valores escalados
        
    Raises:
        ValueError: Se os dados forem inválidos ou o fator for negativo
        
    Example:
        >>> data = {'jan': 100, 'fev': 95, 'mar': 110}
        >>> scale_monthly_data(data, 1.1)
        {'jan': 110.0, 'fev': 104.5, 'mar': 121.0}
    """
    if factor < 0:
        raise ValueError(f"Fator de escala não pode ser negativo: {factor}")
    
    try:
        array = monthly_data_to_array(data)
        scaled_array = [value * factor for value in array]
        return array_to_monthly_data(scaled_array)
    except ValueError as e:
        raise ValueError(f"Não foi possível escalar dados mensais: {e}")


def add_monthly_data(data1: Dict[str, Union[float, int]], 
                    data2: Dict[str, Union[float, int]]) -> Dict[str, float]:
    """
    Soma dois conjuntos de dados mensais
    
    Args:
        data1: Primeiro conjunto de dados mensais
        data2: Segundo conjunto de dados mensais
        
    Returns:
        Novo dicionário com soma dos valores mês a mês
        
    Raises:
        ValueError: Se os dados forem inválidos
        
    Example:
        >>> data1 = {'jan': 100, 'fev': 95, 'mar': 110}
        >>> data2 = {'jan': 50, 'fev': 45, 'mar': 55}
        >>> add_monthly_data(data1, data2)
        {'jan': 150.0, 'fev': 140.0, 'mar': 165.0}
    """
    try:
        array1 = monthly_data_to_array(data1)
        array2 = monthly_data_to_array(data2)
        summed_array = [a + b for a, b in zip(array1, array2)]
        return array_to_monthly_data(summed_array)
    except ValueError as e:
        raise ValueError(f"Não foi possível somar dados mensais: {e}")


def subtract_monthly_data(data1: Dict[str, Union[float, int]], 
                         data2: Dict[str, Union[float, int]]) -> Dict[str, float]:
    """
    Subtrai dois conjuntos de dados mensais (data1 - data2)
    
    Args:
        data1: Minuendo (dados mensais)
        data2: Subtraendo (dados mensais)
        
    Returns:
        Novo dicionário com diferença dos valores mês a mês
        
    Raises:
        ValueError: Se os dados forem inválidos ou resultado for negativo
        
    Example:
        >>> data1 = {'jan': 100, 'fev': 95, 'mar': 110}
        >>> data2 = {'jan': 50, 'fev': 45, 'mar': 55}
        >>> subtract_monthly_data(data1, data2)
        {'jan': 50.0, 'fev': 50.0, 'mar': 55.0}
    """
    try:
        array1 = monthly_data_to_array(data1)
        array2 = monthly_data_to_array(data2)
        diff_array = [a - b for a, b in zip(array1, array2)]
        
        # Verificar se algum resultado é negativo
        if any(value < 0 for value in diff_array):
            raise ValueError("Resultado da subtração contém valores negativos")
        
        return array_to_monthly_data(diff_array)
    except ValueError as e:
        raise ValueError(f"Não foi possível subtrair dados mensais: {e}")