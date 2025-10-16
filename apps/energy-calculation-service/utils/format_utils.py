# -*- coding: utf-8 -*-
"""
Utilitários de formatação para valores monetários e percentuais
"""

def format_currency(value: float) -> str:
    """Formata valor monetário em padrão brasileiro"""
    if value is None or not isinstance(value, (int, float)):
        return "R$ 0,00"
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def format_percentage(value: float) -> str:
    """Formata percentual em padrão brasileiro"""
    if value is None or not isinstance(value, (int, float)):
        return "0,00%"
    return f"{value:.2f}%".replace(".", ",")

def format_number(value: float, decimal_places: int = 2) -> str:
    """Formata número em padrão brasileiro"""
    if value is None or not isinstance(value, (int, float)):
        return "0"
    return f"{value:,.{decimal_places}f}".replace(",", "X").replace(".", ",").replace("X", ".")