import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Lightning, ArrowRight, Users, SquaresFour, 
  Sun, Moon, Check, CaretDown, ChatCircleText, CalendarCheck, Wallet, Warning, Megaphone, X
} from '@phosphor-icons/react';
import { RegisterCondo } from './RegisterCondo';

interface LandingPageProps {
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

// Helper Component for Scroll Animation
const RevealOnScroll = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => { if (ref.current) observer.unobserve(ref.current); };
    }, []);

    return (
        <div 
            ref={ref} 
            className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}
        >
            {children}
        </div>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ isDarkMode, toggleTheme }) => {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-900 text-gray-900 dark:text-slate-100 font-sans transition-colors duration-300 overflow-x-hidden">
      
      {showRegister && <RegisterCondo onClose={() => setShowRegister(false)} isDarkMode={isDarkMode} />}

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-500 font-['Bruno_Ace_SC'] tracking-wider flex items-center gap-2">
            ZYNDO
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-slate-300">
             <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">Funcionalidades</a>
             <a href="#ia" className="hover:text-blue-600 transition-colors">Inteligência Artificial</a>
             <a href="#precos" className="hover:text-blue-600 transition-colors">Planos</a>
             <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            {toggleTheme && (
                <button 
                    onClick={toggleTheme}
                    className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    {isDarkMode ? <Sun size={20} weight="fill" /> : <Moon size={20} weight="fill" />}
                </button>
            )}
            <button 
              onClick={() => setShowRegister(true)}
              className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 px-5 py-2.5 rounded-full font-semibold transition-all shadow-lg shadow-gray-900/10 flex items-center gap-2 text-sm"
            >
              Começar
            </button>
          </div>
        </div>
      </nav>

      {/* 1. Hero Section */}
      <header className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent -z-10"></div>
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-200/20 dark:bg-indigo-500/10 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-fade-in-up max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold border border-blue-100 dark:border-slate-700">
              <Lightning size={16} weight="fill" /> Gestão Descomplicada 2.0
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-gray-900 dark:text-white">
              Seu condomínio <br/>
              organizado em <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">um só lugar.</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-slate-400 leading-relaxed">
              Diga adeus às planilhas e grupos de WhatsApp caóticos. O Zyndo é a plataforma moderna para síndicos que buscam paz mental e eficiência.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => setShowRegister(true)}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-600/30 hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Começar agora <ArrowRight size={20} weight="bold" />
              </button>
              <a 
                href="#como-funciona"
                className="px-8 py-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-2xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
              >
                Ver como funciona
              </a>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-500 pt-2">
                <span className="flex items-center gap-1"><Check size={16} className="text-green-500" weight="bold"/> Sem cartão para testar</span>
                <span className="flex items-center gap-1"><Check size={16} className="text-green-500" weight="bold"/> Configuração em 2 min</span>
            </div>
          </div>
          
          {/* CSS Mockup Dashboard */}
          <div className="relative perspective-1000 hidden lg:block animate-fade-in-right delay-200">
             <div className="relative z-10 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl shadow-blue-900/20 border border-gray-200 dark:border-slate-700 p-4 w-full h-[600px] rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out overflow-hidden flex flex-col">
                {/* Mockup Header */}
                <div className="h-12 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between px-4 mb-4">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="w-32 h-2 bg-gray-100 dark:bg-slate-700 rounded-full"></div>
                </div>
                
                {/* Mockup Body */}
                <div className="flex flex-1 gap-4 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-16 flex flex-col items-center gap-4 py-2 border-r border-gray-100 dark:border-slate-700">
                         <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center"><SquaresFour weight="fill"/></div>
                         <div className="w-10 h-10 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-400 flex items-center justify-center"><CalendarCheck weight="fill"/></div>
                         <div className="w-10 h-10 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-400 flex items-center justify-center"><Warning weight="fill"/></div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 space-y-4 pr-2">
                        <div className="flex gap-4">
                            <div className="flex-1 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800 mb-2"></div>
                                <div className="w-16 h-4 bg-blue-200 dark:bg-blue-800 rounded mb-1"></div>
                                <div className="w-8 h-6 bg-blue-300 dark:bg-blue-700 rounded"></div>
                            </div>
                            <div className="flex-1 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800/30">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-800 mb-2"></div>
                                <div className="w-16 h-4 bg-purple-200 dark:bg-purple-800 rounded mb-1"></div>
                                <div className="w-8 h-6 bg-purple-300 dark:bg-purple-700 rounded"></div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-700/30 rounded-2xl border border-gray-100 dark:border-slate-700 h-32">
                             <div className="w-32 h-4 bg-gray-200 dark:bg-slate-600 rounded mb-4"></div>
                             <div className="space-y-2">
                                <div className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded"></div>
                                <div className="w-3/4 h-2 bg-gray-200 dark:bg-slate-600 rounded"></div>
                             </div>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-600"></div>
                             <div className="space-y-1 flex-1">
                                 <div className="w-24 h-3 bg-gray-200 dark:bg-slate-600 rounded"></div>
                                 <div className="w-16 h-2 bg-gray-100 dark:bg-slate-700 rounded"></div>
                             </div>
                             <div className="w-16 h-6 bg-green-100 dark:bg-green-900/30 rounded-full"></div>
                        </div>
                         <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-600"></div>
                             <div className="space-y-1 flex-1">
                                 <div className="w-32 h-3 bg-gray-200 dark:bg-slate-600 rounded"></div>
                                 <div className="w-20 h-2 bg-gray-100 dark:bg-slate-700 rounded"></div>
                             </div>
                             <div className="w-16 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full"></div>
                        </div>
                    </div>
                </div>
             </div>
             
             {/* Floating Badge */}
             <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 animate-bounce-slow z-20 flex items-center gap-3">
                 <div className="bg-green-500 p-2 rounded-xl text-white shadow-lg shadow-green-500/30">
                     <ShieldCheck size={24} weight="fill"/>
                 </div>
                 <div>
                     <p className="font-bold text-gray-900 dark:text-white leading-tight">100% Seguro</p>
                     <p className="text-xs text-gray-500 dark:text-slate-400">Dados criptografados</p>
                 </div>
             </div>
          </div>
        </div>
      </header>

      {/* 2. Quick Benefits Section */}
      <section className="py-24 bg-white dark:bg-slate-800/50">
        <RevealOnScroll className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <BenefitCard 
                    icon={<CalendarCheck size={32} weight="fill" className="text-blue-500"/>}
                    title="Reservas Online"
                    text="Adeus caderninho. Moradores reservam áreas comuns pelo app em segundos."
                />
                <BenefitCard 
                    icon={<Warning size={32} weight="fill" className="text-red-500"/>}
                    title="Ocorrências"
                    text="Registro centralizado de problemas com fotos e status de resolução."
                />
                <BenefitCard 
                    icon={<Wallet size={32} weight="fill" className="text-emerald-500"/>}
                    title="Transparência"
                    text="Gestão financeira simplificada para todos saberem para onde vai o dinheiro."
                />
                <BenefitCard 
                    icon={<Megaphone size={32} weight="fill" className="text-purple-500"/>}
                    title="Comunicados"
                    text="Avisos que chegam a todos. Mural digital para acabar com o 'eu não sabia'."
                />
            </div>
        </RevealOnScroll>
      </section>

      {/* 3. How it Works Section */}
      <section id="como-funciona" className="py-24 bg-[#F5F5F7] dark:bg-slate-900 relative">
          <RevealOnScroll className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Simples como deve ser</h2>
                  <p className="text-gray-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">Nada de implementações complexas. Você começa a usar hoje mesmo.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-12 relative">
                  {/* Connecting Line (Desktop) */}
                  <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-700 to-transparent z-0"></div>

                  <StepCard 
                    number="1"
                    title="Crie seu Condomínio"
                    text="Cadastre seu prédio em menos de 2 minutos. Você define as áreas comuns e regras."
                  />
                  <StepCard 
                    number="2"
                    title="Convide os Moradores"
                    text="Envie um link ou cadastre manualmente. Cada morador tem seu acesso individual."
                  />
                  <StepCard 
                    number="3"
                    title="Gerencie Tudo"
                    text="Centralize reservas, avisos e contas no seu painel administrativo."
                  />
              </div>
          </RevealOnScroll>
      </section>

      {/* 4. Features Section */}
      <section id="funcionalidades" className="py-24 bg-white dark:bg-slate-800/50">
        <RevealOnScroll className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                 <span className="text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase text-sm">Funcionalidades</span>
                 <h2 className="text-3xl md:text-4xl font-bold mt-2 text-gray-900 dark:text-white">Tudo que o síndico precisa</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
                <FeatureBox 
                    title="Painel Geral" 
                    desc="Visão panorâmica do que acontece agora. Métricas rápidas e alertas."
                    items={['Dashboard em tempo real', 'Alertas de pendências', 'Resumo financeiro']}
                    icon={<SquaresFour size={24} weight="fill"/>}
                    color="blue"
                />
                <FeatureBox 
                    title="Gestão de Reservas" 
                    desc="Controle total sobre salão de festas, churrasqueira e academia."
                    items={['Calendário interativo', 'Regras de horário', 'Aprovação automática ou manual']}
                    icon={<CalendarCheck size={24} weight="fill"/>}
                    color="indigo"
                />
                <FeatureBox 
                    title="Gestão de Ocorrências" 
                    desc="Organize as demandas de manutenção e reclamações."
                    items={['Upload de fotos', 'Status de progresso', 'Histórico completo']}
                    icon={<Warning size={24} weight="fill"/>}
                    color="red"
                />
                <FeatureBox 
                    title="Controle Financeiro" 
                    desc="Chega de planilhas confusas. Receitas e despesas claras."
                    items={['Categorização de gastos', 'Gráficos mensais', 'Prestação de contas simples']}
                    icon={<Wallet size={24} weight="fill"/>}
                    color="emerald"
                />
            </div>
        </RevealOnScroll>
      </section>

      {/* 5. AI Highlight Section */}
      <section id="ia" className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-blue-900 dark:from-slate-900 dark:to-black"></div>
          {/* Abstract Shapes */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px]"></div>

          <RevealOnScroll className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
              <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-sm font-semibold border border-white/20 mb-6 backdrop-blur-sm">
                      <Lightning size={16} weight="fill" className="text-yellow-400" /> Exclusivo Zyndo
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                      Um Síndico com <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Superpoderes de IA</span>
                  </h2>
                  <p className="text-lg text-blue-100 mb-8 leading-relaxed">
                      Não sabe como escrever aquele comunicado delicado? Precisa de uma análise técnica sobre um problema? Nossa Inteligência Artificial integrada resolve para você.
                  </p>
                  
                  <div className="space-y-4">
                      <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 mt-1">
                              <ChatCircleText size={20} weight="fill"/>
                          </div>
                          <div>
                              <h4 className="text-white font-bold text-lg">Redator de Comunicados</h4>
                              <p className="text-blue-200 text-sm">A IA escreve avisos formais, educados ou urgentes em segundos.</p>
                          </div>
                      </div>
                      <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 mt-1">
                              <ShieldCheck size={20} weight="fill"/>
                          </div>
                          <div>
                              <h4 className="text-white font-bold text-lg">Análise de Problemas</h4>
                              <p className="text-blue-200 text-sm">Envie a descrição de um problema e receba um plano de ação sugerido.</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Chat Simulation Card */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 shadow-2xl relative">
                   <div className="absolute -top-4 -right-4 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg rotate-12">NOVO</div>
                   <div className="space-y-4">
                       <div className="flex gap-3 justify-end">
                           <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none text-sm max-w-[80%]">
                               Preciso avisar sobre a manutenção do elevador amanhã às 9h. Pode escrever algo educado?
                           </div>
                       </div>
                       <div className="flex gap-3">
                           <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">IA</div>
                           <div className="bg-white/20 text-white p-3 rounded-2xl rounded-tl-none text-sm max-w-[90%]">
                               <p className="font-bold mb-1">Título: Manutenção Preventiva no Elevador</p>
                               Prezados moradores, informamos que realizaremos uma manutenção preventiva no elevador social amanhã, às 09h00. Agradecemos a compreensão.
                           </div>
                       </div>
                   </div>
              </div>
          </RevealOnScroll>
      </section>

      {/* 6. Pricing Section */}
      <section id="precos" className="py-24 bg-[#F5F5F7] dark:bg-slate-900">
          <RevealOnScroll className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Planos transparentes</h2>
                  <p className="text-gray-500 dark:text-slate-400 text-lg">Escolha o melhor para o tamanho do seu condomínio.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 items-start">
                  {/* Basic */}
                  <PricingCard 
                      title="Básico"
                      price="R$ 0"
                      period="para sempre"
                      description="Para micro-condomínios iniciarem a organização."
                      features={['Até 5 unidades', 'Reservas básicas', 'Mural de avisos', 'Suporte por email']}
                  />

                  {/* Pro */}
                  <div className="relative transform md:-translate-y-4">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">MAIS POPULAR</div>
                      <PricingCard 
                          title="Profissional"
                          price="R$ 89"
                          period="/mês"
                          description="O pacote completo para gestão eficiente."
                          highlight
                          features={['Até 50 unidades', 'IA Ilimitada', 'Gestão Financeira', 'Suporte Prioritário', 'App PWA']}
                      />
                  </div>

                  {/* Admin */}
                  <PricingCard 
                      title="Administradora"
                      price="Sob Consulta"
                      period=""
                      description="Gestão multi-condomínio para empresas."
                      features={['Condomínios ilimitados', 'Painel Master', 'API de integração', 'Gerente de conta']}
                  />
              </div>
          </RevealOnScroll>
      </section>

      {/* 7. FAQ Section */}
      <section id="faq" className="py-24 bg-white dark:bg-slate-800/50">
          <RevealOnScroll className="max-w-3xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Perguntas Frequentes</h2>
              </div>
              
              <div className="space-y-4">
                  <FaqItem 
                    question="Preciso instalar algum programa no computador?" 
                    answer="Não! O Zyndo é 100% online. Você acessa pelo navegador do computador ou celular, sem instalações complicadas."
                  />
                  <FaqItem 
                    question="Como funciona o pagamento?" 
                    answer="Aceitamos cartão de crédito e PIX. O plano Profissional é cobrado mensalmente, sem fidelidade. Você pode cancelar quando quiser."
                  />
                  <FaqItem 
                    question="Meus dados estão seguros?" 
                    answer="Sim. Utilizamos criptografia de ponta e servidores seguros (Google Cloud) para garantir que as informações do seu condomínio estejam protegidas."
                  />
                  <FaqItem 
                    question="Serve para condomínios grandes?" 
                    answer="O Zyndo foi desenhado focando na simplicidade de pequenos e médios condomínios (até 100 unidades). Para condomínios clube gigantes, recomendamos soluções enterprise."
                  />
              </div>
          </RevealOnScroll>
      </section>

      {/* 8. Final CTA */}
      <section className="py-24 px-6 text-center">
          <RevealOnScroll className="max-w-4xl mx-auto bg-blue-600 dark:bg-blue-700 rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl shadow-blue-900/20">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="relative z-10 space-y-8">
                  <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Pronto para organizar seu condomínio?</h2>
                  <p className="text-blue-100 text-xl max-w-2xl mx-auto">
                      Junte-se a centenas de síndicos que recuperaram sua tranquilidade com o Zyndo.
                  </p>
                  <a 
                    href="#precos"
                    className="inline-block px-10 py-5 bg-white text-blue-600 rounded-full font-bold text-xl hover:bg-gray-100 transition-all shadow-xl hover:scale-105"
                  >
                      Criar Conta Grátis
                  </a>
                  <p className="text-blue-200 text-sm mt-4">Não requer cartão de crédito • Cancelamento a qualquer momento</p>
              </div>
          </RevealOnScroll>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-bold text-gray-400 dark:text-slate-600 font-['Bruno_Ace_SC'] tracking-wider">
                ZYNDO
            </div>
            <div className="flex gap-8 text-sm text-gray-500 dark:text-slate-500">
                <button onClick={() => setShowTerms(true)} className="hover:text-blue-600">Termos de Uso</button>
                <button onClick={() => setShowPrivacy(true)} className="hover:text-blue-600">Privacidade</button>
                <a href="mailto:contato@zyndo.com.br" className="hover:text-blue-600">Contato</a>
            </div>
            <p className="text-gray-400 dark:text-slate-600 text-sm">
                © {new Date().getFullYear()} Zyndo. Feito com ❤️ para síndicos.
            </p>
        </div>
      </footer>

      {/* Terms Modal */}
      {showTerms && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative shadow-2xl animate-fade-in-up">
                  <button onClick={() => setShowTerms(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X size={24}/></button>
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Termos de Uso</h2>
                  <div className="prose dark:prose-invert text-sm text-gray-600 dark:text-slate-300">
                      <p><strong>1. Aceitação dos Termos.</strong> Ao acessar e usar o Zyndo, você concorda em cumprir estes termos de serviço.</p>
                      <p><strong>2. Uso do Serviço.</strong> O Zyndo é uma plataforma para gestão de condomínios. Você é responsável por todo o conteúdo que publica (avisos, reservas, ocorrências). Não é permitido usar o serviço para fins ilegais ou para assediar outros moradores.</p>
                      <p><strong>3. Responsabilidade.</strong> O Zyndo é uma ferramenta tecnológica. Não somos administradores do condomínio nem somos responsáveis pelas decisões tomadas pelo síndico ou pelos moradores. Não garantimos que o serviço estará livre de erros ou interrupções.</p>
                      <p><strong>4. Pagamento e Cancelamento.</strong> Os planos pagos são cobrados mensalmente. Você pode cancelar sua assinatura a qualquer momento, sem multa, perdendo o acesso aos recursos premium no fim do ciclo de faturamento atual.</p>
                      <p><strong>5. Modificações.</strong> Reservamo-nos o direito de modificar estes termos a qualquer momento. O uso contínuo do serviço após as alterações constitui aceitação dos novos termos.</p>
                  </div>
                  <div className="mt-8 text-right">
                      <button onClick={() => setShowTerms(false)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700">Entendi</button>
                  </div>
              </div>
          </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative shadow-2xl animate-fade-in-up">
                  <button onClick={() => setShowPrivacy(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X size={24}/></button>
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Política de Privacidade</h2>
                  <div className="prose dark:prose-invert text-sm text-gray-600 dark:text-slate-300">
                      <p><strong>1. Coleta de Dados.</strong> Coletamos informações necessárias para a gestão condominial, incluindo: nome, email, número do apartamento e telefone. Também armazenamos os dados gerados pelo uso (reservas, ocorrências).</p>
                      <p><strong>2. Uso das Informações.</strong> Seus dados são usados exclusivamente para fornecer o serviço de gestão do seu condomínio. Não vendemos seus dados para terceiros.</p>
                      <p><strong>3. Segurança.</strong> Utilizamos práticas de segurança padrão da indústria (criptografia SSL, bancos de dados seguros no Google Cloud) para proteger suas informações. No entanto, nenhum método de transmissão pela internet é 100% seguro.</p>
                      <p><strong>4. Seus Direitos (LGPD).</strong> Você tem direito a acessar, corrigir ou excluir seus dados pessoais. Se você é um morador, solicite a exclusão ao síndico do seu condomínio. Se você é o síndico, pode solicitar a exclusão da conta do condomínio entrando em contato conosco.</p>
                      <p><strong>5. Cookies.</strong> Utilizamos cookies apenas para manter sua sessão de login ativa e preferências de tema.</p>
                  </div>
                  <div className="mt-8 text-right">
                      <button onClick={() => setShowPrivacy(false)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700">Entendi</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// --- Sub-components for cleaner code ---

const BenefitCard: React.FC<{icon: React.ReactNode, title: string, text: string}> = ({ icon, title, text }) => (
    <div className="bg-gray-50 dark:bg-slate-800 p-8 rounded-3xl hover:bg-white dark:hover:bg-slate-700 transition-all hover:shadow-xl border border-transparent hover:border-gray-100 dark:hover:border-slate-600 group">
        <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
        <p className="text-gray-500 dark:text-slate-400 leading-relaxed">{text}</p>
    </div>
);

const StepCard: React.FC<{number: string, title: string, text: string}> = ({ number, title, text }) => (
    <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">
            {number}
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
        <p className="text-gray-500 dark:text-slate-400 leading-relaxed max-w-xs">{text}</p>
    </div>
);

const FeatureBox: React.FC<{title: string, desc: string, items: string[], icon: React.ReactNode, color: string}> = ({ title, desc, items, icon, color }) => {
    // Mapping simpler color props to tailwind classes usually requires a full map or safelist. 
    // Using inline styles or a specific map for simplicity here.
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        red: 'bg-red-50 text-red-600',
        emerald: 'bg-emerald-50 text-emerald-600'
    };
    const darkColors: any = {
         blue: 'dark:bg-blue-900/20 dark:text-blue-400',
         indigo: 'dark:bg-indigo-900/20 dark:text-indigo-400',
         red: 'dark:bg-red-900/20 dark:text-red-400',
         emerald: 'dark:bg-emerald-900/20 dark:text-emerald-400'
    };

    return (
        <div className="bg-[#F5F5F7] dark:bg-slate-900 p-8 rounded-3xl border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-all">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${colors[color]} ${darkColors[color]}`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-slate-400 mb-6 text-sm h-10">{desc}</p>
            <ul className="space-y-3">
                {items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                        <Check size={14} weight="bold" className="text-blue-600 dark:text-blue-400"/> {item}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const PricingCard: React.FC<{title: string, price: string, period: string, description: string, features: string[], highlight?: boolean}> = ({ title, price, period, description, features, highlight }) => (
    <div className={`p-8 rounded-3xl border ${highlight ? 'bg-white dark:bg-slate-800 border-blue-500 dark:border-blue-500 shadow-2xl shadow-blue-500/10' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'}`}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">{price}</span>
            <span className="text-gray-500 dark:text-slate-400 text-sm">{period}</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-8 border-b border-gray-100 dark:border-slate-700 pb-8">{description}</p>
        <ul className="space-y-4 mb-8">
            {features.map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-slate-300">
                    <Check size={16} weight="bold" className="text-blue-600 dark:text-blue-400"/> {feat}
                </li>
            ))}
        </ul>
        <button className={`w-full py-3 rounded-xl font-bold transition-colors ${highlight ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white'}`}>
            Escolher Plano
        </button>
    </div>
);

const FaqItem: React.FC<{question: string, answer: string}> = ({ question, answer }) => (
    <div className="border-b border-gray-200 dark:border-slate-700 py-6">
        <details className="group">
            <summary className="flex justify-between items-center cursor-pointer list-none">
                <h4 className="font-bold text-gray-900 dark:text-white pr-4">{question}</h4>
                <span className="transition group-open:rotate-180">
                    <CaretDown size={20} className="text-gray-500"/>
                </span>
            </summary>
            <p className="text-gray-600 dark:text-slate-400 mt-4 leading-relaxed text-sm animate-fade-in">
                {answer}
            </p>
        </details>
    </div>
);