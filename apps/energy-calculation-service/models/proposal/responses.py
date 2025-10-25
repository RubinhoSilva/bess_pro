from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProposalResponse(BaseModel):
    """Response da geração de proposta"""
    success: bool = Field(..., description="Status da operação")
    message: str = Field(..., description="Mensagem de resposta")
    pdf_url: str = Field(..., description="URL para download do PDF")
    pdf_filename: str = Field(..., description="Nome do arquivo gerado")
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="Data/hora da geração")
    file_size_kb: Optional[float] = Field(None, description="Tamanho do arquivo em KB")