import React, { useState } from 'react';
import { ProductConsolidated } from '../types/inventory';
import {
  FileSpreadsheet,
  Cloud,
  Download,
  Share2,
  ExternalLink,
  RefreshCw,
  Folder,
  Check,
  Table,
  Code,
  Terminal,
  Copy,
  CheckCheck,
  PackageCheck,
  HelpCircle,
  FileCode,
  Sparkles,
} from 'lucide-react';
import {
  triggerExcelDownload,
  triggerVbaBasDownload,
  triggerAppsScriptDownload,
  VBA_MACRO_CODE,
  GOOGLE_APPS_SCRIPT_CODE,
} from '../utils/excelMacrosGenerator';

interface GoogleSheetsModuleProps {
  verifiedItems: ProductConsolidated[];
  bartenderName: string;
  shift: string;
  durationSeconds: number;
  frequency?: string;
}

export const GoogleSheetsModule: React.FC<GoogleSheetsModuleProps> = ({
  verifiedItems,
  bartenderName,
  shift,
  frequency = 'Diario',
}) => {
  const [activeTab, setActiveTab] = useState<'cierre_hoy' | 'requisicion' | 'macros_vba' | 'hoja_drive'>('cierre_hoy');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [copiedVba, setCopiedVba] = useState(false);
  const [copiedGas, setCopiedGas] = useState(false);
  const [showMacroGuideModal, setShowMacroGuideModal] = useState(false);
  const [syncToast, setSyncToast] = useState<{
    show: boolean;
    status: 'syncing' | 'success';
    message: string;
  } | null>(null);

  const currentDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const sheetId = '1ouzo_master_inventory_sheets_2026';
  const driveFolderPath = 'Mi unidad > Ouzo Restaurante > Inventarios Bar 2026';
  const spreadsheetTitle = 'Plantilla_Oficial_Inventario_Bar_Ouzo.xlsx';

  // Función simulada 'syncToGoogleDrive' que recibe los datos consolidados y dispara alertas visuales
  const syncToGoogleDrive = (data: ProductConsolidated[]) => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncToast({
      show: true,
      status: 'syncing',
      message: 'Sincronizando con hoja de cálculo de Ouzo...',
    });

    setTimeout(() => {
      setIsSyncing(false);
      const newTimestamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastSyncTime(newTimestamp);
      setSyncToast({
        show: true,
        status: 'success',
        message: 'Sincronización exitosa',
      });

      // Ocultar alerta después de 3.5 segundos
      setTimeout(() => {
        setSyncToast(null);
      }, 3500);
    }, 1600);
  };

  // Handle re-sync
  const handleTriggerSync = () => {
    syncToGoogleDrive(verifiedItems);
  };

  // Full Excel with Macros Download
  const handleDownloadExcelWithMacros = () => {
    triggerExcelDownload(verifiedItems, {
      bartenderName,
      shift,
      date: currentDate,
      frequency,
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyVbaCode = () => {
    navigator.clipboard.writeText(VBA_MACRO_CODE);
    setCopiedVba(true);
    setTimeout(() => setCopiedVba(false), 2500);
  };

  const handleCopyGasCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedGas(true);
    setTimeout(() => setCopiedGas(false), 2500);
  };

  const generateWhatsAppSummary = () => {
    const lines = [
      `🍸 *OUZO BAR & RESTAURANTE — INVENTARIO SINCRONIZADO EN GOOGLE SHEETS*`,
      `📅 Fecha: ${currentDate} | Turno: ${shift} | Tipo: ${frequency}`,
      `👤 Responsable: ${bartenderName}`,
      `📂 Google Sheets: *${spreadsheetTitle}*`,
      `✅ Pestaña generada: *Cierre_${currentDate.replace(/\s+/g, '')}*`,
      `----------------------------------------`,
      `📊 *TOTALES DEL CUADRE:*`,
      `• Referencias transferidas: ${verifiedItems.length}`,
      `• Total físico registrado: ${verifiedItems.reduce((s, i) => s + i.totalPhysical, 0).toFixed(2)} bot.`,
      `• Discrepancia neta: ${verifiedItems.reduce((s, i) => s + i.difference, 0).toFixed(2)} bot.`,
      `• Estado en Google Drive: *Sincronizado exitosamente*`,
      `----------------------------------------`,
      `🚀 _Generado automáticamente con BarraExpress Ouzo — Cero transcripción manual._`,
    ];
    return lines.join('\n');
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(generateWhatsAppSummary());
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  // Requisition items for Par-Level view
  const requisitionItems = verifiedItems
    .map((item) => {
      const par = item.product.parLevel || 4.0;
      const needed = Math.max(0, par - item.totalPhysical);
      return {
        product: item.product,
        physical: item.totalPhysical,
        par,
        needed,
        cost: needed * item.product.unitCost,
      };
    })
    .filter((i) => i.needed > 0);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-28 relative">
      {/* Visual Stylized Toast for simulated syncToGoogleDrive */}
      {syncToast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl border transition-all duration-300 animate-in fade-in slide-in-from-top-4 flex items-center gap-3.5 ${
            syncToast.status === 'syncing'
              ? 'bg-[#071322]/95 border-amber-500/60 text-slate-100 shadow-amber-500/10 backdrop-blur-md ring-1 ring-amber-400/30'
              : 'bg-[#064e3b]/95 border-emerald-500 text-white shadow-emerald-500/25 backdrop-blur-md ring-1 ring-emerald-400/40'
          }`}
        >
          {syncToast.status === 'syncing' ? (
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0">
              <Check className="w-6 h-6 text-emerald-400 stroke-[3]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-300">
                Google Drive Cloud Sync
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-[10px] text-amber-300 font-mono">
                {verifiedItems.length} referencias
              </span>
            </div>
            <p className="text-sm font-bold text-white mt-0.5 leading-snug">
              {syncToast.message}
            </p>
            {syncToast.status === 'success' && (
              <span className="text-[11px] text-emerald-200 block mt-0.5">
                Hoja oficial de Ouzo actualizada con éxito en la nube
              </span>
            )}
          </div>
        </div>
      )}

      {/* Module 4 Header */}
      <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
              <span>Módulo 4</span>
              <span className="text-slate-400">·</span>
              <span>Conexión con Google Sheets & Drive</span>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-400">Excel con Macros & Nube</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              <span>Sincronización con Plantilla Empresarial & Excel con Macros</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Descarga el libro de Excel con <strong>todas las funciones y código de Macros VBA integrado</strong> (.xls / .xlsm), o accede a la <strong>Hoja sincronizada en Google Drive</strong> con Google Apps Script.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Sync to Google Drive button */}
            <button
              type="button"
              onClick={() => syncToGoogleDrive(verifiedItems)}
              disabled={isSyncing}
              className="px-3.5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-blue-950 disabled:text-slate-400 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Simular envío de datos consolidados a la hoja de cálculo de Google Drive"
            >
              <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce text-sky-200' : 'text-sky-300'}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar con Google Drive'}</span>
            </button>

            {/* Download Excel with Macros button */}
            <button
              type="button"
              onClick={handleDownloadExcelWithMacros}
              className="px-4 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-lg shadow-emerald-400/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Descargar libro de Excel completo con fórmulas vivas y código de Macros VBA"
            >
              <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Descargar Excel con Macros (.xls)</span>
            </button>

            {/* VBA .bas module download */}
            <button
              type="button"
              onClick={triggerVbaBasDownload}
              className="px-3 py-2.5 text-xs font-semibold text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/50 rounded-xl transition-colors flex items-center gap-1.5"
              title="Descargar módulo VBA (.bas) listo para importar con Alt + F11 en Excel"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Módulo VBA (.bas)</span>
            </button>

            {/* How to enable macros guide modal */}
            <button
              type="button"
              onClick={() => setShowMacroGuideModal(true)}
              className="px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#071322] hover:bg-[#142845] border border-[#1a3356] rounded-xl transition-colors flex items-center gap-1.5"
              title="Ver guía paso a paso para ejecutar las macros en Excel y Google Sheets"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Guía de Macros</span>
            </button>

            {/* WhatsApp report */}
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="px-3.5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-md shadow-amber-400/20 active:scale-95 flex items-center gap-1.5"
            >
              {copiedWhatsApp ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedWhatsApp ? '¡Copiado!' : 'Reporte WhatsApp'}</span>
            </button>
          </div>
        </div>

        {/* Cloud Connection Meta Strip */}
        <div className="mt-6 pt-5 border-t border-[#1a3356] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#071322] border border-[#1a3356] rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Estado de Conexión</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sincronizado en la nube
              </span>
            </div>
          </div>

          <div className="bg-[#071322] border border-[#1a3356] rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Folder className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-medium">Google Drive Carpeta</span>
              <span className="font-medium text-slate-200 truncate block">
                {driveFolderPath}
              </span>
            </div>
          </div>

          <div className="bg-[#071322] border border-[#1a3356] rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-medium">Archivo Destino</span>
              <span className="font-mono text-slate-200 font-semibold truncate block">
                {spreadsheetTitle}
              </span>
            </div>
          </div>

          <div className="bg-[#071322] border border-[#1a3356] rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Última Sincronización</span>
              <span className="font-mono font-bold text-slate-200">
                {lastSyncTime}
              </span>
            </div>
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="p-2 bg-[#0b1b32] hover:bg-[#142845] rounded-lg text-slate-300 hover:text-white transition-colors"
              title="Forzar re-sincronización con Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Google Sheets Window Component */}
      <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl shadow-xl overflow-hidden">
        {/* Google Sheets Window Title & Menu Bar */}
        <div className="bg-[#071322] border-b border-[#1a3356] p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              <Table className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {spreadsheetTitle}
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                  Guardado en Drive automáticamente
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                <span className="hover:text-slate-200 cursor-pointer" onClick={handleDownloadExcelWithMacros}>Archivo (Descargar)</span>
                <span className="hover:text-slate-200 cursor-pointer" onClick={() => setActiveTab('macros_vba')}>Herramientas (Macros VBA)</span>
                <span className="hover:text-slate-200 cursor-pointer" onClick={() => setActiveTab('hoja_drive')}>Extensiones (Apps Script)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-[#0b1b32] hover:bg-[#142845] border border-[#1a3356] rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <ExternalLink className="w-3 h-3" />}
              <span>{copiedLink ? 'Enlace Copiado' : 'Copiar URL Google Sheets'}</span>
            </button>

            <a
              href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/50 rounded-lg transition-colors flex items-center gap-1"
            >
              <span>Abrir Hoja Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Formula Bar */}
        <div className="bg-[#0a182d] border-b border-[#1a3356] px-4 py-1.5 flex items-center gap-3 text-xs font-mono text-slate-300">
          <span className="text-slate-500 font-bold">fx</span>
          <span className="text-amber-400 font-semibold">
            {activeTab === 'cierre_hoy' && `=SUMA(G4:G${verifiedItems.length + 3})`}
            {activeTab === 'requisicion' && `=MAX(0, D4-C4)`}
            {activeTab === 'macros_vba' && `Sub CuadreAutomatico() -> Macro VBA en Excel`}
            {activeTab === 'hoja_drive' && `function onOpen() -> Google Apps Script Drive`}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] text-slate-400 font-sans">
            {activeTab === 'cierre_hoy' && 'Fórmula de cuadre en columna H: =G4-(D4+E4-F4)'}
            {activeTab === 'requisicion' && 'Cálculo automático de pedido: Si Físico < Par-Level => Reorden = Par - Físico'}
            {activeTab === 'macros_vba' && 'Módulo de automatización con atajos para Excel Desktop'}
            {activeTab === 'hoja_drive' && 'Sincronización en la nube mediante Google Workspace'}
          </span>
        </div>

        {/* ========================================================================= */}
        {/* PESTAÑA 1: CONTROL DE INVENTARIO (CUADRE OFICIAL)                         */}
        {/* ========================================================================= */}
        {activeTab === 'cierre_hoy' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#050e1a] text-slate-500 text-[10px] border-b border-[#1a3356]">
                  <th className="w-10 p-2 text-center border-r border-[#1a3356]">#</th>
                  <th className="p-2 border-r border-[#1a3356]">A (CÓDIGO)</th>
                  <th className="p-2 border-r border-[#1a3356]">B (PRODUCTO OUZO)</th>
                  <th className="p-2 border-r border-[#1a3356]">C (CATEGORÍA)</th>
                  <th className="p-2 text-right border-r border-[#1a3356]">D (INICIAL)</th>
                  <th className="p-2 text-right border-r border-[#1a3356]">E (ENTRADAS)</th>
                  <th className="p-2 text-right border-r border-[#1a3356]">F (VENTAS POS)</th>
                  <th className="p-2 text-right border-r border-[#1a3356] bg-emerald-950/20 text-emerald-300">G (STOCK FÍSICO)</th>
                  <th className="p-2 text-right border-r border-[#1a3356]">H (DIFERENCIA)</th>
                  <th className="p-2 text-right border-r border-[#1a3356]">I (COSTO U.)</th>
                  <th className="p-2 text-right border-r border-[#1a3356]">J (TOTAL $)</th>
                  <th className="p-2 border-r border-[#1a3356]">K (AUDITORÍA)</th>
                  <th className="p-2">L (JUSTIFICACIÓN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#142845] text-slate-300">
                {verifiedItems.map((item, idx) => {
                  const rowNum = idx + 4;
                  return (
                    <tr key={item.product.id} className="hover:bg-[#0e213b] transition-colors">
                      <td className="p-2 text-center bg-[#071322] text-slate-500 border-r border-[#1a3356] text-[11px]">
                        {rowNum}
                      </td>
                      <td className="p-2 text-amber-400 font-bold border-r border-[#1a3356]">
                        {item.product.code}
                      </td>
                      <td className="p-2 font-sans font-medium text-slate-100 border-r border-[#1a3356] max-w-[220px] truncate">
                        {item.product.name}
                      </td>
                      <td className="p-2 text-slate-400 border-r border-[#1a3356] capitalize">
                        {item.product.category.replace('_', ' ')}
                      </td>
                      <td className="p-2 text-right text-slate-300 border-r border-[#1a3356]">
                        {item.product.initialStock.toFixed(2)}
                      </td>
                      <td className="p-2 text-right text-slate-300 border-r border-[#1a3356]">
                        {item.product.receipts.toFixed(2)}
                      </td>
                      <td className="p-2 text-right text-slate-300 border-r border-[#1a3356]">
                        {item.product.posSales.toFixed(2)}
                      </td>
                      <td className="p-2 text-right font-bold text-white border-r border-[#1a3356] bg-emerald-950/20">
                        {item.totalPhysical.toFixed(2)}
                      </td>
                      <td className={`p-2 text-right font-bold border-r border-[#1a3356] ${
                        item.difference < 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {item.difference >= 0 ? `+${item.difference.toFixed(2)}` : item.difference.toFixed(2)}
                      </td>
                      <td className="p-2 text-right text-slate-400 border-r border-[#1a3356]">
                        ${item.product.unitCost.toFixed(2)}
                      </td>
                      <td className="p-2 text-right text-slate-300 border-r border-[#1a3356]">
                        ${Math.abs(item.costImpact).toFixed(2)}
                      </td>
                      <td className="p-2 font-sans text-[11px] border-r border-[#1a3356]">
                        {Math.abs(item.difference) <= 0.15 ? (
                          <span className="text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">OK</span>
                        ) : Math.abs(item.difference) <= 0.35 ? (
                          <span className="text-amber-400 font-semibold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">Alerta</span>
                        ) : (
                          <span className="text-rose-400 font-semibold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">Crítico</span>
                        )}
                      </td>
                      <td className="p-2 font-sans text-[11px]">
                        {item.justification ? (
                          <span className="text-amber-300 italic">{item.justification}</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">Conforme</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Total Row */}
                <tr className="bg-[#071322] font-bold text-white border-t-2 border-[#1a3356]">
                  <td className="p-2 text-center text-slate-500 border-r border-[#1a3356]">
                    {verifiedItems.length + 4}
                  </td>
                  <td colSpan={6} className="p-2 text-right font-sans uppercase tracking-wider text-xs border-r border-[#1a3356]">
                    Totales Consolidados de Turno:
                  </td>
                  <td className="p-2 text-right text-emerald-400 text-sm border-r border-[#1a3356]">
                    {verifiedItems.reduce((s, i) => s + i.totalPhysical, 0).toFixed(2)} bot.
                  </td>
                  <td className="p-2 text-right text-amber-400 border-r border-[#1a3356]">
                    {verifiedItems.reduce((s, i) => s + i.difference, 0).toFixed(2)} bot.
                  </td>
                  <td className="p-2 border-r border-[#1a3356]"></td>
                  <td className="p-2 text-right text-rose-400 border-r border-[#1a3356]">
                    ${Math.abs(verifiedItems.reduce((s, i) => s + i.costImpact, 0)).toFixed(2)}
                  </td>
                  <td colSpan={2} className="p-2 font-sans text-xs text-emerald-400">
                    Sincronizado a Google Sheets
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 2: REQUISICIÓN PAR-LEVEL                                          */}
        {/* ========================================================================= */}
        {activeTab === 'requisicion' && (
          <div className="overflow-x-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-amber-400" />
                  <span>Hoja de Requisición Automática a Bodega Central</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Esta hoja se genera automáticamente en el Excel con la fórmula <code className="text-amber-300 font-mono">=MAX(0, ParLevel - StockFisico)</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadExcelWithMacros}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar en Excel</span>
              </button>
            </div>

            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#050e1a] text-slate-500 text-[10px] border-b border-[#1a3356]">
                  <th className="p-2 border-r border-[#1a3356]">CÓDIGO</th>
                  <th className="p-2 border-r border-[#1a3356]">PRODUCTO</th>
                  <th className="p-2 text-right border-r border-[#1a3356]">STOCK FÍSICO</th>
                  <th className="p-2 text-right border-r border-[#1a3356]">PAR-LEVEL</th>
                  <th className="p-2 text-right border-r border-[#1a3356] bg-amber-950/20 text-amber-300">PEDIDO SUGERIDO</th>
                  <th className="p-2 text-right">COSTO ESTIMADO USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#142845] text-slate-300">
                {requisitionItems.map((req) => (
                  <tr key={req.product.id} className="hover:bg-[#0e213b]">
                    <td className="p-2 text-amber-400 font-bold border-r border-[#1a3356]">{req.product.code}</td>
                    <td className="p-2 font-sans font-medium text-white border-r border-[#1a3356]">{req.product.name}</td>
                    <td className="p-2 text-right border-r border-[#1a3356]">{req.physical.toFixed(2)}</td>
                    <td className="p-2 text-right border-r border-[#1a3356]">{req.par}</td>
                    <td className="p-2 text-right font-bold text-amber-400 border-r border-[#1a3356] bg-amber-950/20">+{req.needed.toFixed(1)} bot.</td>
                    <td className="p-2 text-right font-bold text-emerald-400">${req.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 3: CÓDIGO DE MACROS VBA (VISUAL BASIC PARA EXCEL)                  */}
        {/* ========================================================================= */}
        {activeTab === 'macros_vba' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#071322] border border-[#1a3356] p-4 rounded-xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" />
                  <span>Módulo de Macros VBA para Microsoft Excel (.xlsm / .xls)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Incluye las macros: <code>CuadreAutomatico</code>, <code>GenerarRequisicionBodega</code>, <code>ExportarAGoogleDrive</code> y <code>LimpiarParaNuevoTurno</code>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyVbaCode}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {copiedVba ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedVba ? '¡Código Copiado!' : 'Copiar Código VBA'}</span>
                </button>

                <button
                  type="button"
                  onClick={triggerVbaBasDownload}
                  className="px-3 py-1.5 bg-[#142845] hover:bg-[#1d385f] text-slate-200 text-xs rounded-lg transition-colors flex items-center gap-1.5 border border-[#1a3356]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .bas</span>
                </button>
              </div>
            </div>

            {/* Code viewer */}
            <div className="bg-[#050e1a] border border-[#1a3356] rounded-xl p-4 overflow-x-auto max-h-96">
              <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
                {VBA_MACRO_CODE}
              </pre>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 4: INTEGRACIÓN CON GOOGLE DRIVE & GOOGLE APPS SCRIPT              */}
        {/* ========================================================================= */}
        {activeTab === 'hoja_drive' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#071322] border border-[#1a3356] p-4 rounded-xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-blue-400" />
                  <span>Google Apps Script para Hoja en Google Drive</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Crea automáticamente un menú personalizado <strong className="text-amber-400">🍸 Ouzo Bar - Inventarios</strong> en la barra superior de tu Google Sheets.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyGasCode}
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {copiedGas ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedGas ? '¡Script Copiado!' : 'Copiar Google Apps Script'}</span>
                </button>

                <button
                  type="button"
                  onClick={triggerAppsScriptDownload}
                  className="px-3 py-1.5 bg-[#142845] hover:bg-[#1d385f] text-slate-200 text-xs rounded-lg transition-colors flex items-center gap-1.5 border border-[#1a3356]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .gs</span>
                </button>
              </div>
            </div>

            {/* Script viewer */}
            <div className="bg-[#050e1a] border border-[#1a3356] rounded-xl p-4 overflow-x-auto max-h-96">
              <pre className="text-xs font-mono text-sky-300 leading-relaxed">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>
        )}

        {/* Google Sheets Tabs Bottom Bar */}
        <div className="bg-[#071322] border-t border-[#1a3356] p-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('cierre_hoy')}
              className={`px-3 py-1 rounded-t-lg font-medium border-t-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'cierre_hoy'
                  ? 'bg-[#0b1b32] text-emerald-400 border-emerald-400 font-bold shadow'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>1_Control_Inventario (Hoy)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('requisicion')}
              className={`px-3 py-1 rounded-t-lg font-medium border-t-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'requisicion'
                  ? 'bg-[#0b1b32] text-amber-400 border-amber-400 font-bold'
                  : 'text-slate-500 hover:text-slate-300 border-transparent'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>2_Requisicion_ParLevel</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('macros_vba')}
              className={`px-3 py-1 rounded-t-lg font-medium border-t-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'macros_vba'
                  ? 'bg-[#0b1b32] text-sky-400 border-sky-400 font-bold'
                  : 'text-slate-500 hover:text-slate-300 border-transparent'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>3_Codigo_Macros_VBA</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hoja_drive')}
              className={`px-3 py-1 rounded-t-lg font-medium border-t-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'hoja_drive'
                  ? 'bg-[#0b1b32] text-indigo-400 border-indigo-400 font-bold'
                  : 'text-slate-500 hover:text-slate-300 border-transparent'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>4_Hoja_Google_Drive</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-sans pr-2 hidden md:block">
            Libro de Excel multipestaña con macros y fórmulas listas para descarga
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: GUÍA PASO A PASO PARA ACTIVAR MACROS EN EXCEL Y GOOGLE DRIVE       */}
      {/* ========================================================================= */}
      {showMacroGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1b32] border border-[#1a3356] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1a3356] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Guía de Activación de Macros en Excel y Google Drive
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMacroGuideModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-[#071322] border border-[#1a3356] rounded-xl space-y-1">
                <span className="font-bold text-amber-400 block">Opción A: Descarga Directa del Libro de Excel (.xls / .xlsm)</span>
                <p>1. Presiona el botón verde <strong>"Descargar Excel con Macros (.xls)"</strong>.</p>
                <p>2. Abre el archivo en Microsoft Excel. Verás las 4 hojas con todas las fórmulas vivas y el código listo.</p>
              </div>

              <div className="p-3 bg-[#071322] border border-[#1a3356] rounded-xl space-y-1">
                <span className="font-bold text-emerald-400 block">Opción B: Importar el Módulo VBA en cualquier Excel existente</span>
                <p>1. Descarga el archivo <code>Macros_Ouzo_BarraExpress.bas</code>.</p>
                <p>2. En Excel, presiona <kbd className="px-1.5 py-0.5 bg-[#142845] border border-[#1a3356] rounded text-white font-mono">Alt + F11</kbd> para abrir el Editor de Visual Basic.</p>
                <p>3. Ve a <strong>Archivo &gt; Importar archivo...</strong> y selecciona el archivo <code>.bas</code> descargado.</p>
                <p>4. Guarda tu libro como <strong>Libro de Excel habilitado para macros (*.xlsm)</strong>.</p>
                <p>5. Para ejecutar, presiona <kbd className="px-1.5 py-0.5 bg-[#142845] border border-[#1a3356] rounded text-white font-mono">Alt + F8</kbd> y selecciona <code>CuadreAutomatico</code> o <code>GenerarRequisicionBodega</code>.</p>
              </div>

              <div className="p-3 bg-[#071322] border border-[#1a3356] rounded-xl space-y-1">
                <span className="font-bold text-sky-400 block">Opción C: En Google Drive y Google Sheets</span>
                <p>1. Abre tu hoja en Google Sheets desde Google Drive.</p>
                <p>2. Ve a <strong>Extensiones &gt; Apps Script</strong>.</p>
                <p>3. Pega el código de la pestaña <strong>4_Hoja_Google_Drive</strong> y presiona Guardar.</p>
                <p>4. Al recargar la hoja aparecerá el menú superior <strong className="text-white">🍸 Ouzo Bar - Inventarios</strong> para ejecutar cuadres y pedidos con 1 clic en la nube.</p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1a3356] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleDownloadExcelWithMacros}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Excel con Macros Ahora</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMacroGuideModal(false)}
                className="px-4 py-2 bg-[#142845] hover:bg-[#1d385f] text-slate-300 text-xs rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
