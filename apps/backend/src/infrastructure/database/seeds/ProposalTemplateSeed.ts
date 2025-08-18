import { ProposalTemplate } from '../../../domain/entities/ProposalTemplate';
import { v4 as uuidv4 } from 'uuid';

export const defaultProposalTemplates: Omit<ProposalTemplate, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Proposta PV Residencial Padrão',
    description: 'Template padrão para propostas de sistemas fotovoltaicos residenciais',
    category: 'PV',
    isDefault: true,
    structure: [
      {
        id: uuidv4(),
        type: 'cover',
        title: 'Capa da Proposta',
        content: `
          <div class="cover-page">
            <div class="header">
              <img src="{{company_logo}}" alt="{{company_name}}" class="logo" />
              <div class="company-info">
                <h1>{{company_name}}</h1>
                <p>{{company_address}}</p>
                <p>{{company_phone}} | {{company_email}}</p>
              </div>
            </div>
            
            <div class="main-content">
              <h1>PROPOSTA COMERCIAL</h1>
              <h2>Sistema de Energia Solar Fotovoltaica</h2>
              
              <div class="client-info">
                <h3>Cliente: {{client_name}}</h3>
                <p>{{client_address}}</p>
                <p>{{client_phone}} | {{client_email}}</p>
              </div>
              
              <div class="project-summary">
                <div class="summary-item">
                  <strong>Potência do Sistema:</strong> {{system_size}} kWp
                </div>
                <div class="summary-item">
                  <strong>Geração Estimada:</strong> {{generation_estimate}} kWh/mês
                </div>
                <div class="summary-item">
                  <strong>Economia Anual:</strong> R$ {{annual_savings}}
                </div>
                <div class="summary-item">
                  <strong>Investimento:</strong> R$ {{total_investment}}
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>Data da Proposta: {{proposal_date}}</p>
              <p>Válida até: {{validity_date}}</p>
            </div>
          </div>
        `,
        order: 1,
        isRequired: true,
        showInPreview: true
      },
      {
        id: uuidv4(),
        type: 'introduction',
        title: 'Introdução',
        content: `
          <div class="introduction-section">
            <h2>Sobre a Energia Solar Fotovoltaica</h2>
            
            <p>A energia solar fotovoltaica é uma das fontes de energia mais limpa e sustentável disponível atualmente. 
            Ao converter a luz solar diretamente em eletricidade, os sistemas fotovoltaicos oferecem uma solução 
            eficiente e econômica para reduzir significativamente os custos com energia elétrica.</p>
            
            <h3>Vantagens do Sistema Solar:</h3>
            <ul>
              <li><strong>Economia imediata:</strong> Reduza até 95% da sua conta de luz</li>
              <li><strong>Investimento seguro:</strong> Retorno garantido em 3 a 6 anos</li>
              <li><strong>Sustentabilidade:</strong> Energia 100% limpa e renovável</li>
              <li><strong>Valorização:</strong> Aumenta o valor do seu imóvel</li>
              <li><strong>Durabilidade:</strong> Sistema com vida útil de 25+ anos</li>
              <li><strong>Baixa manutenção:</strong> Custos mínimos de operação</li>
            </ul>
            
            <h3>Sobre Nossa Empresa</h3>
            <p>{{company_description}}</p>
            
            <p>Com equipamentos de primeira linha e equipe técnica especializada, garantimos a máxima qualidade 
            e eficiência do seu sistema de energia solar.</p>
          </div>
        `,
        order: 2,
        isRequired: false,
        showInPreview: true
      },
      {
        id: uuidv4(),
        type: 'technical',
        title: 'Especificações Técnicas',
        content: `
          <div class="technical-section">
            <h2>Especificações do Sistema</h2>
            
            <div class="system-overview">
              <h3>Resumo do Sistema</h3>
              <table class="specs-table">
                <tr>
                  <td><strong>Potência Total:</strong></td>
                  <td>{{system_size}} kWp</td>
                </tr>
                <tr>
                  <td><strong>Módulos Fotovoltaicos:</strong></td>
                  <td>{{modules_quantity}}x {{module_power}}W {{module_brand}} {{module_model}}</td>
                </tr>
                <tr>
                  <td><strong>Inversor:</strong></td>
                  <td>{{inverter_quantity}}x {{inverter_brand}} {{inverter_model}} ({{inverter_power}}W)</td>
                </tr>
                <tr>
                  <td><strong>Área Necessária:</strong></td>
                  <td>{{installation_area}} m²</td>
                </tr>
                <tr>
                  <td><strong>Orientação:</strong></td>
                  <td>{{orientation}}</td>
                </tr>
                <tr>
                  <td><strong>Inclinação:</strong></td>
                  <td>{{tilt_angle}}°</td>
                </tr>
              </table>
            </div>
            
            <div class="performance-data">
              <h3>Dados de Performance</h3>
              <table class="performance-table">
                <tr>
                  <td><strong>Geração Mensal Estimada:</strong></td>
                  <td>{{generation_estimate}} kWh</td>
                </tr>
                <tr>
                  <td><strong>Geração Anual Estimada:</strong></td>
                  <td>{{annual_generation}} kWh</td>
                </tr>
                <tr>
                  <td><strong>Fator de Capacidade:</strong></td>
                  <td>{{capacity_factor}}%</td>
                </tr>
                <tr>
                  <td><strong>Performance Ratio:</strong></td>
                  <td>{{performance_ratio}}%</td>
                </tr>
                <tr>
                  <td><strong>Irradiação Local:</strong></td>
                  <td>{{solar_irradiation}} kWh/m²/dia</td>
                </tr>
              </table>
            </div>
            
            <div class="equipment-specs">
              <h3>Especificações dos Equipamentos</h3>
              
              <h4>Módulos Fotovoltaicos</h4>
              <ul>
                <li><strong>Marca/Modelo:</strong> {{module_brand}} {{module_model}}</li>
                <li><strong>Potência:</strong> {{module_power}}W</li>
                <li><strong>Eficiência:</strong> {{module_efficiency}}%</li>
                <li><strong>Garantia:</strong> {{module_warranty}} anos</li>
                <li><strong>Certificações:</strong> {{module_certifications}}</li>
              </ul>
              
              <h4>Inversor</h4>
              <ul>
                <li><strong>Marca/Modelo:</strong> {{inverter_brand}} {{inverter_model}}</li>
                <li><strong>Potência:</strong> {{inverter_power}}W</li>
                <li><strong>Eficiência:</strong> {{inverter_efficiency}}%</li>
                <li><strong>Garantia:</strong> {{inverter_warranty}} anos</li>
                <li><strong>Monitoramento:</strong> {{monitoring_system}}</li>
              </ul>
            </div>
            
            <div class="installation-info">
              <h3>Informações da Instalação</h3>
              <p><strong>Estrutura de Fixação:</strong> {{mounting_structure}}</p>
              <p><strong>Cabeamento:</strong> {{cable_specifications}}</p>
              <p><strong>Proteções:</strong> {{protection_devices}}</p>
              <p><strong>Sistema de Monitoramento:</strong> {{monitoring_description}}</p>
            </div>
          </div>
        `,
        order: 3,
        isRequired: true,
        showInPreview: true
      },
      {
        id: uuidv4(),
        type: 'financial',
        title: 'Análise Financeira',
        content: `
          <div class="financial-section">
            <h2>Análise Financeira do Investimento</h2>
            
            <div class="investment-summary">
              <h3>Resumo do Investimento</h3>
              <table class="financial-table">
                <tr>
                  <td><strong>Investimento Total:</strong></td>
                  <td>R$ {{total_investment}}</td>
                </tr>
                <tr>
                  <td><strong>Economia Mensal Estimada:</strong></td>
                  <td>R$ {{monthly_savings}}</td>
                </tr>
                <tr>
                  <td><strong>Economia Anual Estimada:</strong></td>
                  <td>R$ {{annual_savings}}</td>
                </tr>
                <tr>
                  <td><strong>Payback Simples:</strong></td>
                  <td>{{payback_period}} anos</td>
                </tr>
                <tr>
                  <td><strong>Economia em 25 anos:</strong></td>
                  <td>R$ {{total_savings_25_years}}</td>
                </tr>
              </table>
            </div>
            
            <div class="payment-conditions">
              <h3>Condições de Pagamento</h3>
              <p>{{payment_conditions}}</p>
              
              <div class="payment-options">
                {{#if payment_option_cash}}
                <div class="payment-option">
                  <h4>À Vista</h4>
                  <p><strong>Valor:</strong> R$ {{cash_price}}</p>
                  <p><strong>Desconto:</strong> {{cash_discount}}%</p>
                </div>
                {{/if}}
                
                {{#if payment_option_installments}}
                <div class="payment-option">
                  <h4>Parcelado</h4>
                  <p><strong>Entrada:</strong> R$ {{down_payment}} ({{down_payment_percent}}%)</p>
                  <p><strong>Parcelas:</strong> {{installments_number}}x R$ {{installment_value}}</p>
                </div>
                {{/if}}
                
                {{#if payment_option_financing}}
                <div class="payment-option">
                  <h4>Financiamento</h4>
                  <p><strong>Financiado:</strong> {{financing_percent}}% do valor</p>
                  <p><strong>Condições:</strong> {{financing_conditions}}</p>
                </div>
                {{/if}}
              </div>
            </div>
            
            <div class="roi-analysis">
              <h3>Análise de Retorno</h3>
              
              <div class="roi-metrics">
                <div class="roi-item">
                  <strong>VPL (Valor Presente Líquido):</strong>
                  <span>R$ {{npv}}</span>
                </div>
                <div class="roi-item">
                  <strong>TIR (Taxa Interna de Retorno):</strong>
                  <span>{{irr}}% a.a.</span>
                </div>
                <div class="roi-item">
                  <strong>Payback Descontado:</strong>
                  <span>{{discounted_payback}} anos</span>
                </div>
              </div>
              
              <p class="roi-explanation">
                Com uma TIR de {{irr}}% ao ano, o investimento em energia solar apresenta 
                rentabilidade muito superior aos principais investimentos do mercado financeiro.
              </p>
            </div>
            
            <div class="comparison-table">
              <h3>Comparativo de Investimentos</h3>
              <table class="comparison">
                <thead>
                  <tr>
                    <th>Investimento</th>
                    <th>Rentabilidade Anual</th>
                    <th>Risco</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="highlight">
                    <td><strong>Energia Solar</strong></td>
                    <td><strong>{{irr}}%</strong></td>
                    <td><strong>Baixíssimo</strong></td>
                  </tr>
                  <tr>
                    <td>Poupança</td>
                    <td>6,5%</td>
                    <td>Baixo</td>
                  </tr>
                  <tr>
                    <td>CDI</td>
                    <td>11,5%</td>
                    <td>Baixo</td>
                  </tr>
                  <tr>
                    <td>Tesouro IPCA+</td>
                    <td>6,0%</td>
                    <td>Baixo</td>
                  </tr>
                  <tr>
                    <td>IBOVESPA</td>
                    <td>7,8%</td>
                    <td>Alto</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `,
        order: 4,
        isRequired: true,
        showInPreview: true
      },
      {
        id: uuidv4(),
        type: 'custom',
        title: 'Garantias e Serviços',
        content: `
          <div class="guarantees-section">
            <h2>Garantias e Serviços Inclusos</h2>
            
            <div class="guarantees">
              <h3>Garantias</h3>
              <ul>
                <li><strong>Módulos Fotovoltaicos:</strong> {{module_warranty}} anos de garantia contra defeitos de fabricação</li>
                <li><strong>Performance dos Módulos:</strong> {{performance_warranty}} anos de garantia de performance (mín. 80%)</li>
                <li><strong>Inversor:</strong> {{inverter_warranty}} anos de garantia contra defeitos</li>
                <li><strong>Instalação:</strong> {{installation_warranty}} anos de garantia dos serviços de instalação</li>
                <li><strong>Estruturas de Fixação:</strong> {{structure_warranty}} anos contra corrosão e defeitos</li>
              </ul>
            </div>
            
            <div class="included-services">
              <h3>Serviços Inclusos</h3>
              <ul>
                <li>✅ Projeto técnico detalhado</li>
                <li>✅ Análise de viabilidade técnica</li>
                <li>✅ Aprovação junto à concessionária</li>
                <li>✅ Instalação completa do sistema</li>
                <li>✅ Comissionamento e testes</li>
                <li>✅ Monitoramento remoto por 1 ano</li>
                <li>✅ Treinamento para operação do sistema</li>
                <li>✅ Suporte técnico especializado</li>
                <li>✅ Manutenção preventiva no primeiro ano</li>
              </ul>
            </div>
            
            <div class="certifications">
              <h3>Certificações e Qualificações</h3>
              <ul>
                <li>{{company_certifications}}</li>
                <li>Equipamentos certificados pelo INMETRO</li>
                <li>Profissionais certificados pelo CREA</li>
                <li>Seguimos todas as normas ABNT vigentes</li>
              </ul>
            </div>
            
            <div class="support">
              <h3>Suporte Pós-Venda</h3>
              <p>Oferecemos suporte técnico completo através de:</p>
              <ul>
                <li>📞 <strong>Telefone:</strong> {{support_phone}}</li>
                <li>📧 <strong>Email:</strong> {{support_email}}</li>
                <li>💬 <strong>WhatsApp:</strong> {{support_whatsapp}}</li>
                <li>🌐 <strong>Portal do Cliente:</strong> {{customer_portal_url}}</li>
              </ul>
            </div>
          </div>
        `,
        order: 5,
        isRequired: false,
        showInPreview: true
      }
    ],
    variables: [
      // Variáveis da empresa
      { id: uuidv4(), name: 'company_name', displayName: 'Nome da Empresa', type: 'text', isRequired: true, category: 'company', defaultValue: '' },
      { id: uuidv4(), name: 'company_logo', displayName: 'Logo da Empresa', type: 'image', isRequired: false, category: 'company' },
      { id: uuidv4(), name: 'company_address', displayName: 'Endereço da Empresa', type: 'text', isRequired: false, category: 'company' },
      { id: uuidv4(), name: 'company_phone', displayName: 'Telefone da Empresa', type: 'text', isRequired: false, category: 'company' },
      { id: uuidv4(), name: 'company_email', displayName: 'Email da Empresa', type: 'text', isRequired: false, category: 'company' },
      
      // Variáveis do cliente
      { id: uuidv4(), name: 'client_name', displayName: 'Nome do Cliente', type: 'text', isRequired: true, category: 'client' },
      { id: uuidv4(), name: 'client_address', displayName: 'Endereço do Cliente', type: 'text', isRequired: false, category: 'client' },
      { id: uuidv4(), name: 'client_phone', displayName: 'Telefone do Cliente', type: 'text', isRequired: false, category: 'client' },
      { id: uuidv4(), name: 'client_email', displayName: 'Email do Cliente', type: 'text', isRequired: false, category: 'client' },
      
      // Variáveis do projeto
      { id: uuidv4(), name: 'system_size', displayName: 'Potência do Sistema (kWp)', type: 'calculated', isRequired: true, category: 'calculation' },
      { id: uuidv4(), name: 'generation_estimate', displayName: 'Geração Mensal Estimada (kWh)', type: 'calculated', isRequired: true, category: 'calculation' },
      { id: uuidv4(), name: 'annual_generation', displayName: 'Geração Anual Estimada (kWh)', type: 'calculated', isRequired: true, category: 'calculation' },
      { id: uuidv4(), name: 'total_investment', displayName: 'Investimento Total (R$)', type: 'calculated', isRequired: true, category: 'calculation' },
      { id: uuidv4(), name: 'annual_savings', displayName: 'Economia Anual (R$)', type: 'calculated', isRequired: true, category: 'calculation' },
      { id: uuidv4(), name: 'payback_period', displayName: 'Período de Payback (anos)', type: 'calculated', isRequired: true, category: 'calculation' },
      
      // Variáveis de equipamentos
      { id: uuidv4(), name: 'modules_quantity', displayName: 'Quantidade de Módulos', type: 'number', isRequired: false, category: 'project' },
      { id: uuidv4(), name: 'module_power', displayName: 'Potência do Módulo (W)', type: 'number', isRequired: false, category: 'project' },
      { id: uuidv4(), name: 'module_brand', displayName: 'Marca do Módulo', type: 'text', isRequired: false, category: 'project' },
      { id: uuidv4(), name: 'module_model', displayName: 'Modelo do Módulo', type: 'text', isRequired: false, category: 'project' },
      { id: uuidv4(), name: 'inverter_brand', displayName: 'Marca do Inversor', type: 'text', isRequired: false, category: 'project' },
      { id: uuidv4(), name: 'inverter_model', displayName: 'Modelo do Inversor', type: 'text', isRequired: false, category: 'project' },
      
      // Variáveis de datas
      { id: uuidv4(), name: 'proposal_date', displayName: 'Data da Proposta', type: 'date', isRequired: true, category: 'project', defaultValue: new Date().toISOString() },
      { id: uuidv4(), name: 'validity_date', displayName: 'Data de Validade', type: 'date', isRequired: false, category: 'project' }
    ],
    styling: {
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      accentColor: '#3b82f6',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontSize: {
        title: 32,
        heading: 24,
        body: 14,
        small: 12
      },
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      },
      logo: {
        position: 'left' as const,
        size: 'medium' as const,
        url: ''
      },
      watermark: {
        enabled: false,
        opacity: 0.1
      }
    }
  },
  
  // Template para BESS
  {
    name: 'Proposta BESS Padrão',
    description: 'Template padrão para propostas de sistemas de armazenamento de energia',
    category: 'BESS',
    isDefault: true,
    structure: [
      {
        id: uuidv4(),
        type: 'cover',
        title: 'Capa da Proposta BESS',
        content: `
          <div class="cover-page bess-theme">
            <div class="header">
              <img src="{{company_logo}}" alt="{{company_name}}" class="logo" />
              <div class="company-info">
                <h1>{{company_name}}</h1>
                <p>{{company_address}}</p>
                <p>{{company_phone}} | {{company_email}}</p>
              </div>
            </div>
            
            <div class="main-content">
              <h1>PROPOSTA COMERCIAL</h1>
              <h2>Sistema de Armazenamento de Energia (BESS)</h2>
              
              <div class="client-info">
                <h3>Cliente: {{client_name}}</h3>
                <p>{{client_address}}</p>
                <p>{{client_phone}} | {{client_email}}</p>
              </div>
              
              <div class="project-summary">
                <div class="summary-item">
                  <strong>Capacidade de Armazenamento:</strong> {{battery_capacity}} kWh
                </div>
                <div class="summary-item">
                  <strong>Potência:</strong> {{system_power}} kW
                </div>
                <div class="summary-item">
                  <strong>Autonomia:</strong> {{autonomy_hours}} horas
                </div>
                <div class="summary-item">
                  <strong>Economia Anual:</strong> R$ {{annual_savings}}
                </div>
                <div class="summary-item">
                  <strong>Investimento:</strong> R$ {{total_investment}}
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>Data da Proposta: {{proposal_date}}</p>
              <p>Válida até: {{validity_date}}</p>
            </div>
          </div>
        `,
        order: 1,
        isRequired: true,
        showInPreview: true
      }
      // Mais seções específicas para BESS podem ser adicionadas aqui
    ],
    variables: [
      { id: uuidv4(), name: 'battery_capacity', displayName: 'Capacidade da Bateria (kWh)', type: 'number', isRequired: true, category: 'project' },
      { id: uuidv4(), name: 'system_power', displayName: 'Potência do Sistema (kW)', type: 'number', isRequired: true, category: 'project' },
      { id: uuidv4(), name: 'autonomy_hours', displayName: 'Autonomia (horas)', type: 'number', isRequired: true, category: 'project' }
      // Mais variáveis específicas para BESS
    ],
    styling: {
      primaryColor: '#059669',
      secondaryColor: '#047857',
      accentColor: '#10b981',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontSize: {
        title: 32,
        heading: 24,
        body: 14,
        small: 12
      },
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      },
      logo: {
        position: 'left' as const,
        size: 'medium' as const,
        url: ''
      },
      watermark: {
        enabled: false,
        opacity: 0.1
      }
    }
  }
];