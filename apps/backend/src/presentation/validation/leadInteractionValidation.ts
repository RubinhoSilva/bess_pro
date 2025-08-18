import Joi from 'joi';
import { InteractionType, InteractionDirection } from '@/domain/entities/LeadInteraction';

export const createLeadInteractionValidation = Joi.object({
  leadId: Joi.string().required().messages({
    'string.empty': 'Lead ID é obrigatório',
    'any.required': 'Lead ID é obrigatório'
  }),
  type: Joi.string().valid(...Object.values(InteractionType)).required().messages({
    'any.only': 'Tipo de interação inválido',
    'any.required': 'Tipo de interação é obrigatório'
  }),
  direction: Joi.string().valid(...Object.values(InteractionDirection)).required().messages({
    'any.only': 'Direção da interação inválida',
    'any.required': 'Direção da interação é obrigatória'
  }),
  title: Joi.string().max(200).required().messages({
    'string.max': 'Título deve ter no máximo 200 caracteres',
    'string.empty': 'Título é obrigatório',
    'any.required': 'Título é obrigatório'
  }),
  description: Joi.string().max(2000).required().messages({
    'string.max': 'Descrição deve ter no máximo 2000 caracteres',
    'string.empty': 'Descrição é obrigatória',
    'any.required': 'Descrição é obrigatória'
  }),
  scheduledAt: Joi.date().iso().optional().messages({
    'date.format': 'Data deve estar no formato ISO'
  }),
  metadata: Joi.object().optional()
});

export const updateLeadInteractionValidation = Joi.object({
  title: Joi.string().max(200).optional().messages({
    'string.max': 'Título deve ter no máximo 200 caracteres'
  }),
  description: Joi.string().max(2000).optional().messages({
    'string.max': 'Descrição deve ter no máximo 2000 caracteres'
  }),
  scheduledAt: Joi.date().iso().optional().messages({
    'date.format': 'Data deve estar no formato ISO'
  }),
  completedAt: Joi.date().iso().optional().messages({
    'date.format': 'Data deve estar no formato ISO'
  }),
  metadata: Joi.object().optional()
});