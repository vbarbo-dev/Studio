import React, { useState } from 'react';
import { CondoDocument, UserRole, DocumentCategory } from '../types';
import { FilePdf, Link as LinkIcon, DownloadSimple, Trash, Plus, FileText, CheckCircle, Warning } from '@phosphor-icons/react';

interface DocumentsProps {
    documents: CondoDocument[];
    addDocument: (doc: CondoDocument) => void;
    removeDocument: (id: string) => void;
    userRole: UserRole;
    showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const Documents: React.FC<DocumentsProps> = ({ documents, addDocument, removeDocument, userRole, showToast }) => {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        category: 'general' as DocumentCategory,
        type: 'link' as 'file' | 'link',
        url: ''
    });

    const categoryLabels: Record<DocumentCategory, string> = {
        rules: 'Regimento & Normas',
        financial: 'Financeiro & Contas',
        minutes: 'Atas de Reunião',
        general: 'Geral'
    };

    const categoryColors: Record<DocumentCategory, string> = {
        rules: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        financial: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
        minutes: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        general: 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit size to 500KB for Firestore storage (since we are not using Storage Bucket in this MVP)
        if (file.size > 500 * 1024) {
            showToast('Arquivo muito grande (Max 500KB). Para arquivos maiores, use a opção "Link Externo" (Google Drive, etc).', 'error');
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setFormData(prev => ({ ...prev, url: reader.result as string }));
            showToast('Arquivo carregado com sucesso!');
        };
        reader.onerror = () => showToast('Erro ao ler arquivo.', 'error');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title || !formData.url) {
            showToast('Preencha todos os campos.', 'error');
            return;
        }

        addDocument({
            id: Date.now().toString(),
            condoId: '', // Overwritten by parent
            title: formData.title,
            category: formData.category,
            type: formData.type,
            url: formData.url,
            createdAt: new Date().toLocaleDateString('pt-BR')
        });

        setFormData({ title: '', category: 'general', type: 'link', url: '' });
        setShowForm(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-600 dark:text-blue-400" size={32} weight="fill"/> Documentos
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Regras, atas e prestação de contas do condomínio.</p>
                </div>
                {userRole === 'syndic' && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all font-medium text-sm"
                    >
                        <Plus size={18} weight="bold" /> Adicionar Documento
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-blue-100 dark:border-blue-900/30 shadow-xl shadow-blue-500/5 animate-fade-in-down">
                    <h3 className="font-bold text-lg mb-6 text-gray-900 dark:text-white">Novo Documento</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Título do Documento</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    placeholder="Ex: Regimento Interno 2024"
                                    className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Categoria</label>
                                <select 
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value as DocumentCategory})}
                                    className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    {Object.entries(categoryLabels).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Tipo de Arquivo</label>
                            <div className="flex gap-4">
                                <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${formData.type === 'link' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                                    <input type="radio" name="type" className="hidden" checked={formData.type === 'link'} onChange={() => setFormData({...formData, type: 'link', url: ''})} />
                                    <LinkIcon size={24} weight="bold"/>
                                    <span className="font-medium text-sm">Link Externo</span>
                                    <span className="text-xs opacity-70">Drive, Dropbox, Site</span>
                                </label>
                                <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${formData.type === 'file' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                                    <input type="radio" name="type" className="hidden" checked={formData.type === 'file'} onChange={() => setFormData({...formData, type: 'file', url: ''})} />
                                    <FilePdf size={24} weight="bold"/>
                                    <span className="font-medium text-sm">Upload Arquivo</span>
                                    <span className="text-xs opacity-70">PDF/Imagem (Max 500KB)</span>
                                </label>
                            </div>
                        </div>

                        {formData.type === 'link' ? (
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">URL do Link</label>
                                <input 
                                    type="url" 
                                    required 
                                    value={formData.url}
                                    onChange={e => setFormData({...formData, url: e.target.value})}
                                    placeholder="https://..."
                                    className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Selecione o Arquivo</label>
                                <input 
                                    type="file" 
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    onChange={handleFileUpload}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-700 dark:file:text-slate-300"
                                />
                                {formData.url && (
                                    <div className="mt-2 text-green-600 dark:text-green-400 text-xs flex items-center gap-1 font-medium">
                                        <CheckCircle size={12} weight="fill"/> Arquivo pronto para envio
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-medium text-sm">Cancelar</button>
                            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-md shadow-blue-500/20">Publicar Documento</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.length === 0 && (
                     <div className="col-span-full py-16 text-center rounded-3xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                        <div className="flex justify-center mb-4 text-gray-300 dark:text-slate-600">
                            <FileText size={48} weight="light"/>
                        </div>
                        <p className="text-gray-400 dark:text-slate-500">Nenhum documento disponível.</p>
                     </div>
                )}

                {documents.map((doc) => (
                    <div key={doc.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-full">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${doc.type === 'file' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                                    {doc.type === 'file' ? <FilePdf size={24} weight="fill"/> : <LinkIcon size={24} weight="bold"/>}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${categoryColors[doc.category]}`}>
                                    {categoryLabels[doc.category]}
                                </span>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2" title={doc.title}>
                                {doc.title}
                            </h3>
                            <p className="text-xs text-gray-400 dark:text-slate-500 font-medium mb-6">
                                Adicionado em {doc.createdAt}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-slate-700/50 mt-auto">
                            <a 
                                href={doc.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-colors"
                            >
                                {doc.type === 'file' ? <DownloadSimple size={16} /> : <LinkIcon size={16} />}
                                {doc.type === 'file' ? 'Baixar' : 'Acessar'}
                            </a>
                            {userRole === 'syndic' && (
                                <button 
                                    onClick={() => removeDocument(doc.id)}
                                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                    title="Excluir Documento"
                                >
                                    <Trash size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
