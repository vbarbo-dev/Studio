import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockProcessPayment, createSaaSAccount, checkSubdomainAvailability } from '../services/saasService';
import { ArrowRight, CheckCircle, Warning, X, Globe, IdentificationCard, Hash } from '@phosphor-icons/react';

interface RegisterCondoProps {
    onClose: () => void;
    isDarkMode?: boolean;
}

export const RegisterCondo: React.FC<RegisterCondoProps> = ({ onClose, isDarkMode }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [docType, setDocType] = useState<'CPF' | 'CNPJ'>('CNPJ');
    const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

    const [formData, setFormData] = useState({
        email: '',
        cpfCnpj: '',
        condoName: '',
        unitsCount: 0,
        subdomain: ''
    });
    const [isSubdomainManual, setIsSubdomainManual] = useState(false);

    // Mascarar CPF/CNPJ
    const maskDocument = (value: string, type: 'CPF' | 'CNPJ') => {
        const digits = value.replace(/\D/g, '');
        if (type === 'CPF') {
            return digits
                .slice(0, 11)
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            return digits
                .slice(0, 14)
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }
    };

    const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = maskDocument(e.target.value, docType);
        setFormData({ ...formData, cpfCnpj: masked });
    };

    // Gerar subdomínio automático quando o nome muda
    useEffect(() => {
        if (formData.condoName && !isSubdomainManual) {
            const slug = formData.condoName
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            
            setFormData(prev => {
                // Só atualiza se o subdomínio for diferente para evitar loops
                if (prev.subdomain === slug) return prev;
                return { ...prev, subdomain: slug };
            });
        }
    }, [formData.condoName, isSubdomainManual]);

    // Verificar disponibilidade do subdomínio
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (formData.subdomain.length >= 3) {
                setSubdomainStatus('checking');
                const isAvailable = await checkSubdomainAvailability(formData.subdomain);
                setSubdomainStatus(isAvailable ? 'available' : 'taken');
            } else {
                setSubdomainStatus('idle');
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.subdomain]);

    const handleNext = () => {
        if (step === 1) {
            if (!formData.email || !formData.cpfCnpj || !formData.condoName || !formData.unitsCount || !formData.subdomain) {
                setError('Preencha todos os campos corretamente.');
                return;
            }
            if (subdomainStatus === 'taken') {
                setError('Este subdomínio já está em uso.');
                return;
            }
            setStep(2);
            setError('');
        }
    };

    const handleRegister = async () => {
        setLoading(true);
        setError('');
        try {
            await mockProcessPayment('pro_plan');
            await createSaaSAccount(formData);
            setSuccess(true);
            setLoading(false);
        } catch (err: any) {
            console.error(err);
            setLoading(false);
            setError(err.message || 'Erro ao criar conta. Tente novamente.');
        }
    };

    const handleFinish = () => {
        onClose();
        // Redirecionar para o subdomínio
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        
        // Se estiver em localhost ou similar (ambiente de desenvolvimento/preview)
        if (hostname === 'localhost' || hostname.includes('run.app')) {
            // No ambiente de preview, simulamos via path
            window.location.href = `/${formData.subdomain}`; 
        } else {
            // Em produção real: meucondo.zyndo.com.br
            // Removemos o 'www' se existir para evitar 'subdomain.www.zyndo.com.br'
            const baseDomain = hostname.replace(/^www\./, '');
            window.location.href = `${protocol}//${formData.subdomain}.${baseDomain}`;
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl relative animate-fade-in-up text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={32} weight="fill" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Cadastro Realizado!</h2>
                    <p className="text-gray-600 dark:text-slate-300 mb-6">
                        Enviamos um e-mail para <strong>{formData.email}</strong> com um link para definir sua senha.
                    </p>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-8 border border-blue-100 dark:border-blue-800/30">
                        <p className="text-xs text-blue-800 dark:text-blue-300 font-bold uppercase mb-1">Seu endereço de acesso:</p>
                        <p className="text-lg font-mono text-blue-600 dark:text-blue-400 break-all">
                            {formData.subdomain}.zyndo.com.br
                        </p>
                    </div>
                    <button 
                        onClick={handleFinish}
                        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                        Acessar meu Painel <ArrowRight size={20} weight="bold"/>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl p-8 shadow-2xl relative animate-fade-in-up overflow-y-auto max-h-[95vh]">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"><X size={20} /></button>
                
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {step === 1 ? 'Cadastre seu Condomínio' : 'Confirmar e Pagar'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl font-medium flex items-center gap-2">
                        <Warning size={18}/> {error}
                    </div>
                )}

                {step === 1 ? (
                    <div className="space-y-5">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 ml-1">Nome do Condomínio</label>
                                <input 
                                    type="text" 
                                    value={formData.condoName}
                                    onChange={e => setFormData({...formData, condoName: e.target.value})}
                                    className="w-full p-4 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Ex: Residencial Flores"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 ml-1 flex items-center gap-2">
                                    <Globe size={14}/> Subdomínio (URL de acesso)
                                </label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={formData.subdomain}
                                        onChange={e => {
                                            setIsSubdomainManual(true);
                                            setFormData({...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')});
                                        }}
                                        className={`w-full p-4 pr-32 border ${subdomainStatus === 'taken' ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono text-sm`}
                                        placeholder="meu-condominio"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <span className="text-gray-400 dark:text-slate-500 text-xs">.zyndo.com.br</span>
                                        {subdomainStatus === 'checking' && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
                                        {subdomainStatus === 'available' && <CheckCircle size={18} weight="fill" className="text-green-500"/>}
                                        {subdomainStatus === 'taken' && <Warning size={18} weight="fill" className="text-red-500"/>}
                                    </div>
                                </div>
                                {subdomainStatus === 'taken' && <p className="text-[10px] text-red-500 mt-1 ml-1 font-bold uppercase">Este endereço já está sendo usado por outro condomínio.</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 ml-1">Documento</label>
                                <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-xl mb-2">
                                    <button 
                                        onClick={() => { setDocType('CPF'); setFormData({...formData, cpfCnpj: ''}); }}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'CPF' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500'}`}
                                    >
                                        CPF
                                    </button>
                                    <button 
                                        onClick={() => { setDocType('CNPJ'); setFormData({...formData, cpfCnpj: ''}); }}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${docType === 'CNPJ' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500'}`}
                                    >
                                        CNPJ
                                    </button>
                                </div>
                                <input 
                                    type="text" 
                                    value={formData.cpfCnpj}
                                    onChange={handleDocChange}
                                    className="w-full p-4 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    placeholder={docType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 ml-1 flex items-center gap-2"><Hash size={14}/> Unidades</label>
                                <input 
                                    type="number" 
                                    value={formData.unitsCount || ''}
                                    onChange={e => setFormData({...formData, unitsCount: parseInt(e.target.value) || 0})}
                                    className="w-full p-4 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Ex: 50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 ml-1">E-mail do Administrador</label>
                            <input 
                                type="email" 
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="w-full p-4 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                placeholder="admin@condominio.com"
                            />
                        </div>

                        <button 
                            onClick={handleNext}
                            disabled={subdomainStatus === 'taken' || subdomainStatus === 'checking'}
                            className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            Continuar <ArrowRight size={20} weight="bold"/>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-slate-600 pb-2">Resumo do Pedido</h3>
                            <div className="flex justify-between mb-2 text-sm">
                                <span className="text-gray-500 dark:text-slate-400">Plano</span>
                                <span className="font-medium text-gray-900 dark:text-white">Profissional</span>
                            </div>
                            <div className="flex justify-between mb-2 text-sm">
                                <span className="text-gray-500 dark:text-slate-400">Condomínio</span>
                                <span className="font-medium text-gray-900 dark:text-white">{formData.condoName}</span>
                            </div>
                            <div className="flex justify-between mb-4 text-sm">
                                <span className="text-gray-500 dark:text-slate-400">Subdomínio</span>
                                <span className="font-medium text-blue-600 dark:text-blue-400">{formData.subdomain}.zyndo.com.br</span>
                            </div>
                            <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-slate-600 text-lg font-bold">
                                <span className="text-gray-900 dark:text-white">Total</span>
                                <span className="text-green-600 dark:text-green-400">R$ 199,90/mês</span>
                            </div>
                        </div>

                        <div className="text-xs text-gray-400 dark:text-slate-500 text-center px-4">
                            Ao confirmar, você concorda com os Termos de Uso e Política de Privacidade.
                            O pagamento será processado automaticamente (Simulação).
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setStep(1)}
                                className="flex-1 py-4 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Voltar
                            </button>
                            <button 
                                onClick={handleRegister}
                                disabled={loading}
                                className="flex-[2] py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? 'Processando...' : 'Confirmar e Pagar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
