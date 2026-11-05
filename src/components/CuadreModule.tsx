import React, { useState } from 'react';
import { Product, CaptureEntry, ProductConsolidated } from '../types/inventory';
import {
  Layers,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  FileCheck2,
} from 'lucide-react';

interface CuadreModuleProps {
  products: Product[];
  confirmedCaptures: CaptureEntry[];
  justifications: Record<string, string>;
  onGoBackToCapture: () => void;
  onProceedToVerification: () => void;
  onUpdateJustification: (productId: string, justification: string) => void;
}

export const CuadreModule: React.FC<CuadreModuleProps> = ({
  products,
  confirmedCaptures,
  justifications,
  onGoBackToCapture,
  onProceedToVerification,
  onUpdateJustification,
}) => {
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [filterPending, setFilterPending] = useState<'all' | 'counted' | 'pending'>('all');

  // Core cumulative calculation: Group all captures by product and sum them!
  const consolidatedList: ProductConsolidated[] = products.map((product) => {
    // Find all captures confirmed for this product
    const productCaptures = confirmedCaptures.filter((c) => c.productId === product.id);

    // Sum every confirmed capture (e.g. 5 + 3 + 2 = 10!)
    const totalPhysical = productCaptures.reduce((sum, c) => sum + c.totalCaptured, 0);

    const theoreticalStock = product.initialStock + product.receipts - product.posSales;
    const difference = totalPhysical - theoreticalStock;
    const costImpact = difference * product.unitCost;

    let status: 'ok' | 'warning' | 'critical' = 'ok';
    if (productCaptures.length === 0) {
      status = 'warning'; // Pendiente de conteo
    } else if (Math.abs(difference) <= 0.15) {
      status = 'ok';
    } else if (Math.abs(difference) <= 0.35) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      product,
      captures: productCaptures,
      totalPhysical,
      theoreticalStock,
      difference,
      costImpact,
      status,
      justification: justifications[product.id],
      verified: productCaptures.length > 0,
    };
  });

  // Filter list
  const filteredList = consolidatedList.filter((item) => {
    if (filterPending === 'counted') return item.captures.length > 0;
    if (filterPending === 'pending') return item.captures.length === 0;
    return true;
  });

  // Totals
  const totalCapturedBottles = consolidatedList.reduce((sum, i) => sum + i.totalPhysical, 0);
  const totalTheoreticalBottles = consolidatedList.reduce((sum, i) => sum + i.theoreticalStock, 0);
  const totalDifferenceBottles = totalCapturedBottles - totalTheoreticalBottles;
  const totalCostImpact = consolidatedList.reduce((sum, i) => sum + i.costImpact, 0);
  const countedProductsCount = consolidatedList.filter((i) => i.captures.length > 0).length;
  const pendingProductsCount = consolidatedList.filter((i) => i.captures.length === 0).length;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-28">
      {/* Module 2 Header */}
      <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
              <span>Módulo 2</span>
              <span className="text-slate-400">·</span>
              <span>Cuadre de Inventario Ouzo</span>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-400">Consolidación Acumulativa</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Cuadre y Consolidación de Capturas
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              El sistema suma automáticamente todas las capturas confirmadas de cada producto (ej. 5 + 3 + 2 = 10) y las compara contra las ventas registradas por el POS de Ouzo Bar.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onGoBackToCapture}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#071322] hover:bg-[#142845] border border-[#1a3356] rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Añadir Capturas</span>
            </button>

            <button
              type="button"
              onClick={onProceedToVerification}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-1.5"
            >
              <span>Verificar y Cerrar (Módulo 3)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Pillars Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1a3356]">
          <div className="bg-[#071322] border border-[#1a3356] rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Stock Físico Consolidado</span>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              {totalCapturedBottles.toFixed(2)} <span className="text-xs text-slate-400 font-normal">bot.</span>
            </p>
            <span className="text-[10px] text-slate-400">
              {confirmedCaptures.length} capturas sumadas
            </span>
          </div>

          <div className="bg-[#071322] border border-[#1a3356] rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Stock Teórico Esperado</span>
            <p className="text-xl font-bold font-mono text-slate-200 mt-0.5">
              {totalTheoreticalBottles.toFixed(2)} <span className="text-xs text-slate-400 font-normal">bot.</span>
            </p>
            <span className="text-[10px] text-slate-400">
              Inicial + Entradas - POS
            </span>
          </div>

          <div className="bg-[#071322] border border-[#1a3356] rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Diferencia Neta de Turno</span>
            <p className={`text-xl font-bold font-mono mt-0.5 ${totalDifferenceBottles < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {totalDifferenceBottles >= 0 ? `+${totalDifferenceBottles.toFixed(2)}` : totalDifferenceBottles.toFixed(2)} <span className="text-xs font-normal">bot.</span>
            </p>
            <span className="text-[10px] text-slate-400">
              {totalDifferenceBottles < 0 ? 'Faltante acumulado' : 'Balance favorable'}
            </span>
          </div>

          <div className="bg-[#071322] border border-[#1a3356] rounded-xl p-3">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-rose-400" />
              <span>Impacto Financiero</span>
            </div>
            <p className={`text-xl font-bold font-mono mt-0.5 ${totalCostImpact < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ${Math.abs(totalCostImpact).toFixed(2)} <span className="text-xs font-normal">USD</span>
            </p>
            <span className="text-[10px] text-slate-400">
              {pendingProductsCount > 0 ? `${pendingProductsCount} pendientes` : '100% inventariado'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-[#0b1b32] border border-[#1a3356] rounded-xl">
          <button
            type="button"
            onClick={() => setFilterPending('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterPending === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos los Productos ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterPending('counted')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterPending === 'counted'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Con Capturas ({countedProductsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterPending('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterPending === 'pending'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pendientes de Captura ({pendingProductsCount})
          </button>
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline">
          Haz clic en cada producto para desplegar el desglose de capturas individuales
        </span>
      </div>

      {/* Consolidated Table */}
      <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#071322] text-slate-400 uppercase tracking-wider text-[10px] border-b border-[#1a3356] font-medium">
              <tr>
                <th className="p-3 pl-4">Producto & Código</th>
                <th className="p-3 text-center">Fórmula Teórica (Ini + Ent - POS)</th>
                <th className="p-3 text-right">Capturas Confirmadas</th>
                <th className="p-3 text-right">Total Físico Cuadre</th>
                <th className="p-3 text-right">Diferencia</th>
                <th className="p-3 text-right">Impacto $</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 pr-4 text-center">Acción / Desglose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#142845] text-slate-300 font-mono">
              {filteredList.map((item) => {
                const isExpanded = expandedProductId === item.product.id;
                const hasCaptures = item.captures.length > 0;

                return (
                  <React.Fragment key={item.product.id}>
                    <tr
                      className={`hover:bg-[#10243e] transition-colors ${
                        !hasCaptures ? 'opacity-60 bg-[#071322]/40' : ''
                      }`}
                    >
                      <td className="p-3 pl-4 font-sans font-medium text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-400 text-[10px]">
                            {item.product.code}
                          </span>
                          <span>{item.product.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {item.product.brand} · {item.product.sizeMl}ml · ${item.product.unitCost.toFixed(2)}/bot
                        </span>
                      </td>

                      <td className="p-3 text-center text-slate-400 text-[11px]">
                        {item.product.initialStock.toFixed(1)} + {item.product.receipts.toFixed(1)} - {item.product.posSales.toFixed(1)} = <strong className="text-slate-200">{item.theoreticalStock.toFixed(2)}</strong>
                      </td>

                      <td className="p-3 text-right font-sans">
                        {hasCaptures ? (
                          <span className="inline-block bg-[#071322] px-2 py-0.5 rounded border border-[#1a3356] text-[11px] text-amber-300 font-mono">
                            {item.captures.length} {item.captures.length === 1 ? 'captura' : 'capturas sumadas'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">0 capturas</span>
                        )}
                      </td>

                      <td className="p-3 text-right font-bold text-white text-sm">
                        {hasCaptures ? (
                          <span className="text-emerald-400">{item.totalPhysical.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-500">0.00</span>
                        )}
                      </td>

                      <td className={`p-3 text-right font-bold ${
                        !hasCaptures
                          ? 'text-slate-500'
                          : item.status === 'ok'
                          ? 'text-emerald-400'
                          : item.status === 'warning'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}>
                        {hasCaptures ? (
                          item.difference >= 0 ? `+${item.difference.toFixed(2)}` : item.difference.toFixed(2)
                        ) : (
                          `-${item.theoreticalStock.toFixed(2)}`
                        )}
                      </td>

                      <td className="p-3 text-right">
                        ${hasCaptures ? Math.abs(item.costImpact).toFixed(2) : (item.theoreticalStock * item.product.unitCost).toFixed(2)}
                      </td>

                      <td className="p-3 text-center font-sans">
                        {!hasCaptures ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                            PENDIENTE
                          </span>
                        ) : item.status === 'ok' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
                            CUADRADO
                          </span>
                        ) : item.status === 'warning' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/70 text-amber-400 border border-amber-800/50">
                            VARIACIÓN
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/70 text-rose-400 border border-rose-800/50">
                            CRÍTICO
                          </span>
                        )}
                      </td>

                      <td className="p-3 pr-4 text-center font-sans">
                        {hasCaptures ? (
                          <button
                            type="button"
                            onClick={() => setExpandedProductId(isExpanded ? null : item.product.id)}
                            className="p-1 hover:bg-[#142845] rounded text-slate-400 hover:text-white transition-colors"
                            title="Ver desglose de capturas individuales"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={onGoBackToCapture}
                            className="text-[10px] text-amber-400 hover:underline"
                          >
                            Capturar ahora
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Drill-down of individual confirmed captures (Demonstrating 5 + 3 + 2 = 10) */}
                    {isExpanded && hasCaptures && (
                      <tr className="bg-[#071322]">
                        <td colSpan={8} className="p-3 pl-8">
                          <div className="border-l-2 border-amber-500 pl-4 space-y-2">
                            <span className="text-[11px] font-sans font-bold text-amber-400 uppercase tracking-wider block">
                              Desglose de Capturas Confirmadas para {item.product.name}:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {item.captures.map((c, idx) => (
                                <div
                                  key={c.id}
                                  className="bg-[#0b1b32] border border-[#1a3356] rounded-lg p-2 text-xs"
                                >
                                  <div className="flex justify-between font-bold text-white">
                                    <span>Captura #{idx + 1} ({c.station})</span>
                                    <span className="text-emerald-400 font-mono">+{c.totalCaptured.toFixed(2)} bot</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {c.fullBottles} cerradas + {c.openBottleLevel.toFixed(2)} abierta · {c.timestamp}
                                    {c.note && <div className="text-amber-300 italic">{c.note}</div>}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="text-xs text-slate-300 pt-1 flex items-center gap-2">
                              <span>Sumatoria automática acumulada:</span>
                              <strong className="text-emerald-400 font-mono text-sm">
                                {item.captures.map((c) => c.totalCaptured.toFixed(1)).join(' + ')} = {item.totalPhysical.toFixed(2)} botellas físicas en total
                              </strong>
                            </div>

                            {Math.abs(item.difference) > 0.15 && (
                              <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-[#1a3356]">
                                <span className="text-[11px] text-amber-400 font-semibold">
                                  Justificar diferencia ({item.difference >= 0 ? `+${item.difference.toFixed(2)}` : item.difference.toFixed(2)} bot):
                                </span>
                                <select
                                  value={item.justification || ''}
                                  onChange={(e) => onUpdateJustification(item.product.id, e.target.value)}
                                  className="bg-[#0b1b32] border border-[#1a3356] rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                                >
                                  <option value="">Seleccionar motivo...</option>
                                  <option value="Rotura accidental de botella en coctelera">Rotura accidental de botella</option>
                                  <option value="Cortesía autorizada gerencia Ouzo">Cortesía autorizada gerencia</option>
                                  <option value="Degustación técnica de bar">Degustación técnica de bar</option>
                                  <option value="Sobre-vertido / margen de coctelería">Sobre-vertido / margen cóctel</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between p-4 bg-[#0b1b32] border border-[#1a3356] rounded-2xl">
        <button
          type="button"
          onClick={onGoBackToCapture}
          className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#071322] hover:bg-[#142845] rounded-xl transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Módulo de Captura</span>
        </button>

        <button
          type="button"
          onClick={onProceedToVerification}
          className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Finalizar Cuadre y Pasar a Verificación (Módulo 3) →</span>
        </button>
      </div>
    </div>
  );
};
