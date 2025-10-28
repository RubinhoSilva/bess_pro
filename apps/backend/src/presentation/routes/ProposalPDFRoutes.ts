import { Router } from 'express';
import { ProposalPDFController } from '../controllers/ProposalPDFController';

const router = Router();
const proposalPDFController = new ProposalPDFController();

/**
 * Rotas para geração de propostas PDF
 * Estas rotas atuam como um adaptador entre o frontend (camelCase) e o serviço Python (snake_case)
 */

router.post('/generate', proposalPDFController.generateProposal);
router.get('/download/:filename', proposalPDFController.downloadPDF);

export default router;