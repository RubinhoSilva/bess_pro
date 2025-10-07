"""
Core response models for the API
"""

from pydantic import BaseModel, Field
from typing import Generic, TypeVar, Optional, Any
from datetime import datetime

T = TypeVar('T')

class SuccessResponse(BaseModel, Generic[T]):
    """Generic success response wrapper"""
    
    success: bool = Field(default=True, description="Indica se a operação foi bem-sucedida")
    data: T = Field(..., description="Dados da resposta")
    message: Optional[str] = Field(None, description="Mensagem opcional sobre a operação")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp da resposta")
    
    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "data": {},
                "message": "Operação realizada com sucesso",
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }

class ErrorResponse(BaseModel):
    """Standard error response"""
    
    success: bool = Field(default=False, description="Indica que a operação falhou")
    error: str = Field(..., description="Mensagem de erro")
    details: Optional[Any] = Field(None, description="Detalhes adicionais do erro")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp do erro")
    
    class Config:
        schema_extra = {
            "example": {
                "success": False,
                "error": "Erro de validação",
                "details": {"field": "value", "message": "Campo obrigatório"},
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }