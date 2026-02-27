import React from 'react';
import { DownloadSimple, X } from '@phosphor-icons/react';

interface InstallPWAProps {
    show: boolean;
    onClick: () => void;
    onDismiss: () => void;
}

export const InstallPWA: React.FC<InstallPWAProps> = ({ show, onClick, onDismiss }) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-4 md:right-6 z-[9999] animate-bounce-slow">
        <button
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 md:px-5 rounded-full shadow-xl shadow-blue-600/40 flex items-center gap-3 font-semibold transition-all hover:scale-105 active:scale-95 border border-blue-400/20 backdrop-blur-sm"
        >
            <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
                <DownloadSimple size={20} weight="bold" />
            </div>
            <div className="text-left leading-tight">
                <span className="block text-[10px] opacity-90 uppercase tracking-wide font-bold">Instalar App</span>
                <span className="block text-sm">Baixar Zyndo</span>
            </div>
            <div 
                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                className="ml-2 p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
                <X size={14} />
            </div>
        </button>
    </div>
  );
};