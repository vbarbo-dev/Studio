import React, { useState } from 'react';
import { Visitor, User } from '../types';
import { UserFocus, Plus, Clock, CheckCircle, Trash } from '@phosphor-icons/react';

interface MyVisitorsProps {
    visitors: Visitor[];
    currentUser: User;
    addVisitor: (v: Visitor) => void;
    showToast: (msg: string) => void;
}

export const MyVisitors: React.FC<MyVisitorsProps> = ({ visitors, currentUser, addVisitor, showToast }) => {
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [date, setDate] = useState('');

    // Filter visitors for this resident's apartment
    const myVisitors = visitors.filter(v => v.targetApartment === currentUser.apartment).sort((a,b) => new Date(b.entryTime || b.expectedDate || '').getTime() - new Date(a.entryTime || a.expectedDate || '').getTime());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addVisitor({
            id: Date.now().toString(),
            condoId: '',
            name,
            targetApartment: currentUser.apartment || '',
            type: 'visitor',
            status: 'expected',
            expectedDate: date ? new Date(date).toISOString() : new Date().toISOString()
        });
        showToast('Visitante autorizado! A portaria foi notificada.');
        setShowForm(false);
        setName('');
        setDate('');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <UserFocus className="text-blue-600 dark:text-blue-400" size={32} weight="fill"/> Meus Visitantes
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Autorize a entrada e veja o histórico.</p>
                </div>
                {!showForm && (
                    <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full shadow-md flex items-center gap-2 font-medium text-sm transition-all">
                        <Plus size={18} weight="bold"/> Autorizar Entrada
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-lg animate-fade-in-down mb-6">
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Nova Autorização</h3>
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Nome do Visitante</label>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 rounded-xl outline-none focus:border-blue-500" placeholder="Ex: Maria Silva" />
                        </div>
                        <div className="w-full md:w-48">
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Data Prevista</label>
                            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 rounded-xl outline-none focus:border-blue-500" />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-3 bg-gray-100 dark:bg-slate-700 rounded-xl font-medium text-gray-600 dark:text-slate-300">Cancelar</button>
                            <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors">Salvar</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {myVisitors.length === 0 && <p className="text-center text-gray-400 py-12">Nenhum registro encontrado.</p>}
                {myVisitors.map(v => (
                    <div key={v.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${v.status === 'inside' ? 'bg-green-100 text-green-700' : v.status === 'expected' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                {v.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{v.name}</h4>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    {v.status === 'expected' 
                                        ? `Esperado em: ${new Date(v.expectedDate!).toLocaleDateString('pt-BR')}`
                                        : `Entrou em: ${new Date(v.entryTime!).toLocaleDateString('pt-BR')} às ${new Date(v.entryTime!).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`
                                    }
                                </p>
                            </div>
                        </div>
                        <div>
                            {v.status === 'expected' && <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-blue-100">Aguardando</span>}
                            {v.status === 'inside' && <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-green-100 flex items-center gap-1"><CheckCircle weight="fill"/> No Local</span>}
                            {v.status === 'exited' && <span className="bg-gray-50 text-gray-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-gray-100">Saiu</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
