import React, { useState, useEffect } from 'react';
import { User, Visitor, Order, Unit } from '../types';
import { Package, UserFocus, Truck, MagnifyingGlass, Clock, SignOut, CheckCircle, X, Camera } from '@phosphor-icons/react';

interface ConciergePanelProps {
    visitors: Visitor[];
    orders: Order[];
    users: User[]; // To validate apartments
    units: Unit[];
    addVisitor: (v: Visitor) => void;
    updateVisitor: (id: string, updates: Partial<Visitor>) => void;
    addOrder: (o: Order) => void;
    updateOrder: (id: string, updates: Partial<Order>) => void;
    showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ConciergePanel: React.FC<ConciergePanelProps> = ({ visitors, orders, users, units, addVisitor, updateVisitor, addOrder, updateOrder, showToast }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedItem, setSelectedItem] = useState<{type: 'visitor' | 'order', id: string} | null>(null);
    const [activeAction, setActiveAction] = useState<'visitor' | 'order' | 'provider' | null>(null);
    
    // Forms
    const [formUnitId, setFormUnitId] = useState('');
    const [formName, setFormName] = useState(''); // Visitor Name or Order Description
    const [formRecipient, setFormRecipient] = useState(''); // Order Recipient
    const [formDoc, setFormDoc] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Filter active items for the feed
    const activeVisitors = visitors.filter(v => v.status === 'inside' || v.status === 'expected').sort((a,b) => new Date(b.entryTime || b.expectedDate || '').getTime() - new Date(a.entryTime || a.expectedDate || '').getTime());
    const pendingOrders = orders.filter(o => o.status === 'pending').sort((a,b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    // Combined Feed
    const feedItems = [
        ...activeVisitors.map(v => ({...v, feedType: 'visitor' as const})),
        ...pendingOrders.map(o => ({...o, feedType: 'order' as const}))
    ].sort((a, b) => {
        // Sort by most recent interaction
        const dateA = a.feedType === 'visitor' ? (a.entryTime || a.expectedDate) : a.receivedAt;
        const dateB = b.feedType === 'visitor' ? (b.entryTime || b.expectedDate) : b.receivedAt;
        return new Date(dateB || '').getTime() - new Date(dateA || '').getTime();
    });

    const handleActionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate Unit
        const selectedUnit = units.find(u => u.id === formUnitId);
        
        // Allow "ADM" or manual entry if units list is empty or for flexibility? 
        // The requirement says "atreladas à unidade". So we should enforce unit selection if units exist.
        // If it's for Administration (ADM), maybe we need a special handling or just assume units exist.
        // Let's assume units exist. If not, maybe fallback to manual?
        // The prompt implies we HAVE units now.
        
        if (!selectedUnit && formUnitId !== 'ADM') {
             showToast('Selecione uma unidade válida.', 'error');
             return;
        }

        const unitLabel = selectedUnit ? (selectedUnit.block ? `${selectedUnit.number} (${selectedUnit.block})` : selectedUnit.number) : 'ADM';

        if (activeAction === 'order') {
            addOrder({
                id: Date.now().toString(),
                condoId: '',
                description: formName,
                targetApartment: unitLabel,
                unitId: selectedUnit?.id,
                recipientName: formRecipient,
                status: 'pending',
                receivedAt: new Date().toISOString()
            });
            showToast('Encomenda registrada!');
        } else {
            addVisitor({
                id: Date.now().toString(),
                condoId: '',
                name: formName,
                document: formDoc,
                type: activeAction === 'provider' ? 'provider' : 'visitor',
                targetApartment: unitLabel,
                unitId: selectedUnit?.id,
                status: 'inside',
                entryTime: new Date().toISOString()
            });
            showToast(`${activeAction === 'provider' ? 'Prestador' : 'Visitante'} registrado!`);
        }
        resetForm();
    };

    const resetForm = () => {
        setActiveAction(null);
        setFormUnitId('');
        setFormName('');
        setFormRecipient('');
        setFormDoc('');
    };

    // Detail Panel Logic
    const renderDetailPanel = () => {
        if (!selectedItem) return <div className="h-full flex items-center justify-center text-gray-400 text-center px-6">Selecione um item da lista para ver detalhes e ações.</div>;

        if (selectedItem.type === 'visitor') {
            const v = visitors.find(x => x.id === selectedItem.id);
            if (!v) return null;
            return (
                <div className="animate-fade-in">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl mb-6 text-center">
                        <div className="w-24 h-24 bg-blue-200 dark:bg-blue-800 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-blue-800 dark:text-blue-300">
                            {v.name.charAt(0)}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{v.name}</h3>
                        <p className="text-blue-800 dark:text-blue-400 font-medium mt-1">{v.type === 'provider' ? 'Prestador de Serviço' : 'Visitante'}</p>
                    </div>
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-2">
                            <span className="text-gray-500 dark:text-slate-400">Destino</span>
                            <span className="font-bold text-gray-900 dark:text-white text-lg">Apto {v.targetApartment}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-2">
                            <span className="text-gray-500 dark:text-slate-400">Entrada</span>
                            <span className="font-medium text-gray-900 dark:text-white">{v.entryTime ? new Date(v.entryTime).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : 'Aguardando'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-2">
                            <span className="text-gray-500 dark:text-slate-400">Documento</span>
                            <span className="font-medium text-gray-900 dark:text-white">{v.document || '-'}</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {v.status === 'expected' ? (
                             <button onClick={() => { updateVisitor(v.id, { status: 'inside', entryTime: new Date().toISOString() }); setSelectedItem(null); showToast('Entrada confirmada'); }} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg">Confirmar Chegada</button>
                        ) : (
                             <button onClick={() => { updateVisitor(v.id, { status: 'exited', exitTime: new Date().toISOString() }); setSelectedItem(null); showToast('Saída registrada'); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg">Registrar Saída</button>
                        )}
                    </div>
                </div>
            );
        } else {
            const o = orders.find(x => x.id === selectedItem.id);
            if (!o) return null;
            return (
                <div className="animate-fade-in">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl mb-6 text-center">
                        <div className="w-24 h-24 bg-amber-200 dark:bg-amber-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <Package size={48} className="text-amber-700 dark:text-amber-300" weight="fill"/>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">{o.description}</h3>
                        <p className="text-amber-600 dark:text-amber-400 font-medium mt-1">Encomenda / Correio</p>
                    </div>
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-2">
                            <span className="text-gray-500 dark:text-slate-400">Destinatário</span>
                            <div className="text-right">
                                <span className="font-bold text-gray-900 dark:text-white text-lg block">Apto {o.targetApartment}</span>
                                {o.recipientName && <span className="text-sm text-gray-500 dark:text-slate-400 block">{o.recipientName}</span>}
                            </div>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-2">
                            <span className="text-gray-500 dark:text-slate-400">Recebido em</span>
                            <span className="font-medium text-gray-900 dark:text-white">{new Date(o.receivedAt).toLocaleDateString('pt-BR')} às {new Date(o.receivedAt).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                    </div>
                    <button onClick={() => { updateOrder(o.id, { status: 'delivered', deliveredAt: new Date().toISOString() }); setSelectedItem(null); showToast('Encomenda entregue!'); }} className="w-full bg-blue-800 hover:bg-blue-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2">
                        <CheckCircle size={24} weight="bold"/> Marcar como Entregue
                    </button>
                </div>
            );
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] grid grid-cols-12 gap-6 p-2">
            
            {/* COLUMN 1: ACTIONS */}
            <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 text-center mb-2">
                    <p className="text-gray-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">Data e Hora</p>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-1 font-mono">
                        {currentTime.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </h2>
                    <p className="text-sm text-gray-400 dark:text-slate-500">{currentTime.toLocaleDateString('pt-BR', {weekday: 'long', day:'numeric', month:'long'})}</p>
                </div>

                {!activeAction ? (
                    <>
                        <button onClick={() => setActiveAction('visitor')} className="flex-1 bg-blue-800 hover:bg-blue-900 text-white p-6 rounded-3xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] text-left group">
                            <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                                <UserFocus size={28} weight="fill"/>
                            </div>
                            <h3 className="text-xl font-bold">Registrar<br/>Visitante</h3>
                        </button>
                        <button onClick={() => setActiveAction('order')} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white p-6 rounded-3xl shadow-lg shadow-amber-900/20 transition-all hover:scale-[1.02] text-left group">
                            <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                                <Package size={28} weight="fill"/>
                            </div>
                            <h3 className="text-xl font-bold">Receber<br/>Encomenda</h3>
                        </button>
                        <button onClick={() => setActiveAction('provider')} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white p-6 rounded-3xl shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] text-left group">
                            <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                                <Truck size={28} weight="fill"/>
                            </div>
                            <h3 className="text-xl font-bold">Prestador<br/>de Serviço</h3>
                        </button>
                    </>
                ) : (
                    <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-lg border border-blue-100 dark:border-slate-600 flex flex-col animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                {activeAction === 'order' ? 'Nova Encomenda' : activeAction === 'provider' ? 'Novo Prestador' : 'Novo Visitante'}
                            </h3>
                            <button onClick={resetForm} className="bg-gray-100 dark:bg-slate-700 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleActionSubmit} className="space-y-4 flex-1 flex flex-col">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Unidade / Apto</label>
                                <select 
                                    required 
                                    value={formUnitId} 
                                    onChange={e => setFormUnitId(e.target.value)} 
                                    className="w-full p-4 bg-gray-50 dark:bg-slate-700 rounded-xl text-lg font-bold border border-gray-200 dark:border-slate-600 outline-none focus:border-blue-800"
                                >
                                    <option value="">Selecione...</option>
                                    {units.filter(u => u.status === 'active').sort((a,b) => a.number.localeCompare(b.number)).map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.number} {u.block ? `(${u.block})` : ''}
                                        </option>
                                    ))}
                                    <option value="ADM">Administração</option>
                                </select>
                            </div>
                            
                            {activeAction === 'order' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Destinatário (Opcional)</label>
                                    <input type="text" value={formRecipient} onChange={e => setFormRecipient(e.target.value)} placeholder="Ex: João Silva" className="w-full p-4 bg-gray-50 dark:bg-slate-700 rounded-xl text-lg border border-gray-200 dark:border-slate-600 focus:border-blue-800 outline-none" />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">{activeAction === 'order' ? 'Descrição do Pacote' : 'Nome Completo'}</label>
                                <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} placeholder={activeAction === 'order' ? "Ex: Caixa Mercado Livre" : "Nome do visitante"} className="w-full p-4 bg-gray-50 dark:bg-slate-700 rounded-xl text-lg border border-gray-200 dark:border-slate-600 focus:border-blue-800 outline-none" />
                            </div>
                            {activeAction !== 'order' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Documento (RG/CPF)</label>
                                    <input type="text" value={formDoc} onChange={e => setFormDoc(e.target.value)} placeholder="Opcional" className="w-full p-4 bg-gray-50 dark:bg-slate-700 rounded-xl text-lg border border-gray-200 dark:border-slate-600 focus:border-blue-800 outline-none" />
                                </div>
                            )}
                            <div className="mt-auto">
                                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-md transition-transform active:scale-95">
                                    Confirmar Registro
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* COLUMN 2: FEED */}
            <div className="col-span-12 md:col-span-5 bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock size={20} className="text-blue-800" weight="fill"/> Atividade em Tempo Real
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {feedItems.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 opacity-60">
                            <MagnifyingGlass size={48} weight="duotone" className="mb-2"/>
                            <p>Sem atividade recente.</p>
                        </div>
                    )}
                    {feedItems.map((item, idx) => (
                        <div 
                            key={`${item.feedType}-${item.id}`}
                            onClick={() => setSelectedItem({type: item.feedType, id: item.id})}
                            className={`p-4 rounded-2xl cursor-pointer transition-all border-l-4 hover:shadow-md ${
                                selectedItem?.id === item.id 
                                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-800' 
                                : 'bg-gray-50 dark:bg-slate-700/30 border-transparent hover:bg-white dark:hover:bg-slate-700'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${item.feedType === 'visitor' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300'}`}>
                                        {item.feedType === 'visitor' ? <UserFocus size={24} weight="fill"/> : <Package size={24} weight="fill"/>}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-base">
                                            {'name' in item ? item.name : item.description}
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">
                                            Apto <span className="font-bold text-gray-800 dark:text-slate-200">{item.targetApartment}</span>
                                            {item.feedType === 'visitor' && 'status' in item && item.status === 'expected' && <span className="ml-2 text-orange-500 font-bold text-xs uppercase bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded">Pré-autorizado</span>}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-mono text-gray-400 dark:text-slate-500">
                                    {item.feedType === 'visitor' 
                                        ? ('entryTime' in item && item.entryTime ? new Date(item.entryTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Chegando')
                                        : ('receivedAt' in item && new Date(item.receivedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}))
                                    }
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* COLUMN 3: DETAILS */}
            <div className="col-span-12 md:col-span-4 bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
                {renderDetailPanel()}
            </div>
        </div>
    );
};
