"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Priority = exports.LeadStage = void 0;
var LeadStage;
(function (LeadStage) {
    LeadStage["RECEIVED"] = "lead-recebido";
    LeadStage["QUALIFICATION"] = "pre-qualificacao";
    LeadStage["PROPOSAL_SENT"] = "proposta-enviada";
    LeadStage["DOCUMENTATION"] = "documentacao-recebida";
    LeadStage["APPROVED"] = "projeto-aprovado";
    LeadStage["INSTALLATION"] = "instalacao-agendada";
    LeadStage["DELIVERED"] = "sistema-entregue";
})(LeadStage || (exports.LeadStage = LeadStage = {}));
var Priority;
(function (Priority) {
    Priority["LOW"] = "low";
    Priority["MEDIUM"] = "medium";
    Priority["HIGH"] = "high";
})(Priority || (exports.Priority = Priority = {}));
//# sourceMappingURL=lead.types.js.map