"""
Utilitários de formatação para exibição de dados

Funções para formatação de números, moedas, percentuais e outros valores
seguindo padrões brasileiros.
"""

from typing import Optional, Union
import locale


def format_currency(value: Union[float, int]) -> str:
    """
    Formata número como moeda brasileira
    
    Args:
        value: Valor numérico para formatar
        
    Returns:
        String formatada como moeda brasileira (R$ 123.456,78)
        
    Examples:
        >>> format_currency(123456.78)
        'R$ 123.456,78'
        >>> format_currency(-123.45)
        '-R$ 123,45'
        >>> format_currency(0)
        'R$ 0,00'
    """
    if value is None:
        return "R$ 0,00"
    
    # Converter para float
    try:
        float_value = float(value)
    except (ValueError, TypeError):
        return "R$ 0,00"
    
    # Formatação manual para garantir consistência
    abs_value = abs(float_value)
    
    # Separar parte inteira e decimal
    integer_part = int(abs_value)
    decimal_part = round((abs_value - integer_part) * 100)
    
    # Ajustar caso arredondamento cause overflow
    if decimal_part >= 100:
        integer_part += 1
        decimal_part -= 100
    
    # Formatar parte inteira com separadores de milhar
    integer_str = f"{integer_part:,}".replace(",", ".")
    
    # Formatar parte decimal com 2 dígitos
    decimal_str = f"{decimal_part:02d}"
    
    # Montar string final
    formatted = f"R$ {integer_str},{decimal_str}"
    
    # Adicionar sinal negativo se necessário
    if float_value < 0:
        formatted = f"-{formatted}"
    
    return formatted


def format_percentage(value: Optional[Union[float, int]]) -> str:
    """
    Formata número como percentual
    
    Args:
        value: Valor numérico (0.15 para 15%) ou None
        
    Returns:
        String formatada como percentual (15,50%) ou "N/A" se None
        
    Examples:
        >>> format_percentage(0.1550)
        '15,50%'
        >>> format_percentage(15.5)
        '15,50%'
        >>> format_percentage(None)
        'N/A'
        >>> format_percentage(-0.05)
        '-5,00%'
    """
    if value is None:
        return "N/A"
    
    try:
        float_value = float(value)
    except (ValueError, TypeError):
        return "N/A"
    
    # Converter para percentual (multiplicar por 100 se for decimal)
    if abs(float_value) < 1:
        percentage_value = float_value * 100
    else:
        percentage_value = float_value
    
    # Formatar com 2 casas decimais
    abs_value = abs(percentage_value)
    integer_part = int(abs_value)
    decimal_part = round((abs_value - integer_part) * 100)
    
    if decimal_part >= 100:
        integer_part += 1
        decimal_part -= 100
    
    # Formatar parte inteira com separadores de milhar
    integer_str = f"{integer_part:,}".replace(",", ".")
    decimal_str = f"{decimal_part:02d}"
    
    formatted = f"{integer_str},{decimal_str}%"
    
    # Adicionar sinal negativo se necessário
    if percentage_value < 0:
        formatted = f"-{formatted}"
    
    return formatted


def format_number(value: Union[float, int], unit: str = "", decimal_places: int = 2) -> str:
    """
    Formata número com separadores brasileiros
    
    Args:
        value: Valor numérico para formatar
        unit: Unidade de medida (opcional)
        decimal_places: Número de casas decimais (padrão: 2)
        
    Returns:
        String formatada (12.345,67 kWh)
        
    Examples:
        >>> format_number(12345.67, "kWh")
        '12.345,67 kWh'
        >>> format_number(1234.5)
        '1.234,50'
        >>> format_number(1000000, "MW", 1)
        '1.000.000,0 MW'
    """
    if value is None:
        return f"0{',' + '0'*decimal_places if decimal_places > 0 else ''} {unit}".strip()
    
    try:
        float_value = float(value)
    except (ValueError, TypeError):
        return f"0{',' + '0'*decimal_places if decimal_places > 0 else ''} {unit}".strip()
    
    # Arredondar para o número de casas decimais desejado
    multiplier = 10 ** decimal_places
    rounded_value = round(float_value * multiplier) / multiplier
    
    # Separar parte inteira e decimal
    integer_part = int(abs(rounded_value))
    decimal_part = round((abs(rounded_value) - integer_part) * multiplier)
    
    if decimal_part >= multiplier:
        integer_part += 1
        decimal_part -= multiplier
    
    # Formatar parte inteira com separadores de milhar
    integer_str = f"{integer_part:,}".replace(",", ".")
    
    # Formatar parte decimal
    if decimal_places > 0:
        decimal_str = f"{decimal_part:0{decimal_places}d}"
        formatted = f"{integer_str},{decimal_str}"
    else:
        formatted = integer_str
    
    # Adicionar sinal negativo se necessário
    if float_value < 0:
        formatted = f"-{formatted}"
    
    # Adicionar unidade se fornecida
    if unit:
        formatted = f"{formatted} {unit}"
    
    return formatted


def format_years(value: Optional[Union[float, int]]) -> str:
    """
    Formata anos com 2 casas decimais
    
    Args:
        value: Valor em anos ou None
        
    Returns:
        String formatada (5,23 anos) ou "N/A" se None
        
    Examples:
        >>> format_years(5.234)
        '5,23 anos'
        >>> format_years(10)
        '10,00 anos'
        >>> format_years(None)
        'N/A'
        >>> format_years(1.5)
        '1,50 anos'
    """
    if value is None:
        return "N/A"
    
    try:
        float_value = float(value)
    except (ValueError, TypeError):
        return "N/A"
    
    if float_value < 0:
        return "N/A"
    
    return format_number(float_value, "anos", 2)


def format_energy(value: Union[float, int], unit: str = "kWh") -> str:
    """
    Formata valores de energia
    
    Args:
        value: Valor de energia
        unit: Unidade de energia (padrão: kWh)
        
    Returns:
        String formatada com unidade de energia
        
    Examples:
        >>> format_energy(1234.56)
        '1.234,56 kWh'
        >>> format_energy(5000, "MWh")
        '5.000,00 MWh'
    """
    return format_number(value, unit, 2)


def format_power(value: Union[float, int], unit: str = "kW") -> str:
    """
    Formata valores de potência
    
    Args:
        value: Valor de potência
        unit: Unidade de potência (padrão: kW)
        
    Returns:
        String formatada com unidade de potência
        
    Examples:
        >>> format_power(5.5)
        '5,50 kW'
        >>> format_power(1000, "MW")
        '1.000,00 MW'
    """
    return format_number(value, unit, 2)


def format_tariff(value: Union[float, int]) -> str:
    """
    Formata valores de tarifa de energia
    
    Args:
        value: Valor da tarifa em R$/kWh
        
    Returns:
        String formatada como tarifa
        
    Examples:
        >>> format_tariff(0.85)
        'R$ 0,85/kWh'
        >>> format_tariff(1.234)
        'R$ 1,23/kWh'
    """
    if value is None:
        return "R$ 0,00/kWh"
    
    try:
        float_value = float(value)
    except (ValueError, TypeError):
        return "R$ 0,00/kWh"
    
    # Formatar o valor numérico com 3 casas decimais para tarifa
    abs_value = abs(float_value)
    integer_part = int(abs_value)
    decimal_part = round((abs_value - integer_part) * 1000)
    
    if decimal_part >= 1000:
        integer_part += 1
        decimal_part -= 1000
    
    integer_str = f"{integer_part:,}".replace(",", ".")
    decimal_str = f"{decimal_part:03d}"
    
    formatted = f"R$ {integer_str},{decimal_str}/kWh"
    
    if float_value < 0:
        formatted = f"-{formatted}"
    
    return formatted


def format_ratio(value: Optional[Union[float, int]], decimal_places: int = 3) -> str:
    """
    Formata valores de razão/índice
    
    Args:
        value: Valor da razão
        decimal_places: Número de casas decimais
        
    Returns:
        String formatada como razão
        
    Examples:
        >>> format_ratio(1.25)
        '1,250'
        >>> format_ratio(0.85, 2)
        '0,85'
        >>> format_ratio(None)
        'N/A'
    """
    if value is None:
        return "N/A"
    
    try:
        float_value = float(value)
    except (ValueError, TypeError):
        return "N/A"
    
    return format_number(float_value, "", decimal_places)


def format_efficiency(value: Optional[Union[float, int]]) -> str:
    """
    Formata valores de eficiência
    
    Args:
        value: Valor de eficiência (0.85 para 85%)
        
    Returns:
        String formatada como percentual
        
    Examples:
        >>> format_efficiency(0.85)
        '85,00%'
        >>> format_efficiency(95.5)
        '95,50%'
        >>> format_efficiency(None)
        'N/A'
    """
    if value is None:
        return "N/A"
    
    try:
        float_value = float(value)
    except (ValueError, TypeError):
        return "N/A"
    
    # Se o valor já for percentual (> 1), usar diretamente
    if abs(float_value) > 1:
        return format_percentage(float_value)
    else:
        return format_percentage(float_value * 100)


def format_temperature(value: Union[float, int], unit: str = "°C") -> str:
    """
    Formata valores de temperatura
    
    Args:
        value: Valor da temperatura
        unit: Unidade de temperatura (padrão: °C)
        
    Returns:
        String formatada com unidade de temperatura
        
    Examples:
        >>> format_temperature(25.5)
        '25,50°C'
        >>> format_temperature(-10, "°F")
        '-10,00°F'
    """
    return format_number(value, unit, 2)


def format_area(value: Union[float, int], unit: str = "m²") -> str:
    """
    Formata valores de área
    
    Args:
        value: Valor da área
        unit: Unidade de área (padrão: m²)
        
    Returns:
        String formatada com unidade de área
        
    Examples:
        >>> format_area(125.75)
        '125,75 m²'
        >>> format_area(1000, "ha")
        '1.000,00 ha'
    """
    return format_number(value, unit, 2)


def format_co2(value: Union[float, int]) -> str:
    """
    Formata valores de CO2
    
    Args:
        value: Valor de CO2 em kg
        
    Returns:
        String formatada com unidade de CO2
        
    Examples:
        >>> format_co2(1234.56)
        '1.234,56 kg CO₂'
        >>> format_co2(5000)
        '5.000,00 kg CO₂'
    """
    return format_number(value, "kg CO₂", 2)


def format_large_number(value: Union[float, int], unit: str = "") -> str:
    """
    Formata números grandes com sufixos (K, M, B)
    
    Args:
        value: Valor numérico
        unit: Unidade opcional
        
    Returns:
        String formatada com sufixo apropriado
        
    Examples:
        >>> format_large_number(1500)
        '1,5K'
        >>> format_large_number(2500000, "kWh")
        '2,5M kWh'
        >>> format_large_number(1234567890)
        '1,23B'
    """
    if value is None:
        return "0"
    
    try:
        float_value = float(value)
    except (ValueError, TypeError):
        return "0"
    
    abs_value = abs(float_value)
    
    if abs_value >= 1e9:
        formatted_value = float_value / 1e9
        suffix = "B"
    elif abs_value >= 1e6:
        formatted_value = float_value / 1e6
        suffix = "M"
    elif abs_value >= 1e3:
        formatted_value = float_value / 1e3
        suffix = "K"
    else:
        return format_number(value, unit, 0)
    
    # Formatar com até 2 casas decimais, removendo zeros desnecessários
    if abs(formatted_value) >= 100:
        formatted = format_number(formatted_value, "", 0)
    elif abs(formatted_value) >= 10:
        formatted = format_number(formatted_value, "", 1)
    else:
        formatted = format_number(formatted_value, "", 2)
    
    result = f"{formatted}{suffix}"
    
    if unit:
        result = f"{result} {unit}"
    
    return result