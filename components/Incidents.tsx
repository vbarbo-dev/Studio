import React, { useState } from 'react';
import { Incident, User } from '../types';
import { Warning, CheckCircle, Circle, Lightbulb, Robot, Check, X, Clock, ArrowRight, Image, UploadSimple } from '@phosphor-icons/react';
import { analyzeIncident } from '../services/geminiService';

interface IncidentsProps {
  incidents: Incident[];
  addIncident: (inc: Incident) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  removeIncident: (id: string) => void;
  currentUser: User;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const Incidents: React.FC<IncidentsProps> = ({ incidents, addIncident, updateIncident, removeIncident, currentUser, showToast }) => {
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Resolution Modal State
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // In Progress Modal State
  const [progressingId, setProgressingId] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState('');

  // Image Compression Utility
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
              const img = new Image();
              img.src = event.target?.result as string;
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  
                  // Max width 800px
                  const MAX_WIDTH = 800;
                  const scaleSize = MAX_WIDTH / img.width;
                  const width = Math.min(MAX_WIDTH, img.width);
                  const height = img.height * (width === MAX_WIDTH ? scaleSize : 1);

                  canvas.width = width;
                  canvas.height = height;
                  ctx?.drawImage(img, 0, 0, width, height);
                  
                  // Compress to 0.6 quality JPEG
                  const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                  setSelectedImage(compressedBase64);
              };
          };
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addIncident({
      id: Date.now().toString(),
      condoId: '', // Placeholder
      title,
      description,
      date: new Date().toLocaleDateString('pt-BR'),
      status: 'open',
      severity: 'medium',
      approved: currentUser.role === 'syndic', // Syndic auto-approves, Resident needs approval
      authorName: currentUser.name,
      apartment: currentUser.apartment || 'Administração',
      imageUrl: selectedImage || undefined
    });
    setTitle('');
    setDescription('');
    setSelectedImage(null);
  };

  const handleAIAnalysis = async (incident: Incident) => {
    setAnalyzingId(incident.id);
    const suggestion = await analyzeIncident(incident.description);
    updateIncident(incident.id, { aiSuggestion: suggestion });
    setAnalyzingId(null);
  };

  const handleResolveSubmit = () => {
      if (resolvingId && resolutionNote.trim()) {
          updateIncident(resolvingId, { status: 'resolved', resolutionNote });
          setResolvingId(null);
          setResolutionNote('');
          showToast('Ocorrência resolvida!');
      } else {
          showToast('Por favor, descreva a solução.', 'error');
      }
  };

  const handleProgressSubmit = () => {
      if (progressingId && progressNote.trim()) {
          updateIncident(progressingId, { status: 'in_progress', progressNote });
          setProgressingId(null);
          setProgressNote('');
          showToast('Tratativa iniciada.');
      } else {
          showToast('Por favor, descreva a medida.', 'error');
      }
  };

  const pendingIncidents = incidents.filter(i => !i.approved);
  const approvedIncidents = incidents.filter(i => i.approved);

  return (
    <div className="space-y-6 relative">
       {/* Resolution Modal Overlay */}
       {resolvingId && (
           <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-md w-full animate-fade-in-down border border-gray-100 dark:border-slate-700">
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Finalizar Ocorrência</h3>
                   <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">Descreva o que foi feito para resolver este problema. Isso ficará visível para os moradores.</p>
                   <textarea 
                        value={resolutionNote}
                        onChange={e => setResolutionNote(e.target.value)}
                        className="w-full border border-gray-200 dark:border-slate-600 rounded-xl p-4 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none mb-6 min-h-[120px] bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
                        placeholder="Ex: A lâmpada foi trocada por uma de LED..."
                   />
                   <div className="flex justify-end gap-3">
                       <button onClick={() => { setResolvingId(null); setResolutionNote(''); }} className="px-5 py-2.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium text-sm transition-colors">Cancelar</button>
                       <button onClick={handleResolveSubmit} className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium text-sm shadow-lg shadow-green-600/20 transition-colors">Concluir</button>
                   </div>
               </div>
           </div>
       )}

       {/* In Progress Modal Overlay */}
       {progressingId && (
           <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-md w-full animate-fade-in-down border border-gray-100 dark:border-slate-700">
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Iniciar Tratativa</h3>
                   <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">Informe aos moradores o que está sendo feito (ex: orçamento solicitado, prestador agendado).</p>
                   <textarea 
                        value={progressNote}
                        onChange={e => setProgressNote(e.target.value)}
                        className="w-full border border-gray-200 dark:border-slate-600 rounded-xl p-4 text-sm focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none mb-6 min-h-[120px] bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
                        placeholder="Ex: Agendado visita técnica para sexta-feira..."
                   />
                   <div className="flex justify-end gap-3">
                       <button onClick={() => { setProgressingId(null); setProgressNote(''); }} className="px-5 py-2.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium text-sm transition-colors">Cancelar</button>
                       <button onClick={handleProgressSubmit} className="px-6 py-2.5 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 font-medium text-sm shadow-lg shadow-yellow-600/20 transition-colors">Salvar</button>
                   </div>
               </div>
           </div>
       )}

       <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Warning className="text-red-500 dark:text-red-400" size={32} weight="fill"/> Ocorrências
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Registro de problemas e manutenções</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] sticky top-6">
                    <h3 className="font-bold text-lg mb-6 text-gray-900 dark:text-white">Registrar Problema</h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Título Resumido</label>
                            <input 
                                type="text"
                                required 
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Ex: Lâmpada queimada hall"
                                className="w-full p-3.5 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Descrição Detalhada</label>
                            <textarea 
                                required
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={4}
                                placeholder="Descreva o problema..."
                                className="w-full p-3.5 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all resize-none"
                            />
                        </div>
                        
                        <div>
                             <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Evidência (Foto)</label>
                             <div className="relative">
                                 <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                 />
                                 <label 
                                    htmlFor="image-upload" 
                                    className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-500 dark:text-slate-400 text-sm font-medium"
                                 >
                                     <UploadSimple size={16} /> {selectedImage ? 'Imagem selecionada (Trocar)' : 'Carregar Foto'}
                                 </label>
                             </div>
                             {selectedImage && (
                                 <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                                     <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                                     <button type="button" onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors"><X size={12}/></button>
                                 </div>
                             )}
                        </div>

                        <button type="submit" className="w-full py-3.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-semibold shadow-lg shadow-red-500/20 active:scale-[0.98]">
                            Registrar Ocorrência
                        </button>
                    </form>
                </div>
            </div>

            <div className="md:col-span-2 space-y-6">
                {/* Pending Approval Section (Syndic Only) */}
                {currentUser.role === 'syndic' && pendingIncidents.length > 0 && (
                    <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-6">
                        <h3 className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-2 mb-4 text-sm uppercase tracking-wide">
                            <Circle className="text-amber-500" size={12} weight="fill" /> Pendentes de Aprovação
                        </h3>
                        <div className="space-y-4">
                            {pendingIncidents.map(inc => (
                                <div key={inc.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-amber-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 dark:text-white">{inc.title}</p>
                                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-2 mt-1">{inc.description}</p>
                                        {inc.imageUrl && (
                                            <div className="mb-2">
                                                <img src={inc.imageUrl} alt="Evidência" className="h-16 w-16 object-cover rounded-lg border border-gray-200 dark:border-slate-600 cursor-pointer" onClick={() => window.open(inc.imageUrl)}/>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Criado por {inc.authorName} ({inc.apartment}) em {inc.date}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0 self-start">
                                        <button 
                                            onClick={() => updateIncident(inc.id, { approved: true })}
                                            className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors"
                                        >
                                            <Check size={14} /> Aprovar
                                        </button>
                                        <button 
                                            onClick={() => removeIncident(inc.id)}
                                            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors"
                                        >
                                            <X size={14} /> Rejeitar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Approved List */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">Ocorrências do Condomínio</h3>
                    {approvedIncidents.length === 0 && (
                        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                            <p className="text-gray-400 dark:text-slate-500 font-medium">Nenhuma ocorrência em aberto. Tudo em ordem!</p>
                        </div>
                    )}
                    {approvedIncidents.map(incident => (
                        <div key={incident.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{incident.title}</h3>
                                        <span className={`px-2.5 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wide border ${
                                            incident.status === 'open' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30' :
                                            incident.status === 'in_progress' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30' :
                                            'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30'
                                        }`}>
                                            {incident.status === 'open' ? 'Aberto' : incident.status === 'in_progress' ? 'Em Andamento' : 'Resolvido'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                                        {incident.date} • {incident.authorName} - {incident.apartment}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {/* Action Buttons for Syndic */}
                                    {currentUser.role === 'syndic' && incident.status === 'open' && (
                                        <button 
                                            onClick={() => setProgressingId(incident.id)}
                                            className="text-gray-400 dark:text-slate-500 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors p-1 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg flex items-center gap-1 text-xs font-medium" 
                                            title="Iniciar Tratativa"
                                        >
                                            <ArrowRight size={16} /> <span className="hidden sm:inline">Iniciar</span>
                                        </button>
                                    )}
                                    {currentUser.role === 'syndic' && incident.status !== 'resolved' && (
                                        <button 
                                            onClick={() => setResolvingId(incident.id)}
                                            className="text-gray-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 transition-colors p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg flex items-center gap-1 text-xs font-medium" 
                                            title="Resolver"
                                        >
                                            <CheckCircle size={16} /> <span className="hidden sm:inline">Resolver</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-gray-600 dark:text-slate-300 mb-5 leading-relaxed">{incident.description}</p>
                            
                            {incident.imageUrl && (
                                <div className="mb-5">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1"><Image size={12}/> Evidência</p>
                                    <div className="w-full max-w-xs h-40 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700">
                                        <img src={incident.imageUrl} alt="Evidência" className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(incident.imageUrl)}/>
                                    </div>
                                </div>
                            )}
                            
                            {/* Progress Note Display */}
                            {incident.status !== 'resolved' && incident.progressNote && (
                                <div className="mt-4 p-4 bg-yellow-50/50 dark:bg-yellow-900/20 border border-yellow-100/50 dark:border-yellow-900/30 rounded-xl">
                                    <h4 className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400 uppercase flex items-center gap-1.5 mb-1 tracking-wide">
                                        <Clock size={12}/> Em Andamento
                                    </h4>
                                    <p className="text-sm text-yellow-900/80 dark:text-yellow-100/80">{incident.progressNote}</p>
                                </div>
                            )}

                            {/* Resolution Note Display */}
                            {incident.status === 'resolved' && incident.resolutionNote && (
                                <div className="mt-4 p-4 bg-green-50/50 dark:bg-green-900/20 border border-green-100/50 dark:border-green-900/30 rounded-xl">
                                    <h4 className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase flex items-center gap-1.5 mb-1 tracking-wide">
                                        <CheckCircle size={12} weight="fill"/> Solução Aplicada
                                    </h4>
                                    <p className="text-sm text-green-900/80 dark:text-green-100/80">{incident.resolutionNote}</p>
                                </div>
                            )}

                            {/* AI Section */}
                            {(currentUser.role === 'syndic' || incident.aiSuggestion) && incident.status !== 'resolved' && (
                                <div className="bg-purple-50/50 dark:bg-purple-900/20 rounded-xl p-5 border border-purple-100/50 dark:border-purple-900/30 mt-4">
                                    {!incident.aiSuggestion ? (
                                        <button 
                                            onClick={() => handleAIAnalysis(incident)}
                                            disabled={analyzingId === incident.id}
                                            className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-50 transition-colors"
                                        >
                                            <Robot size={18} /> 
                                            {analyzingId === incident.id ? 'Analisando...' : 'Pedir sugestão à IA'}
                                        </button>
                                    ) : (
                                        <div>
                                            <h4 className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-400 mb-3 uppercase tracking-wide">
                                                <Lightbulb size={14} weight="fill"/> Sugestão do Assistente
                                            </h4>
                                            <div className="text-sm text-gray-700 dark:text-slate-300 prose prose-sm max-w-none leading-relaxed">
                                                {incident.aiSuggestion.split('\n').map((line, i) => (
                                                    <p key={i} className="mb-1.5">{line}</p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};