import React, { useState } from 'react';
import { User, UserRole, Unit, ResidentType } from '../types';
import { UserPlus, ArrowCounterClockwise, Trash, Users, PencilSimple, Warning, ShieldCheck, Key, Info, Funnel } from '@phosphor-icons/react';

interface ResidentsManagerProps {
  users: User[];
  units: Unit[];
  addUser: (u: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  removeUser: (id: string) => void;
  resetPassword: (id: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ResidentsManager: React.FC<ResidentsManagerProps> = ({ users, units, addUser, updateUser, removeUser, resetPassword, showToast }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | UserRole>('all');
  
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      cpf: '',
      apartment: '',
      phone: '',
      role: 'resident' as UserRole,
      unitId: '',
      residentType: 'owner' as ResidentType
  });

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: 'delete' | 'reset', userId: string, userName: string} | null>(null);

  // Filter users based on active tab and exclude super_admin
  const filteredUsers = users
    .filter(u => u.role !== 'super_admin')
    .filter(u => activeTab === 'all' ? true : u.role === activeTab)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Input Masks
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '') // Remove non-digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1'); // Limit length
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, cpf: formatCPF(e.target.value) });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, phone: formatPhone(e.target.value) });
  };

  const startEdit = (user: User) => {
      setFormData({
          name: user.name,
          email: user.email,
          cpf: user.cpf || '',
          apartment: user.apartment || '',
          phone: user.phone || '',
          role: user.role,
          unitId: user.unitId || '',
          residentType: user.residentType || 'owner'
      });
      setEditingId(user.id);
      setShowForm(true);
  };

  const cancelForm = () => {
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', email: '', cpf: '', apartment: '', phone: '', role: 'resident', unitId: '', residentType: 'owner' });
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const rawCpf = formData.cpf.replace(/\D/g, '');

      // Check Duplicates
      const duplicateEmail = users.find(u => u.email === formData.email && u.id !== editingId);
      const duplicateCPF = users.find(u => u.cpf === formData.cpf && u.id !== editingId);

      if (duplicateEmail) {
          showToast('Este email já está cadastrado.', 'error');
          return;
      }
      if (duplicateCPF) {
          showToast('Este CPF já está cadastrado.', 'error');
          return;
      }
      if (rawCpf.length !== 11) {
          showToast('Por favor, insira um CPF válido com 11 dígitos.', 'error');
          return;
      }

      // Logic for apartment field based on role
      let finalApartment = formData.apartment;
      let finalUnitId = undefined;
      let finalResidentType = undefined;

      if (formData.role === 'resident') {
          if (formData.unitId) {
              const unit = units.find(u => u.id === formData.unitId);
              if (unit) {
                  finalApartment = unit.block ? `${unit.number} (${unit.block})` : unit.number;
                  finalUnitId = unit.id;
                  finalResidentType = formData.residentType;
              }
          }
      } else if (formData.role === 'doorman') {
          finalApartment = 'Portaria';
      } else {
          finalApartment = 'Administração';
      }

      if (editingId) {
          // Update mode
          const updates: any = {
              name: formData.name,
              email: formData.email,
              cpf: formData.cpf,
              phone: formData.phone,
              apartment: finalApartment,
              role: formData.role
          };
          if (finalUnitId) updates.unitId = finalUnitId;
          if (finalResidentType) updates.residentType = finalResidentType;
          
          updateUser(editingId, updates);
      } else {
          // Create mode
          const newUser: any = {
              role: formData.role,
              name: formData.name,
              email: formData.email,
              cpf: formData.cpf, 
              phone: formData.phone,
              apartment: finalApartment,
              password: rawCpf, 
              needsPasswordChange: true,
              createdAt: new Date().toISOString()
          };
          
          if (finalUnitId) newUser.unitId = finalUnitId;
          if (finalResidentType) newUser.residentType = finalResidentType;
          
          addUser(newUser as User);
      }
      
      cancelForm();
  };

  const executeConfirmAction = () => {
      if (!confirmModal) return;
      if (confirmModal.action === 'delete') {
          removeUser(confirmModal.userId);
      } else {
          resetPassword(confirmModal.userId);
      }
      setConfirmModal(null);
  };

  const getRoleBadge = (role: UserRole) => {
      switch(role) {
          case 'syndic': return <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 py-1 px-2 rounded text-[10px] font-bold uppercase tracking-wide border border-purple-200 dark:border-purple-800">Gestor</span>;
          case 'doorman': return <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 py-1 px-2 rounded text-[10px] font-bold uppercase tracking-wide border border-orange-200 dark:border-orange-800">Porteiro</span>;
          default: return <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 py-1 px-2 rounded text-[10px] font-bold uppercase tracking-wide border border-blue-100 dark:border-blue-800">Morador</span>;
      }
  };

  const getRoleDescription = (role: UserRole) => {
      switch(role) {
          case 'syndic': return "Acesso total ao sistema: financeiro, configurações, gestão de usuários e aprovações.";
          case 'doorman': return "Acesso restrito ao Painel da Portaria: registro de visitantes e recebimento de encomendas. Não vê financeiro.";
          default: return "Acesso ao aplicativo de morador: reservas, avisos, ocorrências e suas próprias encomendas.";
      }
  };

  return (
    <div className="space-y-6 relative">
        {confirmModal && (
           <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-sm w-full animate-fade-in-down border border-gray-100 dark:border-slate-700 text-center">
                   <div className="flex justify-center mb-4">
                       <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full">
                           <Warning size={32} weight="fill" />
                       </div>
                   </div>
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                       {confirmModal.action === 'delete' ? 'Excluir Usuário?' : 'Resetar Senha?'}
                   </h3>
                   <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
                       {confirmModal.action === 'delete' 
                        ? `Tem certeza que deseja remover ${confirmModal.userName}? Essa ação não pode ser desfeita.` 
                        : `A senha de ${confirmModal.userName} será redefinida para o CPF.`}
                   </p>
                   <div className="flex gap-3">
                       <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors">Cancelar</button>
                       <button onClick={executeConfirmAction} className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium shadow-lg shadow-red-600/20 transition-colors">Confirmar</button>
                   </div>
               </div>
           </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="text-indigo-600 dark:text-indigo-400" size={32} weight="fill"/> Gestão de Usuários
                </h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Gerencie os acessos de moradores e funcionários.</p>
            </div>
            {!showForm && (
                <button
                    onClick={() => { cancelForm(); setShowForm(true); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all font-medium text-sm w-full sm:w-auto"
                >
                    <UserPlus size={18} weight="bold" /> Novo Usuário
                </button>
            )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
                { id: 'all', label: 'Todos' },
                { id: 'resident', label: 'Moradores' },
                { id: 'syndic', label: 'Gestores' },
                { id: 'doorman', label: 'Porteiros' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border
                        ${activeTab === tab.id 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        {showForm && (
             <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 shadow-xl shadow-indigo-500/5 animate-fade-in-down mb-8">
             <h3 className="font-bold text-lg mb-6 text-gray-900 dark:text-white">{editingId ? 'Editar Usuário' : 'Cadastrar Usuário'}</h3>
             <form onSubmit={handleSubmit} className="space-y-6">
                 
                 {/* Role Selection */}
                 <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-600">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1"><ShieldCheck size={14} weight="fill"/> Tipo de Acesso</label>
                    <div className="flex flex-col md:flex-row gap-4">
                        <select 
                            value={formData.role} 
                            onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                            className="p-3 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all md:w-1/3"
                        >
                            <option value="resident">Morador</option>
                            <option value="syndic">Gestor / Síndico</option>
                            <option value="doorman">Porteiro</option>
                        </select>
                        <div className="flex-1 flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                            <Info size={24} className="text-blue-500 shrink-0" weight="fill"/>
                            <p className="leading-snug text-xs md:text-sm">{getRoleDescription(formData.role)}</p>
                        </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                     <div>
                         <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Nome Completo</label>
                         <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Email</label>
                         <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">CPF {editingId ? '' : '(Senha Inicial)'}</label>
                         <input 
                            type="text" 
                            required 
                            value={formData.cpf} 
                            onChange={handleCPFChange} 
                            className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                            placeholder="000.000.000-00" 
                            maxLength={14}
                         />
                     </div>
                     
                     {/* Unit Selection - Only for Residents */}
                     {formData.role === 'resident' && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Unidade</label>
                                {units.length > 0 ? (
                                    <select 
                                        required
                                        value={formData.unitId} 
                                        onChange={e => setFormData({...formData, unitId: e.target.value})} 
                                        className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    >
                                        <option value="">Selecione...</option>
                                        {units.filter(u => u.status === 'active').sort((a,b) => a.number.localeCompare(b.number)).map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.number} {u.block ? `(${u.block})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.apartment} 
                                        onChange={e => setFormData({...formData, apartment: e.target.value})} 
                                        className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                                        placeholder="Ex: 515 (Manual)" 
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Tipo de Morador</label>
                                <select 
                                    value={formData.residentType} 
                                    onChange={e => setFormData({...formData, residentType: e.target.value as ResidentType})} 
                                    className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                >
                                    <option value="owner">Proprietário</option>
                                    <option value="tenant">Inquilino</option>
                                    <option value="dependent">Dependente</option>
                                </select>
                            </div>
                        </>
                     )}

                     <div>
                         <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Telefone</label>
                         <input 
                            type="text" 
                            required 
                            value={formData.phone} 
                            onChange={handlePhoneChange} 
                            className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                         />
                     </div>
                 </div>
                 <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                     <button type="button" onClick={cancelForm} className="px-5 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 rounded-xl w-full md:w-auto font-medium transition-colors">Cancelar</button>
                     <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl w-full md:w-auto hover:bg-indigo-700 font-bold transition-colors shadow-md shadow-indigo-500/20">Salvar Usuário</button>
                 </div>
             </form>
         </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 text-gray-400 dark:text-slate-500 uppercase tracking-wider text-xs font-semibold">
                        <tr>
                            <th className="px-8 py-5">Nome / Função</th>
                            <th className="px-6 py-5">Apto</th>
                            <th className="px-6 py-5">Contato</th>
                            <th className="px-6 py-5">CPF</th>
                            <th className="px-6 py-5">Status</th>
                            <th className="px-8 py-5 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="font-bold text-gray-900 dark:text-white">{user.name}</div>
                                    <div className="mt-1">{getRoleBadge(user.role)}</div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-gray-600 dark:text-slate-300 font-medium">{user.apartment || '-'}</span>
                                </td>
                                <td className="px-6 py-5 text-gray-500 dark:text-slate-400">
                                    <div className="text-gray-900 dark:text-white font-medium">{user.email}</div>
                                    <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{user.phone}</div>
                                </td>
                                <td className="px-6 py-5 text-gray-500 dark:text-slate-400 font-mono text-xs">
                                    {user.cpf}
                                </td>
                                <td className="px-6 py-5">
                                    {user.needsPasswordChange ? (
                                        <span className="text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1"><Key size={12}/> Pendente</span>
                                    ) : (
                                        <span className="text-green-600 dark:text-green-400 text-[10px] font-bold flex items-center gap-1"><ShieldCheck size={12}/> Ativo</span>
                                    )}
                                </td>
                                <td className="px-8 py-5 text-right flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => startEdit(user)}
                                        className="p-2 text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <PencilSimple size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setConfirmModal({isOpen: true, action: 'reset', userId: user.id, userName: user.name})}
                                        className="p-2 text-gray-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                        title="Resetar Senha"
                                    >
                                        <ArrowCounterClockwise size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setConfirmModal({isOpen: true, action: 'delete', userId: user.id, userName: user.name})}
                                        className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Remover Acesso"
                                    >
                                        <Trash size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500 italic">Nenhum usuário encontrado neste filtro.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};