import React, { useState, useMemo } from 'react';
import { ProductConsolidated, StationLocation } from '../types/inventory';
import {
  Sliders,
  TrendingDown,
  TrendingUp,
  Download,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  Copy,
  Check,
  RefreshCw,
  Wine,
  Sparkles,
  Filter,
  BarChart3,
  Calendar,
  Building2,
} from 'lucide-react';
import { triggerExcelDownload } from '../utils/excelMacrosGenerator';

interface ParametricDashboardProps {
  verifiedItems: ProductConsolidated[];
  bartenderName: string;
  shift: string;
  frequency?: string;
  onGoToSheets?: () => void;
  onGoToCapture?: () => void;
}

export const ParametricDashboard: React.FC<ParametricDashboardProps> = ({
  verifiedItems,
  bartenderName,
  shift,
  frequency = 'Diario',
  onGoToSheets,
  onGoToCapture,
}) => {
  // ==========================================
  // ESTADOS DE PARÁMETROS CONFIGURABLES
  // ==========================================
  // 1. Tolerancia máxima de merma aceptable en botellas (default: 0.15)
  const [toleranceBottles, setToleranceBottles] = useState<number>(0.15);

  // 2. Multiplicador de Par-Level por demanda / fin de semana (default: 1.25x)
  const [demandMultiplier, setDemandMultiplier] = useState<number>(1.25);

  // 3. Meta de Pour Cost Bar Target % (default: 20%)
  const [targetPourCostPct, setTargetPourCostPct] = useState<number>(20);

  // 4. Filtro por categoría
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // 5. Filtro por estación física
  const [stationFilter, setStationFilter] = useState<string>('all');

  // Copied executive summary state
  const [copiedSummary, setCopiedSummary] = useState(false);

  const currentDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Reset to standard restaurant benchmarks
  const handleResetDefaults = () => {
    setToleranceBottles(0.15);
    setDemandMultiplier(1.0);
    setTargetPourCostPct(20);
    setCategoryFilter('all');
    setStationFilter('all');
  };

  // ==========================================
  // FILTRADO DINÁMICO DE DATOS
  // ==========================================
  const filteredItems = useMemo(() => {
    return verifiedItems.filter((item) => {
      const matchCat = categoryFilter === 'all' || item.product.category === categoryFilter;
      const matchStation = stationFilter === 'all' || item.product.location === stationFilter;
      return matchCat && matchStation;
    });
  }, [verifiedItems, categoryFilter, stationFilter]);

  // ==========================================
  // CÁLCULOS PARAMETRIZADOS EN TIEMPO REAL
  // ==========================================
  // 1. Valoración total del stock físico en barra (USD)
  const totalPhysicalValue = useMemo(() => {
    return filteredItems.reduce((acc, i) => acc + i.totalPhysical * i.product.unitCost, 0);
  }, [filteredItems]);

  // 2. Total botellas físicas registradas
  const totalPhysicalBottles = useMemo(() => {
    return filteredItems.reduce((acc, i) => acc + i.totalPhysical, 0);
  }, [filteredItems]);

  // 3. Discrepancia neta en botellas
  const totalNetDifference = useMemo(() => {
    return filteredItems.reduce((acc, i) => acc + i.difference, 0);
  }, [filteredItems]);

  // 4. Mermas que exceden la tolerancia paramétrica configurada
  const itemsExceedingTolerance = useMemo(() => {
    return filteredItems.filter((i) => Math.abs(i.difference) > toleranceBottles);
  }, [filteredItems, toleranceBottles]);

  // 5. Impacto financiero de las mermas que superan la tolerancia
  const financialLossFromTolerance = useMemo(() => {
    return itemsExceedingTolerance.reduce(
      (acc, i) => acc + Math.abs(i.difference) * i.product.unitCost,
      0
    );
  }, [itemsExceedingTolerance]);

  // 6. Tasa de exactitud de auditoría (% de ítems dentro de la tolerancia)
  const accuracyRatePct = useMemo(() => {
    if (filteredItems.length === 0) return 100;
    const okCount = filteredItems.length - itemsExceedingTolerance.length;
    return (okCount / filteredItems.length) * 100;
  }, [filteredItems, itemsExceedingTolerance]);

  // 7. Reorden a Bodega ajustado por el multiplicador paramétrico de demanda
  const parametricRequisition = useMemo(() => {
    return filteredItems
      .map((i) => {
        const basePar = i.product.parLevel || 4.0;
        const adjustedPar = Math.ceil(basePar * demandMultiplier * 10) / 10;
        const needed = Math.max(0, adjustedPar - i.totalPhysical);
        return {
          product: i.product,
          physical: i.totalPhysical,
          basePar,
          adjustedPar,
          needed,
          cost: needed * i.product.unitCost,
        };
      })
      .filter((i) => i.needed > 0);
  }, [filteredItems, demandMultiplier]);

  const totalRequisitionCost = useMemo(() => {
    return parametricRequisition.reduce((acc, i) => acc + i.cost, 0);
  }, [parametricRequisition]);

  const totalRequisitionBottles = useMemo(() => {
    return parametricRequisition.reduce((acc, i) => acc + i.needed, 0);
  }, [parametricRequisition]);

  // 8. Resumen por Categorías
  const categorySummary = useMemo(() => {
    const cats: Record<
      string,
      { label: string; count: number; value: number; diff: number; loss: number }
    > = {
      destilados: { label: 'Destilados & Signature', count: 0, value: 0, diff: 0, loss: 0 },
      aperitivos: { label: 'Aperitivos & Licores', count: 0, value: 0, diff: 0, loss: 0 },
      vinos_cavas: { label: 'Vinos & Cavas', count: 0, value: 0, diff: 0, loss: 0 },
      cervezas_mixers: { label: 'Cervezas & Mixers', count: 0, value: 0, diff: 0, loss: 0 },
    };

    filteredItems.forEach((i) => {
      const catKey = i.product.category;
      if (cats[catKey]) {
        cats[catKey].count += 1;
        cats[catKey].value += i.totalPhysical * i.product.unitCost;
        cats[catKey].diff += i.difference;
        if (Math.abs(i.difference) > toleranceBottles) {
          cats[catKey].loss += Math.abs(i.difference) * i.product.unitCost;
        }
      }
    });

    return Object.entries(cats).map(([key, data]) => ({
      key,
      ...data,
      pctOfTotalValue: totalPhysicalValue > 0 ? (data.value / totalPhysicalValue) * 100 : 0,
    }));
  }, [filteredItems, totalPhysicalValue, toleranceBottles]);

  // 9. Top 5 productos con mayor impacto de desvío
  const topDeviations = useMemo(() => {
    return [...filteredItems]
      .sort((a, b) => Math.abs(b.costImpact) - Math.abs(a.costImpact))
      .slice(0, 5);
  }, [filteredItems]);

  // Export Parametric Excel
  const handleDownloadParametricExcel = () => {
    triggerExcelDownload(verifiedItems, {
      bartenderName,
      shift,
      date: currentDate,
      frequency,
      toleranceBottles,
      demandMultiplier,
      targetPourCostPct,
    });
  };

  // Copy Executive Report to Clipboard
  const handleCopyExecutiveSummary = () => {
    const text = [
      `📊 *DASHBOARD PARAMETRIZADO — OUZO BAR & RESTAURANTE*`,
      `📅 Fecha: ${currentDate} | Turno: ${shift} | Frecuencia: ${frequency}`,
      `👤 Responsable: ${bartenderName}`,
      `-------------------------------------------------`,
      `⚙️ *PARÁMETROS APLICADOS:*`,
      `• Tolerancia de Merma Máxima: ±${toleranceBottles.toFixed(2)} botellas`,
      `• Multiplicador Demanda Fin de Semana: ${demandMultiplier.toFixed(2)}x`,
      `• Meta Pour Cost de Bar: ${targetPourCostPct}%`,
      `-------------------------------------------------`,
      `📈 *INDICADORES CLAVE (KPIS):*`,
      `• Valoración Total en Barra: $${totalPhysicalValue.toFixed(2)} USD`,
      `• Botellas Totales Físicas: ${totalPhysicalBottles.toFixed(2)} unidades`,
      `• Tasa de Exactitud de Cuadre: ${accuracyRatePct.toFixed(1)}%`,
      `• Impacto Financiero Mermas Críticas: $${financialLossFromTolerance.toFixed(2)} USD`,
      `• Ítems fuera de tolerancia: ${itemsExceedingTolerance.length} de ${filteredItems.length}`,
      `• Presupuesto Reposición Bodega (${demandMultiplier}x): $${totalRequisitionCost.toFixed(2)} USD (${totalRequisitionBottles.toFixed(1)} bot.)`,
      `-------------------------------------------------`,
      `🍸 _Reporte generado desde BarraExpress Ouzo — Control Parametrizado._`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-28">
      {/* Header Banner */}
      <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
              <span>Módulo Ejecutivo</span>
              <span className="text-slate-400">·</span>
              <span>Gestión de Costos &amp; Control</span>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-400">Fórmulas Nativas de Excel</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Sliders className="w-7 h-7 text-amber-400" />
              <span>Dashboard Excel Parametrizado</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Modifica los <strong>parámetros de control</strong> (tolerancia de mermas, multiplicador de fin de semana y costo meta). Los indicadores, alertas y el libro de Excel se recalculan dinámicamente en tiempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadParametricExcel}
              className="px-4 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-lg shadow-emerald-400/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Descargar libro Excel con pestaña 0_Dashboard_Parametrizado vinculada a celdas de control"
            >
              <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Descargar Dashboard en Excel (.xls)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyExecutiveSummary}
              className="px-3.5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-md active:scale-95 flex items-center gap-1.5"
            >
              {copiedSummary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSummary ? '¡Informe Copiado!' : 'Copiar Resumen'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#071322] hover:bg-[#142845] border border-[#1a3356] rounded-xl transition-colors flex items-center gap-1.5"
              title="Restablecer parámetros estándar de restaurante"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Valores Estándar</span>
            </button>
          </div>
        </div>

        {/* Quick Context Bar */}
        <div className="mt-5 pt-4 border-t border-[#1a3356] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Fecha: <strong className="text-white">{currentDate}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Turno: <strong className="text-white">{shift} ({frequency})</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <Wine className="w-3.5 h-3.5 text-sky-400" />
              <span>Auditor: <strong className="text-white">{bartenderName}</strong></span>
            </span>
          </div>

          <div className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            ● Parámetros conectados a fórmulas =SUMA, =CONTAR.SI y =MAX
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PANEL DE CONTROL DE PARÁMETROS CONFIGURABLES (LO QUE PIDE EL USUARIO)   */}
      {/* ========================================================================= */}
      <div className="bg-[#0b1b32] border border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-[#1a3356] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              ⚙️
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Panel de Parámetros de Control (Variables de Auditoría)
              </h2>
              <p className="text-xs text-slate-400">
                Ajusta las tolerancias y factores para adaptar el análisis a la demanda real de Ouzo Bar.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-800/40">
            Ajuste en Vivo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Parámetro 1: Tolerancia de Merma Máxima Aceptable */}
          <div className="bg-[#071322] border border-[#1a3356] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300 font-semibold block">
                1. Tolerancia Máx. de Merma:
              </label>
              <span className="text-sm font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                ±{toleranceBottles.toFixed(2)} bot.
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Desvío admisible por evaporación, servicio y rotura leve antes de disparar alerta roja.
            </p>
            <input
              type="range"
              min="0.05"
              max="0.40"
              step="0.05"
              value={toleranceBottles}
              onChange={(e) => setToleranceBottles(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-[#0b1b32] rounded-lg border border-[#1a3356]"
            />
            <div className="flex items-center justify-between gap-1 text-[10px]">
              {[
                { label: 'Estricto (0.10)', val: 0.1 },
                { label: 'Normal (0.15)', val: 0.15 },
                { label: 'Flexible (0.25)', val: 0.25 },
              ].map((b) => (
                <button
                  key={b.val}
                  type="button"
                  onClick={() => setToleranceBottles(b.val)}
                  className={`px-2 py-1 rounded transition-colors ${
                    toleranceBottles === b.val
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-[#142845] text-slate-300 hover:text-white'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parámetro 2: Multiplicador de Par-Level por Demanda */}
          <div className="bg-[#071322] border border-[#1a3356] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300 font-semibold block">
                2. Multiplicador de Demanda (Par):
              </label>
              <span className="text-sm font-mono font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                {demandMultiplier.toFixed(2)}x
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Aumenta el stock de seguridad para viernes, sábados o eventos especiales de alta concurrencia.
            </p>
            <input
              type="range"
              min="1.0"
              max="2.0"
              step="0.25"
              value={demandMultiplier}
              onChange={(e) => setDemandMultiplier(parseFloat(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer h-2 bg-[#0b1b32] rounded-lg border border-[#1a3356]"
            />
            <div className="flex items-center justify-between gap-1 text-[10px]">
              {[
                { label: '1.0x Regular', val: 1.0 },
                { label: '1.25x Finde', val: 1.25 },
                { label: '1.50x Festivo', val: 1.5 },
                { label: '1.75x Temporada', val: 1.75 },
              ].map((m) => (
                <button
                  key={m.val}
                  type="button"
                  onClick={() => setDemandMultiplier(m.val)}
                  className={`px-1.5 py-1 rounded transition-colors ${
                    demandMultiplier === m.val
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-[#142845] text-slate-300 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parámetro 3: Filtro Dinámico de Categoría & Barra */}
          <div className="bg-[#071322] border border-[#1a3356] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300 font-semibold block">
                3. Segmentación Operativa:
              </label>
              <Filter className="w-3.5 h-3.5 text-amber-400" />
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Categoría:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-[#0b1b32] border border-[#1a3356] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Todas las Categorías ({verifiedItems.length} refs)</option>
                  <option value="destilados">Solo Destilados & Ouzo Signature</option>
                  <option value="aperitivos">Aperitivos & Licores Mediterráneos</option>
                  <option value="vinos_cavas">Vinos de Santorini & Cavas</option>
                  <option value="cervezas_mixers">Cervezas Importadas & Mixers</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Estación de Barra:</span>
                <select
                  value={stationFilter}
                  onChange={(e) => setStationFilter(e.target.value)}
                  className="w-full bg-[#0b1b32] border border-[#1a3356] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Todas las Estaciones</option>
                  <option value="speed_rail">Speed Rail (Riel de Velocidad)</option>
                  <option value="botellero_principal">Botellero Principal</option>
                  <option value="cava_vinos">Cava de Vinos</option>
                  <option value="nevera_cervezas">Nevera de Cervezas</option>
                  <option value="reserva_bodega">Bodega de Barra</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5 TARJETAS DE KPIS DINÁMICOS PARAMETRIZADOS                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Valor Stock Físico */}
        <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Valor Stock en Barra</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl md:text-2xl font-mono font-extrabold text-white">
            ${totalPhysicalValue.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalPhysicalBottles.toFixed(1)} botellas físicas en {filteredItems.length} refs
          </div>
        </div>

        {/* Card 2: Tasa de Exactitud de Cuadre */}
        <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Exactitud de Cuadre</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-xl md:text-2xl font-mono font-extrabold ${
            accuracyRatePct >= 85 ? 'text-emerald-400' : accuracyRatePct >= 70 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {accuracyRatePct.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Dentro de tolerancia (±{toleranceBottles.toFixed(2)} bot.)
          </div>
        </div>

        {/* Card 3: Impacto Financiero Mermas Críticas */}
        <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Mermas Fuera Tolerancia</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl md:text-2xl font-mono font-extrabold text-rose-400">
            ${financialLossFromTolerance.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {itemsExceedingTolerance.length} refs con desvío &gt; {toleranceBottles}
          </div>
        </div>

        {/* Card 4: Ítems en Quiebre Paramétrico */}
        <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Quiebres de Stock Par</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl md:text-2xl font-mono font-extrabold text-amber-400">
            {parametricRequisition.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Por debajo de Par ({demandMultiplier}x)
          </div>
        </div>

        {/* Card 5: Presupuesto Requisición a Bodega */}
        <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Presupuesto Reposición</span>
            <Package className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl md:text-2xl font-mono font-extrabold text-sky-400">
            ${totalRequisitionCost.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalRequisitionBottles.toFixed(1)} botellas a pedir a bodega
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ANÁLISIS POR CATEGORÍA Y TOP 5 DESVÍOS CRÍTICOS                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Distribución por Categoría (7 cols) */}
        <div className="lg:col-span-7 bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#1a3356] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Distribución de Valor y Mermas por Categoría</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total: ${totalPhysicalValue.toFixed(2)} USD
            </span>
          </div>

          <div className="space-y-3">
            {categorySummary.map((cat) => (
              <div key={cat.key} className="bg-[#071322] border border-[#1a3356] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{cat.label}</span>
                    <span className="text-[10px] text-slate-400">({cat.count} refs)</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-emerald-400 font-bold">${cat.value.toFixed(2)} USD</span>
                    <span className="text-[10px] text-slate-400">({cat.pctOfTotalValue.toFixed(1)}%)</span>
                    {cat.loss > 0 && (
                      <span className="text-rose-400 text-[11px] font-bold">
                        -${cat.loss.toFixed(2)} merma
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#142845] h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, cat.pctOfTotalValue))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Desvíos Críticos (5 cols) */}
        <div className="lg:col-span-5 bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#1a3356] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>Top 5 Desvíos Financieros Críticos</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Auditoría Ouzo</span>
          </div>

          <div className="space-y-2.5">
            {topDeviations.map((item, idx) => {
              const exceeds = Math.abs(item.difference) > toleranceBottles;
              return (
                <div
                  key={item.product.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    exceeds
                      ? 'bg-rose-950/20 border-rose-800/40'
                      : 'bg-[#071322] border-[#1a3356]'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-amber-400">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-100 truncate block">
                        {item.product.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Físico: <strong className="text-white">{item.totalPhysical.toFixed(2)}</strong> · 
                      Teórico: <strong className="text-slate-300">{item.theoreticalStock.toFixed(2)}</strong> · 
                      {item.justification && <span className="text-amber-300 ml-1">({item.justification})</span>}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-mono font-bold block ${
                      item.difference < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {item.difference >= 0 ? `+${item.difference.toFixed(2)}` : item.difference.toFixed(2)} bot.
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ${Math.abs(item.costImpact).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TABLA DE REORDEN PARAMETRIZADA A BODEGA (CON MULTIPLICADOR EN VIVO)      */}
      {/* ========================================================================= */}
      <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1a3356] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-400" />
              <span>Reorden Parametrizado a Bodega Central (Factor: {demandMultiplier.toFixed(2)}x)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cálculo vivo: Si <code>Stock Físico &lt; (Par Base × Multiplicador)</code>, se sugiere reposición inmediata para garantizar servicio continuo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-300">
              Total: <strong className="text-sky-400">${totalRequisitionCost.toFixed(2)} USD</strong> ({totalRequisitionBottles.toFixed(1)} bot.)
            </span>
            <button
              type="button"
              onClick={handleDownloadParametricExcel}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Reorden</span>
            </button>
          </div>
        </div>

        {parametricRequisition.length === 0 ? (
          <div className="p-6 text-center text-xs text-emerald-300 bg-emerald-950/40 rounded-xl border border-emerald-800/40">
            🎉 Todas las referencias cumplen con el stock de seguridad para el factor de demanda seleccionado ({demandMultiplier}x).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#050e1a] text-slate-400 text-[10px] border-b border-[#1a3356]">
                  <th className="p-2 border-r border-[#1a3356]">CÓDIGO</th>
                  <th className="p-2 border-r border-[#1a3356]">PRODUCTO OUZO</th>
                  <th className="p-2 border-r border-[#1a3356]">ESTACIÓN</th>
                  <th className="p-2 text-right border-r border-[#1a3356]">STOCK ACTUAL</th>
                  <th className="p-2 text-right border-r border-[#1a3356]">PAR BASE</th>
                  <th className="p-2 text-right border-r border-[#1a3356] bg-sky-950/30 text-sky-300">PAR AJUSTADO ({demandMultiplier}x)</th>
                  <th className="p-2 text-right border-r border-[#1a3356] bg-amber-950/30 text-amber-300 font-bold">A PEDIR</th>
                  <th className="p-2 text-right">COSTO TOTAL USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#142845] text-slate-300">
                {parametricRequisition.map((req) => (
                  <tr key={req.product.id} className="hover:bg-[#0e213b]">
                    <td className="p-2 text-amber-400 font-bold border-r border-[#1a3356]">{req.product.code}</td>
                    <td className="p-2 font-sans font-medium text-white border-r border-[#1a3356]">{req.product.name}</td>
                    <td className="p-2 text-slate-400 border-r border-[#1a3356]">{req.product.location}</td>
                    <td className="p-2 text-right border-r border-[#1a3356]">{req.physical.toFixed(2)}</td>
                    <td className="p-2 text-right border-r border-[#1a3356]">{req.basePar}</td>
                    <td className="p-2 text-right font-bold text-sky-300 border-r border-[#1a3356] bg-sky-950/20">
                      {req.adjustedPar.toFixed(1)}
                    </td>
                    <td className="p-2 text-right font-bold text-amber-400 border-r border-[#1a3356] bg-amber-950/20">
                      +{req.needed.toFixed(1)} bot.
                    </td>
                    <td className="p-2 text-right font-bold text-emerald-400">
                      ${req.cost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
