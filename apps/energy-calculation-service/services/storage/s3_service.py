import os
import logging
import uuid
from datetime import date
from typing import Optional
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from core.config import settings

logger = logging.getLogger(__name__)

class S3Service:
    """Serviço para interação com AWS S3"""
    
    def __init__(self):
        """Inicializa o cliente S3"""
        self.s3_client = None
        self.bucket_name = settings.S3_BUCKET_NAME
        self.prefix = settings.S3_PROPOSALS_PREFIX
        
        # Inicializa cliente S3 apenas se as credenciais estiverem configuradas
        if settings.USE_S3_STORAGE and self._validate_credentials():
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION
                )
                logger.info("Cliente S3 inicializado com sucesso")
            except Exception as e:
                logger.error(f"Erro ao inicializar cliente S3: {str(e)}")
                self.s3_client = None
    
    def _validate_credentials(self) -> bool:
        """Valida se as credenciais AWS estão configuradas"""
        return bool(
            settings.AWS_ACCESS_KEY_ID and
            settings.AWS_SECRET_ACCESS_KEY and
            settings.S3_BUCKET_NAME
        )
    
    def is_available(self) -> bool:
        """Verifica se o serviço S3 está disponível"""
        return settings.USE_S3_STORAGE and self.s3_client is not None
    
    def upload_file(self, file_path: str, filename: Optional[str] = None) -> Optional[str]:
        """
        Faz upload de arquivo para o S3 e retorna a URL pré-assinada
        
        Args:
            file_path: Caminho local do arquivo
            filename: Nome do arquivo no S3 (opcional)
            
        Returns:
            URL pré-assinada para download ou None em caso de erro
        """
        if not self.is_available():
            logger.warning("S3 não está disponível, usando armazenamento local")
            return None
        
        if not os.path.exists(file_path):
            logger.error(f"Arquivo não encontrado: {file_path}")
            return None
        
        try:
            # Gerar nome único se não fornecido
            if not filename:
                filename = f"proposta_{uuid.uuid4().hex[:8]}_{date.today().strftime('%Y%m%d')}.pdf"
            
            # Caminho completo no S3
            s3_key = f"{self.prefix}{filename}"
            
            # Fazer upload
            self.s3_client.upload_file(
                file_path,
                self.bucket_name,
                s3_key,
                ExtraArgs={
                    'ContentType': 'application/pdf',
                    'ContentDisposition': f'inline; filename="{filename}"'
                }
            )
            
            logger.info(f"Arquivo {filename} enviado para S3: {s3_key}")
            
            # Gerar URL direta (sem presigned)
            return self.get_direct_url(s3_key)
            
        except ClientError as e:
            logger.error(f"Erro ao fazer upload para S3: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Erro inesperado no upload S3: {str(e)}")
            return None
    
    def get_direct_url(self, s3_key: str) -> Optional[str]:
        """
        Gera URL direta para download (sem presigned)
        
        Args:
            s3_key: Caminho do arquivo no S3
            
        Returns:
            URL direta (CloudFront ou S3) ou None em caso de erro
        """
        if not self.is_available():
            return None
        
        try:
            # Priorizar CloudFront se configurado
            cloudfront_url = settings.AWS_CLOUDFRONT_URL
            if cloudfront_url:
                url = f"{cloudfront_url}/{s3_key}"
                logger.info(f"URL CloudFront gerada para {s3_key}: {url}")
                return url
            
            # Fallback para S3 direto (sem presigned)
            url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
            logger.info(f"URL S3 direta gerada para {s3_key}: {url}")
            return url
            
        except Exception as e:
            logger.error(f"Erro ao gerar URL direta: {str(e)}")
            return None
    
    def generate_presigned_url(self, s3_key: str, expiration: Optional[int] = None) -> Optional[str]:
        """
        Gera URL pré-assinada para download (MANTIDO PARA COMPATIBILIDADE)
        
        Args:
            s3_key: Caminho do arquivo no S3
            expiration: Tempo de expiração em segundos (opcional)
            
        Returns:
            URL pré-assinada ou None em caso de erro
        """
        if not self.is_available():
            return None
        
        try:
            expiration = expiration or settings.S3_PRESIGNED_URL_EXPIRATION
            
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key
                },
                ExpiresIn=expiration
            )
            
            logger.info(f"URL pré-assinada gerada para {s3_key}")
            return url
            
        except ClientError as e:
            logger.error(f"Erro ao gerar URL pré-assinada: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Erro inesperado ao gerar URL pré-assinada: {str(e)}")
            return None
    
    def delete_file(self, s3_key: str) -> bool:
        """
        Exclui arquivo do S3
        
        Args:
            s3_key: Caminho do arquivo no S3
            
        Returns:
            True se excluído com sucesso, False caso contrário
        """
        if not self.is_available():
            return False
        
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            logger.info(f"Arquivo {s3_key} excluído do S3")
            return True
            
        except ClientError as e:
            logger.error(f"Erro ao excluir arquivo do S3: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Erro inesperado ao excluir arquivo do S3: {str(e)}")
            return False
    
    def check_file_exists(self, s3_key: str) -> bool:
        """
        Verifica se arquivo existe no S3
        
        Args:
            s3_key: Caminho do arquivo no S3
            
        Returns:
            True se arquivo existe, False caso contrário
        """
        if not self.is_available():
            return False
        
        try:
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return True
            
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            logger.error(f"Erro ao verificar existência do arquivo: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Erro inesperado ao verificar arquivo: {str(e)}")
            return False

# Instância global do serviço S3
s3_service = S3Service()