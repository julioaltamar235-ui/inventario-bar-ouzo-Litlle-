import React, { useState } from 'react';
import { Product, CaptureEntry, StationLocation, InventoryFrequency } from '../types/inventory';
import { BottleVisualizer } from './BottleVisualizer';
import {
  Wine,
  Check,
  Plus,
  Minus,
  Trash2,
  Clock,
  Layers,
  ArrowRight,
  Search,
  Sparkles,
  Zap,
  Calendar,
  BarChart3,
  ListOrdered,
  Eye,
  AlertTriangle,
  PackageCheck,
  Copy,
  CheckCheck,
} from 'lucide-react';

interface CaptureModuleProps {
  products: Product[];
  confirmedCaptures: CaptureEntry[];
  onConfirmCapture: (capture: Omit<CaptureEntry, 'id' | 'timestamp'>) => void;
  onDeleteCapture: (captureId: string) => void;
  onProceedToCuadre: () => void;
  timerSeconds: number;
  bartenderName: string;
  station: StationLocation;
  setStation: (station: StationLocation) => void;
  frequency?: InventoryFrequency;
  setFrequency?: (freq: InventoryFrequency) => void;
}

export const CaptureModule: React.FC<CaptureModuleProps> = ({
  products,
  confirmedCaptures,
  onConfirmCapture,
  onDeleteCapture,
  onProceedToCuadre,
  timerSeconds,
  bartenderName,
  station,
  setStation,
  frequency = 'diario',
  setFrequency,
}) => {
  // Inventory frequency local fallback if not lifted
  const [internalFreq, setInternalFreq] = useState<InventoryFrequency>(frequency);
  const currentFreq = setFrequency ? frequency : internalFreq;
  const handleFreqChange = (f: InventoryFrequency) => {
    if (setFrequency) setFrequency(f);
    else setInternalFreq(f);
  };

  // View Mode: 'lista' (Agile Batch List) or 'foco' (Single Product Bottle Visualizer)
  const [viewMode, setViewMode] = useState<'lista' | 'foco'>('lista');

  // Selected product for 'foco' mode
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [fullBottles, setFullBottles] = useState<number>(1);
  const [openBottleLevel, setOpenBottleLevel] = useState<number>(0.0);
  const [note, setNote] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [confirmSuccessMsg, setConfirmSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Quick List state: per-product draft counts { [productId]: { full: number, open: number, changed: boolean } }
  const [listDrafts, setListDrafts] = useState<
    Record<string, { full: number; open: number; changed: boolean }>
  >(() => {
    const initial: Record<string, { full: number; open: number; changed: boolean }> = {};
    products.forEach((p) => {
      initial[p.id] = { full: 0, open: 0, changed: false };
    });
    return initial;
  });

  // Track copied requisition state
  const [copiedRequisition, setCopiedRequisition] = useState(false);
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Current calculation for active entry in single focus mode
  const activeTotal = fullBottles + openBottleLevel;

  // Filter products by category & search
  const filteredProducts = products.filter((p) => {
    // Frequency filtering relevance
    let matchesFreq = true;
    if (currentFreq === 'diario') {
      // Prioritize Speed rail, high-turnover destilados & aperitivos
      matchesFreq = p.location === 'speed_rail' || p.category === 'destilados' || p.category === 'aperitivos';
    } else if (currentFreq === 'semanal') {
      // Cavas, botellero, neveras de cerveza
      matchesFreq = p.location === 'cava_vinos' || p.location === 'nevera_cervezas' || p.location === 'botellero_principal';
    }
    // 'mensual' includes all products

    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFreq && matchesCat && matchesSearch;
  });

  // Calculate accumulated total for selected product from past captures
  const existingProductCaptures = confirmedCaptures.filter(
    (c) => c.productId === selectedProduct?.id
  );
  const existingProductTotal = existingProductCaptures.reduce(
    (sum, c) => sum + c.totalCaptured,
    0
  );

  // Helper for single product confirm (Modo Foco)
  const handleConfirmSingle = () => {
    if (!selectedProduct) return;

    if (activeTotal <= 0) {
      setValidationError("⚠️ Debes registrar al menos 1 botella o fracción mayor a 0 para confirmar.");
      setTimeout(() => setValidationError(null), 3500);
      return;
    }

    if (isSubmitting) return;
    setValidationError(null);
    setIsSubmitting(true);

    onConfirmCapture({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productCode: selectedProduct.code,
      fullBottles,
      openBottleLevel,
      totalCaptured: activeTotal,
      station,
      bartender: bartenderName,
      note: note.trim() || undefined,
    });

    const msg = `¡Captura confirmada! +${activeTotal.toFixed(2)} bot. registradas de ${selectedProduct.name}.`;
    setConfirmSuccessMsg(msg);

    // Reset entry inputs for next bottle
    setFullBottles(1);
    setOpenBottleLevel(0.0);
    setNote('');

    setTimeout(() => {
      setConfirmSuccessMsg(null);
      setIsSubmitting(false);
    }, 2500);
  };

  // Quick List Helpers
  const updateListDraft = (
    productId: string,
    updater: (prev: { full: number; open: number; changed: boolean }) => {
      full: number;
      open: number;
      changed: boolean;
    }
  ) => {
    setListDrafts((prev) => {
      const current = prev[productId] || { full: 0, open: 0, changed: false };
      return {
        ...prev,
        [productId]: updater(current),
      };
    });
  };

  // Confirm single row in List Mode
  const handleConfirmRow = (product: Product) => {
    const draft = listDrafts[product.id] || { full: 0, open: 0 };
    const total = draft.full + draft.open;

    if (total <= 0) {
      setValidationError(`⚠️ Asigna botellas para ${product.name} antes de confirmar.`);
      setTimeout(() => setValidationError(null), 3000);
      return;
    }

    onConfirmCapture({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      fullBottles: draft.full,
      openBottleLevel: draft.open,
      totalCaptured: total,
      station,
      bartender: bartenderName,
      note: `Conteo rápido lista (${currentFreq})`,
    });

    // Reset draft for this row and mark unedited
    setListDrafts((prev) => ({
      ...prev,
      [product.id]: { full: 0, open: 0, changed: false },
    }));

    setConfirmSuccessMsg(`✅ +${total.toFixed(2)} bot. registradas para ${product.name}`);
    setTimeout(() => setConfirmSuccessMsg(null), 2500);
  };

  // Batch confirm all changed items in List Mode
  const handleBatchConfirmList = () => {
    const toConfirm = products.filter((p) => {
      const d = listDrafts[p.id];
      return d && d.changed && (d.full > 0 || d.open > 0);
    });

    if (toConfirm.length === 0) {
      setValidationError("⚠️ No hay productos con cantidades modificadas pendientes de guardar.");
      setTimeout(() => setValidationError(null), 3000);
      return;
    }

    toConfirm.forEach((prod) => {
      const d = listDrafts[prod.id];
      const tot = d.full + d.open;
      onConfirmCapture({
        productId: prod.id,
        productName: prod.name,
        productCode: prod.code,
        fullBottles: d.full,
        openBottleLevel: d.open,
        totalCaptured: tot,
        station,
        bartender: bartenderName,
        note: `Lote Rápido ${currentFreq.toUpperCase()}`,
      });
    });

    // Clear drafts
    const clean: Record<string, { full: number; open: number; changed: boolean }> = {};
    products.forEach((p) => {
      clean[p.id] = { full: 0, open: 0, changed: false };
    });
    setListDrafts(clean);

    setConfirmSuccessMsg(`🎉 ¡Lote registrado con éxito! ${toConfirm.length} referencias guardadas.`);
    setTimeout(() => setConfirmSuccessMsg(null), 3500);
  };

  // Whisky 5+3+2 Example
  const handleLoadWhiskyExample = () => {
    const whisky = products.find((p) => p.code === 'OUZ-WHI-01');
    if (!whisky) return;

    onConfirmCapture({
      productId: whisky.id,
      productName: whisky.name,
      productCode: whisky.code,
      fullBottles: 5,
      openBottleLevel: 0,
      totalCaptured: 5,
      station: 'speed_rail',
      bartender: bartenderName,
      note: 'Conteo Speed Rail estación 1',
    });

    onConfirmCapture({
      productId: whisky.id,
      productName: whisky.name,
      productCode: whisky.code,
      fullBottles: 3,
      openBottleLevel: 0,
      totalCaptured: 3,
      station: 'reserva_bodega',
      bartender: bartenderName,
      note: 'Conteo Nevera de reserva',
    });

    onConfirmCapture({
      productId: whisky.id,
      productName: whisky.name,
      productCode: whisky.code,
      fullBottles: 2,
      openBottleLevel: 0,
      totalCaptured: 2,
      station: 'botellero_principal',
      bartender: bartenderName,
      note: 'Conteo Botellero exhibición',
    });

    setConfirmSuccessMsg('¡Ejemplo cargado: Whisky Johnnie Walker (5 + 3 + 2 = 10 unidades registradas)!');
    setTimeout(() => setConfirmSuccessMsg(null), 3000);
  };

  // Automatic Requisition Calculation (Priority Automation: Par-Level Restock)
  const requisitionItems = products
    .map((p) => {
      const pCaptures = confirmedCaptures.filter((c) => c.productId === p.id);
      const currentPhysical = pCaptures.reduce((sum, c) => sum + c.totalCaptured, 0);
      const needed = Math.max(0, p.parLevel - currentPhysical);
      return {
        product: p,
        currentPhysical,
        parLevel: p.parLevel,
        needed,
        cost: needed * p.unitCost,
      };
    })
    .filter((item) => item.needed > 0);

  const totalRequisitionBottles = requisitionItems.reduce((acc, i) => acc + i.needed, 0);

  const handleCopyRequisition = () => {
    const text = [
      `📋 *REQUISICIÓN AUTOMÁTICA A BODEGA — OUZO BAR*`,
      `📅 Fecha: ${new Date().toLocaleDateString('es-ES')} | Turno: Cierre`,
      `👤 Responsable: ${bartenderName}`,
      `📦 Solicitud generada automáticamente por Par-Level:`,
      `---------------------------------------`,
      ...requisitionItems.map(
        (i) =>
          `• ${i.product.name} (${i.product.code}): PEDIR ${i.needed.toFixed(1)} bot. [Stock actual: ${i.currentPhysical.toFixed(1)} | Par: ${i.parLevel}]`
      ),
      `---------------------------------------`,
      `Total a reponer: ${totalRequisitionBottles.toFixed(1)} botellas`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedRequisition(true);
    setTimeout(() => setCopiedRequisition(false), 3000);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-28">
      {/* Top Banner with Ouzo Branding & Frequency Selection */}
      <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
              <span>Módulo 1</span>
              <span className="text-slate-400">·</span>
              <span>Captura de Inventario</span>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-400">Nube Ouzo Sincronizada</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Control Táctil de Inventarios en Barra</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Registra existencias con el <strong>Modo Lista Rápida</strong> para conteos ágiles en cascada o cambia al <strong>Modo Foco</strong> con medidor visual de botella.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Live timer badge */}
            <div className="bg-[#071322] border border-[#1b365d] rounded-xl px-3 py-2 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                  Tiempo en Barra
                </span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {formatTimer(timerSeconds)}
                </span>
              </div>
            </div>

            {/* Requisition Button (Priority Automation) */}
            <button
              type="button"
              onClick={() => setShowRequisitionModal(true)}
              className="px-3 py-2 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/40 rounded-xl transition-colors flex items-center gap-1.5"
              title="Ver reposición automática calculada por Par-Level"
            >
              <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Pedido Bodega ({requisitionItems.length})
              </span>
            </button>

            {/* Example 5 + 3 + 2 Shortcut */}
            <button
              type="button"
              onClick={handleLoadWhiskyExample}
              className="px-3 py-2 text-xs font-semibold text-sky-300 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-600/40 rounded-xl transition-colors flex items-center gap-1.5"
              title="Cargar ejemplo específico del usuario: Whisky A (5 + 3 + 2 = 10 unidades)"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Ejemplo 5+3+2</span>
            </button>

            {/* Quick jump to Cuadre */}
            <button
              type="button"
              onClick={onProceedToCuadre}
              className="px-4 py-2 text-xs font-bold text-[#07111e] bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shadow-amber-400/20 active:scale-95 flex items-center gap-1.5"
            >
              <span>Ir al Cuadre ({confirmedCaptures.length} reg.)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Frequency & Mode Selector Row */}
        <div className="mt-4 pt-4 border-t border-[#1a3356] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          {/* Inventory Frequency Tabs: Diario / Semanal / Mensual */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <span>Tipo de Inventario:</span>
            </span>
            <div className="flex items-center bg-[#071322] p-1 rounded-xl border border-[#1a3356]">
              <button
                type="button"
                onClick={() => handleFreqChange('diario')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  currentFreq === 'diario'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Diario (Cierre Turno)</span>
              </button>
              <button
                type="button"
                onClick={() => handleFreqChange('semanal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  currentFreq === 'semanal'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Semanal (Cavas)</span>
              </button>
              <button
                type="button"
                onClick={() => handleFreqChange('mensual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  currentFreq === 'mensual'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Mensual (Auditoría)</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 hidden xl:inline-block italic ml-1">
              {currentFreq === 'diario' && '⚡ 80/20: Speed Rail y alta rotación'}
              {currentFreq === 'semanal' && '📅 Cavas de vinos y botelleros'}
              {currentFreq === 'mensual' && '🏛️ Auditoría contable exhaustiva'}
            </span>
          </div>

          {/* View Mode Toggle: Lista Rápida vs Foco Individual */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Modo de Captura:</span>
            <div className="flex items-center bg-[#071322] p-1 rounded-xl border border-[#1a3356]">
              <button
                type="button"
                onClick={() => setViewMode('lista')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === 'lista'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Lista Rápida (Revisión Ágil)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('foco')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === 'foco'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Foco Individual (Táctil)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Station Selector Bar */}
        <div className="mt-3 pt-3 border-t border-[#1a3356]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Estación de Conteo:</span>
            <div className="flex items-center gap-1 bg-[#071322] p-1 rounded-lg border border-[#1a3356]">
              {[
                { id: 'speed_rail', label: 'Speed Rail' },
                { id: 'botellero_principal', label: 'Botellero' },
                { id: 'cava_vinos', label: 'Cava Vinos' },
                { id: 'nevera_cervezas', label: 'Nevera' },
                { id: 'reserva_bodega', label: 'Bodega Barra' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStation(st.id as StationLocation)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    station === st.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-slate-400">
            Bartender responsable: <strong className="text-white">{bartenderName}</strong>
          </div>
        </div>
      </div>

      {/* Confirmation Toast Alert */}
      {confirmSuccessMsg && (
        <div className="bg-emerald-950/80 border border-emerald-600 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-200 animate-in fade-in slide-in-from-top duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{confirmSuccessMsg}</span>
        </div>
      )}

      {/* Validation Alert */}
      {validationError && (
        <div className="bg-rose-950/80 border border-rose-600 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-rose-200 animate-in fade-in slide-in-from-top duration-200">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-medium">{validationError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 1: MODO LISTA RÁPIDA (CONTEO ÁGIL Y AMENO DE MÚLTIPLES PRODUCTOS) */}
      {/* ========================================================================= */}
      {viewMode === 'lista' && (
        <div className="space-y-4">
          {/* Controls Bar for List View */}
          <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar referencia o licor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#071322] border border-[#1a3356] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'destilados', label: 'Destilados' },
                  { id: 'aperitivos', label: 'Aperitivos' },
                  { id: 'vinos_cavas', label: 'Vinos' },
                  { id: 'cervezas_mixers', label: 'Cervezas' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      activeCategory === cat.id
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-[#071322] hover:bg-[#142845] text-slate-300 border border-[#1a3356]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Batch Confirm Action */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBatchConfirmList}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center gap-1.5"
                title="Registrar todos los productos que tienen cantidades modificadas en la lista"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Confirmar Todo el Lote Editado</span>
              </button>
            </div>
          </div>

          {/* List of Products (Fast multi-counting cards) */}
          <div className="space-y-3">
            {filteredProducts.map((p) => {
              const draft = listDrafts[p.id] || { full: 0, open: 0, changed: false };
              const draftTotal = draft.full + draft.open;
              const pCaptures = confirmedCaptures.filter((c) => c.productId === p.id);
              const pTotalCaptured = pCaptures.reduce((sum, c) => sum + c.totalCaptured, 0);
              const hasPastCaptures = pCaptures.length > 0;
              const isBelowPar = pTotalCaptured < p.parLevel;
              const reorderQty = Math.max(0, p.parLevel - pTotalCaptured);

              return (
                <div
                  key={p.id}
                  className={`bg-[#0b1b32] border rounded-2xl p-4 transition-all shadow-sm ${
                    draft.changed
                      ? 'border-amber-500/60 ring-1 ring-amber-500/40 bg-[#0e213d]'
                      : hasPastCaptures
                      ? 'border-emerald-600/40'
                      : 'border-[#1a3356]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Product Information & Status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                          {p.code}
                        </span>
                        <h3 className="text-sm font-bold text-white truncate">{p.name}</h3>
                        <span className="text-[10px] text-slate-400 bg-[#071322] px-2 py-0.5 rounded border border-[#1a3356] uppercase">
                          {p.category.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        <span>Marca: <strong className="text-slate-300">{p.brand}</strong></span>
                        <span>·</span>
                        <span>Costo: <strong className="text-slate-300">${p.unitCost.toFixed(2)} USD</strong></span>
                        <span>·</span>
                        <span>Estación: <strong className="text-slate-300">{p.location}</strong></span>
                        <span>·</span>
                        <span className="font-mono text-slate-300">Par-Level: <strong className="text-amber-300">{p.parLevel} bot.</strong></span>
                      </div>

                      {/* Par-Level Automation Alert & Past Captures Pill */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                        {hasPastCaptures ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-lg">
                            <Check className="w-3 h-3 text-emerald-400" />
                            Registrado en sesión: <strong>+{pTotalCaptured.toFixed(2)} bot.</strong> ({pCaptures.length} conteos)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-[#071322] border border-[#1a3356] px-2 py-0.5 rounded-lg italic">
                            Pendiente de conteo en este turno
                          </span>
                        )}

                        {isBelowPar && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded-lg" title="Automatización de reorden Ouzo: Se sugiere pedido a bodega">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            Sugerir a bodega: +{reorderQty.toFixed(1)} bot.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Inline Stepper & Fraction Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                      {/* Stepper Cerradas */}
                      <div className="bg-[#071322] border border-[#1a3356] rounded-xl p-1.5 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase px-1">
                          Cerradas:
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateListDraft(p.id, (prev) => ({
                              ...prev,
                              full: Math.max(0, prev.full - 1),
                              changed: true,
                            }))
                          }
                          className="w-8 h-8 rounded-lg bg-[#142845] hover:bg-[#1c355b] text-white font-bold flex items-center justify-center active:scale-95 transition-all text-xs"
                          title="Restar 1 botella cerrada"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-white text-sm">
                          {draft.full}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateListDraft(p.id, (prev) => ({
                              ...prev,
                              full: prev.full + 1,
                              changed: true,
                            }))
                          }
                          className="w-8 h-8 rounded-lg bg-[#142845] hover:bg-[#1c355b] text-white font-bold flex items-center justify-center active:scale-95 transition-all text-xs"
                          title="Sumar 1 botella cerrada"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateListDraft(p.id, (prev) => ({
                              ...prev,
                              full: prev.full + 5,
                              changed: true,
                            }))
                          }
                          className="px-2 h-8 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-xs font-bold transition-all"
                          title="Sumar lote de 5 botellas"
                        >
                          +5
                        </button>
                      </div>

                      {/* Fraction Quick Chips for Open Bottle */}
                      <div className="bg-[#071322] border border-[#1a3356] rounded-xl p-1.5 flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase px-1">
                          Abierta:
                        </span>
                        {[
                          { val: 0.0, label: '0' },
                          { val: 0.25, label: '¼' },
                          { val: 0.5, label: '½' },
                          { val: 0.75, label: '¾' },
                        ].map((frac) => (
                          <button
                            key={frac.label}
                            type="button"
                            onClick={() =>
                              updateListDraft(p.id, (prev) => ({
                                ...prev,
                                open: frac.val,
                                changed: true,
                              }))
                            }
                            className={`px-2 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                              draft.open === frac.val
                                ? 'bg-amber-500 text-slate-950 shadow-sm'
                                : 'bg-[#142845] hover:bg-[#1d385f] text-slate-200'
                            }`}
                          >
                            {frac.label}
                          </button>
                        ))}
                      </div>

                      {/* Total to confirm & 1-Tap Save Button */}
                      <div className="flex items-center gap-2">
                        <div className="text-right min-w-[65px]">
                          <span className="text-[10px] text-slate-400 block uppercase">Subtotal</span>
                          <span className="font-mono font-bold text-amber-400 text-sm">
                            {draftTotal.toFixed(2)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmRow(p)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                            draftTotal > 0
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                          title="Registrar conteo de este producto"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Guardar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: MODO FOCO INDIVIDUAL (VISUALIZADOR TÁCTIL DE BOTELLA 1 A 1)      */}
      {/* ========================================================================= */}
      {viewMode === 'foco' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (6 cols): Active Capture Form */}
          <div className="lg:col-span-6 bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-5 shadow-sm space-y-5">
            <div>
              <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider block">
                Formulario de Captura Individual
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {selectedProduct ? selectedProduct.name : 'Selecciona un producto'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                <span className="text-amber-400">{selectedProduct.code}</span>
                <span>·</span>
                <span>{selectedProduct.brand}</span>
                <span>·</span>
                <span>${selectedProduct.unitCost.toFixed(2)} USD</span>
                <span>·</span>
                <span className="text-amber-300">Par-Level: {selectedProduct.parLevel} bot.</span>
              </div>
            </div>

            {/* Quantities Entry (Closed + Fraction) */}
            <div className="space-y-4 pt-3 border-t border-[#1a3356]">
              {/* Botellas Cerradas */}
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">
                  Botellas Completas Cerradas (Precintadas)
                </label>
                <div className="flex items-center bg-[#071322] border border-[#1a3356] rounded-xl p-1.5">
                  <button
                    type="button"
                    onClick={() => setFullBottles(Math.max(0, fullBottles - 1))}
                    className="w-12 h-12 rounded-lg bg-[#142845] hover:bg-[#1c355b] text-white font-bold text-lg flex items-center justify-center active:scale-95 transition-transform"
                    aria-label="Restar una botella cerrada"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={fullBottles}
                    onChange={(e) => setFullBottles(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-center bg-transparent text-white font-mono text-2xl font-bold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setFullBottles(fullBottles + 1)}
                    className="w-12 h-12 rounded-lg bg-[#142845] hover:bg-[#1c355b] text-white font-bold text-lg flex items-center justify-center active:scale-95 transition-transform"
                    aria-label="Sumar una botella cerrada"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Botella Abierta (Fracción Táctil) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-slate-300 font-medium">
                    Botella Abierta en Servicio (Nivel Líquido)
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    +{openBottleLevel.toFixed(2)} bot. ({Math.round(openBottleLevel * selectedProduct.sizeMl)} ml)
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {[
                    { label: '0 (Vacía)', val: 0.0 },
                    { label: '¼ (25%)', val: 0.25 },
                    { label: '½ (50%)', val: 0.5 },
                    { label: '¾ (75%)', val: 0.75 },
                    { label: '1 (Llena)', val: 1.0 },
                  ].map((frac) => (
                    <button
                      key={frac.label}
                      type="button"
                      onClick={() => setOpenBottleLevel(frac.val)}
                      className={`py-2 px-1 rounded-lg text-xs font-medium font-mono text-center transition-all ${
                        openBottleLevel === frac.val
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                          : 'bg-[#071322] hover:bg-[#142845] text-slate-300 border border-[#1a3356]'
                      }`}
                    >
                      {frac.label}
                    </button>
                  ))}
                </div>

                {/* Slider de precisión */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={openBottleLevel}
                  onChange={(e) => setOpenBottleLevel(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-[#071322] rounded-lg border border-[#1a3356]"
                />
              </div>

              {/* Visualizer preview */}
              <div className="p-3 bg-[#071322] border border-[#1a3356] rounded-xl flex items-center justify-center">
                <BottleVisualizer
                  level={openBottleLevel}
                  onChange={setOpenBottleLevel}
                  productName={selectedProduct.name}
                />
              </div>

              {/* Subtotal Preview */}
              <div className="p-3 bg-[#071322] border border-amber-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Total a Registrar en esta Captura:</span>
                  <span className="text-[11px] text-slate-500">
                    {fullBottles} cerradas + {openBottleLevel.toFixed(2)} abierta
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-amber-400">
                    +{activeTotal.toFixed(2)} bot.
                  </span>
                </div>
              </div>

              {/* Nota opcional */}
              <div>
                <input
                  type="text"
                  placeholder="Nota u observación de barra (opcional)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-[#071322] border border-[#1a3356] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* CONFIRMAR BUTTON */}
              <button
                type="button"
                onClick={handleConfirmSingle}
                disabled={isSubmitting}
                className="w-full h-14 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>CONFIRMAR CAPTURA Y ENVIAR AL CUADRE</span>
              </button>
            </div>
          </div>

          {/* Right Column (6 cols): Product Selector Catalog */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wine className="w-4 h-4 text-amber-400" />
                  <span>Seleccionar Producto para Inventariar</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {products.length} referencias
                </span>
              </div>

              {/* Search and Category Filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#071322] border border-[#1a3356] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'destilados', label: 'Destilados' },
                    { id: 'aperitivos', label: 'Aperitivos' },
                    { id: 'vinos_cavas', label: 'Vinos' },
                    { id: 'cervezas_mixers', label: 'Cervezas' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                        activeCategory === cat.id
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-[#071322] hover:bg-[#142845] text-slate-300 border border-[#1a3356]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Quick Selection List */}
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[#142845]/60">
                {filteredProducts.map((p) => {
                  const isSelected = p.id === selectedProductId;
                  const pCaptures = confirmedCaptures.filter((c) => c.productId === p.id);
                  const pTotal = pCaptures.reduce((sum, c) => sum + c.totalCaptured, 0);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setFullBottles(1);
                        setOpenBottleLevel(0.0);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border border-amber-500/50 text-white shadow-sm'
                          : 'bg-[#071322]/80 hover:bg-[#0e213b] text-slate-300 border border-transparent'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-amber-400 font-semibold">
                            {p.code}
                          </span>
                          <span className="text-xs font-semibold text-slate-100">
                            {p.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {p.brand} · {p.sizeMl}ml · Par: {p.parLevel}
                        </span>
                      </div>

                      <div className="text-right">
                        {pTotal > 0 ? (
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                            +{pTotal.toFixed(2)} bot. ({pCaptures.length})
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            Sin capturas
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Session Captures History Log */}
            <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Capturas Confirmadas en esta Sesión ({confirmedCaptures.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Almacenadas en la nube
                </span>
              </div>

              {confirmedCaptures.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-[#071322]/50 rounded-xl border border-dashed border-[#1a3356]">
                  Aún no hay capturas confirmadas. Ingresa cantidades y presiona <strong>CONFIRMAR</strong>.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {confirmedCaptures.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2.5 bg-[#071322] border border-[#1a3356] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-100">
                          {entry.productName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {entry.fullBottles} cerr. + {entry.openBottleLevel.toFixed(2)} ab. · {entry.station}
                          {entry.note && <span className="text-amber-300 ml-1">({entry.note})</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          +{entry.totalCaptured.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteCapture(entry.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Eliminar esta captura parcial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL / DRAWER: AUTOMATIZACIÓN PRIORITARIA (PEDIDO SUGERIDO A BODEGA)     */}
      {/* ========================================================================= */}
      {showRequisitionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1b32] border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1a3356] pb-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Requisición Automática a Bodega (Motor Par-Level)
                  </h3>
                  <p className="text-xs text-slate-300">
                    Cálculo determinista en tiempo real: Sugerencia de reposición para evitar quiebres de stock.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequisitionModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {requisitionItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-emerald-300 bg-emerald-950/40 rounded-xl border border-emerald-800/40">
                🎉 Todas las referencias cumplen con el stock de seguridad (Par-Level). No se requiere reposición inmediata.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {requisitionItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-[#071322] border border-[#1a3356] rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{item.product.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Código: {item.product.code} · Stock actual: {item.currentPhysical.toFixed(2)} bot. · Par requerido: {item.parLevel} bot.
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-400 text-sm block">
                        +{item.needed.toFixed(1)} botellas
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Costo aprox: ${(item.cost).toFixed(2)} USD
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-[#1a3356] flex items-center justify-between">
              <div className="text-xs text-slate-300 font-mono">
                Total sugerido: <strong className="text-amber-400">{totalRequisitionBottles.toFixed(1)} botellas</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyRequisition}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  {copiedRequisition ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedRequisition ? '¡Copiado para WhatsApp!' : 'Copiar Pedido a Bodega'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequisitionModal(false)}
                  className="px-3 py-2 bg-[#142845] hover:bg-[#1d385f] text-slate-300 rounded-xl text-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
