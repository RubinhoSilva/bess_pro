import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  rememberMe: z.boolean().optional().default(false),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  company: z.string().optional(),
  role: z.enum(['admin', 'vendedor', 'viewer']).optional(),
});

// Project schemas
export const createProjectSchema = z.object({
  projectName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  projectType: z.enum(['pv', 'bess']),
  address: z.string().optional(),
  leadId: z.string().optional(),
});

// Lead schemas
export const createLeadSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
});

// Export types
export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type CreateProjectForm = z.infer<typeof createProjectSchema>;
export type CreateLeadForm = z.infer<typeof createLeadSchema>;