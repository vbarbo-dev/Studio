import React, { useState } from 'react';
import { Unit, User, Condo, ResidentType } from '../types';
import { House, Plus, PencilSimple, Trash, Eye, CheckCircle, Prohibit, Warning, X, UserPlus, Users } from '@phosphor-icons/react';

interface UnitsManagerProps {
    units: Unit[];
    users: User[];
    condo: Condo;
    addUnit: (unit: Unit) => void;
    updateUnit: (id: string, updates: Partial<Unit>) => void;
    showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const UnitsManager: React.FC<UnitsManagerProps> = ({ units, users, condo, addUnit, updateUnit, showToast }) => {
    const [showForm, setShowForm] = useState(false);
    const [showViewModal, setShowViewModal] = useState<Unit | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        number: '',
        block: '',
        status: 'active' as 'active' | 'inactive'
    });

    const activeUnitsCount = units.filter(u => u.status === 'active').length;
    const limitReached = activeUnitsCount >= condo.unitCount;

    // Helpers
    const getResidentsForUnit = (unitId: string) => users.filter(u => u.unitId === unitId);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.number.trim()) {
            showToast('Número da unidade é obrigatório.', 'error');
            return;
        }

        // Check uniqueness
        const duplicate = units.find(u => 
            u.number === formData.number && 
            u.block === formData.block && 
            u.id !== editingId
        );

        if (duplicate) {
            showToast('Já existe uma unidade com este número/bloco.', 'error');
            return;
        }

        if (editingId) {
            updateUnit(editingId, {
                number: formData.number,
                block: formData.block,
                status: formData.status
            });
            showToast('Unidade atualizada.');
        } else {
            if (limitReached) {
                showToast('Limite de unidades do plano atingido.', 'error');
                return;
            }
            addUnit({
                id: Date.now().toString(),
                condoId: condo.id,
                number: formData.number,
                block: formData.block,
                status: formData.status
            });
            showToast('Unidade criada com sucesso.');
        }
        resetForm();
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ number: '', block: '', status: 'active' });
    };

    const startEdit = (unit: Unit) => {
        setFormData({
            number: unit.number,
            block: unit.block || '',
            status: unit.status
        });
        setEditingId(unit.id);
        setShowForm(true);
    };

    const toggleStatus = (unit: Unit) => {
        const newStatus = unit.status === 'active' ? 'inactive' : 'active';
        // If activating, check limit
        if (newStatus === 'active' && limitReached) {
            showToast('Não é possível ativar. Limite do plano atingido.', 'error');
            return;
        }
        updateUnit(unit.id, { status: newStatus });
        showToast(`Unidade ${newStatus === 'active' ? 'ativada' : 'desativada'}.`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <House className="text-blue-600 dark:text-blue-400" size={32} weight="fill"/> Gestão de Unidades
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Gerencie as unidades habitacionais do condomínio.</p>
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex flex-col items-end mr-2">
                        <span className="text-xs font-bold uppercase text-gray-500 dark:text-slate-400">Utilização do Plano</span>
                        <span className={`text-sm font-bold ${limitReached ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                            {activeUnitsCount} de {condo.unitCount} unidades
                        </span>
                    </div>
                    {!showForm && (
                        <button
                            onClick={() => { resetForm(); setShowForm(true); }}
                            disabled={limitReached}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-full shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all font-medium text-sm w-full sm:w-auto"
                        >
                            <Plus size={18} weight="bold" /> Nova Unidade
                        </button>
                    )}
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-blue-100 dark:border-blue-900/30 shadow-xl shadow-blue-500/5 animate-fade-in-down mb-8">
                    <h3 className="font-bold text-lg mb-6 text-gray-900 dark:text-white">{editingId ? 'Editar Unidade' : 'Nova Unidade'}</h3>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Número</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.number} 
                                    onChange={e => setFormData({...formData, number: e.target.value})} 
                                    className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Ex: 101"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Bloco (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={formData.block} 
                                    onChange={e => setFormData({...formData, block: e.target.value})} 
                                    className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Ex: A"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Status</label>
                                <select 
                                    value={formData.status} 
                                    onChange={e => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                                    className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                >
                                    <option value="active">Ativa</option>
                                    <option value="inactive">Inativa</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button type="button" onClick={resetForm} className="px-5 py-2.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-medium text-sm">Cancelar</button>
                            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-md shadow-blue-500/20">Salvar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 text-gray-400 dark:text-slate-500 uppercase tracking-wider text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Unidade</th>
                                <th className="px-6 py-4">Bloco</th>
                                <th className="px-6 py-4 text-center">Moradores</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                            {units.map(unit => {
                                const residentsCount = getResidentsForUnit(unit.id).length;
                                return (
                                    <tr key={unit.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{unit.number}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-slate-400">{unit.block || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg text-xs font-bold">
                                                {residentsCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {unit.status === 'active' ? (
                                                <span className="text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wide bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">Ativa</span>
                                            ) : (
                                                <span className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wide bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">Inativa</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => setShowViewModal(unit)}
                                                className="p-2 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="Visualizar"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button 
                                                onClick={() => startEdit(unit)}
                                                className="p-2 text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <PencilSimple size={18} />
                                            </button>
                                            <button 
                                                onClick={() => toggleStatus(unit)}
                                                className={`p-2 rounded-lg transition-colors ${unit.status === 'active' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                                                title={unit.status === 'active' ? "Desativar" : "Ativar"}
                                            >
                                                {unit.status === 'active' ? <Prohibit size={18} /> : <CheckCircle size={18} />}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {units.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500 italic">Nenhuma unidade cadastrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal */}
            {showViewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-lg w-full border border-gray-100 dark:border-slate-700 shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-900 dark:text-white">Unidade {showViewModal.number}</h3>
                                {showViewModal.block && <p className="text-gray-500 dark:text-slate-400">Bloco {showViewModal.block}</p>}
                            </div>
                            <button onClick={() => setShowViewModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500"><X size={20}/></button>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Users size={14} weight="fill"/> Moradores Vinculados
                            </h4>
                            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-2 max-h-60 overflow-y-auto">
                                {getResidentsForUnit(showViewModal.id).length === 0 ? (
                                    <p className="text-center text-gray-400 dark:text-slate-500 text-sm py-4">Nenhum morador vinculado.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {getResidentsForUnit(showViewModal.id).map(resident => (
                                            <div key={resident.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{resident.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400">{resident.email}</p>
                                                </div>
                                                <span className="text-[10px] uppercase font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg">
                                                    {resident.residentType === 'owner' ? 'Proprietário' : resident.residentType === 'tenant' ? 'Inquilino' : 'Dependente'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button onClick={() => setShowViewModal(null)} className="px-6 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl font-medium text-sm transition-colors">Fechar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
