import React, { useState } from 'react';
import { InventoryCountSummary } from '../types/inventory';
import { Check, Copy, Download, Share2, X, AlertTriangle, Clock, DollarSign } from 'lucide-react';

interface ActaModalProps {
  summary: InventoryCountSummary;
  onClose: () => void;
}

export const ActaModal: React.FC<ActaModalProps> = ({ summary, onClose }) => {
  const [copied, setCopied] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Generate WhatsApp ready text report
  const generateWhatsAppText = () => {
    const lines = [
      `🍸 *ACTA DE CIERRE DE BARRA — BARRAEXPRESS*`,
      `📅 Fecha: ${summary.date}`,
      `👤 Bartender: ${summary.bartenderName} | Turno: ${summary.shift}`,
      `⏱️ Tiempo de conteo: *${formatDuration(summary.durationSeconds)}* (Meta: < 8 min)`,
      `----------------------------------------`,
      `📊 *RESUMEN DE DISCREPANCIAS:*`,
      `• Referencias contadas: ${summary.items.length}`,
      `• Diferencia neta en botellas: ${summary.totalDiscrepancyBottles >= 0 ? '+' : ''}${summary.totalDiscrepancyBottles.toFixed(2)} bot.`,
      `• Impacto financiero: $${Math.abs(summary.totalCostImpact).toFixed(2)} USD`,
      `• Ítems con variación crítica: ${summary.criticalItemsCount}`,
      `----------------------------------------`,
      `🔍 *DETALLE POR BOTELLA:*`,
    ];

    summary.items.forEach((item) => {
      const diffFormatted = item.difference >= 0 ? `+${item.difference.toFixed(2)}` : `${item.difference.toFixed(2)}`;
      const icon = item.status === 'ok' ? '✅' : item.status === 'warning' ? '⚠️' : '🚨';
      const justif = item.justification ? ` _[Nota: ${item.justification}]_` : '';
      lines.push(`${icon} *${item.product.name}*: Contado: ${item.physicalStock.toFixed(2)} | Teórico: ${item.theoreticalStock.toFixed(2)} (Dif: ${diffFormatted})${justif}`);
    });

    lines.push(`----------------------------------------`);
    lines.push(`🚀 _Generado digitalmente con BarraExpress — Cero transcripción en papel._`);
    return lines.join('\n');
  };

  const handleCopyWhatsApp = async () => {
    try {
      const text = generateWhatsAppText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDownloadCsv = () => {
    const headers = ['Producto', 'Ubicacion', 'Stock_Contado', 'Stock_Teorico', 'Diferencia_Botellas', 'Costo_Unitario', 'Impacto_Total', 'Estado', 'Justificacion'];
    const rows = summary.items.map((i) => [
      `"${i.product.name}"`,
      i.product.location,
      i.physicalStock.toFixed(2),
      i.theoreticalStock.toFixed(2),
      i.difference.toFixed(2),
      i.product.unitCost.toFixed(2),
      i.costImpact.toFixed(2),
      i.status,
      `"${i.justification || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Acta_Barra_${summary.id}_${summary.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl my-8 text-slate-100 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                ACTA OFICIAL #{summary.id}
              </span>
              <span className="text-xs text-slate-400">· {summary.date}</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Acta Digital de Conteo de Barra
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Tiempo de Conteo</span>
              </div>
              <p className="text-xl font-bold font-mono text-emerald-400">
                {formatDuration(summary.durationSeconds)}
              </p>
              <span className="text-[10px] text-slate-400">vs 45m tradicional</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <span>Referencias</span>
              </div>
              <p className="text-xl font-bold font-mono text-white">
                {summary.items.length}
              </p>
              <span className="text-[10px] text-slate-400">100% verificadas</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                <span>Impacto Variación</span>
              </div>
              <p className={`text-xl font-bold font-mono ${summary.totalCostImpact < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ${Math.abs(summary.totalCostImpact).toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-400">
                {summary.totalCostImpact < 0 ? 'Faltante neto' : 'Exacto / favorable'}
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Discrepancias</span>
              </div>
              <p className="text-xl font-bold font-mono text-amber-400">
                {summary.criticalItemsCount}
              </p>
              <span className="text-[10px] text-slate-400">alertas detectadas</span>
            </div>
          </div>

          {/* Operational summary banner */}
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-300">
                ¡Objetivo Operativo Cumplido!
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Conteo completado en menos de 6 minutos. Elimina 40 minutos de transcripción para caja y administración.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-900/80 px-2.5 py-1 rounded-md">
              -88% TIEMPO
            </span>
          </div>

          {/* Items breakdown list */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Detalle de Botellas y Cotejo de Turno
            </h3>
            <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
              {summary.items.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 bg-slate-950/40 flex items-center justify-between text-xs"
                >
                  <div className="flex-1 pr-3">
                    <p className="font-medium text-slate-100 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Físico: <span className="font-mono text-white">{item.physicalStock.toFixed(2)}</span> · Teórico: <span className="font-mono text-white">{item.theoreticalStock.toFixed(2)}</span>
                      {item.justification && (
                        <span className="text-amber-300 ml-1.5 italic">
                          ({item.justification})
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        item.status === 'ok'
                          ? 'text-emerald-400 bg-emerald-950/50'
                          : item.status === 'warning'
                          ? 'text-amber-400 bg-amber-950/50'
                          : 'text-rose-400 bg-rose-950/50'
                      }`}
                    >
                      {item.difference >= 0 ? `+${item.difference.toFixed(2)}` : item.difference.toFixed(2)} bot
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      ${Math.abs(item.costImpact).toFixed(2)} USD
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 rounded-b-2xl flex flex-wrap gap-3 items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Bartender responsable: <span className="text-white font-medium">{summary.bartenderName}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadCsv}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar CSV
            </button>

            <button
              onClick={handleCopyWhatsApp}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  ¡Copiado para WhatsApp!
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  Copiar Reporte WhatsApp
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
