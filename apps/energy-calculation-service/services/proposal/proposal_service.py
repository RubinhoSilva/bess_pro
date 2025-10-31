import os
import logging
import tempfile
import uuid
import shutil
from datetime import date
from typing import Dict, Any, List, Optional
import requests
import matplotlib.pyplot as plt
import numpy as np

from models.proposal.requests import ProposalRequest
from models.proposal.responses import ProposalResponse
from .pdf_generator import ProposalPDF
from core.config import settings
from services.storage import s3_service

logger = logging.getLogger(__name__)

class ProposalGenerationService:
    """Serviço para geração de propostas em PDF"""
    
    @staticmethod
    def generate_proposal(request: ProposalRequest) -> ProposalResponse:
        """
        Gera proposta PDF completa baseada nos dados fornecidos
        """
        try:
            # Log do JSON recebido
            import json
            
            # 1. Gerar gráficos
            graph_files = ProposalGenerationService._generate_graphs(request)
            
            # 2. Validar dados
            ProposalGenerationService._validate_proposal_data(request)
            
            # 3. Baixar logo
            logo_path = ProposalGenerationService._download_logo(request.logo_url)
            
            # 4. Gerar PDF
            pdf_path = ProposalGenerationService._generate_pdf(request, graph_files, logo_path)
            
            # 4. Mover para storage permanente (S3 ou local)
            final_url = ProposalGenerationService._move_to_storage(pdf_path, request.nome_arquivo)
            
            # 5. Limpar arquivos temporários
            ProposalGenerationService._cleanup_temp_files(graph_files, logo_path)
            
            # 6. Obter tamanho do arquivo
            if s3_service.is_available() and final_url.startswith('http'):
                # Se for URL do S3, obter tamanho do arquivo local
                file_size = os.path.getsize(pdf_path) / 1024 if os.path.exists(pdf_path) else 0
            else:
                # Se for armazenamento local
                storage_path = final_url.replace('/api/v1/proposal/download/', './storage/proposals/')
                file_size = os.path.getsize(storage_path) / 1024 if os.path.exists(storage_path) else 0
            
            return ProposalResponse(
                success=True,
                message="Proposta gerada com sucesso",
                pdf_url=final_url,
                pdf_filename=os.path.basename(final_url),
                file_size_kb=round(file_size, 2)
            )
            
        except Exception as e:
            raise Exception(f"Erro ao gerar proposta: {str(e)}")
    
    @staticmethod
    def _generate_graphs(request: ProposalRequest) -> Dict[str, str]:
        """Gera os gráficos para a proposta"""
        graph_files = {}
        
        try:
            # Gráfico ROI
            roi_graph = ProposalGenerationService._generate_roi_graph(
                request.valor_investimento, 
                request.economia_anual_bruta
            )
            graph_files['roi'] = roi_graph
            
            # Gráfico Mensal (se houver dados)
            if request.dados_tecnicos_mensal:
                mensal_graph = ProposalGenerationService._generate_mensal_graph(
                    request.dados_tecnicos_mensal
                )
                graph_files['mensal'] = mensal_graph
            
            # Gráfico Fluxo de Caixa (se houver dados)
            if request.dados_fluxo_caixa:
                fluxo_graph = ProposalGenerationService._generate_fluxo_caixa_graph(
                    request.dados_fluxo_caixa
                )
                graph_files['fluxo_caixa'] = fluxo_graph
                
        except Exception as e:
            # Continuar sem gráficos se falhar
            pass
        
        return graph_files
    
    @staticmethod
    def _generate_roi_graph(investimento: float, economia_anual: float) -> str:
        """Gera gráfico de ROI/Payback"""
        anos = np.arange(0, 25)
        fluxo_caixa = -investimento + anos * economia_anual
        payback_time = investimento / economia_anual
        
        plt.figure(figsize=(8, 4.5))
        plt.plot(anos, fluxo_caixa, marker='o', linestyle='-', color='tab:blue', label='Fluxo de Caixa Acumulado (R$)')
        plt.axhline(0, color='red', linestyle='--', label='Ponto de Equilíbrio (R$ 0)')
        
        if payback_time <= 5:
            plt.plot(payback_time, 0, 'go', markersize=10, label=f'Payback: {payback_time:.2f} anos')
        
        plt.title('Projeção de Retorno de Investimento (ROI)', fontsize=11)
        plt.xlabel('Anos de Operação', fontsize=8)
        plt.ylabel('Valor Acumulado (R$)', fontsize=8)
        plt.grid(True, linestyle=':', alpha=0.7)
        plt.legend()
        plt.tight_layout()
        
        # Salvar em arquivo temporário
        temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        plt.savefig(temp_file.name, dpi=150, bbox_inches='tight')
        plt.close()
        
        return temp_file.name
    
    @staticmethod
    def _generate_mensal_graph(dados_mensal: List[Dict]) -> str:
        """Gera gráfico mensal de geração vs consumo"""
        # Limitar a 12 meses e extrair dados no formato do notebook
        dados_12_meses = dados_mensal[:12]
        meses = []
        consumo = []
        geracao = []
        
        for d in dados_12_meses:
            if hasattr(d, 'mes'):
                # Se for objeto com atributos
                meses.append(d.mes)
                consumo.append(d.consumo)
                geracao.append(d.geracao)
            else:
                # Se for dicionário
                meses.append(d.get('mes', f"Mês{len(meses)+1}"))
                consumo.append(d.get('consumo', 0))
                geracao.append(d.get('geracao', 0))
        
        x = np.arange(len(meses))
        width = 0.35
        
        plt.figure(figsize=(10, 5))
        plt.bar(x - width/2, consumo, width, label='Consumo (kWh)', color='tab:red', alpha=0.6)
        plt.bar(x + width/2, geracao, width, label='Geração (kWh)', color='tab:blue', alpha=0.8)
        
        plt.title('Comparativo Mensal: Geração Estimada vs Consumo', fontsize=14)
        plt.ylabel('Energia (kWh)', fontsize=10)
        plt.xticks(x, meses)
        plt.legend()
        plt.grid(axis='y', linestyle=':', alpha=0.7)
        plt.tight_layout()
        
        # Salvar em arquivo temporário
        temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        plt.savefig(temp_file.name, dpi=150, bbox_inches='tight')
        plt.close()
        
        return temp_file.name
    
    @staticmethod
    def _generate_fluxo_caixa_graph(dados_fluxo: List[Dict]) -> str:
        """Gera gráfico de fluxo de caixa acumulado"""
        # Extrair dados do formato do notebook (mais robusto)
        anos = []
        fluxo_nominal_acumulado = []
        
        for d in dados_fluxo:
            if hasattr(d, 'ano'):
                # Se for objeto com atributos
                anos.append(d.ano)
                fluxo_nominal_acumulado.append(d.fc_acum_nominal)
            else:
                # Se for dicionário
                anos.append(d.get('ano', 0))
                fluxo_nominal_acumulado.append(d.get('fc_acum_nominal', 0))
        
        plt.figure(figsize=(10, 5))
        plt.plot(anos, fluxo_nominal_acumulado, marker='o', linestyle='-', color='darkgreen', label='Fluxo de Caixa Acumulado Nominal (R$)')
        plt.axhline(0, color='red', linestyle='--', label='Ponto de Equilíbrio (R$ 0)')
        
        # Encontrar payback (melhorado do notebook)
        payback_simples_ano = 0
        for i in range(1, len(fluxo_nominal_acumulado)):
            if fluxo_nominal_acumulado[i] >= 0 and fluxo_nominal_acumulado[i-1] < 0:
                payback_simples_ano = anos[i-1] + (0 - fluxo_nominal_acumulado[i-1]) / (fluxo_nominal_acumulado[i] - fluxo_nominal_acumulado[i-1])
                plt.plot(payback_simples_ano, 0, 'go', markersize=8, label=f'Payback: {payback_simples_ano:.2f} anos')
                break
        
        plt.title('Fluxo de Caixa Acumulado (Projeção de 25 Anos)', fontsize=14)
        plt.xlabel('Ano', fontsize=10)
        plt.ylabel('Valor Acumulado (R$)', fontsize=10)
        plt.xticks(np.arange(0, 26, 5))
        plt.grid(True, linestyle=':', alpha=0.7)
        plt.legend()
        plt.tight_layout()
        
        # Salvar em arquivo temporário
        temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        plt.savefig(temp_file.name, dpi=150, bbox_inches='tight')
        plt.close()
        
        return temp_file.name
    
    @staticmethod
    def _download_logo(logo_url: Optional[str]) -> Optional[str]:
        """Baixa logo da URL fornecida"""
        if not logo_url:
            # Usar URL padrão se não fornecida
            logo_url = getattr(settings, 'DEFAULT_LOGO_URL', None) or "https://via.placeholder.com/150x80/0066cc/ffffff?text=Logo"
        
        try:
            response = requests.get(logo_url, timeout=10)
            response.raise_for_status()
            
            # Salvar em arquivo temporário
            temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
            temp_file.write(response.content)
            temp_file.close()
            
            return temp_file.name
            
        except Exception as e:
            return None
    
    @staticmethod
    def _generate_pdf(request: ProposalRequest, graph_files: Dict[str, str], logo_path: Optional[str]) -> str:
        """Gera o PDF da proposta"""
        try:
            # Criar classe PDF personalizada
            pdf = ProposalPDF(request, logo_path)
            
            # Construir documento
            pdf.gerar_capa()
            pdf.gerar_sobre_empresa()
            pdf.gerar_resumo()
            pdf.gerar_analise_financeira(graph_files)
            pdf.gerar_analise_tecnica(graph_files)
            pdf.gerar_esclarecimentos()
            pdf.gerar_aceite()
            
            # Salvar em arquivo temporário
            temp_file = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
            pdf.output(temp_file.name)
            
            return temp_file.name
            
        except Exception as e:
            raise Exception(f"Erro ao gerar PDF: {str(e)}")
    
    @staticmethod
    def _move_to_storage(temp_path: str, filename: Optional[str]) -> str:
        """Move arquivo para storage permanente (S3 ou local)"""
        try:
            # Gerar nome único se não fornecido
            if not filename:
                filename = f"proposta_{uuid.uuid4().hex[:8]}_{date.today().strftime('%Y%m%d')}.pdf"
            
            # Verificar se o arquivo temporário existe
            if not os.path.exists(temp_path):
                raise Exception(f"Arquivo temporário não encontrado: {temp_path}")
            
            # Tentar upload para S3 primeiro se estiver disponível
            if s3_service.is_available():
                logger.info("Enviando arquivo para S3...")
                s3_url = s3_service.upload_file(temp_path, filename)
                
                if s3_url:
                    logger.info(f"Arquivo enviado com sucesso para S3: {s3_url}")
                    # Remover arquivo temporário após upload bem-sucedido
                    try:
                        os.unlink(temp_path)
                    except Exception as e:
                        logger.warning(f"Não foi possível remover arquivo temporário: {str(e)}")
                    
                    return s3_url
                else:
                    logger.warning("Falha no upload para S3, usando armazenamento local")
            
            # Fallback para armazenamento local
            logger.info("Usando armazenamento local...")
            
            # Criar diretório de propostas se não existir
            proposals_dir = getattr(settings, 'PROPOSALS_STORAGE_DIR', "./storage/proposals")
            os.makedirs(proposals_dir, exist_ok=True)
            
            # Garantir permissões de escrita no diretório
            try:
                os.chmod(proposals_dir, 0o755)
            except Exception as chmod_error:
                pass
            
            final_path = os.path.join(proposals_dir, filename)
            
            # Mover arquivo (usando shutil para funcionar entre diferentes dispositivos)
            shutil.move(temp_path, final_path)
            
            # Verificar se o arquivo foi movido com sucesso
            if not os.path.exists(final_path):
                raise Exception(f"Falha ao mover arquivo para: {final_path}")
            
            # Garantir permissões do arquivo
            try:
                os.chmod(final_path, 0o644)
            except Exception as chmod_error:
                pass
            
            # Retornar URL relativa
            return f"/api/v1/proposal/download/{filename}"
            
        except Exception as e:
            raise Exception(f"Erro ao salvar arquivo: {str(e)}")
    
    @staticmethod
    def _cleanup_temp_files(files: Dict[str, str], logo_path: Optional[str]):
        """Limpa arquivos temporários"""
        for file_path in files.values():
            try:
                if os.path.exists(file_path):
                    os.unlink(file_path)
            except Exception as e:
                pass
        
        if logo_path and os.path.exists(logo_path):
            try:
                os.unlink(logo_path)
            except Exception as e:
                pass
    
    @staticmethod
    def _validate_proposal_data(request: ProposalRequest):
        """
        Valida dados essenciais da requisição
        """
        # Log de informações básicas
        logger.info(f"Gerando proposta para cliente: {request.cliente.nome}")
        logger.info(f"Valor do investimento: R$ {request.valor_investimento:,.2f}")
        logger.info(f"Economia anual bruta: R$ {request.economia_anual_bruta:,.2f}")
        
        # Validação de campos obrigatórios
        if request.valor_investimento <= 0:
            raise ValueError("Valor do investimento deve ser positivo")
        
        if request.economia_anual_bruta < 0:
            raise ValueError("Economia anual bruta não pode ser negativa")
        
        # Log de sucesso da validação
        logger.info("Validação da proposta concluída com sucesso")