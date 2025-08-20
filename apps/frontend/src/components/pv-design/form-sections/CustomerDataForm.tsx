import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User, Search, Loader2 } from 'lucide-react';
import { useClients } from '@/hooks/client-hooks';
import { apiClient } from '@/lib/api';

interface CustomerDataFormProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
  isLeadLocked?: boolean; // Nova prop para bloquear edição do lead
}

const CustomerDataForm: React.FC<CustomerDataFormProps> = ({ formData, onFormChange, isLeadLocked = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [initialLeads, setInitialLeads] = useState<any[]>([]);
  

  // Usar dados reais dos hooks
  const { data: clientsData } = useClients({ pageSize: 100 }); // Buscar mais clientes para busca

  // Função para carregar os primeiros 5 leads
  const loadInitialLeads = useCallback(async () => {
    try {
      const leadsResponse = await apiClient.leads.list({ 
        pageSize: 5 
      });
      
      let leadsData = null;
      if (leadsResponse?.data?.data?.leads) {
        leadsData = leadsResponse.data.data.leads;
      } else if (leadsResponse?.data?.data && Array.isArray(leadsResponse.data.data)) {
        leadsData = leadsResponse.data.data;
      } else if (leadsResponse?.data && Array.isArray(leadsResponse.data)) {
        leadsData = leadsResponse.data;
      }
      
      if (leadsData && Array.isArray(leadsData)) {
        const formattedLeads = leadsData
          .filter(lead => lead && lead.name && lead.id)
          .map(lead => ({
            ...lead,
            type: 'lead',
            displayName: lead.name,
            displayInfo: lead.email || lead.company || 'Lead'
          }));
        setInitialLeads(formattedLeads);
      }
    } catch (error) {
      console.warn('Erro ao carregar leads iniciais:', error);
      setInitialLeads([]);
    }
  }, []);

  // Carregar leads iniciais na montagem do componente
  useEffect(() => {
    loadInitialLeads();
  }, [loadInitialLeads]);

  const performSearch = useCallback(async () => {
    if (searchTerm.length < 2) {
      setSearchResults(initialLeads);
      return;
    }

    setIsSearching(true);
    
    try {
      const results: any[] = [];
      const searchLower = searchTerm.toLowerCase();
      
      // Buscar leads via API com tratamento de erro melhorado
      try {
        const leadsResponse = await apiClient.leads.list({ 
          searchTerm: searchTerm.trim(),
          pageSize: 20 
        });
        
        // console.log('Response structure:', leadsResponse.data);
        
        // Tentar diferentes estruturas de resposta
        let leadsData = null;
        if (leadsResponse?.data?.data?.leads) {
          leadsData = leadsResponse.data.data.leads;
        } else if (leadsResponse?.data?.data && Array.isArray(leadsResponse.data.data)) {
          leadsData = leadsResponse.data.data;
        } else if (leadsResponse?.data && Array.isArray(leadsResponse.data)) {
          leadsData = leadsResponse.data;
        }
        
        if (leadsData && Array.isArray(leadsData)) {
          leadsData.forEach((lead: any) => {
            if (lead && lead.name && lead.id) {
              results.push({
                ...lead,
                type: 'lead',
                displayName: lead.name,
                displayInfo: lead.email || lead.company || 'Lead'
              });
            }
          });
        }
      } catch (error) {
        console.warn('Erro ao buscar leads:', error);
        // Não interromper a busca se leads falharem
      }

      // Buscar clientes dos dados já carregados com validação melhorada
      if (clientsData?.clients && Array.isArray(clientsData.clients)) {
        clientsData.clients.forEach((client: any) => {
          try {
            if (client && client.name && client.id) {
              const nameMatch = client.name.toLowerCase().includes(searchLower);
              const emailMatch = client.email && client.email.toLowerCase().includes(searchLower);
              const companyMatch = client.company && client.company.toLowerCase().includes(searchLower);
              
              if (nameMatch || emailMatch || companyMatch) {
                results.push({
                  ...client,
                  type: 'client',
                  displayName: client.name,
                  displayInfo: client.email || client.company || 'Cliente'
                });
              }
            }
          } catch (clientError) {
            console.warn('Erro ao processar cliente:', clientError);
          }
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Erro crítico na busca:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, clientsData?.clients, initialLeads]);


  useEffect(() => {
    const debounce = setTimeout(() => {
      performSearch();
    }, 300);
    return () => clearTimeout(debounce);
  }, [performSearch]);


  useEffect(() => {
    if (formData.customer?.name) {
      setSearchTerm(formData.customer.name);
    }
  }, [formData.customer]);


  const handleSelectCustomer = (customer: any) => {
    try {
      // Validar se o cliente possui dados necessários
      if (!customer || !customer.id || !customer.displayName) {
        // console.error('Cliente inválido selecionado:', customer);
        return;
      }

      // Priorizar lead sobre customer
      if (customer.type === 'lead') {
        onFormChange('lead', {
          id: customer.id,
          name: customer.displayName,
          email: customer.email || '',
          phone: customer.phone || '',
          company: customer.company || '',
          address: customer.address || '',
          type: customer.type
        });
        // Manter compatibilidade com customer para não quebrar código existente
        onFormChange('customer', {
          id: customer.id,
          name: customer.displayName,
          email: customer.email || '',
          phone: customer.phone || '',
          company: customer.company || '',
          address: customer.address || '',
          type: customer.type
        });
      } else {
        onFormChange('customer', {
          id: customer.id,
          name: customer.displayName,
          email: customer.email || '',
          phone: customer.phone || '',
          company: customer.company || '',
          address: customer.address || '',
          type: customer.type
        });
        // Limpar lead se um cliente foi selecionado
        onFormChange('lead', null);
      }
      
      // Definir grupo tarifário baseado no tipo do cliente
      if (customer.clientType === 'industrial' || customer.clientType === 'commercial') {
        onFormChange('grupoTarifario', 'A');
      } else {
        onFormChange('grupoTarifario', 'B');
      }

      setSearchTerm(customer.displayName);
      setIsDropdownOpen(false);
    } catch (error) {
      // console.error('Erro ao selecionar cliente:', error);
      // Manter dropdown aberto em caso de erro
    }
  };


  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <User className="w-5 h-5 text-blue-400" /> 
          Dados do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 relative">
          <Label htmlFor="customer-search" className="text-foreground flex items-center gap-2">
            {isLeadLocked ? 'Lead Selecionado (Do CRM)' : 'Buscar Lead (Obrigatório)'}
            <span className="text-red-500 text-sm">*</span>
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="customer-search"
              type="text"
              placeholder={isLeadLocked ? "Lead selecionado automaticamente" : "Digite para buscar um lead existente (obrigatório)"}
              value={searchTerm}
              onChange={(e) => {
                if (!isLeadLocked) {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }
              }}
              onFocus={() => {
                if (!isLeadLocked) {
                  setIsDropdownOpen(true);
                  // Se não há termo de busca, mostrar leads iniciais
                  if (searchTerm.length < 2) {
                    setSearchResults(initialLeads);
                  }
                }
              }}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              className={`pl-10 bg-background border-border text-foreground ${
                isLeadLocked ? 'cursor-not-allowed opacity-75 bg-gray-50 dark:bg-gray-800' : ''
              }`}
              disabled={isLeadLocked}
            />
          </div>
          
          {!isLeadLocked && isDropdownOpen && (
            <div className="absolute z-10 w-full bg-background border border-border rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
              {isSearching ? (
                <div className="p-2 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
                  Buscando...
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  {searchTerm.length < 2 && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border-b border-border">
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        📋 Leads recentes (escolha um ou digite para buscar)
                      </p>
                    </div>
                  )}
                  {searchResults.map((result, index) => {
                    // Validação de segurança para cada resultado
                    if (!result || !result.id || !result.displayName) {
                      // console.warn('Resultado inválido ignorado:', result);
                      return null;
                    }
                    
                    return (
                      <div
                        key={`${result.type || 'unknown'}-${result.id}-${index}`}
                        className="p-2 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectCustomer(result);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-foreground">{result.displayName}</p>
                            <p className="text-xs text-muted-foreground">{result.displayInfo || 'Sem informações'}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            result.type === 'client' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {result.type === 'client' ? 'Cliente' : 'Lead'}
                          </span>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </>
              ) : searchTerm.length > 1 ? (
                <div className="p-2 text-center text-muted-foreground">
                  Nenhum cliente ou lead encontrado.
                </div>
              ) : initialLeads.length === 0 ? (
                <div className="p-2 text-center text-muted-foreground">
                  <div className="text-sm mb-1">Nenhum lead encontrado</div>
                  <div className="text-xs text-blue-400">Crie leads no CRM primeiro</div>
                </div>
              ) : null}
            </div>
          )}
        </div>


        {/* Campo para nome do dimensionamento */}
        <div className="space-y-2">
          <Label htmlFor="dimensioning-name" className="text-foreground flex items-center gap-2">
            Nome do Dimensionamento
            <span className="text-red-500 text-sm">*</span>
          </Label>
          <Input
            id="dimensioning-name"
            type="text"
            placeholder="Ex: Dimensionamento Principal, Proposta A, etc."
            value={formData.dimensioningName || ''}
            onChange={(e) => onFormChange('dimensioningName', e.target.value)}
            className={`bg-background border-border text-foreground ${
              !formData.dimensioningName?.trim() 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                : 'border-green-300 focus:border-green-500 focus:ring-green-200'
            }`}
          />
          <p className="text-xs text-muted-foreground">
            <span className="text-red-600 dark:text-red-400">*Obrigatório</span> - Nome para identificar este dimensionamento.
          </p>
        </div>

        {/* Informações do cliente selecionado */}
        {formData.customer && (
          <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-400">Cliente Selecionado</h4>
              {isLeadLocked && (
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full font-medium">
                  Vindo do CRM
                </span>
              )}
            </div>
            <div className="text-sm text-blue-300 space-y-1">
              <p><strong>Nome:</strong> {formData.customer.name}</p>
              {formData.customer.email && <p><strong>Email:</strong> {formData.customer.email}</p>}
              {formData.customer.company && <p><strong>Empresa:</strong> {formData.customer.company}</p>}
              <p><strong>Tipo:</strong> {formData.customer.type === 'client' ? 'Cliente' : 'Lead'}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-foreground">Grupo Tarifário</Label>
          <Select 
            onValueChange={(v) => onFormChange('grupoTarifario', v)} 
            value={formData.grupoTarifario || 'B'}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Selecione o grupo tarifário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="B">Grupo B (Residencial/Comercial até 75kW)</SelectItem>
              <SelectItem value="A">Grupo A (Alta Tensão)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AnimatePresence>
          {formData.grupoTarifario === 'B' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }} 
              className="space-y-4 overflow-hidden"
            >
              <div className="space-y-2">
                <Label htmlFor="tarifaEnergiaB" className="text-foreground">Tarifa de Energia (R$/kWh)</Label>
                <Input 
                  id="tarifaEnergiaB" 
                  type="number" 
                  step="0.01" 
                  value={formData.tarifaEnergiaB || ''} 
                  onChange={(e) => onFormChange('tarifaEnergiaB', parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 0.85"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custoFioB" className="text-foreground">Custo Fio B (R$/kWh)</Label>
                <Input 
                  id="custoFioB" 
                  type="number" 
                  step="0.01" 
                  value={formData.custoFioB || ''} 
                  onChange={(e) => onFormChange('custoFioB', parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 0.30"
                  className="bg-background border-border text-foreground"
                />
              </div>
            </motion.div>
          )}
          
          {formData.grupoTarifario === 'A' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }} 
              className="space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tarifaEnergiaPontaA" className="text-foreground">Tarifa Ponta (R$/kWh)</Label>
                  <Input 
                    id="tarifaEnergiaPontaA" 
                    type="number" 
                    step="0.01" 
                    value={formData.tarifaEnergiaPontaA || ''} 
                    onChange={(e) => onFormChange('tarifaEnergiaPontaA', parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 1.20"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tarifaEnergiaForaPontaA" className="text-foreground">Tarifa Fora Ponta (R$/kWh)</Label>
                  <Input 
                    id="tarifaEnergiaForaPontaA" 
                    type="number" 
                    step="0.01" 
                    value={formData.tarifaEnergiaForaPontaA || ''} 
                    onChange={(e) => onFormChange('tarifaEnergiaForaPontaA', parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 0.65"
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="demandaContratada" className="text-foreground">Demanda Contratada (kW)</Label>
                  <Input 
                    id="demandaContratada" 
                    type="number" 
                    value={formData.demandaContratada || ''} 
                    onChange={(e) => onFormChange('demandaContratada', parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 100"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tarifaDemanda" className="text-foreground">Tarifa Demanda (R$/kW)</Label>
                  <Input 
                    id="tarifaDemanda" 
                    type="number" 
                    step="0.01" 
                    value={formData.tarifaDemanda || ''} 
                    onChange={(e) => onFormChange('tarifaDemanda', parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 25.50"
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default CustomerDataForm;