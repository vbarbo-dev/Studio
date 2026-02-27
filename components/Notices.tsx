import React, { useState } from 'react';
import { Notice, UserRole } from '../types';
import { Plus, Sparkle, Trash, Megaphone, PencilSimple } from '@phosphor-icons/react';
import { generateNoticeDraft } from '../services/geminiService';

interface NoticesProps {
  notices: Notice[];
  addNotice: (notice: Notice) => void;
  updateNotice?: (id: string, updates: Partial<Notice>) => void;
  removeNotice: (id: string) => void;
  userRole: UserRole;
}

export const Notices: React.FC<NoticesProps> = ({ notices, addNotice, updateNotice, removeNotice, userRole }) => {
  const [showForm, setShowForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    content: '',
    tone: 'polite' as 'polite' | 'strict' | 'urgent',
    important: false
  });

  const handleGenerate = async () => {
    if (!formData.topic) return;
    setIsGenerating(true);
    const draft = await generateNoticeDraft(formData.topic, formData.tone);
    setFormData(prev => ({ ...prev, content: draft, title: prev.title || `Aviso sobre ${formData.topic}` }));
    setIsGenerating(false);
  };

  const startEdit = (notice: Notice) => {
      setFormData({
          title: notice.title,
          content: notice.content,
          topic: '',
          tone: 'polite',
          important: notice.important
      });
      setEditingId(notice.id);
      setShowForm(true);
  };

  const cancelForm = () => {
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', topic: '', content: '', tone: 'polite', important: false });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId && updateNotice) {
        updateNotice(editingId, {
            title: formData.title,
            content: formData.content,
            important: formData.important
        });
    } else {
        const newNotice: Notice = {
            id: Date.now().toString(),
            condoId: '', // Placeholder, overwritten by parent component
            title: formData.title,
            content: formData.content,
            date: new Date().toLocaleDateString('pt-BR'),
            author: 'Síndico',
            important: formData.important
        };
        addNotice(newNotice);
    }
    cancelForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Megaphone className="text-purple-600 dark:text-purple-400" size={32} weight="fill"/> Mural de Avisos
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Comunicação oficial do condomínio</p>
        </div>
        {userRole === 'syndic' && !showForm && (
            <button
            onClick={() => { cancelForm(); setShowForm(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all font-medium text-sm"
            >
            <Plus size={18} weight="bold" /> Novo Aviso
            </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xl shadow-gray-200/50 dark:shadow-slate-900/50 animate-fade-in-down mb-8">
          <h3 className="font-bold text-lg mb-6 text-gray-900 dark:text-white">{editingId ? 'Editar Comunicado' : 'Criar Novo Comunicado'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              {!editingId && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Tópico (para IA)</label>
                    <div className="flex gap-2">
                    <input
                        type="text"
                        value={formData.topic}
                        onChange={e => setFormData({ ...formData, topic: e.target.value })}
                        placeholder="Ex: Elevador quebrado terça-feira"
                        className="flex-1 p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                    <select 
                        value={formData.tone}
                        onChange={e => setFormData({...formData, tone: e.target.value as any})}
                        className="p-3 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                    >
                        <option value="polite">Educado</option>
                        <option value="strict">Firme</option>
                        <option value="urgent">Urgente</option>
                    </select>
                    </div>
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating || !formData.topic}
                        className="mt-3 text-sm flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-50 transition-colors bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg w-fit"
                    >
                        <Sparkle size={14} weight="fill" /> {isGenerating ? 'Escrevendo...' : 'Gerar Rascunho com IA'}
                    </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Título Final</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input 
                    type="checkbox" 
                    id="important"
                    checked={formData.important}
                    onChange={e => setFormData({...formData, important: e.target.checked})}
                    className="w-5 h-5 rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 cursor-pointer appearance-none border checked:bg-blue-600 checked:border-transparent relative after:content-[''] after:absolute after:top-[2px] after:left-[6px] after:w-[6px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45 after:opacity-0 checked:after:opacity-100 transition-all focus:ring-2 focus:ring-blue-500/20"
                />
                <label htmlFor="important" className="text-sm font-medium text-gray-700 dark:text-slate-300 select-none cursor-pointer">Marcar como Importante</label>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Conteúdo</label>
              <textarea
                required
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                className="w-full flex-1 min-h-[180px] p-4 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-sans leading-relaxed resize-none transition-all"
              ></textarea>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button onClick={cancelForm} className="px-5 py-2.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-medium text-sm">Cancelar</button>
            <button onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-md shadow-blue-500/20">Publicar</button>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {notices.map((notice) => (
          <div key={notice.id} className={`bg-white dark:bg-slate-800 p-8 rounded-2xl border ${notice.important ? 'border-l-4 border-l-red-500 border-gray-100 dark:border-slate-700' : 'border-gray-100 dark:border-slate-700'} shadow-sm hover:shadow-md transition-all duration-300 group`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white">{notice.title}</h3>
                        {notice.important && <span className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Importante</span>}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">{notice.date} • Por {notice.author}</p>
                </div>
                {userRole === 'syndic' && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => startEdit(notice)} className="text-gray-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors" title="Editar">
                            <PencilSimple size={18} />
                        </button>
                        <button onClick={() => removeNotice(notice.id)} className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Remover">
                            <Trash size={18} />
                        </button>
                    </div>
                )}
            </div>
            <p className="text-gray-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-base">{notice.content}</p>
          </div>
        ))}

        {notices.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                <p className="text-gray-400 dark:text-slate-500 font-medium">Nenhum aviso publicado.</p>
            </div>
        )}
      </div>
    </div>
  );
};