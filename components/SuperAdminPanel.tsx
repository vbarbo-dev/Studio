import React, { useState, useEffect } from 'react';
import { Condo } from '../types';
import { Buildings, Plus, Trash, Globe, Moon, Sun, User, Lock, Envelope } from '@phosphor-icons/react';
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface SuperAdminPanelProps {
    onLogout: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ onLogout, isDarkMode, toggleTheme }) => {
    const [condos, setCondos] = useState<Condo[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    
    // Condo Form State
    const [subdomain, setSubdomain] = useState('');
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [unitCount, setUnitCount] = useState(10);
    
    // Initial Syndic Form State
    const [syndicName, setSyndicName] = useState('');
    const [syndicEmail, setSyndicEmail] = useState('');
    const [syndicPassword, setSyndicPassword] = useState('');

    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'condos'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Condo));
            setCondos(data);
        });
        return () => unsubscribe();
    }, []);

    const handleCreateCondo = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
        
        if (!cleanSubdomain || !name || !syndicEmail || !syndicPassword || !syndicName) {
            setFeedback('Preencha todos os campos obrigatórios.');
            return;
        }

        try {
            // 1. Create Condo
            await setDoc(doc(db, 'condos', cleanSubdomain), {
                id: cleanSubdomain,
                name,
                address,
                unitCount: Number(unitCount),
                isActive: true,
                createdAt: new Date().toISOString()
            });

            // 2. Create Initial User (Syndic)
            await addDoc(collection(db, 'users'), {
                condoId: cleanSubdomain,
                name: syndicName,
                email: syndicEmail,
                password: syndicPassword,
                role: 'syndic',
                needsPasswordChange: true,
                apartment: 'Administração',
                phone: ''
            });
            
            setFeedback('');
            setIsAdding(false);
            // Reset Form
            setSubdomain(''); setName(''); setAddress(''); setUnitCount(10);
            setSyndicName(''); setSyndicEmail(''); setSyndicPassword('');

        } catch (error) {
            console.error(error);
            setFeedback('Erro ao criar condomínio e usuário.');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(`Tem certeza que deseja excluir o acesso do condomínio ${id}? Isso não apaga os dados, apenas o registro.`)) {
            await deleteDoc(doc(db, 'condos', id));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 font-sans transition-colors duration-300">
            <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-6 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Globe size={24} weight="fill" className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold font-['Bruno_Ace_SC'] text-gray-900 dark:text-white">ZYNDO <span className="text-blue-600 dark:text-blue-400">ADMIN</span></h1>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Gestão Multi-Cliente</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                     <button 
                        onClick={toggleTheme}
                        className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
                    >
                        {isDarkMode ? <Sun size={20} weight="fill" /> : <Moon size={20} weight="fill" />}
                    </button>
                    <button onClick={onLogout} className="text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 px-4 py-2 rounded-lg transition-colors">Sair</button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Condomínios Ativos</h2>
                        <p className="text-gray-500 dark:text-slate-400 mt-1">Gerencie os subdomínios, licenças e acessos iniciais.</p>
                    </div>
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                    >
                        <Plus size={18} weight="bold"/> Novo Condomínio
                    </button>
                </div>

                {isAdding && (
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 mb-10 animate-fade-in-down shadow-2xl">
                        <h3 className="font-bold text-xl mb-6 text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-4">
                            <Buildings size={24} className="text-blue-500"/> Cadastrar Novo Cliente
                        </h3>
                        <form onSubmit={handleCreateCondo} className="space-y-8">
                            
                            {/* Section 1: Condo Info */}
                            <div>
                                <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-4">Dados do Empreendimento</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Subdomínio (URL)</label>
                                        <div className="flex items-center">
                                            <input 
                                                type="text" 
                                                required
                                                value={subdomain}
                                                onChange={e => setSubdomain(e.target.value)}
                                                placeholder="ex: gaudi"
                                                className="flex-1 p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-l-xl text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            />
                                            <span className="bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-slate-300 p-3 border border-gray-200 dark:border-slate-600 rounded-r-xl text-sm font-mono border-l-0">.zyndo.com.br</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Apenas letras minúsculas e números.</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Nome do Condomínio</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Ex: Edifício Gaudi"
                                            className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Endereço</label>
                                        <input 
                                            type="text" 
                                            value={address}
                                            onChange={e => setAddress(e.target.value)}
                                            className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Limite de Unidades</label>
                                        <input 
                                            type="number" 
                                            required
                                            value={unitCount}
                                            onChange={e => setUnitCount(parseInt(e.target.value))}
                                            className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Initial User */}
                            <div>
                                <h4 className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-4">Primeiro Acesso (Gestor)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                     <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1"><User size={14}/> Nome do Síndico</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={syndicName}
                                            onChange={e => setSyndicName(e.target.value)}
                                            className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1"><Envelope size={14}/> Email de Login</label>
                                        <input 
                                            type="email" 
                                            required
                                            value={syndicEmail}
                                            onChange={e => setSyndicEmail(e.target.value)}
                                            className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1"><Lock size={14}/> Senha Inicial</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={syndicPassword}
                                            onChange={e => setSyndicPassword(e.target.value)}
                                            className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-end gap-3 items-center pt-4 border-t border-gray-100 dark:border-slate-700">
                                {feedback && <span className="text-red-500 dark:text-red-400 text-sm font-medium">{feedback}</span>}
                                <div className="flex gap-3 w-full md:w-auto">
                                    <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex-1 md:flex-none text-center">Cancelar</button>
                                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-900/20 flex-1 md:flex-none text-center">Salvar Cliente e Gestor</button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {condos.map(condo => (
                        <div key={condo.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-blue-500/50 transition-all group relative flex flex-col overflow-hidden hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                        <Buildings size={28} weight="fill" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate" title={condo.name}>{condo.name}</h3>
                                    <span className={`w-2.5 h-2.5 rounded-full ${condo.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} title={condo.isActive ? "Ativo" : "Inativo"}></span>
                                </div>
                                <a href={`http://${condo.id}.zyndo.com.br`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 font-mono hover:underline block mb-6">{condo.id}.zyndo.com.br</a>
                                
                                <div className="space-y-3 text-sm text-gray-500 dark:text-slate-400 border-t border-gray-100 dark:border-slate-700/50 pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">Unidades</span>
                                        <span className="text-gray-700 dark:text-slate-200 font-mono bg-gray-100 dark:bg-slate-700/50 px-2 py-0.5 rounded">{condo.unitCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">Cadastro</span>
                                        <span className="text-gray-700 dark:text-slate-300">{new Date(condo.createdAt).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                                <span className="text-xs text-gray-500 dark:text-slate-500 font-medium">{condo.isActive ? 'CONTRATO ATIVO' : 'CONTRATO SUSPENSO'}</span>
                                <button 
                                    onClick={() => handleDelete(condo.id)}
                                    className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                    title="Excluir Condomínio"
                                >
                                    <Trash size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};