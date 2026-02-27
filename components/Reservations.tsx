import React, { useState, useEffect } from 'react';
import { Reservation, User, CommonArea } from '../types';
import { CalendarCheck, CheckCircle, Clock, Trash, CaretLeft, CaretRight, Warning, Gear, Check, X, ClockCounterClockwise, MagnifyingGlass, Info } from '@phosphor-icons/react';

interface ReservationsProps {
  reservations: Reservation[];
  areas: CommonArea[];
  addReservation: (res: Reservation) => void;
  updateReservation: (id: string, updates: Partial<Reservation>) => void;
  removeReservation: (id: string) => void;
  addArea: (area: CommonArea) => void;
  updateArea: (id: string, updates: Partial<CommonArea>) => void;
  removeArea: (id: string) => void;
  currentUser: User;
  users: User[];
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const Reservations: React.FC<ReservationsProps> = ({ 
    reservations, areas, addReservation, updateReservation, removeReservation, 
    addArea, updateArea, removeArea, currentUser, users, showToast 
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'areas' | 'history'>('calendar');
  const [selectedAreaId, setSelectedAreaId] = useState<string>(areas[0]?.id || '');
  const [date, setDate] = useState('');
  const [selectedResidentId, setSelectedResidentId] = useState(currentUser.role === 'syndic' ? '' : currentUser.id);
  
  // Area Management State
  const [areaFormData, setAreaFormData] = useState<Partial<CommonArea>>({ name: '', openTime: '08:00', closeTime: '22:00', requiresApproval: false, maxDuration: 4 });
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);

  // Time Slot Selection State
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  
  // Confirmation & Rejection Modal States
  const [deleteTarget, setDeleteTarget] = useState<{id: string, type: 'reservation' | 'area'} | null>(null);
  const [rejectionTarget, setRejectionTarget] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Calendar Navigation State
  const [viewDate, setViewDate] = useState(new Date());

  // Effect to handle area deletion sync
  useEffect(() => {
      // If current selected area is deleted, switch to the first available one
      if (areas.length > 0 && !areas.find(a => a.id === selectedAreaId)) {
          setSelectedAreaId(areas[0].id);
      } else if (areas.length === 0) {
          setSelectedAreaId('');
      }
  }, [areas, selectedAreaId]);

  const selectedArea = areas.find(a => a.id === selectedAreaId);

  const formatDateDisplay = (dateString: string) => {
      if (!dateString) return '-';
      const parts = dateString.split('-');
      if (parts.length !== 3) return dateString;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArea || !selectedSlot) return;

    // Validate if ALL slots in the duration are available
    const startHour = parseInt(selectedSlot.split(':')[0]);
    const duration = selectedDuration;
    
    // Check conflicts for every hour block
    for(let i = 0; i < duration; i++) {
        const checkHour = startHour + i;
        const timeLabel = `${String(checkHour).padStart(2, '0')}:00`;
        
        const conflict = reservations.find(r => 
            r.areaId === selectedAreaId && 
            r.date === date && 
            r.startTime === timeLabel && 
            r.status !== 'rejected'
        );

        if(conflict) {
             showToast(`Horário ${timeLabel} indisponível para o período selecionado.`, 'error');
             return;
        }

        // Check if exceeds closing time
        const closeHour = parseInt((selectedArea.closeTime || '22:00').split(':')[0]);
        if(checkHour >= closeHour) {
            showToast('A duração excede o horário de fechamento.', 'error');
            return;
        }
    }

    const residentUser = users.find(u => u.id === selectedResidentId);
    if (!residentUser) return;

    const endHour = startHour + duration;
    const endTime = `${String(endHour).padStart(2, '0')}:00`;

    addReservation({
      id: Date.now().toString(),
      condoId: '', // Placeholder
      areaId: selectedArea.id,
      areaName: selectedArea.name,
      date,
      startTime: selectedSlot,
      endTime,
      residentId: residentUser.id,
      residentName: residentUser.name,
      apartment: residentUser.apartment || 'Admin',
      status: selectedArea.requiresApproval && currentUser.role !== 'syndic' ? 'pending' : 'confirmed',
      viewedBySyndic: currentUser.role === 'syndic', // If syndic books, they viewed it.
      viewedByResident: currentUser.id === residentUser.id // If booking for self, viewed.
    });
    
    // Reset selection but keep date for convenience
    setSelectedSlot(null);
    setSelectedDuration(1);
    if(currentUser.role === 'syndic') setSelectedResidentId('');
  };

  // --- Area Management Logic ---
  const handleSaveArea = (e: React.FormEvent) => {
      e.preventDefault();
      if (!areaFormData.name || !areaFormData.openTime || !areaFormData.closeTime) {
          showToast('Preencha todos os campos.', 'error');
          return;
      }
      
      const newArea = { 
          name: areaFormData.name!,
          openTime: areaFormData.openTime!,
          closeTime: areaFormData.closeTime!,
          requiresApproval: !!areaFormData.requiresApproval,
          maxDuration: Number(areaFormData.maxDuration) || 1
      };

      if (editingAreaId) {
          updateArea(editingAreaId, newArea);
          setEditingAreaId(null);
      } else {
          addArea({ 
              id: Date.now().toString(), 
              condoId: '', // Placeholder
              ...newArea
          });
      }
      setAreaFormData({ name: '', openTime: '08:00', closeTime: '22:00', requiresApproval: false, maxDuration: 4 });
  };

  const startEditArea = (area: CommonArea) => {
      setAreaFormData(area);
      setEditingAreaId(area.id);
  };

  const confirmDelete = () => {
      if (!deleteTarget) return;
      if (deleteTarget.type === 'reservation') {
          removeReservation(deleteTarget.id);
      } else {
          removeArea(deleteTarget.id);
      }
      setDeleteTarget(null);
  };

  const confirmRejection = () => {
      if (!rejectionTarget) return;
      updateReservation(rejectionTarget, {
          status: 'rejected',
          viewedByResident: false,
          rejectionReason: rejectionReason.trim() || 'Motivo não especificado.'
      });
      showToast('Reserva rejeitada/cancelada.');
      setRejectionTarget(null);
      setRejectionReason('');
  };

  // --- Calendar Logic ---
  const changeMonth = (offset: number) => {
      const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
      setViewDate(newDate);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const startDay = getFirstDayOfMonth(currentYear, currentMonth);

  // --- Time Slot Logic ---
  const isTimeBlocked = (checkHour: number, areaId: string, dateStr: string) => {
      // Find any reservation that covers this hour
      return reservations.find(r => {
          if (r.areaId !== areaId || r.date !== dateStr || r.status === 'rejected') return false;
          
          const rStart = parseInt(r.startTime.split(':')[0]);
          const rEnd = parseInt(r.endTime.split(':')[0]);
          
          // Check if checkHour falls within [rStart, rEnd)
          return checkHour >= rStart && checkHour < rEnd;
      });
  };

  const renderTimeSlots = () => {
      if (!selectedArea || !date) return <p className="text-center text-gray-500 py-4 text-sm">Selecione uma data para ver os horários.</p>;

      const openTime = selectedArea.openTime || '08:00';
      const closeTime = selectedArea.closeTime || '22:00';

      const start = parseInt(openTime.split(':')[0]);
      const end = parseInt(closeTime.split(':')[0]);
      const slots = [];

      for (let i = start; i < end; i++) {
          const timeLabel = `${String(i).padStart(2, '0')}:00`;
          
          const reservation = isTimeBlocked(i, selectedAreaId, date);
          
          // Check past time if today
          const now = new Date();
          const isToday = date === now.toISOString().split('T')[0];
          const isPastTime = isToday && i <= now.getHours();

          const isUnavailable = !!reservation;
          const isPending = reservation?.status === 'pending';

          slots.push(
              <button
                key={i}
                type="button"
                disabled={isUnavailable || isPastTime}
                onClick={() => setSelectedSlot(timeLabel)}
                className={`
                    flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold border transition-all h-14
                    ${selectedSlot === timeLabel ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300 dark:ring-blue-900' : 
                      isUnavailable ? (isPending ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 cursor-not-allowed opacity-90' : 'bg-red-50 dark:bg-red-900/20 text-red-300 border-red-100 cursor-not-allowed') :
                      isPastTime ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 border-transparent cursor-not-allowed' :
                      'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-600 hover:border-blue-400'}
                `}
              >
                  <span className="text-xs">{timeLabel}</span>
                  {reservation && (
                      <span className={`text-[9px] font-extrabold uppercase tracking-wide mt-0.5 ${isPending ? 'text-amber-700 dark:text-amber-400' : 'text-red-400 dark:text-red-400'}`}>
                         {isPending ? 'Análise' : 'Ocupado'}
                      </span>
                  )}
              </button>
          );
      }
      return <div className="grid grid-cols-3 gap-2">{slots}</div>;
  };

  const renderCalendarGrid = () => {
      if (!selectedArea) return null;
      const days = [];
      // Empty slots
      for (let i = 0; i < startDay; i++) {
          days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
      }
      // Days
      for(let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const hasBooking = reservations.some(r => r.areaId === selectedAreaId && r.date === dateStr && r.status !== 'rejected');
          
          const checkDate = new Date(currentYear, currentMonth, d);
          const today = new Date();
          today.setHours(0,0,0,0);
          const isPast = checkDate < today;

          days.push(
              <div 
                key={d}
                onClick={() => {
                    if (!isPast) {
                        setDate(dateStr);
                        setSelectedSlot(null); // Reset slot selection when changing date
                        setSelectedDuration(1); // Reset duration
                    }
                }}
                className={`
                    aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-medium cursor-pointer transition-all relative
                    ${isPast ? 'bg-gray-50 dark:bg-slate-700 text-gray-300 dark:text-slate-500 cursor-not-allowed' :
                      date === dateStr ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 transform scale-105' : 'bg-white dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 border border-gray-100 dark:border-slate-600'}
                `}
              >
                  {d}
                  {hasBooking && <div className={`mt-1 w-1 h-1 rounded-full ${date === dateStr ? 'bg-white' : 'bg-blue-400'}`}></div>}
              </div>
          );
      }
      return days;
  };

  // --- Views ---

  // 1. AREA MANAGEMENT (SYNDIC)
  if (activeTab === 'areas' && currentUser.role === 'syndic') {
      return (
          <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Gear className="text-gray-600 dark:text-gray-400" size={32} weight="fill"/> Gestão de Áreas Comuns
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Configure horários e regras de reserva.</p>
                 </div>
                 <button onClick={() => setActiveTab('calendar')} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 dark:bg-slate-800 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center">
                     <CaretLeft size={16}/> Voltar para Calendário
                 </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* List of Areas */}
                  <div className="lg:col-span-2 space-y-4">
                      {areas.map(area => (
                          <div key={area.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex justify-between items-center">
                              <div>
                                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{area.name}</h3>
                                  <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-slate-400 flex-wrap">
                                      <span className="flex items-center gap-1"><Clock size={14}/> {area.openTime || '08:00'} - {area.closeTime || '22:00'}</span>
                                      <span className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-medium">Max: {area.maxDuration || 1}h</span>
                                      {area.requiresApproval && <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium"><CheckCircle size={14} weight="fill"/> Requer Aprovação</span>}
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => startEditArea(area)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500"><Gear size={18}/></button>
                                  <button 
                                    onClick={() => setDeleteTarget({id: area.id, type: 'area'})} 
                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                                  >
                                      <Trash size={18}/>
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* Edit/Create Form */}
                  <div className="lg:col-span-1">
                      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-lg sticky top-6">
                          <h3 className="font-bold text-lg mb-6 text-gray-900 dark:text-white">{editingAreaId ? 'Editar Área' : 'Nova Área'}</h3>
                          <form onSubmit={handleSaveArea} className="space-y-5">
                              <div>
                                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Nome da Área</label>
                                  <input type="text" required value={areaFormData.name} onChange={e => setAreaFormData({...areaFormData, name: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white" placeholder="Ex: Salão de Festas"/>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Abertura</label>
                                      <input type="time" required value={areaFormData.openTime} onChange={e => setAreaFormData({...areaFormData, openTime: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white"/>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Fechamento</label>
                                      <input type="time" required value={areaFormData.closeTime} onChange={e => setAreaFormData({...areaFormData, closeTime: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white"/>
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Duração Máxima (Horas)</label>
                                  <input 
                                    type="number" 
                                    min="1"
                                    max="12"
                                    required 
                                    value={areaFormData.maxDuration || 1} 
                                    onChange={e => setAreaFormData({...areaFormData, maxDuration: parseInt(e.target.value)})} 
                                    className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                  />
                              </div>
                              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700 p-3 rounded-xl">
                                  <input 
                                    type="checkbox" 
                                    id="reqApp" 
                                    checked={areaFormData.requiresApproval} 
                                    onChange={e => setAreaFormData({...areaFormData, requiresApproval: e.target.checked})}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 bg-white border-gray-300 dark:border-slate-500"
                                  />
                                  <label htmlFor="reqApp" className="text-sm font-medium text-gray-700 dark:text-slate-300">Exige aprovação do síndico?</label>
                              </div>
                              <div className="flex gap-2 pt-2">
                                  {editingAreaId && <button type="button" onClick={() => { setEditingAreaId(null); setAreaFormData({name: '', openTime: '08:00', closeTime: '22:00', requiresApproval: false, maxDuration: 4}); }} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 rounded-xl text-sm font-medium">Cancelar</button>}
                                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-md">Salvar</button>
                              </div>
                          </form>
                      </div>
                  </div>
              </div>
               {/* Reuse Modal for Area Delete */}
               {deleteTarget && deleteTarget.type === 'area' && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-gray-100 dark:border-slate-700 animate-fade-in-down text-center">
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">Excluir Área?</h3>
                            <p className="text-sm text-gray-500 mb-6">Isso removerá a área e todas as reservas associadas.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 rounded-xl">Cancelar</button>
                                <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl">Excluir</button>
                            </div>
                        </div>
                    </div>
                )}
          </div>
      );
  }

  // 2. HISTORY VIEW (SYNDIC)
  if (activeTab === 'history' && currentUser.role === 'syndic') {
      const now = new Date();
      // Filter reservations that are in the past or rejected
      const pastReservations = reservations
          .filter(r => {
              const resEnd = new Date(`${r.date}T${r.endTime}`);
              return resEnd < now || r.status === 'rejected';
          })
          .sort((a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime());

      return (
          <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClockCounterClockwise className="text-gray-600 dark:text-gray-400" size={32} weight="fill"/> Histórico de Reservas
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Registro completo de reservas passadas.</p>
                 </div>
                 <button onClick={() => setActiveTab('calendar')} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 dark:bg-slate-800 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center">
                     <CaretLeft size={16}/> Voltar para Calendário
                 </button>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 text-gray-400 dark:text-slate-500 uppercase tracking-wider text-xs font-semibold">
                              <tr>
                                  <th className="px-6 py-4">Data</th>
                                  <th className="px-6 py-4">Horário</th>
                                  <th className="px-6 py-4">Área</th>
                                  <th className="px-6 py-4">Morador</th>
                                  <th className="px-6 py-4 text-center">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                              {pastReservations.map(res => (
                                  <tr key={res.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{formatDateDisplay(res.date)}</td>
                                      <td className="px-6 py-4 text-gray-500 dark:text-slate-400">{res.startTime} - {res.endTime}</td>
                                      <td className="px-6 py-4 text-gray-700 dark:text-slate-300">{res.areaName}</td>
                                      <td className="px-6 py-4">
                                          <div className="text-gray-900 dark:text-white font-medium">{res.residentName}</div>
                                          <div className="text-xs text-gray-400">Apto {res.apartment}</div>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                          <div className="flex flex-col items-center gap-1">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                                ${res.status === 'confirmed' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                                                    res.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                                                    'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'}`}>
                                                {res.status === 'confirmed' ? 'Concluído' : res.status === 'rejected' ? 'Rejeitado' : 'Expirado'}
                                            </span>
                                            {res.rejectionReason && (
                                                <span className="text-[10px] text-gray-400 dark:text-slate-500 max-w-[150px] truncate" title={res.rejectionReason}>{res.rejectionReason}</span>
                                            )}
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                              {pastReservations.length === 0 && (
                                  <tr>
                                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500 italic">
                                          Nenhum histórico disponível.
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      );
  }

  // 3. STANDARD CALENDAR VIEW
  const pendingReservations = reservations.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6 h-full relative">
      
      {/* Rejection Modal (Syndic) */}
      {rejectionTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-gray-100 dark:border-slate-700 animate-fade-in-down">
                 <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">Motivo da Rejeição</h3>
                 <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Informe ao morador o motivo do cancelamento.</p>
                 <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    maxLength={300}
                    placeholder="Ex: Manutenção no local..."
                    className="w-full border border-gray-200 dark:border-slate-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none mb-1 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white resize-none h-24"
                 />
                 <div className="text-right text-xs text-gray-400 dark:text-slate-500 mb-6">
                    {rejectionReason.length}/300
                 </div>
                 <div className="flex gap-3 w-full">
                    <button onClick={() => { setRejectionTarget(null); setRejectionReason(''); }} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 rounded-xl font-medium transition-colors">Voltar</button>
                    <button onClick={confirmRejection} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium shadow-lg shadow-red-500/20 transition-colors">Confirmar</button>
                 </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Resident) */}
      {deleteTarget && deleteTarget.type === 'reservation' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-gray-100 dark:border-slate-700 animate-fade-in-down text-center">
                 <div className="flex justify-center mb-4"><div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full"><Warning size={28} weight="fill" /></div></div>
                 <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">Cancelar Reserva?</h3>
                 <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">O horário ficará disponível para outros moradores.</p>
                 <div className="flex gap-3 w-full">
                    <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 rounded-xl font-medium transition-colors">Voltar</button>
                    <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium shadow-lg shadow-red-500/20 transition-colors">Sim, cancelar</button>
                 </div>
            </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="text-blue-600 dark:text-blue-400" size={32} weight="fill"/> Reservas
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Gerencie o uso das áreas comuns</p>
        </div>
        {currentUser.role === 'syndic' && (
            <div className="flex flex-row w-full sm:w-auto gap-2">
                <button 
                    onClick={() => setActiveTab('history')}
                    className="text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 font-medium px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm flex-1 sm:flex-none"
                >
                    <ClockCounterClockwise size={16}/> Histórico
                </button>
                <button 
                    onClick={() => setActiveTab('areas')}
                    className="text-sm bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-medium px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none"
                >
                    <Gear size={16}/> Áreas
                </button>
            </div>
        )}
      </div>

      {/* Area Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
            {areas.map(area => (
                <button
                    key={area.id}
                    onClick={() => { setSelectedAreaId(area.id); setDate(''); setSelectedSlot(null); setSelectedDuration(1); }}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border
                         ${selectedAreaId === area.id 
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-lg' 
                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                >
                    {area.name}
                </button>
            ))}
      </div>

      {/* SYNDIC: Approval Queue */}
      {currentUser.role === 'syndic' && pendingReservations.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-2xl mb-6">
              <h3 className="text-amber-800 dark:text-amber-400 font-bold text-sm uppercase tracking-wide flex items-center gap-2 mb-4">
                  <Clock size={16}/> Reservas Aguardando Aprovação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingReservations.map(res => (
                      <div key={res.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-amber-100 dark:border-slate-700">
                          <p className="font-bold text-gray-900 dark:text-white">{res.areaName}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                              {formatDateDisplay(res.date)} • {res.startTime} - {res.endTime} <br/>
                              Apto {res.apartment} ({res.residentName})
                          </p>
                          <div className="flex gap-2">
                              {/* IMPORTANT: Update viewedByResident to false so the resident gets a notification about status change */}
                              <button onClick={() => { updateReservation(res.id, {status: 'confirmed', viewedByResident: false}); showToast('Reserva aprovada!'); }} className="flex-1 bg-green-50 text-green-700 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100 flex justify-center items-center gap-1"><Check size={12}/> Aprovar</button>
                              <button onClick={() => setRejectionTarget(res.id)} className="flex-1 bg-red-50 text-red-700 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 flex justify-center items-center gap-1"><X size={12}/> Rejeitar</button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Calendar & Upcoming */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white text-xl capitalize">
                        {viewDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 p-1 rounded-full border border-gray-100 dark:border-slate-600">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-full text-gray-600 dark:text-slate-300"><CaretLeft size={18} /></button>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-full text-gray-600 dark:text-slate-300"><CaretRight size={18} /></button>
                    </div>
                </div>
                
                <div className="grid grid-cols-7 gap-3 mb-3 text-center text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                    <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
                </div>
                <div className="grid grid-cols-7 gap-3">
                    {renderCalendarGrid()}
                </div>
            </div>
            
            {/* List of upcoming for this area */}
            <div>
                 <h4 className="font-bold text-gray-800 dark:text-slate-200 mb-4 text-sm uppercase tracking-wide">Próximas Reservas ({selectedArea?.name})</h4>
                 <div className="space-y-3">
                    {reservations
                        .filter(r => r.areaId === selectedAreaId && r.status !== 'rejected')
                        .filter(r => {
                            // Filter logic: Is the reservation end time in the future?
                            const now = new Date();
                            const resEnd = new Date(`${r.date}T${r.endTime}`);
                            return resEnd > now;
                        }) 
                        .sort((a,b) => new Date(a.date + 'T' + a.startTime).getTime() - new Date(b.date + 'T' + b.startTime).getTime())
                        .slice(0, 5)
                        .map(res => {
                          const canDelete = currentUser.role === 'syndic' || currentUser.id === res.residentId;
                          return (
                            <div key={res.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm text-sm group">
                                <div className="flex items-center gap-4">
                                    <div className="text-center min-w-[90px] pl-1">
                                        <div className="font-bold text-gray-900 dark:text-white text-base">{res.startTime} - {res.endTime}</div>
                                        <div className="text-[10px] text-gray-400 uppercase">{formatDateDisplay(res.date).substring(0,5)}</div>
                                    </div>
                                    <div className="border-l border-gray-100 dark:border-slate-700 pl-4">
                                        <span className="font-medium text-gray-800 dark:text-slate-200 block">{res.residentName}</span>
                                        <span className="text-xs text-gray-500 dark:text-slate-400">Apto {res.apartment}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {res.status === 'pending' ? (
                                        <span className="text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12}/> Pendente</span>
                                    ) : (
                                        <span className="text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full text-xs font-bold">Confirmado</span>
                                    )}
                                    {canDelete && (
                                        <button 
                                            type="button"
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                if (currentUser.role === 'syndic') {
                                                    setRejectionTarget(res.id); // Syndic opens rejection modal
                                                } else {
                                                    setDeleteTarget({id: res.id, type: 'reservation'}); // Resident does normal delete/cancel
                                                }
                                            }}
                                            className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                            title="Cancelar"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )})}
                        {reservations.filter(r => r.areaId === selectedAreaId && new Date(`${r.date}T${r.endTime}`) > new Date()).length === 0 && <p className="text-gray-400 italic text-sm">Nenhuma reserva futura.</p>}
                 </div>
            </div>
        </div>

        {/* Right Column: Booking Form */}
        <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] sticky top-6">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Nova Reserva</h3>
                
                {/* 1. Selected Date Display */}
                <div className="mb-6">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Data Selecionada</p>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-medium flex items-center gap-2">
                        <CalendarCheck size={18} weight="fill"/>
                        {date ? formatDateDisplay(date) : 'Selecione no calendário'}
                    </div>
                </div>

                {/* 2. Slot Selection */}
                {date && (
                    <div className="mb-6 animate-fade-in">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-2">Horário de Início</p>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar pr-1">
                            {renderTimeSlots()}
                        </div>
                    </div>
                )}

                <form onSubmit={handleBook} className="space-y-6">
                    {/* Duration Selection */}
                    {date && selectedSlot && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Duração (Horas)</label>
                            <select 
                                required 
                                value={selectedDuration} 
                                onChange={e => setSelectedDuration(parseInt(e.target.value))}
                                className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none"
                            >
                                {Array.from({length: selectedArea?.maxDuration || 1}, (_, i) => i + 1).map(h => (
                                    <option key={h} value={h}>{h} Hora{h > 1 ? 's' : ''}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">Máximo permitido: {selectedArea?.maxDuration || 1}h</p>
                        </div>
                    )}

                    {/* 3. User Selection (Syndic) */}
                    {currentUser.role === 'syndic' ? (
                         <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Morador</label>
                            <select 
                                required 
                                value={selectedResidentId} 
                                onChange={e => setSelectedResidentId(e.target.value)}
                                className="w-full p-3 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl outline-none"
                            >
                                <option value="">Selecione...</option>
                                {users.filter(u => u.role === 'resident').map(u => (
                                    <option key={u.id} value={u.id}>Apto {u.apartment} - {u.name}</option>
                                ))}
                            </select>
                         </div>
                    ) : null}
                    
                    {selectedArea?.requiresApproval && currentUser.role !== 'syndic' && (
                        <div className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
                            <strong>Nota:</strong> Esta área requer aprovação. O horário ficará bloqueado como "Análise" até confirmação do síndico.
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={!date || !selectedSlot || !selectedResidentId}
                        className="w-full py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        Confirmar Reserva
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};
