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
import { BessRoutes } from './BessRoutes';
import { IrradiationRoutes } from './IrradiationRoutes';
import { AlertRoutes } from './AlertRoutes';
import { TeamRoutes } from './TeamRoutes';
import { TeamUserRoutes } from './TeamUserRoutes';
import { KanbanRoutes } from './KanbanRoutes';
import { SolarModuleRoutes } from './SolarModuleRoutes';
import { InverterRoutes } from './InverterRoutes';
import { ProposalTemplateRoutes } from './ProposalTemplateRoutes';
import { ProposalSettingsRoutes } from './ProposalSettingsRoutes';
import { ProjectBackupRoutes } from './ProjectBackupRoutes';
import { MultiSystemRoutes } from './MultiSystemRoutes';
import { createSolarAnalysisRoutes } from './SolarAnalysisRoutes';
import { createAdvancedTemplateRoutes } from './AdvancedTemplateRoutes';
import { clientAlertRoutes } from './client-alert.routes';
import { EnergyCompanyRoutes } from './EnergyCompanyRoutes';

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
    router.use('/bess', new BessRoutes(container).getRouter());
    router.use('/irradiation', new IrradiationRoutes(container).getRouter());
    router.use('/alerts', AlertRoutes.create(container));
    router.use('/solar-modules', new SolarModuleRoutes(container).router);
    router.use('/inverters', new InverterRoutes(container).router);
    router.use('/proposal-templates', ProposalTemplateRoutes.create(container));
    router.use('/proposal-settings', ProposalSettingsRoutes.create(container));
    router.use('/project-backups', new ProjectBackupRoutes(container).getRouter());
    router.use('/multi-system', new MultiSystemRoutes(container).getRouter());
    router.use('/solar-analysis', createSolarAnalysisRoutes(container));
    router.use('/advanced-templates', createAdvancedTemplateRoutes(container));
    router.use('/client-alerts', clientAlertRoutes);
    router.use('/energy-companies', EnergyCompanyRoutes.create(container));

    return router;
  }
}