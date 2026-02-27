import React, { useState } from 'react';
import { Visitor, Order } from '../types';
import { ClockCounterClockwise, MagnifyingGlass, UserFocus, Package, Truck, Funnel } from '@phosphor-icons/react';

interface AccessLogProps {
    visitors: Visitor[];
    orders: Order[];
}

export const AccessLog: React.FC<AccessLogProps> = ({ visitors, orders }) => {
    const [filterType, setFilterType] = useState<'all' | 'visitor' | 'provider' | 'order'>('all');
    const [searchApt, setSearchApt] = useState('');

    // Combine and Normalize Data
    const allItems = [
        ...visitors.map(v => ({
            id: v.id,
            type: v.type, // 'visitor' or 'provider'
            title: v.name,
            apartment: v.targetApartment,
            status: v.status,
            date: v.entryTime || v.expectedDate,
            details: v.document || '-'
        })),
        ...orders.map(o => ({
            id: o.id,
            type: 'order',
            title: o.description,
            apartment: o.targetApartment,
            status: o.status,
            date: o.receivedAt,
            details: o.deliveredAt ? `Entregue em: ${new Date(o.deliveredAt).toLocaleString('pt-BR')}` : 'Aguardando'
        }))
    ].sort((a,b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

    // Filter Logic
    const filteredItems = allItems.filter(item => {
        const matchesType = filterType === 'all' || item.type === filterType;
        const matchesApt = searchApt === '' || item.apartment.toLowerCase().includes(searchApt.toLowerCase());
        return matchesType && matchesApt;
    });

    const getStatusBadge = (item: any) => {
        if (item.type === 'order') {
            return item.status === 'delivered' 
                ? <span className="text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-xs font-bold">Entregue</span>
                : <span className="text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded text-xs font-bold">Pendente</span>;
        } else {
            return item.status === 'inside'
                ? <span className="text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-xs font-bold">No Local</span>
                : item.status === 'expected'
                ? <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-xs font-bold">Aguardando</span>
                : <span className="text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-bold">Saiu</span>;
        }
    };

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'visitor': return <UserFocus size={18} className="text-blue-500"/>;
            case 'provider': return <Truck size={18} className="text-slate-500"/>;
            case 'order': return <Package size={18} className="text-amber-500"/>;
            default: return <UserFocus size={18}/>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClockCounterClockwise className="text-slate-600 dark:text-slate-400" size={32} weight="fill"/> Portaria: Histórico
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Registro completo de entradas e encomendas.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                    <Funnel size={20} className="text-gray-400 shrink-0"/>
                    <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>Todos</button>
                    <button onClick={() => setFilterType('visitor')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'visitor' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>Visitantes</button>
                    <button onClick={() => setFilterType('provider')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'provider' ? 'bg-slate-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>Prestadores</button>
                    <button onClick={() => setFilterType('order')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'order' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>Encomendas</button>
                </div>
                <div className="w-full md:flex-1 relative">
                    <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input 
                        type="text" 
                        placeholder="Filtrar por apartamento..." 
                        value={searchApt}
                        onChange={(e) => setSearchApt(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 text-gray-400 dark:text-slate-500 uppercase tracking-wider text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Data/Hora</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Descrição / Nome</th>
                                <th className="px-6 py-4">Apto</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                            {filteredItems.map((item, idx) => (
                                <tr key={`${item.type}-${item.id}-${idx}`} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-slate-400">
                                        {item.date ? new Date(item.date).toLocaleString('pt-BR') : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-medium capitalize text-gray-700 dark:text-slate-300">
                                            {getTypeIcon(item.type)} {item.type === 'visitor' ? 'Visitante' : item.type === 'provider' ? 'Prestador' : 'Encomenda'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                        {item.title}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-bold text-gray-600 dark:text-slate-300">
                                            {item.apartment}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(item)}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-slate-400 max-w-[200px] truncate">
                                        {item.details}
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500 italic">Nenhum registro encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};