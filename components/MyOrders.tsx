import React from 'react';
import { Order, User } from '../types';
import { Package, CheckCircle, Clock } from '@phosphor-icons/react';

interface MyOrdersProps {
    orders: Order[];
    currentUser: User;
}

export const MyOrders: React.FC<MyOrdersProps> = ({ orders, currentUser }) => {
    // Filter orders for this resident's apartment
    const myOrders = orders.filter(o => o.targetApartment === currentUser.apartment).sort((a,b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="text-amber-500" size={32} weight="fill"/> Minhas Encomendas
                </h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Acompanhe o que chegou na portaria.</p>
            </div>

            <div className="grid gap-4">
                {myOrders.length === 0 && (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                        <Package size={48} className="text-gray-300 mx-auto mb-4" weight="duotone"/>
                        <p className="text-gray-400 dark:text-slate-500">Nenhuma encomenda registrada.</p>
                    </div>
                )}
                {myOrders.map(order => (
                    <div key={order.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4 w-full">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${order.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>
                                <Package size={28} weight="fill"/>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-900 dark:text-white">{order.description}</h4>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    Recebido em {new Date(order.receivedAt).toLocaleDateString('pt-BR')} às {new Date(order.receivedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>
                        <div className="w-full md:w-auto flex justify-end">
                            {order.status === 'pending' ? (
                                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-xl text-sm font-bold border border-amber-100 dark:border-amber-900/30 flex items-center gap-2 shadow-sm w-full md:w-auto justify-center">
                                    <Clock size={18} weight="bold"/> Aguardando Retirada
                                </div>
                            ) : (
                                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-2 rounded-xl text-sm font-bold border border-green-100 dark:border-green-900/30 flex items-center gap-2 w-full md:w-auto justify-center">
                                    <CheckCircle size={18} weight="bold"/> Entregue {order.deliveredAt && `em ${new Date(order.deliveredAt).toLocaleDateString('pt-BR')}`}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
