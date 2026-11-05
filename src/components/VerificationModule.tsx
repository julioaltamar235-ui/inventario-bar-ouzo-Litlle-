import React, { useState } from 'react';
import { Product, CaptureEntry, ProductConsolidated } from '../types/inventory';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Send,
  Lock,
  Edit3,
  FileCheck,
} from 'lucide-react';

interface VerificationModuleProps {
  products: Product[];
  confirmedCaptures: CaptureEntry[];
  onGoBackToCuadre: () => void;
  onFinalizeAndSend: (verifiedItems: ProductConsolidated[]) => void;
  bartenderName: string;
  shift: string;
}

export const VerificationModule: React.FC<VerificationModuleProps> = ({
  products,
  confirmedCaptures,
  onGoBackToCuadre,
  onFinalizeAndSend,
  bartenderName,
  shift,
}) => {
  // Checkbox approvals
  const [check1, setCheck1] = useState(true);
  const [check2, setCheck2] = useState(true);
  const [check3, setCheck3] = useState(true);
  const [supervisorName, setSupervisorName] = useState('Dimitri Kostas (Gerente de Bar)');
  const [closureNotes, setClosureNotes] = useState('Inventario verificado al cierre de turno. Cero roturas no justificadas.');

  // Authorized adjustments state by product id
  const [adjustments, setAdjustments] = useState<Record<string, { delta: number; reason: string }>>({});
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjDelta, setAdjDelta] = useState<number>(0);
  const [adjReason, setAdjReason] = useState<string>('Ajuste autorizado en supervisión');

  // Compute consolidated data with any authorized adjustment
  const consolidatedList: ProductConsolidated[] = products.map((product) => {
    const pCaptures = confirmedCaptures.filter((c) => c.productId === product.id);
    const rawPhysical = pCaptures.reduce((sum, c) => sum + c.totalCaptured, 0);

    const adj = adjustments[product.id]?.delta || 0;
    const finalPhysical = rawPhysical + adj;

    const theoreticalStock = product.initialStock + product.receipts - product.posSales;
    const difference = finalPhysical - theoreticalStock;
    const costImpact = difference * product.unitCost;

    let status: 'ok' | 'warning' | 'critical' = 'ok';
    if (Math.abs(difference) <= 0.15) {
      status = 'ok';
    } else if (Math.abs(difference) <= 0.35) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      product,
      captures: pCaptures,
      totalPhysical: finalPhysical,
      theoreticalStock,
      difference,
      costImpact,
      status,
      verified: true,
      approvedAdjustment: adj !== 0 ? adj : undefined,
      justification: adjustments[product.id]?.reason || (Math.abs(difference) > 0.15 ? 'Variación de vertido y rotura justificada' : undefined),
    };
  });

  const totalFinalPhysical = consolidatedList.reduce((sum, i) => sum + i.totalPhysical, 0);
  const totalTheoretical = consolidatedList.reduce((sum, i) => sum + i.theoreticalStock, 0);
  const totalCost = consolidatedList.reduce((sum, i) => sum + i.costImpact, 0);

  const canFinalize = check1 && check2 && check3;

  const handleAuthorizedAdjustment = (productId: string, delta: number, reason: string) => {
    setAdjustments((prev) => ({
      ...prev,
      [productId]: { delta, reason },
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-28">
      {/* Module 3 Header */}
      <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
              <span>Módulo 3</span>
              <span className="text-slate-400">·</span>
              <span>Verificación y Cierre Ouzo</span>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-400">Control Pre-Envío</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Verificación y Aprobación de Inventario
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Revisa los totales consolidados, aprueba ajustes autorizados si corresponde y autoriza el envío de los datos a la plantilla de Google Sheets mediante el botón <strong>FINALIZAR Y ENVIAR</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onGoBackToCuadre}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#071322] hover:bg-[#142845] border border-[#1a3356] rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Cuadre</span>
            </button>
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="mt-6 pt-6 border-t border-[#1a3356] grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex items-center gap-3 bg-[#071322] p-3 rounded-xl border border-[#1a3356] cursor-pointer text-xs text-slate-200">
            <input
              type="checkbox"
              checked={check1}
              onChange={(e) => setCheck1(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
            <span>100% de botellas de alta rotación verificadas</span>
          </label>

          <label className="flex items-center gap-3 bg-[#071322] p-3 rounded-xl border border-[#1a3356] cursor-pointer text-xs text-slate-200">
            <input
              type="checkbox"
              checked={check2}
              onChange={(e) => setCheck2(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
            <span>Mermas justificadas y autorizadas</span>
          </label>

          <label className="flex items-center gap-3 bg-[#071322] p-3 rounded-xl border border-[#1a3356] cursor-pointer text-xs text-slate-200">
            <input
              type="checkbox"
              checked={check3}
              onChange={(e) => setCheck3(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
            <span>Stock de apertura listo para el próximo turno</span>
          </label>
        </div>
      </div>

      {/* Review Table */}
      <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#1a3356] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Inventario Consolidado para Envío a Google Sheets</span>
          </h3>
          <span className="text-xs text-slate-400">
            Responsable: {bartenderName} · Supervisor: {supervisorName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#071322] text-slate-400 uppercase tracking-wider text-[10px] border-b border-[#1a3356] font-medium">
              <tr>
                <th className="p-3 pl-4">Código</th>
                <th className="p-3">Producto</th>
                <th className="p-3 text-right">Stock Físico Final</th>
                <th className="p-3 text-right">Stock Teórico POS</th>
                <th className="p-3 text-right">Diferencia</th>
                <th className="p-3 text-right">Valorización ($)</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 pr-4 text-center">Ajuste de Supervisor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#142845] text-slate-300 font-mono">
              {consolidatedList.map((item) => (
                <tr key={item.product.id} className="hover:bg-[#10243e] transition-colors">
                  <td className="p-3 pl-4 text-amber-400 font-bold">{item.product.code}</td>
                  <td className="p-3 font-sans font-medium text-slate-100">
                    {item.product.name}
                    {item.approvedAdjustment && (
                      <span className="ml-2 text-[10px] text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                        Ajuste: {item.approvedAdjustment > 0 ? '+' : ''}{item.approvedAdjustment} bot
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right font-bold text-white text-sm">
                    {item.totalPhysical.toFixed(2)}
                  </td>
                  <td className="p-3 text-right text-slate-400">
                    {item.theoreticalStock.toFixed(2)}
                  </td>
                  <td className={`p-3 text-right font-bold ${
                    item.difference < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {item.difference >= 0 ? `+${item.difference.toFixed(2)}` : item.difference.toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    ${Math.abs(item.costImpact).toFixed(2)}
                  </td>
                  <td className="p-3 text-center font-sans">
                    {item.status === 'ok' ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                        APROBADO
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded">
                        JUSTIFICADO
                      </span>
                    )}
                  </td>
                  <td className="p-3 pr-4 text-center font-sans">
                    {Math.abs(item.difference) > 0.15 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAdjustingProduct(item.product);
                          setAdjDelta(0.1);
                          setAdjReason('Ajuste autorizado en mesa de supervisión');
                        }}
                        className="px-2 py-1 rounded bg-[#071322] hover:bg-[#142845] border border-[#1a3356] text-[11px] text-amber-400 hover:text-amber-300 font-medium transition-colors"
                      >
                        Ajustar
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Closure Authorization Footer */}
      <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Observaciones de Cierre y Autorización de Envío:
          </label>
          <input
            type="text"
            value={closureNotes}
            onChange={(e) => setClosureNotes(e.target.value)}
            className="w-full bg-[#071322] border border-[#1a3356] rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-[#1a3356]">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Al presionar este botón, el cuadre queda cerrado y se inicia la transferencia a Google Sheets.
            </span>
          </div>

          {/* CRITICAL BUTTON: FINALIZAR Y ENVIAR */}
          <button
            type="button"
            onClick={() => onFinalizeAndSend(consolidatedList)}
            disabled={!canFinalize}
            className="w-full sm:w-auto h-14 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all"
          >
            <Send className="w-5 h-5" />
            <span>FINALIZAR Y ENVIAR A GOOGLE SHEETS</span>
          </button>
        </div>
      </div>

      {/* Authorized Adjustment Modal (In-App Dialog) */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider block">
                Módulo de Supervisión Ouzo
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                Ajuste Autorizado: {adjustingProduct.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingresa la variación autorizada en botellas (+ para sumar, - para restar).
              </p>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Variación en botellas (+/-):
              </label>
              <input
                type="number"
                step="0.05"
                value={adjDelta}
                onChange={(e) => setAdjDelta(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#071322] border border-[#1a3356] rounded-xl px-3 py-2 text-base font-bold font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Motivo / Justificación del Ajuste:
              </label>
              <select
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className="w-full bg-[#071322] border border-[#1a3356] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="Ajuste autorizado en mesa de supervisión">Ajuste de supervisión general</option>
                <option value="Botella recuperada de vitrina de cortesía">Botella recuperada de vitrina</option>
                <option value="Compensación por error en comanda POS">Error de comanda en sistema POS</option>
                <option value="Merma técnica por rotura de botella">Merma técnica por rotura</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-[#071322] rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAuthorizedAdjustment(adjustingProduct.id, adjDelta, adjReason);
                  setAdjustingProduct(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-md shadow-amber-400/20"
              >
                Guardar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
