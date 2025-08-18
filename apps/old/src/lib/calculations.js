// NBR 14300 Fio B Payment Percentages by year
const FIO_B_PERCENTAGES = {
    2023: 0.15,
    2024: 0.30,
    2025: 0.45,
    2026: 0.60,
    2027: 0.75,
    2028: 0.90,
    2029: 1.00, // Assuming 100% from 2029 onwards as defined by ANEEL
};

const getFioBPercentage = (year) => {
    if (year >= 2029) return 1.0;
    return FIO_B_PERCENTAGES[year] || 0;
};

export const calculateFinancials = (data) => {
    const {
        totalInvestment,
        geracaoEstimadaMensal,
        consumoMensal,
        tarifaEnergiaB, // Assuming this is the full energy tariff (TE + TUSD)
        custoFioB,      // This is the specific "TUSD Fio B" component cost
        vidaUtil,
        inflacaoEnergia,
        taxaDesconto,
    } = data;

    const startYear = new Date().getFullYear();
    const fluxoCaixa = [];

    // Ano 0: Apenas o investimento inicial
    fluxoCaixa.push({
        ano: 0,
        fluxoLiquido: -totalInvestment,
        economia: 0,
        custoSemFV: 0,
        custoComFV: 0,
    });
    
    let economiaAnualTotalAcumulada = 0;

    for (let i = 1; i <= vidaUtil; i++) {
        const anoAtual = startYear + i - 1;
        const fatorInflacao = Math.pow(1 + inflacaoEnergia / 100, i - 1);
        const tarifaAtual = tarifaEnergiaB * fatorInflacao;
        const custoFioBAtual = custoFioB * fatorInflacao;
        const fioBPercentual = getFioBPercentage(anoAtual);

        let custoAnualSemFV = 0;
        let custoAnualComFV = 0;

        for (let mes = 0; mes < 12; mes++) {
            const consumoDoMes = consumoMensal[mes];
            const geracaoDoMes = geracaoEstimadaMensal[mes];

            custoAnualSemFV += consumoDoMes * tarifaAtual;
            
            const energiaInjetada = Math.max(0, geracaoDoMes - consumoDoMes);
            const energiaConsumidaDaRede = Math.max(0, consumoDoMes - geracaoDoMes);
            
            // Custo da energia consumida da rede + custo do Fio B sobre a energia injetada
            const custoMesComFV = (energiaConsumidaDaRede * tarifaAtual) + (energiaInjetada * custoFioBAtual * fioBPercentual);
            custoAnualComFV += custoMesComFV;
        }

        const economiaAnual = custoAnualSemFV - custoAnualComFV;
        economiaAnualTotalAcumulada += economiaAnual;

        fluxoCaixa.push({
            ano: i,
            fluxoLiquido: economiaAnual,
            economia: economiaAnual,
            custoSemFV: custoAnualSemFV,
            custoComFV: custoAnualComFV,
        });
    }
    
    const economiaAnualEstimada = economiaAnualTotalAcumulada / vidaUtil;

    // Calcular VPL (Valor Presente Líquido)
    let vpl = 0;
    fluxoCaixa.forEach(item => {
        vpl += item.fluxoLiquido / Math.pow(1 + taxaDesconto / 100, item.ano);
    });

    // Calcular TIR (Taxa Interna de Retorno)
    let tir = 0;
    if (totalInvestment > 0) {
        const irr = (values) => {
            let rate = 0.1; // Chute inicial
            for (let i = 0; i < 50; i++) { // Aumentar iterações para precisão
                let npv = values.reduce((acc, val, j) => acc + val / Math.pow(1 + rate, j), 0);
                if (Math.abs(npv) < 1e-5) return rate * 100;
                
                let derivative = values.reduce((acc, val, j) => acc - j * val / Math.pow(1 + rate, j + 1), 0);
                if (Math.abs(derivative) < 1e-5) break; // Evitar divisão por zero
                
                rate -= npv / derivative;
            }
            return rate * 100;
        };
        tir = irr(fluxoCaixa.map(f => f.fluxoLiquido));
    }

    // Calcular Payback Simples
    let payback = 0;
    if (economiaAnualEstimada > 0) {
        let acumulado = -totalInvestment;
        for (let i = 1; i <= vidaUtil; i++) {
            acumulado += fluxoCaixa[i].fluxoLiquido;
            if (acumulado >= 0) {
                // Interpolação para encontrar o ponto exato dentro do ano
                const fluxoDoAno = fluxoCaixa[i].fluxoLiquido;
                const valorFaltante = acumulado - fluxoDoAno;
                payback = (i - 1) + (Math.abs(valorFaltante) / fluxoDoAno);
                break;
            }
        }
        if (payback === 0) payback = vidaUtil + 1; // Se não houver payback
    } else {
        payback = vidaUtil + 1; // Se não houver economia
    }

    return {
        economiaAnualEstimada,
        vpl,
        tir: isFinite(tir) ? tir : 0,
        payback: payback > vidaUtil ? vidaUtil + 1 : payback,
        fluxoCaixa,
    };
};