import React, { useState, useEffect } from 'react';
import { Product, BottleCountItem, StationLocation, InventoryCountSummary } from '../types/inventory';
import { BottleVisualizer } from './BottleVisualizer';
import { ActaModal } from './ActaModal';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Wine,
  FileCheck,
} from 'lucide-react';

interface QuickCountViewProps {
  products: Product[];
  counts: Record<string, BottleCountItem>;
  setCounts: React.Dispatch<React.SetStateAction<Record<string, BottleCountItem>>>;
  timerSeconds: number;
  setTimerSeconds: React.Dispatch<React.SetStateAction<number>>;
  isTimerRunning: boolean;
  setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
  bartenderName: string;
  setBartenderName: (val: string) => void;
  shift: 'Cierre' | 'Intermedio';
  setShift: (val: 'Cierre' | 'Intermedio') => void;
  onProceedToConciliacion: () => void;
}

export const QuickCountView: React.FC<QuickCountViewProps> = ({
  products,
  counts,
  setCounts,
  timerSeconds,
  setTimerSeconds,
  isTimerRunning,
  setIsTimerRunning,
  bartenderName,
  setBartenderName,
  shift,
  setShift,
  onProceedToConciliacion,
}) => {
  // Filter state
  const [activeStation, setActiveStation] = useState<StationLocation | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active open bottle modal/drawer
  const [selectedProductForLevel, setSelectedProductForLevel] = useState<Product | null>(null);

  // Observable summary modal state
  const [generatedSummary, setGeneratedSummary] = useState<InventoryCountSummary | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handlers for updating count
  const handleFullBottlesChange = (productId: string, delta: number) => {
    setCounts((prev) => {
      const current = prev[productId] || {
        productId,
        fullBottles: 0,
        openBottleLevel: 0,
        verified: true,
      };
      const newFull = Math.max(0, current.fullBottles + delta);
      return {
        ...prev,
        [productId]: {
          ...current,
          fullBottles: newFull,
          verified: true,
        },
      };
    });
  };

  const handleOpenBottleLevelChange = (productId: string, level: number) => {
    setCounts((prev) => {
      const current = prev[productId] || {
        productId,
        fullBottles: 0,
        openBottleLevel: 0,
        verified: true,
      };
      return {
        ...prev,
        [productId]: {
          ...current,
          openBottleLevel: level,
          verified: true,
        },
      };
    });
  };

  const handleJustificationChange = (productId: string, justification: string) => {
    setCounts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        justification,
      },
    }));
  };

  // Scenario presets for demo evaluation
  const handlePresetExact = () => {
    setCounts((prev) => {
      const updated = { ...prev };
      products.forEach((p) => {
        const theoretical = p.initialStock + p.receipts - p.posSales;
        const full = Math.floor(theoretical);
        const frac = Math.round((theoretical - full) * 10) / 10;
        updated[p.id] = {
          productId: p.id,
          fullBottles: Math.max(0, full),
          openBottleLevel: Math.min(0.9, Math.max(0, frac)),
          verified: true,
          justification: undefined,
        };
      });
      return updated;
    });
  };

  const handlePresetVariances = () => {
    setCounts((prev) => {
      const updated = { ...prev };
      products.forEach((p) => {
        const theoretical = p.initialStock + p.receipts - p.posSales;
        let full = Math.floor(theoretical);
        let frac = Math.round((theoretical - full) * 10) / 10;

        // Induce realistic discrepancies for testing
        if (p.id === 'prod-06') {
          // Mezcal: theoretical 2.9, physical 2.4 (difference -0.5)
          full = 2;
          frac = 0.4;
        } else if (p.id === 'prod-13') {
          // Corona: theoretical 37, physical 36 (difference -1.0)
          full = 36;
          frac = 0.0;
        } else if (p.id === 'prod-01') {
          // Don Julio: theoretical 4.7, physical 4.4 (difference -0.3)
          full = 4;
          frac = 0.4;
        }

        updated[p.id] = {
          productId: p.id,
          fullBottles: Math.max(0, full),
          openBottleLevel: Math.min(0.9, Math.max(0, frac)),
          verified: true,
        };
      });
      return updated;
    });
  };

  const handleResetZero = () => {
    setCounts((prev) => {
      const updated = { ...prev };
      products.forEach((p) => {
        updated[p.id] = {
          productId: p.id,
          fullBottles: 0,
          openBottleLevel: 0,
          verified: false,
          justification: undefined,
        };
      });
      return updated;
    });
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesStation = activeStation === 'all' || p.location === activeStation;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStation && matchesSearch;
  });

  // Calculate totals
  const totalItemsCounted = Object.values(counts).filter((c) => c.verified).length;

  // Calculate summary and trigger observable record
  const handleFinalizeCount = () => {
    setIsTimerRunning(false);

    let totalDiffBottles = 0;
    let totalCostImpact = 0;
    let criticalCount = 0;

    const summaryItems = products.map((product) => {
      const count = counts[product.id] || {
        productId: product.id,
        fullBottles: 0,
        openBottleLevel: 0,
        verified: false,
      };
      const physicalStock = count.fullBottles + count.openBottleLevel;
      const theoreticalStock = product.initialStock + product.receipts - product.posSales;
      const difference = physicalStock - theoreticalStock;
      const costImpact = difference * product.unitCost;

      let status: 'ok' | 'warning' | 'critical' = 'ok';
      if (Math.abs(difference) <= 0.15) {
        status = 'ok';
      } else if (Math.abs(difference) <= 0.35) {
        status = 'warning';
        criticalCount += 1;
      } else {
        status = 'critical';
        criticalCount += 1;
      }

      totalDiffBottles += difference;
      totalCostImpact += costImpact;

      return {
        product,
        physicalStock,
        theoreticalStock,
        difference,
        costImpact,
        status,
        justification: count.justification,
      };
    });

    const summary: InventoryCountSummary = {
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      date: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      bartenderName,
      shift,
      durationSeconds: timerSeconds,
      items: summaryItems,
      totalDiscrepancyBottles: totalDiffBottles,
      totalCostImpact,
      criticalItemsCount: criticalCount,
    };

    setGeneratedSummary(summary);
  };

  const getStationLabel = (station: StationLocation) => {
    switch (station) {
      case 'speed_rail':
        return 'Speed Rail';
      case 'botellero_principal':
        return 'Botellero';
      case 'nevera':
        return 'Nevera';
      default:
        return 'Barra';
    }
  };

  return (
    <div className="pb-28">
      {/* Top Controller Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-14 z-20 backdrop-blur-md bg-slate-900/90">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Bartender & Turn Info */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Bartender en Turno</span>
              <select
                value={bartenderName}
                onChange={(e) => setBartenderName(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="Carlos Ruiz (Bartender Líder)">Carlos Ruiz (Bartender Líder)</option>
                <option value="Sofía Mendoza (Bartender 2)">Sofía Mendoza (Bartender 2)</option>
                <option value="Mateo Valenzuela (Jefe de Barra)">Mateo Valenzuela (Jefe de Barra)</option>
              </select>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Momento</span>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as 'Cierre' | 'Intermedio')}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="Cierre">Cierre Nocturno (Principal)</option>
                <option value="Intermedio">Cambio de Turno Tarde</option>
              </select>
            </div>
          </div>

          {/* Live Stopwatch & Efficiency Indicator */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 flex items-center gap-3">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                  Tiempo de Conteo
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {formatTimer(timerSeconds)}
                </span>
              </div>
              <div className="flex gap-1 pl-2 border-l border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  title={isTimerRunning ? 'Pausar' : 'Reanudar'}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setTimerSeconds(0)}
                  title="Reiniciar cronómetro"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase font-semibold px-2">Simulación:</span>
              <button
                type="button"
                onClick={handlePresetExact}
                className="px-2.5 py-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 rounded-lg transition-colors"
                title="Cierre exacto sin diferencias"
              >
                Cierre Exacto
              </button>
              <button
                type="button"
                onClick={handlePresetVariances}
                className="px-2.5 py-1 text-[11px] font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 rounded-lg transition-colors"
                title="Cierre realista con mermas en Mezcal y Cerveza"
              >
                Con Mermas
              </button>
              <button
                type="button"
                onClick={handleResetZero}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                title="Poner a 0 para probar conteo manual táctil"
              >
                Cero
              </button>
            </div>
          </div>
        </div>

        {/* Station Navigation Filter Tabs */}
        <div className="max-w-6xl mx-auto mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Todas las Botellas', count: products.length },
              { id: 'speed_rail', label: 'Speed Rail (80/20)', count: products.filter((p) => p.location === 'speed_rail').length },
              { id: 'botellero_principal', label: 'Botellero', count: products.filter((p) => p.location === 'botellero_principal').length },
              { id: 'nevera', label: 'Nevera & Cervezas', count: products.filter((p) => p.location === 'nevera').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStation(tab.id as any)}
                className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeStation === tab.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({tab.count})</span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar botella o marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content List */}
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Operational Context Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider">
              <span>Automatización de Captura en Barra</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">Meta: De 22h a &lt; 5h mensuales</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Registra botellas cerradas con <span className="text-white font-semibold">+ / -</span> y toca la fracción para marcar el nivel visual de la botella abierta en uso. Sin papel, sin dictado, cotejo automático en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Progreso de conteo</span>
              <span className="text-sm font-bold text-white font-mono">
                {totalItemsCounted} / {products.length} verificadas
              </span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 flex items-center justify-center font-mono text-xs font-bold text-emerald-400">
              {Math.round((totalItemsCounted / products.length) * 100)}%
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((product) => {
            const count = counts[product.id] || {
              productId: product.id,
              fullBottles: 0,
              openBottleLevel: 0,
              verified: false,
            };

            const physicalStock = count.fullBottles + count.openBottleLevel;
            const theoreticalStock = product.initialStock + product.receipts - product.posSales;
            const difference = physicalStock - theoreticalStock;
            const costImpact = difference * product.unitCost;

            // Status determination
            const isExact = Math.abs(difference) <= 0.05;
            const isAcceptable = Math.abs(difference) <= 0.15;
            const statusColor = isExact
              ? 'text-emerald-400'
              : isAcceptable
              ? 'text-amber-400'
              : 'text-rose-400';

            const statusBg = isExact
              ? 'bg-emerald-950/30 border-emerald-800/40'
              : isAcceptable
              ? 'bg-amber-950/30 border-amber-800/40'
              : 'bg-rose-950/30 border-rose-800/40';

            return (
              <div
                key={product.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm"
              >
                {/* Header row */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="text-amber-400 font-medium">
                          {getStationLabel(product.location)}
                        </span>
                        <span>·</span>
                        <span>{product.sizeMl} ml</span>
                        <span>·</span>
                        <span>${product.unitCost.toFixed(2)}/bot</span>
                      </div>
                      <h3 className="text-base font-semibold text-white mt-0.5">
                        {product.name}
                      </h3>
                    </div>

                    {/* Theoretical Stock calculation badge */}
                    <div className="text-right shrink-0 bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1">
                      <span className="text-[10px] text-slate-400 block">Stock Teórico</span>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {theoreticalStock.toFixed(2)} bot
                      </span>
                    </div>
                  </div>

                  {/* Math explanation pills */}
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
                    <span>Ini: {product.initialStock.toFixed(1)}</span>
                    <span>+</span>
                    <span>Ent: {product.receipts.toFixed(1)}</span>
                    <span>-</span>
                    <span>POS: {product.posSales.toFixed(1)}</span>
                  </div>
                </div>

                {/* Tactile Input Controls (Thumb Zone Optimized) */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="grid grid-cols-2 gap-3 items-center">
                    {/* Botellas Cerradas */}
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-medium">
                        Botellas Cerradas
                      </label>
                      <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => handleFullBottlesChange(product.id, -1)}
                          className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-base flex items-center justify-center active:scale-95 transition-transform"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={count.fullBottles}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setCounts((prev) => ({
                              ...prev,
                              [product.id]: {
                                ...prev[product.id],
                                fullBottles: Math.max(0, val),
                                verified: true,
                              },
                            }));
                          }}
                          className="w-full text-center bg-transparent text-lg font-bold font-mono text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleFullBottlesChange(product.id, 1)}
                          className="w-10 h-10 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base flex items-center justify-center active:scale-95 transition-transform"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Botella Abierta (Selector Visual Táctil) */}
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-medium">
                        Botella Abierta (Nivel)
                      </label>
                      <button
                        type="button"
                        onClick={() => setSelectedProductForLevel(product)}
                        className="w-full h-12 bg-slate-950 hover:bg-slate-800/70 border border-slate-700 rounded-xl px-3 flex items-center justify-between text-left transition-colors active:scale-98"
                      >
                        <div className="flex items-center gap-2">
                          <Wine className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-200">
                            {count.openBottleLevel > 0
                              ? `${count.openBottleLevel.toFixed(2)} (${Math.round(count.openBottleLevel * 100)}%)`
                              : '0.0 (Sin abrir)'}
                          </span>
                        </div>
                        <span className="text-[11px] text-amber-400 font-medium underline">
                          Tocar nivel
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Real-time Result Row */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between ${statusBg}`}>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide block">
                        Físico Contado
                      </span>
                      <span className="text-sm font-bold font-mono text-white">
                        {physicalStock.toFixed(2)} botellas
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide block">
                        Diferencia vs Teórico
                      </span>
                      <span className={`text-sm font-bold font-mono ${statusColor}`}>
                        {difference >= 0 ? `+${difference.toFixed(2)}` : difference.toFixed(2)} bot.
                        <span className="text-xs font-normal ml-1">
                          (${Math.abs(costImpact).toFixed(2)})
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Discrepancy Note/Justification if different */}
                  {Math.abs(difference) > 0.15 && (
                    <div className="pt-1">
                      <select
                        value={count.justification || ''}
                        onChange={(e) => handleJustificationChange(product.id, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                      >
                        <option value="">Seleccionar motivo de variación...</option>
                        <option value="Merma por rotura de botella/cristal">Rotura accidental de botella</option>
                        <option value="Cortesía autorizada por Administrador">Cortesía autorizada gerencia</option>
                        <option value="Degustación / Capacitación bartenders">Degustación técnica de bar</option>
                        <option value="Sobre-vertido por alta velocidad (over-pour)">Sobre-vertido / margen coctel</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Level Selector Modal (Tappable Bottle Drawer) */}
      {selectedProductForLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <BottleVisualizer
              productName={selectedProductForLevel.name}
              level={counts[selectedProductForLevel.id]?.openBottleLevel || 0}
              onChange={(newLevel) => {
                handleOpenBottleLevelChange(selectedProductForLevel.id, newLevel);
              }}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProductForLevel(null)}
                className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-98 transition-transform"
              >
                Confirmar Nivel ({counts[selectedProductForLevel.id]?.openBottleLevel.toFixed(2)} bot)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar (Natural Thumb Zone) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <span className="text-xs text-slate-400 block">Tiempo actual</span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {formatTimer(timerSeconds)}
            </span>
          </div>

          <div className="text-left">
            <span className="text-xs text-slate-400 block">Conteo de Barra</span>
            <span className="text-sm font-semibold text-white">
              {totalItemsCounted} de {products.length} productos verificados
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onProceedToConciliacion}
              className="h-12 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all shrink-0"
            >
              <FileCheck className="w-4 h-4" />
              <span>Revisar Cuadre de Turno (Pantalla 2) →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Acta Modal (Observable Result) */}
      {generatedSummary && (
        <ActaModal
          summary={generatedSummary}
          onClose={() => setGeneratedSummary(null)}
        />
      )}
    </div>
  );
};
