import React, { useState } from 'react';
import { CondoSettings } from '../types';
import { Gear, FloppyDisk, Buildings, Lock } from '@phosphor-icons/react';

interface SettingsProps {
    settings: CondoSettings;
    onSave: (settings: CondoSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
    const [formData, setFormData] = useState<CondoSettings>(settings);
    const [saved, setSaved] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Gear className="text-gray-500 dark:text-slate-400" size={32} weight="fill"/> Configurações do Condomínio
                </h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Gerencie os dados cadastrais</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="flex items-start gap-4 p-5 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl text-blue-800 dark:text-blue-300 text-sm border border-blue-100/50 dark:border-blue-800/50">
                        <Buildings size={24} className="shrink-0 text-blue-600 dark:text-blue-400" weight="fill"/>
                        <p className="leading-relaxed">Mantenha os dados atualizados para facilitar a identificação nos comunicados.</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Nome do Condomínio</label>
                            <input 
                                type="text" 
                                required
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full p-3.5 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Endereço Completo</label>
                            <input 
                                type="text" 
                                required
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                className="w-full p-3.5 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                                Quantidade de Unidades <span className="text-xs normal-case font-normal text-gray-400">(Definido pelo plano)</span>
                            </label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    disabled
                                    value={formData.unitCount}
                                    className="w-full p-3.5 border border-gray-200 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-500 rounded-xl outline-none cursor-not-allowed"
                                />
                                <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                        {saved ? (
                            <span className="text-green-600 dark:text-green-400 text-sm font-medium animate-fade-in bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full">Alterações salvas com sucesso!</span>
                        ) : <span></span>}
                        <button 
                            type="submit" 
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 flex items-center gap-2 font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                        >
                            <FloppyDisk size={18} weight="bold"/> Salvar Configurações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};