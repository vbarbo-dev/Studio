import React, { useState } from 'react';
import { Users, Warning, Wallet, CalendarCheck, CheckSquare, Plus, Trash, X } from '@phosphor-icons/react';
import { ViewState, UserRole, CondoSettings, Reminder } from '../types';

interface DashboardProps {
  changeView: (view: ViewState) => void;
  stats: {
    pendingIncidents: number;
    upcomingReservations: number;
    balance: number;
    activeNotices: number;
  };
  userRole: UserRole;
  condoSettings: CondoSettings;
  reminders: Reminder[];
  setReminders: (reminders: Reminder[]) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ changeView, stats, userRole, condoSettings, reminders, setReminders }) => {
  const [newReminder, setNewReminder] = useState('');
  const [isAddingReminder, setIsAddingReminder] = useState(false);

  const handleAddReminder = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newReminder.trim()) return;
      // condoId is empty string here as it's handled by the parent component/backend context when persisting
      setReminders([...reminders, { id: Date.now().toString(), condoId: '', text: newReminder, completed: false }]);
      setNewReminder('');
      setIsAddingReminder(false);
  };

  const toggleReminder = (id: string) => {
      setReminders(reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const deleteReminder = (id: string) => {
      setReminders(reminders.filter(r => r.id !== id));
  };

  const formatCurrency = (value: number) => {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Painel do {userRole === 'syndic' ? 'Síndico' : 'Morador'}</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Visão geral: {condoSettings.name} ({condoSettings.unitCount} unidades)</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card Ocorrências */}
        <div 
          onClick={() => changeView('incidents')}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100/50 dark:border-slate-700/50 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${stats.pendingIncidents > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-500 dark:text-green-400'}`}>
              <Warning size={24} weight="fill" />
            </div>
            <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Ação</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingIncidents}</h3>
          <p className="text-gray-500 dark:text-slate-400 text-sm group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors mt-1 font-medium">Ocorrências abertas</p>
        </div>

        {/* Card Reservas */}
        <div 
          onClick={() => changeView('reservations')}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100/50 dark:border-slate-700/50 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400">
              <CalendarCheck size={24} weight="fill" />
            </div>
            <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Agenda</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.upcomingReservations}</h3>
          <p className="text-gray-500 dark:text-slate-400 text-sm group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors mt-1 font-medium">Reservas agendadas</p>
        </div>

         {/* Card Financeiro */}
         <div 
          onClick={() => changeView('accounts')}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100/50 dark:border-slate-700/50 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400">
              <Wallet size={24} weight="fill" />
            </div>
            <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Finanças</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{formatCurrency(stats.balance)}</h3>
          <p className="text-gray-500 dark:text-slate-400 text-sm group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors mt-1 font-medium">Balanço do mês</p>
        </div>

        {/* Card Avisos */}
        <div 
          onClick={() => changeView('notices')}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100/50 dark:border-slate-700/50 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-500 dark:text-purple-400">
              <Users size={24} weight="fill" />
            </div>
            <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Mural</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeNotices}</h3>
          <p className="text-gray-500 dark:text-slate-400 text-sm group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors mt-1 font-medium">Avisos ativos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Reminders Section */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100/50 dark:border-slate-700/50 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckSquare size={20} className="text-amber-500" weight="fill" /> 
                  {userRole === 'syndic' ? 'Lembretes do Gestor' : 'Lembretes Gerais'}
              </h3>
              {userRole === 'syndic' && !isAddingReminder && (
                  <button onClick={() => setIsAddingReminder(true)} className="text-xs flex items-center gap-1 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 px-3 py-1.5 rounded-full transition-colors font-medium">
                      <Plus size={14} weight="bold" /> Adicionar
                  </button>
              )}
          </div>

          {isAddingReminder && (
              <form onSubmit={handleAddReminder} className="mb-4 flex gap-2">
                  <input 
                    autoFocus
                    type="text" 
                    value={newReminder}
                    onChange={e => setNewReminder(e.target.value)}
                    placeholder="Novo lembrete..."
                    className="flex-1 text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                  <button type="submit" className="text-xs bg-blue-600 text-white px-3 rounded-lg font-medium">OK</button>
                  <button type="button" onClick={() => setIsAddingReminder(false)} className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"><X size={16}/></button>
              </form>
          )}
          
          <ul className="space-y-3 overflow-y-auto max-h-[200px] flex-1 pr-2 custom-scrollbar">
            {reminders.length === 0 && <li className="text-sm text-gray-400 dark:text-slate-500 italic text-center py-4">Nenhum lembrete pendente.</li>}
            {reminders.map(reminder => (
                <li key={reminder.id} className="flex items-center justify-between text-sm group bg-gray-50/50 dark:bg-slate-700/30 p-3 rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-slate-600 transition-all">
                   <div className="flex items-center gap-3">
                       {userRole === 'syndic' ? (
                           <input 
                                type="checkbox" 
                                checked={reminder.completed} 
                                onChange={() => toggleReminder(reminder.id)}
                                className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-500 cursor-pointer bg-white dark:bg-slate-800 accent-blue-600 appearance-none border checked:bg-blue-600 checked:border-transparent relative after:content-[''] after:absolute after:top-[2px] after:left-[6px] after:w-[6px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45 after:opacity-0 checked:after:opacity-100 transition-all"
                           />
                       ) : (
                           <span className={`w-2.5 h-2.5 rounded-full ${reminder.completed ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                       )}
                       <span className={`font-medium ${reminder.completed ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-700 dark:text-slate-200'}`}>
                           {reminder.text}
                       </span>
                   </div>
                   {userRole === 'syndic' && (
                       <button onClick={() => deleteReminder(reminder.id)} className="text-gray-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                           <Trash size={16} />
                       </button>
                   )}
                </li>
            ))}
          </ul>
        </div>

        {userRole === 'syndic' && (
            <div className="bg-gradient-to-br from-[#4e54c8] to-[#8f94fb] dark:from-indigo-900 dark:to-indigo-700 text-white p-8 rounded-2xl shadow-lg shadow-indigo-500/20 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <h3 className="text-2xl font-bold mb-3 relative z-10">Resolva com IA</h3>
                <p className="text-indigo-50/90 dark:text-indigo-100 mb-6 relative z-10 leading-relaxed max-w-sm">Use a inteligência artificial para redigir comunicados difíceis ou analisar problemas de manutenção.</p>
                <button onClick={() => changeView('notices')} className="bg-white/95 dark:bg-white/10 backdrop-blur text-indigo-600 dark:text-white hover:bg-white dark:hover:bg-white/20 px-5 py-3 rounded-xl font-semibold transition-all shadow-sm w-fit relative z-10">
                Criar Comunicado IA
                </button>
            </div>
        )}
        {userRole === 'resident' && (
            <div className="bg-gradient-to-br from-[#11998e] to-[#38ef7d] dark:from-emerald-900 dark:to-emerald-700 text-white p-8 rounded-2xl shadow-lg shadow-emerald-500/20 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <h3 className="text-2xl font-bold mb-3 relative z-10">Área Comum</h3>
                <p className="text-emerald-50/90 dark:text-emerald-100 mb-6 relative z-10 leading-relaxed max-w-sm">Reserve o salão de festas ou a churrasqueira para o seu próximo evento de forma rápida.</p>
                <button onClick={() => changeView('reservations')} className="bg-white/95 dark:bg-white/10 backdrop-blur text-emerald-600 dark:text-white hover:bg-white dark:hover:bg-white/20 px-5 py-3 rounded-xl font-semibold transition-all shadow-sm w-fit relative z-10">
                Fazer Reserva
                </button>
            </div>
        )}
      </div>
    </div>
  );
};