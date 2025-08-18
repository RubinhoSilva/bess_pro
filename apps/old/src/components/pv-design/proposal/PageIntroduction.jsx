import React from 'react';
import { Sun, Zap, ShieldCheck, TrendingUp } from 'lucide-react';

const PageIntroduction = () => {
    return (
        <section className="proposal-page p-10">
            <h2 className="proposal-title">O Futuro é Solar: Sua Independência Energética Começa Agora</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
                Investir em um sistema de energia solar fotovoltaica é mais do que uma decisão econômica inteligente; é um passo em direção a um futuro mais sustentável e autônomo. Ao gerar sua própria eletricidade a partir da luz do sol, uma fonte limpa, gratuita e inesgotável, você se protege contra as constantes altas nas tarifas de energia e contribui para a preservação do meio ambiente.
            </p>

            <div className="mt-8">
                <img  class="w-full h-auto rounded-lg shadow-lg" alt="Diagram of a solar panel system" src="https://images.unsplash.com/photo-1679046410102-c5072c4bc29b" />
            </div>

            <div className="mt-8">
                <h3 className="proposal-subtitle">Principais Vantagens</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="advantage-card">
                        <Zap className="w-8 h-8 text-yellow-500" />
                        <div>
                            <h4 className="font-bold">Redução de Custos</h4>
                            <p>Diminua drasticamente sua conta de luz e fique imune aos aumentos tarifários.</p>
                        </div>
                    </div>
                    <div className="advantage-card">
                        <TrendingUp className="w-8 h-8 text-green-500" />
                        <div>
                            <h4 className="font-bold">Valorização do Imóvel</h4>
                            <p>Imóveis com energia solar são mais valorizados e procurados no mercado.</p>
                        </div>
                    </div>
                    <div className="advantage-card">
                        <Sun className="w-8 h-8 text-orange-500" />
                        <div>
                            <h4 className="font-bold">Sustentabilidade</h4>
                            <p>Gere energia limpa, reduza sua pegada de carbono e ajude o planeta.</p>
                        </div>
                    </div>
                    <div className="advantage-card">
                        <ShieldCheck className="w-8 h-8 text-blue-500" />
                        <div>
                            <h4 className="font-bold">Baixa Manutenção</h4>
                            <p>Sistemas fotovoltaicos são duráveis, com vida útil superior a 25 anos e pouca manutenção.</p>
                        </div>
                    </div>
                </div>
            </div>
            <footer className="proposal-footer">
                <p>Página 2</p>
            </footer>
        </section>
    );
};

export default PageIntroduction;