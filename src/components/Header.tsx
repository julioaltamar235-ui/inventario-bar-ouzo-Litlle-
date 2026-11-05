import React from 'react';
import { Wine, Smartphone, Monitor, Cloud, FileSpreadsheet, Sliders } from 'lucide-react';

export type AppOuzoTab = 'captura' | 'cuadre' | 'verificacion' | 'sheets' | 'dashboard' | 'kpi';

interface HeaderProps {
  activeTab: AppOuzoTab;
  onSelectTab: (tab: AppOuzoTab) => void;
  onQuickStartCount: () => void;
  isMobileSimulation: boolean;
  onToggleMobileSimulation: () => void;
  confirmedCapturesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onQuickStartCount,
  isMobileSimulation,
  onToggleMobileSimulation,
  confirmedCapturesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#071322]/95 border-b border-[#1a3356] backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-4 md:px-6 h-14">
        {/* Zone 1: Ouzo Logo Brand Wordmark */}
        <div
          onClick={() => onSelectTab('captura')}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0"
        >
          {/* Ouzo Hellenic Emblem */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
            <span className="font-serif font-black text-sm tracking-wider">Ω</span>
          </div>
          <div>
            <span className="text-base font-extrabold tracking-wider text-white font-sans uppercase">
              OUZO
            </span>
            <span className="text-[10px] text-amber-400 block -mt-1 font-medium tracking-widest uppercase">
              Bar & Cava
            </span>
          </div>
        </div>

        {/* Zone 2: 4 Main Modules + Dashboard + KPI */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-300">
          <button
            type="button"
            onClick={() => onSelectTab('captura')}
            className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
              activeTab === 'captura'
                ? 'text-amber-400 font-bold'
                : 'hover:text-white'
            }`}
          >
            <span>1. Captura</span>
            {confirmedCapturesCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {confirmedCapturesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('cuadre')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'cuadre'
                ? 'text-amber-400 font-bold'
                : 'hover:text-white'
            }`}
          >
            2. Cuadre (Acumulativo)
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('verificacion')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'verificacion'
                ? 'text-amber-400 font-bold'
                : 'hover:text-white'
            }`}
          >
            3. Verificación & Cierre
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('sheets')}
            className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sheets'
                ? 'text-emerald-400 font-bold'
                : 'hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>4. Google Sheets & Drive</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'text-amber-400 font-bold'
                : 'hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>5. Dashboard Parametrizado</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('kpi')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'kpi'
                ? 'text-amber-400 font-bold'
                : 'hover:text-white'
            }`}
          >
            Impacto (22h → &lt;5h)
          </button>
        </nav>

        {/* Zone 3: Cloud Status, Viewport Simulator & CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Cloud sync pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0b1b32] border border-[#1a3356] text-[11px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Nube Ouzo Conectada</span>
          </div>

          <button
            type="button"
            onClick={onToggleMobileSimulation}
            className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition-colors hidden sm:flex items-center gap-1.5 ${
              isMobileSimulation
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                : 'bg-[#0b1b32] border-[#1a3356] text-slate-400 hover:text-white'
            }`}
            title="Alternar vista simulador de teléfono móvil del bartender"
          >
            {isMobileSimulation ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span>{isMobileSimulation ? 'Vista Escritorio' : 'Vista Móvil'}</span>
          </button>

          <button
            type="button"
            onClick={onQuickStartCount}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-amber-400/20 active:scale-95"
          >
            Nueva Captura
          </button>
        </div>
      </div>

      {/* Mobile Nav Strip */}
      <div className="lg:hidden border-t border-[#1a3356] bg-[#071322] px-3 py-2 flex items-center justify-around overflow-x-auto text-[11px] font-medium text-slate-400 gap-1">
        <button
          type="button"
          onClick={() => onSelectTab('captura')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'captura' ? 'text-amber-400 font-bold bg-[#0b1b32]' : ''
          }`}
        >
          1. Captura
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('cuadre')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'cuadre' ? 'text-amber-400 font-bold bg-[#0b1b32]' : ''
          }`}
        >
          2. Cuadre
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('verificacion')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'verificacion' ? 'text-amber-400 font-bold bg-[#0b1b32]' : ''
          }`}
        >
          3. Cierre
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('sheets')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'sheets' ? 'text-emerald-400 font-bold bg-[#0b1b32]' : ''
          }`}
        >
          4. Sheets
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'dashboard' ? 'text-amber-400 font-bold bg-[#0b1b32]' : ''
          }`}
        >
          5. Dashboard
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('kpi')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'kpi' ? 'text-amber-400 font-bold bg-[#0b1b32]' : ''
          }`}
        >
          KPI & Ficha
        </button>
      </div>
    </header>
  );
};
