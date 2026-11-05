import React, { useState } from 'react';
import { Product, BottleCountItem, InventoryCountSummary } from '../types/inventory';
import {
  Check,
  Share2,
  Download,
  Clock,
  DollarSign,
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  FileText,
} from 'lucide-react';

interface ActaViewProps {
  products: Product[];
  counts: Record<string, BottleCountItem>;
  timerSeconds: number;
  bartenderName: string;
  shift: string;
  onGoBackToConciliacion: () => void;
  onStartNewCount: () => void;
}

export const ActaView: React.FC<ActaViewProps> = ({
  products,
  counts,
  timerSeconds,
  bartenderName,
  shift,
  onGoBackToConciliacion,
  onStartNewCount,
}) => {
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState('Sin incidencias críticas en el turno. Barra limpia y estaciones desinfectadas.');

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const currentDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const folio = 'ACT-2026-' + (timerSeconds % 900 + 100).toString();

  // Calculations
  let totalPhysical = 0;
  let totalTheoretical = 0;
  let totalCostImpact = 0;
  let criticalCount = 0;

  const items = products.map((product) => {
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

    totalPhysical += physicalStock;
    totalTheoretical += theoreticalStock;
    totalCostImpact += costImpact;

    return {
      product,
      physicalStock,
      theoreticalStock,
      difference,
      costImpact,
      status,
      justification: count.justification || '',
    };
  });

  const totalDifference = totalPhysical - totalTheoretical;

  // Generate WhatsApp formatted text
  const generateWhatsAppMessage = () => {
    const lines = [
      `🍸 *ACTA DE CIERRE DE BARRA — BARRAEXPRESS*`,
      `📄 Folio: ${folio}`,
      `📅 Fecha: ${currentDate}`,
      `👤 Bartender: *${bartenderName}* | Turno: *${shift}*`,
      `⏱️ Tiempo de conteo: *${formatDuration(timerSeconds)}* (Estándar manual: 45 min)`,
      `----------------------------------------`,
      `📊 *RESUMEN OPERATIVO:*`,
      `• Referencias contadas: ${items.length} productos`,
      `• Stock físico total: ${totalPhysical.toFixed(2)} bot.`,
      `• Stock teórico esperado: ${totalTheoretical.toFixed(2)} bot.`,
      `• Diferencia neta: ${totalDifference >= 0 ? '+' : ''}${totalDifference.toFixed(2)} botellas`,
      `• Impacto financiero: $${Math.abs(totalCostImpact).toFixed(2)} USD`,
      `• Alertas por merma: ${criticalCount}`,
      `----------------------------------------`,
      `🔍 *DETALLE POR BOTELLA:*`,
    ];

    items.forEach((item) => {
      const icon = item.status === 'ok' ? '✅' : item.status === 'warning' ? '⚠️' : '🚨';
      const diffFormatted = item.difference >= 0 ? `+${item.difference.toFixed(2)}` : `${item.difference.toFixed(2)}`;
      const noteStr = item.justification ? ` _[Justif: ${item.justification}]_` : '';
      lines.push(`${icon} *${item.product.name}*: Contado ${item.physicalStock.toFixed(2)} | Teórico ${item.theoreticalStock.toFixed(2)} (Dif: ${diffFormatted})${noteStr}`);
    });

    if (notes) {
      lines.push(`----------------------------------------`);
      lines.push(`📝 *Observaciones de entrega:* ${notes}`);
    }

    lines.push(`----------------------------------------`);
    lines.push(`🚀 _Generado con BarraExpress Mobile — Cero transcripción en papel._`);
    return lines.join('\n');
  };

  const handleCopyWhatsApp = async () => {
    try {
      const text = generateWhatsAppMessage();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDownloadCsv = () => {
    const headers = [
      'Folio',
      'Fecha',
      'Bartender',
      'Turno',
      'Producto',
      'Ubicacion',
      'Stock_Fisico',
      'Stock_Teorico',
      'Diferencia',
      'Costo_Unitario',
      'Impacto_USD',
      'Estado',
      'Justificacion',
    ];
    const rows = items.map((i) => [
      `"${folio}"`,
      `"${currentDate}"`,
      `"${bartenderName}"`,
      `"${shift}"`,
      `"${i.product.name}"`,
      i.product.location,
      i.physicalStock.toFixed(2),
      i.theoreticalStock.toFixed(2),
      i.difference.toFixed(2),
      i.product.unitCost.toFixed(2),
      i.costImpact.toFixed(2),
      i.status,
      `"${i.justification}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${folio}_Cierre_Barra.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 pb-28">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">
              <span>Pantalla 3 de 4</span>
              <span className="text-slate-500">·</span>
              <span>Resultado Observable Oficial</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Acta Digital de Cierre de Barra
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
              Documento digital consolidado listo para enviar por WhatsApp al grupo de administración o descargar para contabilidad. Cero papel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar CSV
            </button>

            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="px-4 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-400/25 active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  ¡Copiado para WhatsApp!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Copiar Reporte WhatsApp
                </>
              )}
            </button>
          </div>
        </div>

        {/* Efficiency banner */}
        <div className="mt-6 p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-300">
                ¡Conteo ejecutado en {formatDuration(timerSeconds)}!
              </p>
              <p className="text-xs text-slate-300">
                Ahorraste <strong>40 minutos</strong> de conteo y transcripción en este turno frente al método tradicional en papel.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-900/80 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            -89% TIEMPO
          </span>
        </div>
      </div>

      {/* Official Certificate Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
        {/* Certificate Header */}
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono text-amber-400 uppercase tracking-widest font-semibold">
              DOCUMENTO DE AUDITORÍA GASTRONÓMICA
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Acta de Entrega de Turno — {folio}
            </h2>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-400">
            <div>Fecha: <span className="text-slate-200 font-medium">{currentDate}</span></div>
            <div>Responsable: <span className="text-slate-200 font-medium">{bartenderName}</span></div>
          </div>
        </div>

        {/* 4 Pillars Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 block uppercase">Tiempo Empleado</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {formatDuration(timerSeconds)}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 block uppercase">Referencias</span>
            <span className="text-xl font-bold font-mono text-white">
              {items.length} botellas
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 block uppercase">Diferencia Neta</span>
            <span className={`text-xl font-bold font-mono ${totalDifference < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {totalDifference >= 0 ? `+${totalDifference.toFixed(2)}` : totalDifference.toFixed(2)} bot
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] text-slate-400 block uppercase">Impacto Costo</span>
            <span className={`text-xl font-bold font-mono ${totalCostImpact < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ${Math.abs(totalCostImpact).toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Detailed Items List */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Detalle de Inventario por Referencia
          </h3>
          <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="p-3 bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex-1">
                  <div className="font-medium text-slate-100 flex items-center gap-2">
                    <span>{item.product.name}</span>
                    <span className="text-[10px] text-amber-400 font-mono">({item.product.location})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Físico: <span className="font-mono text-slate-200">{item.physicalStock.toFixed(2)}</span> · Teórico: <span className="font-mono text-slate-200">{item.theoreticalStock.toFixed(2)}</span>
                    {item.justification && (
                      <span className="text-amber-300 ml-2 italic">
                        — Justificación: {item.justification}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      item.status === 'ok'
                        ? 'text-emerald-400 bg-emerald-950/60'
                        : item.status === 'warning'
                        ? 'text-amber-400 bg-amber-950/60'
                        : 'text-rose-400 bg-rose-950/60'
                    }`}
                  >
                    {item.difference >= 0 ? `+${item.difference.toFixed(2)}` : item.difference.toFixed(2)} bot.
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    ${Math.abs(item.costImpact).toFixed(2)} USD
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final Observations Field */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            Observaciones Adicionales del Bartender al Administrador
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={onGoBackToConciliacion}
          className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a Conciliación (Pantalla 2)</span>
        </button>

        <button
          type="button"
          onClick={onStartNewCount}
          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Iniciar Nuevo Turno / Conteo</span>
        </button>
      </div>
    </div>
  );
};
