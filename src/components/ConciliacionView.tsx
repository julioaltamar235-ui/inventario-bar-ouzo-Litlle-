import React from 'react';
import { Product, BottleCountItem } from '../types/inventory';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';

interface ConciliacionViewProps {
  products: Product[];
  counts: Record<string, BottleCountItem>;
  onUpdateJustification: (productId: string, justification: string) => void;
  onGoBackToCount: () => void;
  onProceedToActa: () => void;
  bartenderName: string;
  shift: string;
}

export const ConciliacionView: React.FC<ConciliacionViewProps> = ({
  products,
  counts,
  onUpdateJustification,
  onGoBackToCount,
  onProceedToActa,
  bartenderName,
  shift,
}) => {
  // Calculations
  let totalPhysicalBottles = 0;
  let totalTheoreticalBottles = 0;
  let totalDiffBottles = 0;
  let totalCostImpact = 0;
  let criticalCount = 0;
  let pendingJustificationsCount = 0;

  const rowData = products.map((product) => {
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

    if (Math.abs(difference) > 0.15 && !count.justification) {
      pendingJustificationsCount += 1;
    }

    totalPhysicalBottles += physicalStock;
    totalTheoreticalBottles += theoreticalStock;
    totalDiffBottles += difference;
    totalCostImpact += costImpact;

    return {
      product,
      count,
      physicalStock,
      theoreticalStock,
      difference,
      costImpact,
      status,
      justification: count.justification || '',
    };
  });

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 pb-28">
      {/* Screen Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
              <span>Pantalla 2 de 4</span>
              <span className="text-slate-500">·</span>
              <span>Cuadre & Conciliación de Turno</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Conciliación de Stock Físico vs. Ventas POS
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Auditoría en tiempo real de discrepancias del turno ({shift} · {bartenderName}). Revisa el semáforo y registra justificaciones antes de congelar el acta de cierre.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onGoBackToCount}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Editar Conteo
            </button>
            <button
              type="button"
              onClick={onProceedToActa}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-400/20 active:scale-95"
            >
              <span>Emitir Acta Oficial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Stock Físico Contado</span>
            <p className="text-xl font-bold font-mono text-white mt-0.5">
              {totalPhysicalBottles.toFixed(2)} <span className="text-xs text-slate-400 font-normal">bot.</span>
            </p>
            <span className="text-[10px] text-slate-500">14 referencias</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Stock Teórico Esperado</span>
            <p className="text-xl font-bold font-mono text-slate-300 mt-0.5">
              {totalTheoreticalBottles.toFixed(2)} <span className="text-xs text-slate-400 font-normal">bot.</span>
            </p>
            <span className="text-[10px] text-slate-500">Inicial + Entradas - POS</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Diferencia Neta</span>
            <p className={`text-xl font-bold font-mono mt-0.5 ${totalDiffBottles < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {totalDiffBottles >= 0 ? `+${totalDiffBottles.toFixed(2)}` : totalDiffBottles.toFixed(2)} <span className="text-xs font-normal">bot.</span>
            </p>
            <span className="text-[10px] text-slate-500">
              {totalDiffBottles < 0 ? 'Faltante en barra' : 'Balance favorable'}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-rose-400" />
              <span>Impacto Financiero</span>
            </div>
            <p className={`text-xl font-bold font-mono mt-0.5 ${totalCostImpact < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ${Math.abs(totalCostImpact).toFixed(2)} <span className="text-xs font-normal">USD</span>
            </p>
            <span className="text-[10px] text-slate-500">Valorizado al costo</span>
          </div>
        </div>
      </div>

      {/* Pending Justifications Warning */}
      {pendingJustificationsCount > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Hay <strong className="text-white">{pendingJustificationsCount} discrepancia(s)</strong> pendientes de justificación. Selecciona el motivo en la columna derecha para agilizar el cuadre con el administrador.
            </span>
          </div>
        </div>
      )}

      {/* Discrepancy Reconciliation Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Detalle de Cotejo por Producto
          </h2>
          <span className="text-xs text-slate-400">
            Regla de tolerancia: ±0.15 botellas aceptable
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 font-medium">
              <tr>
                <th className="p-3 pl-4">Producto & Estación</th>
                <th className="p-3 text-center">Fórmula Teórica (Ini + Ent - POS)</th>
                <th className="p-3 text-right">Físico Contado</th>
                <th className="p-3 text-right">Diferencia</th>
                <th className="p-3 text-right">Impacto $</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 pr-4">Justificación de Merma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300 font-mono">
              {rowData.map((row) => (
                <tr key={row.product.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 pl-4 font-sans font-medium text-slate-100">
                    <div>{row.product.name}</div>
                    <span className="text-[10px] text-amber-400 uppercase font-sans">
                      {row.product.location.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                    {row.product.initialStock.toFixed(1)} + {row.product.receipts.toFixed(1)} - {row.product.posSales.toFixed(1)} = <strong className="text-slate-200">{row.theoreticalStock.toFixed(2)}</strong>
                  </td>

                  <td className="p-3 text-right font-bold text-white">
                    {row.physicalStock.toFixed(2)}
                  </td>

                  <td className={`p-3 text-right font-bold ${
                    row.status === 'ok'
                      ? 'text-emerald-400'
                      : row.status === 'warning'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}>
                    {row.difference >= 0 ? `+${row.difference.toFixed(2)}` : row.difference.toFixed(2)}
                  </td>

                  <td className="p-3 text-right text-slate-300">
                    ${Math.abs(row.costImpact).toFixed(2)}
                  </td>

                  <td className="p-3 text-center font-sans">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.status === 'ok'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                        : row.status === 'warning'
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                        : 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                    }`}>
                      {row.status === 'ok' ? 'OK' : row.status === 'warning' ? 'VARIACIÓN' : 'CRÍTICO'}
                    </span>
                  </td>

                  <td className="p-3 pr-4 font-sans">
                    {Math.abs(row.difference) > 0.15 ? (
                      <select
                        value={row.justification}
                        onChange={(e) => onUpdateJustification(row.product.id, e.target.value)}
                        className={`w-full bg-slate-950 border rounded-lg px-2 py-1 text-[11px] focus:outline-none ${
                          row.justification
                            ? 'border-slate-700 text-slate-200'
                            : 'border-amber-600/70 text-amber-400 animate-pulse'
                        }`}
                      >
                        <option value="">Seleccionar motivo...</option>
                        <option value="Rotura accidental de botella">Rotura accidental</option>
                        <option value="Cortesía autorizada gerencia">Cortesía de gerencia</option>
                        <option value="Degustación técnica de bar">Degustación técnica</option>
                        <option value="Sobre-vertido / margen coctel">Margen coctel / over-pour</option>
                      </select>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">Dentro de tolerancia</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={onGoBackToCount}
          className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
        >
          ← Regresar al Conteo Táctil
        </button>

        <button
          type="button"
          onClick={onProceedToActa}
          className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
        >
          <FileCheck className="w-4 h-4" />
          <span>Aprobar Cuadre y Emitir Acta Digital (Pantalla 3) →</span>
        </button>
      </div>
    </div>
  );
};
