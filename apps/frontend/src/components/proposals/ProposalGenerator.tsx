import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Download, FileText, Eye } from 'lucide-react';
import { useProposalGenerator } from '../../hooks/useProposalGenerator';
import { PVDimensioning } from '../../types/dimensioning';

interface ProposalGeneratorProps {
  dimensioning: PVDimensioning;
  onGenerated?: (proposalId: string) => void;
}

interface ServiceItem {
  servico: string;
  descricao: string;
  valor: number;
}

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    servico: 'Projeto Elétrico',
    descricao: 'Elaboração de projeto elétrico e ART',
    valor: 1500
  },
  {
    servico: 'Estrutura de Fixação',
    descricao: 'Estrutura metálica para fixação dos módulos',
    valor: 2500
  },
  {
    servico: 'Mão de Obra',
    descricao: 'Instalação completa do sistema',
    valor: 2000
  },
  {
    servico: 'Homologação',
    descricao: 'Processo de homologação na concessionária',
    valor: 875
  }
];

export const ProposalGenerator: React.FC<ProposalGeneratorProps> = ({
  dimensioning,
  onGenerated
}) => {
  const [showPreview, setShowPreview] = useState(false);
  
  const {
    generateProposal,
    previewProposal,
    isLoading,
    error,
    previewData
  } = useProposalGenerator();

  const handleGenerateProposal = async () => {
    try {
      const proposalData = prepareProposalData();
      const blob = await generateProposal(proposalData);
      
      // Download do PDF
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposta-${dimensioning.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onGenerated?.(dimensioning.id);
    } catch (error) {
      console.error('Erro ao gerar proposta:', error);
    }
  };

  const handlePreview = async () => {
    try {
      const proposalData = prepareProposalData();
      await previewProposal(proposalData);
      setShowPreview(true);
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
    }
  };

  const prepareProposalData = () => {
    const customer = dimensioning.data.customer;
    const location = dimensioning.data.location;
    const results = dimensioning.data.results || {};
    const financial = dimensioning.data.financial || {};
    const systemParameters = dimensioning.data.systemParameters || {};

    // Calcular totais financeiros
    const custoEquipamento = financial.custoEquipamento || 0;
    const custoMateriais = financial.custoMateriais || 0;
    const custoMaoDeObra = financial.custoMaoDeObra || 0;
    const bdi = financial.bdi || 20;
    
    const subtotal = custoEquipamento + custoMateriais + custoMaoDeObra;
    const capex = subtotal * (1 + bdi / 100);

    // Calcular total dos serviços
    const totalServices = DEFAULT_SERVICES.reduce((sum, service) => sum + service.valor, 0);

    return {
      dimensioningId: dimensioning.id,
      customer: {
        name: customer.name || 'Cliente não informado',
        document: 'CPF/CNPJ não informado',
        address: customer.address || location?.address || 'Endereço não informado',
        phone: customer.phone || '',
        email: customer.email || '',
        company: customer.company || ''
      },
      technical: {
        potenciaSistema: systemParameters.potenciaModulo && systemParameters.numeroModulos 
          ? (systemParameters.potenciaModulo * systemParameters.numeroModulos) / 1000 
          : (results.potenciaSistema || 10),
        numeroModulos: systemParameters.numeroModulos || Math.round((results.potenciaSistema || 10) * 1000 / 550),
        numeroInversores: dimensioning.data.inverters?.length || 1,
        latitude: location?.latitude || -22.841432,
        longitude: location?.longitude || -51.957627,
        performanceRatio: results.performanceRatio || 92.71,
        yield: results.yield || 1511.2,
        geracaoAnual: results.geracaoAnual || 22103,
        consumoAbatido: results.consumoAbatido || 100,
        autoconsumo: results.autoconsumo || 1105
      },
      financial: {
        capex: capex + totalServices,
        vpl: results.vpl || 246890.52,
        tir: results.tir || 50.23,
        payback: results.payback || 2.19,
        roi: results.roi || 3108.08,
        lcoe: results.lcoe,
        economiaProjetada: results.economiaProjetada || 897571.48,
        vidaUtil: financial.vidaUtil || 25
      },
      services: DEFAULT_SERVICES
    };
  };

  if (showPreview && previewData) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Preview da Proposta</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                Voltar
              </Button>
              <Button
                onClick={handleGenerateProposal}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Gerar PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dados do Cliente */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Dados do Cliente</h3>
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
              <div><strong>Nome:</strong> {previewData.customer.name}</div>
              <div><strong>Documento:</strong> {previewData.customer.document}</div>
              <div><strong>Endereço:</strong> {previewData.customer.address}</div>
              <div><strong>Telefone:</strong> {previewData.customer.phone || 'N/A'}</div>
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Resumo Financeiro</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-100 rounded text-center">
                <div className="text-xl font-bold text-blue-800">
                  R$ {previewData.financial.capex.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-blue-600">Investimento</div>
              </div>
              <div className="p-4 bg-green-100 rounded text-center">
                <div className="text-xl font-bold text-green-800">
                  {previewData.financial.tir.toFixed(2)}%
                </div>
                <div className="text-sm text-green-600">TIR</div>
              </div>
              <div className="p-4 bg-purple-100 rounded text-center">
                <div className="text-xl font-bold text-purple-800">
                  {previewData.financial.payback.toFixed(2)} anos
                </div>
                <div className="text-sm text-purple-600">Payback</div>
              </div>
            </div>
          </div>

          {/* Dados Técnicos */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Dados Técnicos</h3>
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
              <div><strong>Potência:</strong> {previewData.technical.potenciaSistema.toFixed(2)} kWp</div>
              <div><strong>Módulos:</strong> {previewData.technical.numeroModulos}</div>
              <div><strong>Inversores:</strong> {previewData.technical.numeroInversores}</div>
              <div><strong>Performance Ratio:</strong> {previewData.technical.performanceRatio}%</div>
            </div>
          </div>

          {/* Serviços */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Serviços Inclusos</h3>
            <div className="border rounded">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3">Serviço</th>
                    <th className="text-left p-3">Descrição</th>
                    <th className="text-right p-3">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.services.map((service: any, index: number) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{service.servico}</td>
                      <td className="p-3">{service.descricao}</td>
                      <td className="p-3 text-right">
                        R$ {service.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td colSpan={2} className="p-3">Total</td>
                    <td className="p-3 text-right">
                      R$ {previewData.services.reduce((sum: number, service: any) => sum + service.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <FileText className="w-6 h-6 text-green-600" />
          Proposta Comercial
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Gere sua proposta profissional em PDF
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="text-center">
          <Button
            onClick={handleGenerateProposal}
            disabled={isLoading || dimensioning.status !== 'calculated'}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Gerando Proposta...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-3" />
                Baixar Proposta Comercial
              </>
            )}
          </Button>
          {dimensioning.status === 'calculated' && (
            <p className="text-sm text-green-600 mt-3">
              ✓ Dimensionamento pronto para geração da proposta
            </p>
          )}
        </div>
          <div className="flex gap-2">
            {/* <Button
              variant="outline"
              onClick={handlePreview}
              disabled={isLoading || dimensioning.status !== 'calculated'}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              Preview
            </Button> */}
            <Button
              onClick={handleGenerateProposal}
              disabled={isLoading || dimensioning.status !== 'calculated'}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Gerar PDF
            </Button>
        </div>

        {dimensioning.status !== 'calculated' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
            O dimensionamento precisa ser calculado antes de gerar a proposta.
          </div>
        )}
      </CardContent>
    </Card>
  );
};