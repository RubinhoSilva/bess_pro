from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from models.proposal.requests import ProposalRequest
from models.proposal.responses import ProposalResponse
from services.proposal.proposal_service import ProposalGenerationService
from core.response_models import SuccessResponse
import logging
import os

router = APIRouter(prefix="/proposal", tags=["Geração de Proposta"])
logger = logging.getLogger(__name__)

@router.post("/generate", response_model=SuccessResponse[ProposalResponse])
async def generate_proposal(
    request: ProposalRequest,
    background_tasks: BackgroundTasks
):
    """
    Gera proposta comercial em PDF para sistema fotovoltaico
    
    Inclui:
    - Capa personalizada com logo
    - Informações da empresa e cliente
    - Resumo do sistema proposto
    - Análise financeira completa
    - Análise técnica detalhada
    - Gráficos de ROI e performance
    - Termos de aceite
    """
    
    try:
        logger.info(f"Iniciando geração de proposta para cliente: {request.cliente.nome}")
        
        # Validar dados básicos
        if not request.empresa.nome:
            raise HTTPException(status_code=400, detail="Nome da empresa é obrigatório")
        
        if not request.cliente.nome:
            raise HTTPException(status_code=400, detail="Nome do cliente é obrigatório")
        
        if request.valor_investimento <= 0:
            raise HTTPException(status_code=400, detail="Valor do investimento deve ser positivo")
        
        # Gerar proposta
        resultado = ProposalGenerationService.generate_proposal(request)
        
        logger.info(f"Proposta gerada com sucesso: {resultado.pdf_filename}")
        
        return SuccessResponse(
            success=True,
            data=resultado,
            message="Proposta gerada com sucesso"
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Erro na geração de proposta: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno na geração de proposta: {str(e)}"
        )

@router.get("/download/{filename}")
async def download_proposal(filename: str):
    """
    Baixa arquivo PDF da proposta gerada
    """
    from core.config import settings
    from services.storage import s3_service
    
    # Tentar buscar do S3 primeiro se estiver disponível
    if s3_service.is_available():
        s3_key = f"{settings.S3_PROPOSALS_PREFIX}{filename}"
        
        # Verificar se arquivo existe no S3
        if s3_service.check_file_exists(s3_key):
            # Gerar URL pré-assinada e redirecionar
            presigned_url = s3_service.generate_presigned_url(s3_key)
            if presigned_url:
                from fastapi.responses import RedirectResponse
                return RedirectResponse(url=presigned_url)
        
        # Se não encontrar no S3, tentar no storage local (fallback)
        logger.warning(f"Arquivo não encontrado no S3, tentando storage local: {filename}")
    
    # Fallback para armazenamento local
    proposals_dir = getattr(settings, 'PROPOSALS_STORAGE_DIR', "./storage/proposals")
    file_path = os.path.join(proposals_dir, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=filename
    )