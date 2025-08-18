import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  X, 
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdvancedValidator, ValidationResult, ValidationError } from '@/lib/advancedValidations';

interface ValidationPanelProps {
  formData: any;
  onValidationChange?: (result: ValidationResult) => void;
  autoValidate?: boolean;
  collapsed?: boolean;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({
  formData,
  onValidationChange,
  autoValidate = true,
  collapsed = false
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
    info: []
  });
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [showDetails, setShowDetails] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (autoValidate) {
      validateForm();
    }
  }, [formData, autoValidate]);

  const validateForm = async () => {
    setIsValidating(true);
    
    try {
      // Simular delay para validação
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const result = AdvancedValidator.validatePVSystem(formData);
      
      // Validação adicional de compatibilidade de equipamentos
      if (formData.selectedModules && formData.selectedInverters) {
        const compatibilityResult = AdvancedValidator.validateEquipmentCompatibility(
          formData.selectedModules,
          formData.selectedInverters
        );
        
        result.errors.push(...compatibilityResult.errors);
        result.warnings.push(...compatibilityResult.warnings);
        result.info.push(...compatibilityResult.info);
        result.isValid = result.isValid && compatibilityResult.isValid;
      }

      // Validação de balanço energético
      if (formData.energyBills && formData.geracaoEstimadaMensal) {
        const totalConsumption = formData.energyBills.reduce((acc: number[], bill: any) => {
          bill.consumoMensal.forEach((consumo: number, index: number) => {
            acc[index] = (acc[index] || 0) + consumo;
          });
          return acc;
        }, Array(12).fill(0));

        const balanceResult = AdvancedValidator.validateEnergyBalance(
          totalConsumption,
          formData.geracaoEstimadaMensal
        );
        
        result.errors.push(...balanceResult.errors);
        result.warnings.push(...balanceResult.warnings);
        result.info.push(...balanceResult.info);
        result.isValid = result.isValid && balanceResult.isValid;
      }
      
      setValidationResult(result);
      
      if (onValidationChange) {
        onValidationChange(result);
      }
    } catch (error) {
      console.error('Erro na validação:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const getValidationSummary = () => {
    const total = validationResult.errors.length + 
                  validationResult.warnings.length + 
                  validationResult.info.length;
    
    if (validationResult.errors.length > 0) {
      return {
        status: 'error',
        message: `${validationResult.errors.length} erro(s) encontrado(s)`,
        icon: AlertTriangle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800'
      };
    } else if (validationResult.warnings.length > 0) {
      return {
        status: 'warning',
        message: `${validationResult.warnings.length} aviso(s) encontrado(s)`,
        icon: AlertCircle,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800'
      };
    } else if (validationResult.info.length > 0) {
      return {
        status: 'info',
        message: `${validationResult.info.length} informação(ões) disponível(eis)`,
        icon: Info,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800'
      };
    } else {
      return {
        status: 'success',
        message: 'Sistema validado com sucesso',
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800'
      };
    }
  };

  const summary = getValidationSummary();
  const Icon = summary.icon;

  const renderValidationItem = (item: ValidationError, index: number) => {
    const getItemColor = (severity: string) => {
      switch (severity) {
        case 'error': return 'text-red-600 dark:text-red-400';
        case 'warning': return 'text-yellow-600 dark:text-yellow-400';
        case 'info': return 'text-blue-600 dark:text-blue-400';
        default: return 'text-gray-600 dark:text-slate-400';
      }
    };

    const getItemIcon = (severity: string) => {
      switch (severity) {
        case 'error': return AlertTriangle;
        case 'warning': return AlertCircle;
        case 'info': return Info;
        default: return Info;
      }
    };

    const ItemIcon = getItemIcon(item.severity);

    return (
      <motion.div
        key={`${item.field}-${index}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
        className="flex items-start space-x-3 p-3 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600"
      >
        <ItemIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getItemColor(item.severity)}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {item.message}
            </p>
            <span className="text-xs text-gray-500 dark:text-slate-400 capitalize">
              ({item.field})
            </span>
          </div>
          {item.value && (
            <p className="text-xs text-gray-600 dark:text-slate-300 mt-1">
              Valor atual: <span className="font-mono">{item.value}</span>
            </p>
          )}
          {item.suggestion && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              💡 {item.suggestion}
            </p>
          )}
        </div>
      </motion.div>
    );
  };

  if (isCollapsed) {
    return (
      <div 
        className={`rounded-lg border p-4 cursor-pointer transition-colors ${summary.bgColor} ${summary.borderColor}`}
        onClick={() => setIsCollapsed(false)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className={`w-5 h-5 ${summary.color}`} />
            <span className={`text-sm font-medium ${summary.color}`}>
              {summary.message}
            </span>
            {isValidating && (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            )}
          </div>
          <ChevronDown className={`w-4 h-4 ${summary.color}`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${summary.bgColor} ${summary.borderColor}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className={`w-5 h-5 ${summary.color}`} />
            <h3 className={`text-lg font-semibold ${summary.color}`}>
              Validação do Sistema
            </h3>
            {isValidating && (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!autoValidate && (
              <Button
                variant="outline"
                size="sm"
                onClick={validateForm}
                disabled={isValidating}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
                Validar
              </Button>
            )}
            <button
              onClick={() => setIsCollapsed(true)}
              className={`p-1 rounded hover:bg-white/50 dark:hover:bg-slate-600/50 ${summary.color}`}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="mt-2">
          <p className={`text-sm ${summary.color}`}>
            {summary.message}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center space-x-6 mt-4">
          {validationResult.errors.length > 0 && (
            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">{validationResult.errors.length}</span>
            </div>
          )}
          {validationResult.warnings.length > 0 && (
            <div className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{validationResult.warnings.length}</span>
            </div>
          )}
          {validationResult.info.length > 0 && (
            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">{validationResult.info.length}</span>
            </div>
          )}
        </div>

        {/* Toggle Details */}
        {(validationResult.errors.length > 0 || 
          validationResult.warnings.length > 0 || 
          validationResult.info.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className={`mt-2 ${summary.color} hover:bg-white/50 dark:hover:bg-slate-600/50`}
          >
            {showDetails ? 'Ocultar detalhes' : 'Mostrar detalhes'}
            {showDetails ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>
        )}
      </div>

      {/* Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-current border-opacity-20"
          >
            <div className="p-4 space-y-4">
              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">
                    Erros ({validationResult.errors.length})
                  </h4>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {validationResult.errors.map((error, index) => 
                        renderValidationItem(error, index)
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-3">
                    Avisos ({validationResult.warnings.length})
                  </h4>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {validationResult.warnings.map((warning, index) => 
                        renderValidationItem(warning, index)
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Info */}
              {validationResult.info.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">
                    Informações ({validationResult.info.length})
                  </h4>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {validationResult.info.map((info, index) => 
                        renderValidationItem(info, index)
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ValidationPanel;