import React from 'react';

const PageCover = ({ results, profile }) => {
    const { formData } = results;
    const companyName = profile?.company || 'Sua Empresa Solar';
    const companyLogo = profile?.logo_url;
    const companyPhone = profile?.phone || '(XX) XXXX-XXXX';
    const companyEmail = profile?.email || 'seuemail@empresa.com';
    const companyWebsite = profile?.website;

    return (
        <section className="proposal-page page-cover relative flex flex-col justify-between p-12 text-white">
            <div className="absolute inset-0 bg-slate-800 -z-10">
                <img  src="https://images.unsplash.com/photo-1616765753552-818085398cd4" className="absolute inset-0 w-full h-full object-cover opacity-20" alt="Solar panels on a roof" />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/50 to-slate-900"></div>
            </div>
            
            <header className="flex justify-between items-start">
                <div>
                    {companyLogo && <img src={companyLogo} className="w-48 h-auto max-h-24 object-contain" alt="Logotipo da Empresa" />}
                </div>
                <div className="text-right">
                    <p className="font-semibold">Proposta Nº: {Date.now().toString().slice(-6)}</p>
                    <p>Data: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
            </header>

            <main className="text-center my-24">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Proposta de Sistema Fotovoltaico</h1>
                <p className="mt-4 text-2xl text-slate-300">Preparado para:</p>
                <p className="mt-2 text-4xl font-semibold text-yellow-400">{formData.projectName || 'Cliente'}</p>
            </main>

            <footer className="text-center text-sm text-slate-400">
                <p>{companyName} | {companyPhone} | {companyEmail}</p>
                {companyWebsite && <p>{companyWebsite}</p>}
            </footer>
        </section>
    );
};

export default PageCover;