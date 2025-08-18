import { Schema, model, Document } from 'mongoose';
import { AlertType, AlertPriority, AlertStatus } from '../../../../domain/entities/ClientAlert';

export interface IClientAlertDocument extends Document {
  _id: string;
  domainId?: string;
  clientId: string;
  userId: string;
  title: string;
  description?: string;
  alertDate: Date;
  alertType: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  isRecurring: boolean;
  recurringPattern?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ClientAlertSchema = new Schema<IClientAlertDocument>({
  domainId: { type: String, required: false, unique: true, sparse: true },
  clientId: { type: String, required: true },
  userId: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  alertDate: { type: Date, required: true },
  alertType: { 
    type: String, 
    enum: Object.values(AlertType), 
    required: true 
  },
  priority: { 
    type: String, 
    enum: Object.values(AlertPriority), 
    required: true 
  },
  status: { 
    type: String, 
    enum: Object.values(AlertStatus), 
    default: AlertStatus.PENDING 
  },
  isRecurring: { type: Boolean, default: false },
  recurringPattern: { type: String, trim: true },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'client_alerts'
});

// Índices para otimização de consultas - PERFORMANCE CRÍTICA
ClientAlertSchema.index({ domainId: 1 }, { unique: true, sparse: true });

// Índices compostos para queries mais frequentes
ClientAlertSchema.index({ userId: 1, status: 1, alertDate: 1 }); // Dashboard queries
ClientAlertSchema.index({ clientId: 1, status: 1, alertDate: -1 }); // Client alerts
ClientAlertSchema.index({ userId: 1, alertDate: 1, status: 1 }); // Date range queries
ClientAlertSchema.index({ userId: 1, priority: 1, alertDate: 1 }); // Priority filtering
ClientAlertSchema.index({ userId: 1, alertType: 1, alertDate: 1 }); // Type filtering

// Índices para soft delete
ClientAlertSchema.index({ isDeleted: 1, userId: 1 });
ClientAlertSchema.index({ isDeleted: 1, deletedAt: -1 });

// Índice para alertas vencidos e próximos (dashboard performance)
ClientAlertSchema.index({ 
  status: 1, 
  alertDate: 1,
  userId: 1
}, { 
  name: 'alert_dashboard_performance',
  partialFilterExpression: { 
    status: 'pending',
    isDeleted: { $ne: true }
  }
});

// Índice para recorrência
ClientAlertSchema.index({ 
  isRecurring: 1, 
  recurringPattern: 1,
  userId: 1
}, { 
  sparse: true,
  partialFilterExpression: { isRecurring: true }
});

// Índice de texto para busca
ClientAlertSchema.index({
  title: 'text',
  description: 'text'
});

// NOVOS ÍNDICES PARA OTIMIZAÇÃO DE PAGINAÇÃO

// Índice para paginação cursor-based otimizada
ClientAlertSchema.index({ 
  userId: 1, 
  alertDate: -1, 
  _id: 1 
}, { 
  name: 'cursor_pagination_primary',
  background: true 
});

// Índices compostos para filtros + paginação
ClientAlertSchema.index({ 
  userId: 1, 
  status: 1, 
  alertDate: -1, 
  _id: 1 
}, { 
  name: 'status_cursor_pagination',
  background: true 
});

ClientAlertSchema.index({ 
  userId: 1, 
  priority: 1, 
  alertDate: -1, 
  _id: 1 
}, { 
  name: 'priority_cursor_pagination',
  background: true 
});

ClientAlertSchema.index({ 
  userId: 1, 
  alertType: 1, 
  alertDate: -1, 
  _id: 1 
}, { 
  name: 'type_cursor_pagination',
  background: true 
});

ClientAlertSchema.index({ 
  clientId: 1, 
  alertDate: -1, 
  _id: 1 
}, { 
  name: 'client_cursor_pagination',
  background: true 
});

// Índice para queries complexas com múltiplos filtros
ClientAlertSchema.index({ 
  userId: 1, 
  status: 1, 
  priority: 1, 
  alertType: 1, 
  alertDate: -1 
}, { 
  name: 'multi_filter_pagination',
  background: true 
});

// Índice para contagem eficiente (count queries)
ClientAlertSchema.index({ 
  userId: 1, 
  isDeleted: 1 
}, { 
  name: 'count_optimization',
  background: true 
});

// Índice para range de datas (consultas dashboard)
ClientAlertSchema.index({ 
  userId: 1, 
  alertDate: 1, 
  status: 1, 
  isDeleted: 1 
}, { 
  name: 'date_range_dashboard',
  background: true 
});

// Índice para busca por texto + filtros (removido score problemático)
ClientAlertSchema.index({ 
  userId: 1, 
  status: 1, 
  alertDate: -1 
}, { 
  name: 'text_search_with_filters',
  background: true 
});

export const ClientAlertModel = model<IClientAlertDocument>('ClientAlert', ClientAlertSchema);