from fpdf import FPDF
import os
import logging
from datetime import date
from typing import Dict
from models.proposal.requests import ProposalRequest

logger = logging.getLogger(__name__)

class ProposalPDF(FPDF):
    """Classe personalizada para geração de PDF de proposta"""
    
    def __init__(self, request: ProposalRequest, logo_path: str = None):
        super().__init__()
        
        # Configurar fontes Unicode
        self.fonts_loaded = False
        try:
            self.add_font("DejaVuSans", "", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
            self.add_font("DejaVuSans", "B", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
            self.add_font("DejaVuSans", "I", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf")
            self.fonts_loaded = True
        except FileNotFoundError:
            # Fallback para fontes padrão
            self.fonts_loaded = False
        
        self.request = request
        self.logo_path = logo_path
    
    def set_font_safe(self, family: str, style: str = '', size: float = 0):
        """Define fonte com fallback para fontes padrão"""
        if self.fonts_loaded and family == 'DejaVuSans':
            self.set_font(family, style, size)
        else:
            # Mapear para fontes padrão
            if family == 'DejaVuSans':
                if style == 'B':
                    self.set_font('Helvetica', 'B', size)
                elif style == 'I':
                    self.set_font('Helvetica', 'I', size)
                else:
                    self.set_font('Helvetica', '', size)
            else:
                self.set_font(family, style, size)
    
    def header(self):
        """Cabeçalho das páginas"""
        if self.page_no() > 1:
            self.set_font_safe('DejaVuSans', 'B', 10)
            self.set_text_color(0, 102, 204)
            
            if self.logo_path and os.path.exists(self.logo_path):
                self.image(self.logo_path, x=10, y=8, w=30)
            
            self.cell(0, 5, self.request.empresa.nome, 0, new_x='LMARGIN', new_y='NEXT', align='R')
            self.set_line_width(0.25)
            self.line(10, 20, 200, 20)
            self.ln(5)
    
    def footer(self):
        """Rodapé das páginas"""
        self.set_y(-15)
        self.set_font_safe('DejaVuSans', 'I', 8)
        self.set_text_color(100, 100, 100)
        texto_footer = f'Página {self.page_no()}/{{nb}} | {self.request.empresa.contato}'
        self.cell(0, 7, texto_footer, 0, 0, 'C')
    
    def titulo_secao(self, titulo, nivel=1):
        """Título de seção"""
        self.ln(3)
        if nivel == 1:
            self.set_fill_color(0, 102, 204)
            self.set_text_color(255, 255, 255)
            self.set_font_safe('DejaVuSans', 'B', 16)
        elif nivel == 2:
            self.set_fill_color(220, 220, 220)
            self.set_text_color(0, 0, 0)
            self.set_font_safe('DejaVuSans', 'B', 12)
        
        self.cell(0, 10, ' ' + titulo, 0, new_x='LMARGIN', new_y='NEXT', align='L', fill=1)
        self.set_text_color(0, 0, 0)
        self.ln(2)
    
    def gerar_capa(self):
        """Gera capa da proposta"""
        self.add_page()
        
        if self.logo_path and os.path.exists(self.logo_path):
            self.image(self.logo_path, x=80, y=10, w=50)
        
        self.set_font_safe('DejaVuSans', 'B', 48)
        self.set_text_color(0, 102, 204)
        self.set_y(110)
        self.cell(0, 20, 'PROPOSTA SOLAR', 0, new_x='LMARGIN', new_y='NEXT', align='C')
        
        self.set_font_safe('DejaVuSans', '', 20)
        self.set_text_color(50, 50, 50)
        self.cell(0, 10, 'Orçamento de Sistema Fotovoltaico', 0, new_x='LMARGIN', new_y='NEXT', align='C')
        
        self.ln(30)
        
        self.set_font_safe('DejaVuSans', 'B', 24)
        self.set_text_color(0, 0, 0)
        self.cell(0, 15, f'PARA: {self.request.cliente.nome}', 0, new_x='LMARGIN', new_y='NEXT', align='C')
        
        self.set_font_safe('DejaVuSans', '', 14)
        self.cell(0, 10, self.request.cliente.endereco, 0, new_x='LMARGIN', new_y='NEXT', align='C')
        
        self.ln(70)
        
        self.set_y(-40)
        self.set_font_safe('DejaVuSans', 'I', 12)
        self.cell(0, 7, f'Data: {date.today().strftime("%d/%m/%Y")}', 0, new_x='LMARGIN', new_y='NEXT', align='C')
        self.cell(0, 7, self.request.empresa.nome, 0, new_x='LMARGIN', new_y='NEXT', align='C')
        self.cell(0, 7, self.request.empresa.contato, 0, new_x='LMARGIN', new_y='NEXT', align='C')
        self.ln(10)
    
    def gerar_sobre_empresa(self):
        """Gera seção sobre a empresa"""
        self.add_page()
        self.titulo_secao("1. SOBRE A EMPRESA E EXPERIÊNCIA")
        
        if self.request.empresa.missao:
            self.titulo_secao("1.1. Nossa Missão e Valores", nivel=2)
            self.set_font_safe('DejaVuSans', '', 10)
            self.multi_cell(0, 5, self.request.empresa.missao)
            self.ln(5)
        
        self.titulo_secao("1.2. Experiência e Credibilidade", nivel=2)
        self.set_font_safe('DejaVuSans', 'B', 12)
        self.set_fill_color(240, 248, 255)
        
        col1_width = 95
        col2_width = 95
        
        fatos = [
            ("Ano de Fundação", self.request.empresa.fundacao or "Não informado"),
            ("Projetos Concluídos", self.request.empresa.projetos_concluidos or "Não informado"),
            ("Potência Total Instalada", self.request.empresa.potencia_total or "Não informado"),
            ("Clientes Satisfeitos", self.request.empresa.clientes_satisfeitos or "Não informado"),
        ]
        
        for rotulo, valor in fatos:
            self.set_font_safe('DejaVuSans', 'B', 10)
            self.cell(col1_width, 7, rotulo + ":", 1, 0, 'L', 1)
            self.set_font_safe('DejaVuSans', '', 10)
            self.cell(col2_width, 7, valor, 1, new_x='LMARGIN', new_y='NEXT', align='R')
        
        self.ln(5)
        
        if self.request.empresa.observacoes:
            self.titulo_secao("1.3. Observações e Equipe", nivel=2)
            self.set_font_safe('DejaVuSans', '', 10)
            self.multi_cell(0, 5, self.request.empresa.observacoes)
            self.ln(5)
    
    def gerar_resumo(self):
        """Gera resumo da proposta"""
        self.add_page()
        self.titulo_secao("2. RESUMO DA PROPOSTA")
        
        self.titulo_secao("2.1. Perfil de Consumo", nivel=2)
        self.set_font_safe('DejaVuSans', '', 10)
        self.set_fill_color(240, 240, 240)
        self.cell(95, 6, "Cliente:", 1, 0, 'L', 1)
        self.cell(95, 6, self.request.cliente.nome, 1, new_x='LMARGIN', new_y='NEXT', align='L')
        self.cell(95, 6, "Consumo Médio Mensal:", 1, 0, 'L', 1)
        self.cell(95, 6, self.request.cliente.consumo_mensal, 1, new_x='LMARGIN', new_y='NEXT', align='L')
        self.cell(95, 6, "Tarifa Média Atual:", 1, 0, 'L', 1)
        self.cell(95, 6, self.request.cliente.tarifa_media, 1, new_x='LMARGIN', new_y='NEXT', align='L')
        self.ln(3)
        
        self.titulo_secao("2.2. Sistema Proposto", nivel=2)
        self.set_font_safe('DejaVuSans', '', 10)
        self.cell(95, 6, "Potência de Pico (kWp):", 1, 0, 'L', 1)
        self.cell(95, 6, self.request.sistema.potencia_pico, 1, new_x='LMARGIN', new_y='NEXT', align='L')
        self.cell(95, 6, "Geração Estimada Mensal:", 1, 0, 'L', 1)
        self.cell(95, 6, self.request.sistema.geracao_estimada, 1, new_x='LMARGIN', new_y='NEXT', align='L')
        self.ln(3)
        
        self.titulo_secao("2.3. Investimento e Economia", nivel=2)
        self.set_font_safe('DejaVuSans', 'B', 10)
        self.set_fill_color(200, 220, 255)
        self.cell(95, 7, "INVESTIMENTO TOTAL (CAPEX):", 1, 0, 'L', 1)
        self.set_font_safe('DejaVuSans', '', 10)
        self.cell(95, 7, self.request.financeiro.valor_total, 1, new_x='LMARGIN', new_y='NEXT', align='R')
        
        self.set_font_safe('DejaVuSans', 'B', 10)
        self.set_fill_color(200, 255, 200)
        self.cell(95, 7, "ECONOMIA ANUAL ESTIMADA:", 1, 0, 'L', 1)
        self.set_font_safe('DejaVuSans', 'B', 10)
        self.cell(95, 7, self.request.financeiro.economia_anual, 1, new_x='LMARGIN', new_y='NEXT', align='R')
        self.ln(3)
    
    def gerar_analise_financeira(self, graph_files: Dict[str, str]):
        """Gera análise financeira"""
        self.add_page()
        self.titulo_secao("3. ANÁLISE FINANCEIRA COMPLETA")
        
        self.titulo_secao("3.1. Detalhes do Investimento", nivel=2)
        self.set_draw_color(0, 102, 204)
        self.set_font_safe('DejaVuSans', 'B', 10)
        col_width = 63
        self.set_fill_color(200, 220, 255)
        self.cell(col_width, 8, 'ITEM', 1, 0, 'C', 1)
        self.cell(col_width, 8, 'CONDIÇÃO DE PAGAMENTO', 1, 0, 'C', 1)
        self.cell(col_width, 8, 'VALOR (CAPEX)', 1, new_x='LMARGIN', new_y='NEXT', align='C', fill=1)
        
        self.set_font_safe('DejaVuSans', '', 10)
        self.cell(col_width, 8, 'Valor Total (Equip. + Inst.)', 1, 0, 'C')
        self.cell(col_width, 8, 'À Vista ou Financiado', 1, 0, 'C')
        self.set_font_safe('DejaVuSans', 'B', 10)
        self.cell(col_width, 8, self.request.financeiro.valor_total, 1, new_x='LMARGIN', new_y='NEXT', align='C')
        
        self.cell(col_width, 8, 'Validade da Proposta', 1, 0, 'C')
        self.cell(col_width, 8, self.request.financeiro.validade, 1, 0, 'C')
        self.cell(col_width, 8, '-', 1, new_x='LMARGIN', new_y='NEXT', align='C')
        self.ln(3)
        
        # Gráfico ROI
        if 'roi' in graph_files:
            self.titulo_secao("3.2. Projeção de Retorno (Payback Simples)", nivel=2)
            if self.y + 80 > self.page_break_trigger:
                self.add_page()
            self.image(graph_files['roi'], x=10, y=None, w=190)
            self.ln(2)
        
        # Gráfico Fluxo de Caixa
        if 'fluxo_caixa' in graph_files:
            self.add_page()
            self.titulo_secao("3.3. Projeção Completa de Fluxo de Caixa (25 Anos)", nivel=2)
            self.image(graph_files['fluxo_caixa'], x=10, y=None, w=190)
            self.ln(2)
        
        # Adicionar tabela de métricas financeiras
        if hasattr(self.request, 'metricas_financeiras') and self.request.metricas_financeiras:
            self.titulo_secao("3.2. Resumo de Métricas de Viabilidade (25 Anos)", nivel=2)
            self.tabela_metricas_financeiras(self.request.metricas_financeiras.__dict__)
            self.ln(2)
        
        # Adicionar tabela de fluxo de caixa
        if hasattr(self.request, 'dados_fluxo_caixa') and self.request.dados_fluxo_caixa:
            self.tabela_fluxo_caixa(self.request.dados_fluxo_caixa)
    
    def tabela_metricas_financeiras(self, dados_metricas):
        """Desenha a tabela de métricas financeiras (VPL, TIR, Payback, etc.)."""
        self.set_font_safe('DejaVuSans', 'B', 10)
        self.set_fill_color(240, 248, 255)
        self.set_draw_color(200, 200, 200)
        
        LABEL_COL_WIDTH = 130
        VALUE_COL_WIDTH = 60
        
        # Mapeamento para exibir nomes em português
        nomes_portugues = {
            'vpl': 'Valor Presente Líquido (VPL)',
            'tir': 'Taxa Interna de Retorno (TIR)',
            'indice_lucratividade': 'Índice de Lucratividade (PI)',
            'payback_simples': 'Payback Simples',
            'payback_descontado': 'Payback Descontado',
            'lcoe': 'Custo de Energia (LCOE)',
            'roi_simples': '(ROI) Simples',
            'economia_total_nominal': 'Econ. Total Projetada (Nominal)',
            'economia_total_presente': 'Econ. Total Projetada (Presente)'
        }
        
        for chave, valor in dados_metricas.items():
            self.set_x(10)
            self.set_font_safe('DejaVuSans', 'B', 10)
            nome_exibicao = nomes_portugues.get(chave, chave.replace('_', ' ').title())
            self.cell(LABEL_COL_WIDTH, 7, nome_exibicao + ':', 1, 0, 'L', 1)
            
            self.set_font_safe('DejaVuSans', '', 10)
            self.cell(VALUE_COL_WIDTH, 7, valor, 1, new_x='LMARGIN', new_y='NEXT', align='R')
        
        self.ln(2)
    
    def tabela_fluxo_caixa(self, dados_fluxo):
        """Desenha a tabela de Fluxo de Caixa Nominal e Descontado (25 Anos)."""
        self.titulo_secao("3.4. Tabela de Fluxos de Caixa (25 Anos)", nivel=2)
        
        self.set_font_safe('DejaVuSans', 'B', 8)
        self.set_fill_color(200, 220, 255)
        
        col_widths = [12, 47, 47, 42, 42]
        headers = ['Ano', 'FC Nominal', 'FC Acum. Nom.', 'FC Descontado', 'FC Acum. Desc.']
        
        for i, header in enumerate(headers):
            self.cell(col_widths[i], 5, header, 1, 0, 'C', 1)
        self.ln()
        
        self.set_font_safe('DejaVuSans', '', 8)
        
        for i, row in enumerate(dados_fluxo):
            # Lógica de quebra de página para o Fluxo de Caixa
            if i > 0 and self.get_y() + 5 > self.page_break_trigger:
                self.add_page()
                self.titulo_secao("3.4. Tabela de Fluxos de Caixa (Continuação)", nivel=2)
                self.set_font_safe('DejaVuSans', 'B', 8)
                self.set_fill_color(200, 220, 255)
                for j, header in enumerate(headers):
                    self.cell(col_widths[j], 5, header, 1, 0, 'C', 1)
                self.ln()
                self.set_font_safe('DejaVuSans', '', 8)
            
            # Extrair valores do objeto ou da lista
            if hasattr(row, 'ano'):
                dados_row = [row.ano, row.fc_nominal, row.fc_acum_nominal, row.fc_descontado, row.fc_acum_descontado]
            else:
                dados_row = row
            
            for j, item in enumerate(dados_row):
                align = 'C'
                
                if j > 0:
                    formatted_item = f"R$ {item:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                    if item < 0:
                        formatted_item = formatted_item.replace("R$ -", "-R$ ")
                else:
                    formatted_item = str(item)
                
                self.cell(col_widths[j], 5, formatted_item, 1, 0, align)
            self.ln()
        
        self.ln(3)
    
    def gerar_analise_tecnica(self, graph_files: Dict[str, str]):
        """Gera análise técnica"""
        self.add_page()
        self.titulo_secao("4. ANÁLISE TÉCNICA E DESEMPENHO FV")
        
        # 4.1 Resumo Técnico e Parâmetros de Performance
        if hasattr(self.request, 'dados_tecnicos_resumo') and self.request.dados_tecnicos_resumo:
            self.titulo_secao("4.1. Resumo Técnico e Parâmetros de Performance", nivel=2)
            self.set_font_safe('DejaVuSans', '', 10)
            items = list(self.request.dados_tecnicos_resumo.items())
            metade = len(items) // 2
            col1_data = items[:metade]
            col2_data = items[metade:]
            
            LARGURA_ROTULO = 55
            LARGURA_VALOR = 40
            X_COLUNA_2 = 105
            
            for i in range(max(len(col1_data), len(col2_data))):
                # COLUNA 1
                if i < len(col1_data):
                    self.set_x(10)
                    chave1, valor1 = col1_data[i]
                    self.set_font_safe('DejaVuSans', 'B', 10)
                    self.cell(LARGURA_ROTULO, 6, f"{chave1}:", 0, 0, 'L')
                    self.set_font_safe('DejaVuSans', '', 10)
                    self.cell(LARGURA_VALOR, 6, valor1, 0, 0, 'L')
                
                # COLUNA 2
                if i < len(col2_data):
                    self.set_x(X_COLUNA_2)
                    chave2, valor2 = col2_data[i]
                    self.set_font_safe('DejaVuSans', 'B', 10)
                    chave_formatada = chave2.replace('(PR)7', '(PR)').replace('(PR)9', '(PR)')
                    self.cell(LARGURA_ROTULO, 6, f"{chave_formatada}:", 0, 0, 'L')
                    self.set_font_safe('DejaVuSans', '', 10)
                    self.cell(0, 6, valor2, 0, new_x='LMARGIN', new_y='NEXT', align='L')
                else:
                    self.ln(6)
            
            self.ln(3)
        
        # 4.2 Performance Detalhada por Inversor/MPPT
        if hasattr(self.request, 'dados_tecnicos_performance') and self.request.dados_tecnicos_performance:
            self.titulo_secao("4.2. Performance Detalhada por Inversor/MPPT", nivel=2)
            self.tabela_performance_inversor(self.request.dados_tecnicos_performance)
            self.ln(3)
        
        # 4.3 Componentes Principais
        self.titulo_secao("4.3. Componentes Principais", nivel=2)
        self.set_font_safe('DejaVuSans', '', 10)
        self.cell(95, 6, "Módulos:", 1, 0, 'L', 1)
        self.cell(95, 6, self.request.sistema.modulos, 1, new_x='LMARGIN', new_y='NEXT', align='L')
        self.cell(95, 6, "Inversor:", 1, 0, 'L', 1)
        self.cell(95, 6, self.request.sistema.inversor, 1, new_x='LMARGIN', new_y='NEXT', align='L')
        self.cell(95, 6, "Garantia dos Módulos:", 1, 0, 'L', 1)
        self.cell(95, 6, self.request.sistema.garantia_modulos, 1, new_x='LMARGIN', new_y='NEXT', align='L')
        
        # 4.4 Geração Estimada vs Consumo Mensal
        if 'mensal' in graph_files:
            self.titulo_secao("4.4. Geração Estimada vs Consumo Mensal", nivel=2)
            if self.y + 80 > self.page_break_trigger:
                self.add_page()
            self.image(graph_files['mensal'], x=10, y=None, w=190)
            self.ln(2)
            
            # Tabela comparativa mensal
            if hasattr(self.request, 'dados_tecnicos_mensal') and self.request.dados_tecnicos_mensal:
                self.tabela_comparativo_mensal(self.request.dados_tecnicos_mensal)
        
        # 4.5 Observações Técnicas
        self.titulo_secao("4.5. Observações Técnicas", nivel=2)
        self.set_font_safe('DejaVuSans', '', 10)
        texto_tecnico = (
            "A estrutura será dimensionada de acordo com o tipo de telhado e as normas NBR. "
            "Todos os componentes são homologados pelo INMETRO e o projeto passará por "
            "aprovação junto à distribuidora de energia local. A garantia de geração dos "
            f"módulos é de {self.request.sistema.garantia_modulos}."
        )
        self.multi_cell(0, 5, texto_tecnico)
        self.ln(5)
    
    def tabela_performance_inversor(self, dados_performance):
        """Desenha tabela de performance por inversor/MPPT"""
        self.set_font_safe('DejaVuSans', 'B', 9)
        self.set_fill_color(200, 220, 255)
        col_widths = [60, 30, 35, 35, 30]
        headers = ['Inversor/MPPT', 'kWp', 'Geração (kWh/ano)', 'Yield (kWh/kWp)', 'PR (%)']
        
        for i, header in enumerate(headers):
            self.cell(col_widths[i], 7, header, 1, 0, 'C', 1)
        self.ln()
        
        self.set_font_safe('DejaVuSans', '', 9)
        for row in dados_performance:
            # Verificar se é objeto ou lista
            if hasattr(row, 'inversor_mppt'):
                dados_row = [row.inversor_mppt, row.kwp, row.geracao_anual, row.yield_especifico, row.pr]
            else:
                dados_row = row
            
            for i, item in enumerate(dados_row):
                align = 'L' if i == 0 else 'R'
                self.cell(col_widths[i], 6, str(item), 1, 0, align)
            self.ln()
        
        self.ln(3)
    
    def tabela_comparativo_mensal(self, dados_mensal):
        """Desenha tabela comparativa mensal de consumo vs geração"""
        col_widths = [30, 50, 50, 50]
        headers = ['Mês', 'Consumo (kWh)', 'Geração (kWh)', 'Diferença (kWh)']
        CENTRAL_X = 15
        
        # Função interna para desenhar os headers
        def draw_headers():
            self.set_font_safe('DejaVuSans', 'B', 9)
            self.set_fill_color(200, 220, 255)
            self.set_draw_color(0, 0, 0)
            
            self.set_x(CENTRAL_X)
            for i, header in enumerate(headers):
                self.cell(col_widths[i], 7, header, 1, 0, 'C', 1)
            self.ln()
            self.set_font_safe('DejaVuSans', '', 9)
        
        draw_headers()
        
        for i, row in enumerate(dados_mensal):
            # Lógica de Quebra de Página
            if self.get_y() + 6 > self.page_break_trigger:
                self.add_page()
                self.titulo_secao("4.4. Geração Estimada vs Consumo Mensal (Continuação)", nivel=2)
                draw_headers()
            
            self.set_x(CENTRAL_X)
            
            # Verificar se é objeto ou lista
            if hasattr(row, 'mes'):
                dados_row = [row.mes, row.consumo, row.geracao, row.diferenca]
            else:
                dados_row = row
            
            for j, item in enumerate(dados_row):
                if j > 0:
                    formatted_item = f"{item:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                else:
                    formatted_item = str(item)
                
                align = 'L' if j == 0 else 'R'
                self.cell(col_widths[j], 6, formatted_item, 1, 0, align)
            self.ln()
        
        self.ln(3)
    
    def gerar_esclarecimentos(self):
        """Gera esclarecimentos"""
        self.add_page()
        self.titulo_secao("5. ESCLARECIMENTOS DAS INFORMAÇÕES APRESENTADAS")
        
        self.titulo_secao("5.1. Condições Comerciais, Impostos e Garantias", nivel=2)
        self.set_font_safe('DejaVuSans', 'B', 10)
        self.set_fill_color(240, 240, 240)
        
        dados_comerciais = [
            ("Impostos inclusos", "PIS/COFINS, IPI, ICMS e ISS"),
            ("Garantia dos Módulos (Mecânica)", "12 anos"),
            ("Garantia dos Módulos (Geração)", "25 anos"),
            ("Garantia do Inversor", "12 anos"),
            ("Garantia da Estrutura Metálica", "12 anos"),
            ("Prazo de Instalação", "a combinar"),
            ("Validade da Proposta", self.request.financeiro.validade)
        ]
        
        for rotulo, valor in dados_comerciais:
            self.set_font_safe('DejaVuSans', 'B', 10)
            self.cell(95, 6, rotulo + ":", 1, 0, 'L', 1)
            self.set_font_safe('DejaVuSans', '', 10)
            self.cell(95, 6, valor, 1, new_x='LMARGIN', new_y='NEXT', align='L')
        
        self.ln(5)
        
        self.set_font_safe('DejaVuSans', 'B', 10)
        self.multi_cell(0, 5, "Observação: A proposta está sujeita a alterações conforme observações na vistoria técnica.")
        self.ln(5)
    
    def gerar_aceite(self):
        """Gera termo de aceite"""
        self.add_page()
        self.titulo_secao("6. ACEITE DA PROPOSTA")
        
        self.set_font_safe('DejaVuSans', '', 11)
        texto_intro = (
            "Com base nas informações disponibilizadas, no escopo dos serviços, e durante os demais "
            "entendimentos, acreditamos que a nossa solução atenda a melhor relação custo benefício "
            "para vossa aplicação. Ficamos à disposição para quaisquer esclarecimentos e aguardamos vosso retorno."
        )
        self.multi_cell(0, 7, texto_intro, 0, 'J')
        self.ln(5)
        
        self.set_font_safe('DejaVuSans', 'B', 11)
        self.cell(0, 10, "Cordialmente,", 0, new_x='LMARGIN', new_y='NEXT', align='L')
        self.ln(15)
        
        # Assinatura da Empresa
        self.set_line_width(0.4)
        self.line(10, self.y, 100, self.y)
        self.ln(2)
        self.set_font_safe('DejaVuSans', 'B', 10)
        self.cell(0, 6, "Nome:", 0, new_x='LMARGIN', new_y='NEXT', align='L')
        self.cell(0, 6, "Diretor", 0, new_x='LMARGIN', new_y='NEXT', align='L')
        self.ln(15)
        
        # Autorização do Cliente
        self.set_font_safe('DejaVuSans', '', 11)
        self.multi_cell(0, 7, "Estou de acordo com as condições deste orçamento e autorizo o início dos serviços.", 0, 'L')
        self.ln(5)
        
        # Local e Data
        self.set_font_safe('DejaVuSans', '', 10)
        largura_data = 190
        self.set_line_width(0.4)
        
        self.cell(largura_data/3, 7, f'{self.request.empresa.nome.split()[0].upper()},', 0, 0, 'R')
        self.cell(10, 7, 'de', 0, 0, 'C')
        self.cell(largura_data/3, 7, '', 'B', 0, 'C')
        self.cell(10, 7, 'de 2025', 0, new_x='LMARGIN', new_y='NEXT', align='L')
        self.ln(15)
        
        # Assinatura do Cliente
        self.set_line_width(0.4)
        self.line(10, self.y, 190, self.y)
        self.ln(2)
        self.set_font_safe('DejaVuSans', 'B', 10)
        self.cell(0, 6, f'Nome: {self.request.cliente.nome}', 0, new_x='LMARGIN', new_y='NEXT', align='L')
        self.cell(0, 6, "CPF:", 0, new_x='LMARGIN', new_y='NEXT', align='L')
        self.ln(5)