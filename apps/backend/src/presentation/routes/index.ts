import { Router } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { AuthRoutes } from './AuthRoutes';
import { ProjectRoutes } from './ProjectRoutes';
import { LeadRoutes } from './LeadRoutes';
import { createLeadInteractionRoutes } from './leadInteractionRoutes';
import { ClientRoutes } from './ClientRoutes';
import { Model3DRoutes } from './Model3DRoutes';
import { CalculationRoutes } from './CalculationRoutes';
import { ReportRoutes } from './ReportRoutes';

import { IrradiationRoutes } from './IrradiationRoutes';
import { AlertRoutes } from './AlertRoutes';
import { TeamRoutes } from './TeamRoutes';
import { TeamUserRoutes } from './TeamUserRoutes';
import { KanbanRoutes } from './KanbanRoutes';
import { SolarModuleRoutes } from './SolarModuleRoutes';
import { InverterRoutes } from './InverterRoutes';
import { ManufacturerRoutes } from './ManufacturerRoutes';
import { ProposalTemplateRoutes } from './ProposalTemplateRoutes';
import { ProposalSettingsRoutes } from './ProposalSettingsRoutes';
import { ProjectBackupRoutes } from './ProjectBackupRoutes';

import { createSolarAnalysisRoutes } from './SolarAnalysisRoutes';

import { createAdvancedTemplateRoutes } from './AdvancedTemplateRoutes';
import { clientAlertRoutes } from './client-alert.routes';
import { EnergyCompanyRoutes } from './EnergyCompanyRoutes';
import { TestFinancialController } from '../controllers/TestFinancialController';
import { GrupoFinancialRoutes } from './GrupoFinancialRoutes';

import { ProposalRoutes } from './ProposalRoutes';
import ProposalPDFRoutes from './ProposalPDFRoutes';
import { CompanyProfileRoutes } from './CompanyProfileRoutes';

export class ApiRoutes {
  static create(container: Container): Router {
    const router = Router();

    // Health check
    router.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'BESS Pro API is running',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      });
    });

    // API routes
    router.use('/auth', AuthRoutes.create(container));
    router.use('/teams', TeamRoutes.create(container));
    router.use('/teams', TeamUserRoutes.create(container));
    router.use('/kanban', KanbanRoutes.create(container));
    router.use('/projects', ProjectRoutes.create(container));
    router.use('/leads', LeadRoutes.create(container));
    router.use('/lead-interactions', createLeadInteractionRoutes(container));
    router.use('/clients', ClientRoutes.create(container));
    router.use('/models-3d', Model3DRoutes.create(container));
    router.use('/calculations', CalculationRoutes.create(container));
    router.use('/reports', new ReportRoutes(container).getRouter());

    router.use('/irradiation', new IrradiationRoutes(container).getRouter());
    router.use('/alerts', AlertRoutes.create(container));
    router.use('/equipment/modules', new SolarModuleRoutes(container).router);
    router.use('/equipment/inverters', new InverterRoutes(container).router);
    router.use('/equipment/manufacturers', new ManufacturerRoutes(container).router);
    router.use('/proposal-templates', ProposalTemplateRoutes.create(container));
    router.use('/proposal-settings', ProposalSettingsRoutes.create(container));
    router.use('/project-backups', new ProjectBackupRoutes(container).getRouter());

    router.use('/solar-analysis', createSolarAnalysisRoutes(container));

    const grupoFinancialRoutes = new GrupoFinancialRoutes(container);
    router.use('/financial', grupoFinancialRoutes.getRouter());

    router.use('/advanced-templates', createAdvancedTemplateRoutes(container));
    router.use('/client-alerts', clientAlertRoutes);
    router.use('/energy-companies', EnergyCompanyRoutes.create(container));

    // Test routes for financial integration
    const testController = new TestFinancialController();
    router.get('/test-financial-integration', (req, res) => testController.testIntegration(req, res));
    router.get('/test-financial-health', (req, res) => testController.healthCheck(req, res));

    // Proposal routes
    router.use('/proposals', ProposalRoutes.create(container));
    
    // Proposal PDF generation routes
    router.use('/proposal', ProposalPDFRoutes);
    
    // Company Profile routes
    router.use('/company-profiles', CompanyProfileRoutes.create(container));
    
    return router;
  }
}