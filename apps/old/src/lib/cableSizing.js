import { installationMethodsCapacities } from './constants';

const getFatorCorrecaoTemperatura = (tipoCabo) => {
    return tipoCabo === 'epr' ? 1.0 : 1.0;
};

const getFatorCorrecaoAgrupamento = (numCircuitos) => {
    if (numCircuitos <= 1) return 1.0;
    if (numCircuitos === 2) return 0.8;
    if (numCircuitos === 3) return 0.7;
    return 0.6;
};

export const calculateCableSizingForInverter = (params) => {
    const {
        inverterPower,
        tipoLigacao,
        tensaoCA,
        tipoCabo,
        distanciaCircuito,
        metodoInstalacao,
    } = params;

    let correnteProjeto;
    let divisorTensao;

    switch (tipoLigacao) {
        case 'monofasico':
            correnteProjeto = (inverterPower * 1000) / tensaoCA;
            divisorTensao = tensaoCA;
            break;
        case 'bifasico':
            correnteProjeto = (inverterPower * 1000) / tensaoCA;
            divisorTensao = tensaoCA;
            break;
        case 'trifasico':
        default:
            correnteProjeto = (inverterPower * 1000) / (tensaoCA * Math.sqrt(3));
            divisorTensao = tensaoCA * Math.sqrt(3);
            break;
    }

    const fct = getFatorCorrecaoTemperatura(tipoCabo);
    const fca = getFatorCorrecaoAgrupamento(1);
    const correnteCorrigida = correnteProjeto / (fct * fca);

    const tabelaCapacidade = installationMethodsCapacities[metodoInstalacao]?.[tipoCabo];
    if (!tabelaCapacidade) {
        return { error: 'Método de instalação ou tipo de cabo inválido.' };
    }

    let secaoMinimaPorCapacidade = null;
    for (const secao in tabelaCapacidade) {
        if (tabelaCapacidade[secao] >= correnteCorrigida) {
            secaoMinimaPorCapacidade = parseFloat(secao);
            break;
        }
    }

    if (secaoMinimaPorCapacidade === null) {
        return { error: 'Nenhum cabo adequado encontrado para a corrente de projeto.' };
    }

    const resistividadeCobre = 0.0172;
    const quedaTensaoPercentual = ((2 * resistividadeCobre * distanciaCircuito * correnteProjeto) / (secaoMinimaPorCapacidade * (divisorTensao))) * 100;

    let secaoFinal = secaoMinimaPorCapacidade;
    if (quedaTensaoPercentual > 2) {
        secaoFinal = (2 * resistividadeCobre * distanciaCircuito * correnteProjeto) / (0.02 * (divisorTensao));
        
        let secaoNormalizada = null;
        const secoesDisponiveis = Object.keys(tabelaCapacidade).map(parseFloat).sort((a, b) => a - b);
        for (const s of secoesDisponiveis) {
            if (s >= secaoFinal) {
                secaoNormalizada = s;
                break;
            }
        }
        secaoFinal = secaoNormalizada || secoesDisponiveis[secoesDisponiveis.length - 1];
    }

    const quedaTensaoFinal = ((2 * resistividadeCobre * distanciaCircuito * correnteProjeto) / (secaoFinal * (divisorTensao))) * 100;

    return {
        correnteProjeto,
        correnteCorrigida,
        secaoMinimaCalculada: secaoFinal,
        quedaTensaoPercentual: quedaTensaoFinal,
        isQuedaTensaoOk: quedaTensaoFinal <= 2,
    };
};