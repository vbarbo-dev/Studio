import React, { useState } from 'react';
import { Transaction, UserRole, TransactionStatus, TransactionType, User } from '../types';
import { Wallet, TrendUp, TrendDown, Plus, PencilSimple, Trash, Funnel, CalendarBlank, CheckCircle, WarningCircle, Receipt, X, UsersThree, FileArrowDown } from '@phosphor-icons/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AccountsProps {
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  updateTransaction?: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction?: (id: string) => void;
  userRole: UserRole;
  currentUser?: User; // Needed for resident view
}

export const Accounts: React.FC<AccountsProps> = ({ transactions, addTransaction, updateTransaction, removeTransaction, userRole, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'my_unit'>('overview');
  const [showForm, setShowForm] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<'all' | TransactionStatus>('all');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Form State
  const initialFormState = {
      description: '',
      amount: '',
      type: 'expense' as TransactionType,
      category: 'Geral',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'pending' as TransactionStatus,
      targetUnit: '',
      notes: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // Split Expense State
  const [splitData, setSplitData] = useState({ description: '', amount: '', category: 'Rateio Extra', dueDate: '' });

  // --- Helpers ---
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const parseAmount = (val: string) => Number(val.replace(/\D/g, '')) / 100;
  
  const formatAmountInput = (val: string) => {
      const num = Number(val.replace(/\D/g, '')) / 100;
      return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getStatusColor = (status: TransactionStatus) => {
      switch(status) {
          case 'paid': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border-green-100 dark:border-green-900/30';
          case 'pending': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
          case 'overdue': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/30';
          case 'cancelled': return 'text-gray-400 bg-gray-50 dark:bg-gray-800 dark:text-gray-500 border-gray-100 dark:border-gray-700';
      }
  };

  const getStatusLabel = (status: TransactionStatus) => {
      switch(status) {
          case 'paid': return 'Liquidado';
          case 'pending': return 'Pendente';
          case 'overdue': return 'Atrasado';
          case 'cancelled': return 'Cancelado';
      }
  };

  // --- Data Logic ---
  const filteredTransactions = transactions
    .filter(t => {
        // Resident View Filter: Only show global expenses (for transparency) or my unit's specific charges
        if (userRole === 'resident' && activeTab === 'my_unit') {
            return t.targetUnit === currentUser?.apartment;
        }
        // Month Filter
        return t.dueDate.startsWith(filterMonth);
    })
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  // Metrics
  const totalIncome = filteredTransactions.filter(t => t.type === 'income' && t.status === 'paid').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((acc, t) => acc + t.amount, 0);
  const pendingIncome = filteredTransactions.filter(t => t.type === 'income' && (t.status === 'pending' || t.status === 'overdue')).reduce((acc, t) => acc + t.amount, 0);
  const pendingExpense = filteredTransactions.filter(t => t.type === 'expense' && (t.status === 'pending' || t.status === 'overdue')).reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Chart Data
  const chartData = filteredTransactions.reduce((acc, curr) => {
      if (curr.status === 'cancelled') return acc;
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
          if (curr.type === 'income') existing.Receita += curr.amount;
          else existing.Despesa += curr.amount;
      } else {
          acc.push({
              name: curr.category,
              Receita: curr.type === 'income' ? curr.amount : 0,
              Despesa: curr.type === 'expense' ? curr.amount : 0
          });
      }
      return acc;
  }, [] as any[]);

  // --- Handlers ---
  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Avoid passing 'undefined' to Firestore
      const payload: any = {
          description: formData.description,
          amount: parseAmount(formData.amount),
          type: formData.type,
          category: formData.category,
          dueDate: formData.dueDate,
          status: formData.status,
          notes: formData.notes,
          source: 'manual'
      };

      if (formData.targetUnit) {
          payload.targetUnit = formData.targetUnit;
      }

      if (formData.status === 'paid') {
          payload.paidDate = new Date().toISOString();
      }

      if (editingId && updateTransaction) {
          updateTransaction(editingId, payload);
      } else {
          addTransaction({ 
              id: Date.now().toString(), 
              condoId: '', 
              createdAt: new Date().toISOString(),
              ...payload 
          });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormState);
  };

  const handleRateio = (e: React.FormEvent) => {
      e.preventDefault();
      const amount = parseAmount(splitData.amount);
      if (amount <= 0) return;

      // 1. Create the Master Expense
      const masterId = Date.now().toString();
      addTransaction({
          id: masterId,
          condoId: '',
          createdAt: new Date().toISOString(),
          description: `(Rateio) ${splitData.description}`,
          amount: amount,
          type: 'expense',
          category: splitData.category,
          dueDate: splitData.dueDate,
          status: 'paid', // Assuming condo pays the bill first
          source: 'manual',
          notes: 'Despesa mãe do rateio'
      });

      // 2. Create Receivables for each Unit (Mocking units 101-104 for example)
      // In a real scenario, we would iterate over `users` to find all unique apartments
      const units = ['101', '102', '103', '104', '201', '202', '203', '204', '301', '302']; // 10 units example
      const share = amount / units.length;

      units.forEach((unit, index) => {
          addTransaction({
              id: `${masterId}-${index}`,
              condoId: '',
              createdAt: new Date().toISOString(),
              description: `Cota Rateio: ${splitData.description}`,
              amount: share,
              type: 'income',
              category: 'Reembolso Rateio',
              dueDate: splitData.dueDate,
              status: 'pending',
              targetUnit: unit,
              source: 'recurring',
              notes: `Vinculado à despesa principal`
          });
      });

      setShowSplitModal(false);
      setSplitData({ description: '', amount: '', category: 'Rateio Extra', dueDate: '' });
  };

  const startEdit = (t: Transaction) => {
      setFormData({
          description: t.description,
          amount: formatCurrency(t.amount),
          type: t.type,
          category: t.category,
          dueDate: t.dueDate,
          status: t.status,
          targetUnit: t.targetUnit || '',
          notes: t.notes || ''
      });
      setEditingId(t.id);
      setShowForm(true);
  };

  const toggleStatus = (t: Transaction) => {
      if (!updateTransaction) return;
      const newStatus = t.status === 'paid' ? 'pending' : 'paid';
      const updates: any = { status: newStatus };
      
      if (newStatus === 'paid') {
          updates.paidDate = new Date().toISOString();
      } else {
          updates.paidDate = null; // Use null for Firestore to clear value
      }

      updateTransaction(t.id, updates);
  };

  return (
    <div className="space-y-8 animate-fade-in">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Wallet className="text-blue-800 dark:text-blue-500" size={32} weight="fill"/> Gestão Financeira
                </h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                    {userRole === 'resident' ? 'Transparência e suas contas' : 'Controle de caixa, rateios e inadimplência'}
                </p>
            </div>
            
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 text-blue-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}>Visão Geral</button>
                <button onClick={() => setActiveTab('ledger')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'ledger' ? 'bg-white dark:bg-slate-700 text-blue-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}>Lançamentos</button>
                {userRole === 'resident' && (
                    <button onClick={() => setActiveTab('my_unit')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'my_unit' ? 'bg-white dark:bg-slate-700 text-blue-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}>Minha Unidade</button>
                )}
            </div>
        </div>

        {/* Global Stats Cards */}
        {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg"><TrendUp weight="bold"/></div>
                        <span className="text-xs font-bold text-gray-400 uppercase">Receitas (Pago)</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalIncome)}</p>
                    <p className="text-xs text-amber-500 mt-1 font-medium">PENDENTE: {formatCurrency(pendingIncome)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg"><TrendDown weight="bold"/></div>
                        <span className="text-xs font-bold text-gray-400 uppercase">Despesas (Pago)</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalExpense)}</p>
                    <p className="text-xs text-amber-500 mt-1 font-medium">A PAGAR: {formatCurrency(pendingExpense)}</p>
                </div>
                <div className="bg-blue-800 dark:bg-blue-900 p-6 rounded-2xl shadow-lg shadow-blue-900/20 text-white col-span-1 md:col-span-2 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <span className="text-xs font-bold text-blue-200 uppercase relative z-10">Saldo em Caixa</span>
                    <div className="flex items-end gap-2 relative z-10">
                        <p className="text-4xl font-bold">{formatCurrency(balance)}</p>
                    </div>
                </div>
            </div>
        )}

        {/* Charts & Actions */}
        {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 h-[400px]">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-6">Fluxo por Categoria</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={chartData} barSize={20}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10"/>
                            <XAxis dataKey="name" stroke="#9CA3AF" tick={{fontSize: 10}} axisLine={false} tickLine={false} dy={10}/>
                            <YAxis stroke="#9CA3AF" tick={{fontSize: 10}} tickFormatter={(val) => `R$${val}`} axisLine={false} tickLine={false}/>
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}/>
                            <Bar dataKey="Receita" fill="#10B981" radius={[4,4,0,0]} />
                            <Bar dataKey="Despesa" fill="#EF4444" radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                
                {userRole === 'syndic' && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-4">Ações Rápidas</h3>
                            <div className="space-y-3">
                                <button onClick={() => { setShowForm(true); setFormData({...initialFormState, type: 'income'}); }} className="w-full py-3 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800">
                                    <Plus weight="bold"/> Nova Receita
                                </button>
                                <button onClick={() => { setShowForm(true); setFormData({...initialFormState, type: 'expense'}); }} className="w-full py-3 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/30">
                                    <Plus weight="bold"/> Nova Despesa
                                </button>
                                <button onClick={() => setShowSplitModal(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                                    <UsersThree weight="fill" size={18}/> Ratear Despesa
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Transaction Ledger (List) */}
        {(activeTab === 'ledger' || activeTab === 'my_unit') && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-700 p-1.5 rounded-lg border border-gray-200 dark:border-slate-600">
                            <CalendarBlank size={16} className="text-gray-400"/>
                            <input 
                                type="month" 
                                value={filterMonth} 
                                onChange={e => setFilterMonth(e.target.value)}
                                className="bg-transparent text-sm font-medium outline-none text-gray-700 dark:text-slate-200"
                            />
                        </div>
                        <div className="h-6 w-px bg-gray-300 dark:bg-slate-600"></div>
                        <button onClick={() => setFilterStatus('all')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${filterStatus === 'all' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>Todos</button>
                        <button onClick={() => setFilterStatus('pending')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${filterStatus === 'pending' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>Pendentes</button>
                        <button onClick={() => setFilterStatus('paid')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${filterStatus === 'paid' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>Pagos</button>
                    </div>
                    {userRole === 'syndic' && activeTab === 'ledger' && (
                        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                            <Plus weight="bold"/> Adicionar
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-700/30 text-gray-400 dark:text-slate-500 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Data Venc.</th>
                                <th className="px-6 py-4">Descrição</th>
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4 text-right">Valor</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                {userRole === 'syndic' && activeTab === 'ledger' && <th className="px-6 py-4 text-right">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-mono text-xs">
                                        {new Date(t.dueDate).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{t.description}</div>
                                        {t.targetUnit && <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Unidade {t.targetUnit}</div>}
                                        {t.source !== 'manual' && <div className="text-[10px] uppercase tracking-wide text-gray-400 mt-0.5">{t.source === 'reservation' ? 'Reserva' : t.source === 'fine' ? 'Multa' : 'Recorrente'}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-xs text-gray-600 dark:text-slate-300 font-medium">{t.category}</span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(t.status)}`}>
                                            {getStatusLabel(t.status)}
                                        </span>
                                    </td>
                                    {userRole === 'syndic' && activeTab === 'ledger' && (
                                        <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => toggleStatus(t)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-400 hover:text-green-600" title={t.status === 'paid' ? "Marcar como pendente" : "Marcar como pago"}>
                                                <CheckCircle size={18}/>
                                            </button>
                                            <button onClick={() => startEdit(t)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-400 hover:text-blue-600">
                                                <PencilSimple size={18}/>
                                            </button>
                                            <button onClick={() => removeTransaction && removeTransaction(t.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-400 hover:text-red-600">
                                                <Trash size={18}/>
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">Nenhum lançamento encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* MODAL: Transaction Form */}
        {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-2xl w-full border border-gray-100 dark:border-slate-700 shadow-2xl animate-fade-in-up overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                            {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
                        </h3>
                        <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500"><X size={20}/></button>
                    </div>
                    
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Tipo</label>
                                <div className="flex gap-2 bg-gray-50 dark:bg-slate-700 p-1 rounded-xl">
                                    <button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${formData.type === 'income' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>Receita</button>
                                    <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${formData.type === 'expense' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>Despesa</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Status</label>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as TransactionStatus})} className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl outline-none">
                                    <option value="pending">Pendente</option>
                                    <option value="paid">{formData.type === 'income' ? 'Recebido' : 'Pago'}</option>
                                    <option value="overdue">Atrasado</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Descrição</label>
                            <input type="text" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 rounded-xl outline-none focus:border-blue-500" placeholder="Ex: Manutenção Jardim"/>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Valor (R$)</label>
                                <input type="text" required value={formData.amount} onChange={e => setFormData({...formData, amount: formatAmountInput(e.target.value)})} className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 rounded-xl outline-none focus:border-blue-500" placeholder="0,00"/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Vencimento</label>
                                <input type="date" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 rounded-xl outline-none focus:border-blue-500"/>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Categoria</label>
                                <input type="text" list="categories" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 rounded-xl outline-none focus:border-blue-500"/>
                                <datalist id="categories"><option value="Condomínio"/><option value="Manutenção"/><option value="Água"/><option value="Luz"/><option value="Pessoal"/><option value="Fundo de Reserva"/></datalist>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Vincular Unidade (Opcional)</label>
                                <input type="text" value={formData.targetUnit} onChange={e => setFormData({...formData, targetUnit: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 rounded-xl outline-none focus:border-blue-500" placeholder="Ex: 101"/>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Notas / Observações</label>
                            <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 rounded-xl outline-none focus:border-blue-500 resize-none"></textarea>
                        </div>

                        <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">Salvar Lançamento</button>
                    </form>
                </div>
            </div>
        )}

        {/* MODAL: Split Expense (Rateio) */}
        {showSplitModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full border border-gray-100 dark:border-slate-700 shadow-2xl animate-fade-in-up">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <UsersThree size={24} className="text-blue-600"/> Rateio de Despesa
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                        Isso criará uma despesa paga pelo condomínio e gerará cobranças pendentes para <b>todas as unidades</b>.
                    </p>
                    
                    <form onSubmit={handleRateio} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Descrição do Rateio</label>
                            <input type="text" required value={splitData.description} onChange={e => setSplitData({...splitData, description: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 rounded-xl outline-none" placeholder="Ex: Conserto Portão"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Valor Total (R$)</label>
                            <input type="text" required value={splitData.amount} onChange={e => setSplitData({...splitData, amount: formatAmountInput(e.target.value)})} className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 rounded-xl outline-none" placeholder="0,00"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Vencimento da Cobrança</label>
                            <input type="date" required value={splitData.dueDate} onChange={e => setSplitData({...splitData, dueDate: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 rounded-xl outline-none"/>
                        </div>
                        
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setShowSplitModal(false)} className="flex-1 py-3 text-gray-600 dark:text-slate-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md">Gerar Cobranças</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
