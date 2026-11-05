import React, { useState } from 'react';
import {
  FICHA_FUNCIONAL_METADATA,
  FICHA_FUNCIONAL_SECTIONS,
  DECISIONES_PENDIENTES,
} from '../data/fichaData';
import {
  Check,
  Copy,
  Download,
  FileText,
  Layers,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const FichaFuncionalView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'markdown'>('visual');

  // Build the complete Markdown text for Prompt Maestro 2
  const buildFullMarkdown = () => {
    let md = `# FICHA FUNCIONAL — PROMPT MAESTRO 2\n\n`;
    md += `**Nombre de la herramienta:** ${FICHA_FUNCIONAL_METADATA.toolName}\n`;
    md += `**Tipo de negocio:** ${FICHA_FUNCIONAL_METADATA.businessType}\n`;
    md += `**Problema que resuelve:** ${FICHA_FUNCIONAL_METADATA.problem}\n`;
    md += `**Insight seleccionado:** ${FICHA_FUNCIONAL_METADATA.selectedInsight}\n`;
    md += `**Indicador meta:** ${FICHA_FUNCIONAL_METADATA.targetMetric}\n\n`;
    md += `---\n\n`;

    FICHA_FUNCIONAL_SECTIONS.forEach((sec) => {
      md += `## ${sec.number}. ${sec.title}\n`;
      md += `*${sec.subtitle}*\n\n`;
      md += `> **Resumen ejecutivo:** ${sec.summary}\n\n`;
      md += `**Detalle funcional y operativo:**\n`;
      sec.details.forEach((d) => {
        md += `- ${d}\n`;
      });
      md += `\n**Conclusión clave:** ${sec.keyTakeaway}\n\n`;
      md += `---\n\n`;
    });

    md += `## 11. DECISIONES PENDIENTES IDENTIFICADAS\n\n`;
    DECISIONES_PENDIENTES.forEach((dec) => {
      md += `### ${dec.topic}\n`;
      md += `- **Pregunta a definir:** ${dec.question}\n`;
      md += `- **${dec.recommendation}**\n\n`;
    });

    return md;
  };

  const handleCopyMarkdown = async () => {
    try {
      const text = buildFullMarkdown();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDownloadMarkdown = () => {
    const text = buildFullMarkdown();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ficha_Funcional_BarraExpress_Prompt_Maestro_2.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleSection = (num: number) => {
    setExpandedSection(expandedSection === num ? null : num);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Banner and Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
              <span>Insumo Oficial para Prompt Maestro 2</span>
              <span className="text-slate-500">·</span>
              <span>10 Puntos Clave</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Ficha Funcional: {FICHA_FUNCIONAL_METADATA.toolName}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Especificación funcional y operativa generada a partir del problema de inventarios del restaurante, el insight de{' '}
              <strong className="text-white">Automatización de Captura en Barra</strong> y la meta de reducir el tiempo del bar de{' '}
              <strong className="text-emerald-400">22 horas a menos de 5 horas mensuales</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadMarkdown}
              className="px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar .MD
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="px-4 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  ¡Ficha Copiada al Portapapeles!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Ficha para Prompt Maestro 2
                </>
              )}
            </button>
          </div>
        </div>

        {/* Core Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Problema Central</span>
            <p className="text-xs text-slate-200 mt-1 line-clamp-3">
              Carga de &gt;30 conteos al mes en papel y transcripción manual (22h bar + 10h caja + 24h admin).
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Insight Seleccionado</span>
            <p className="text-xs text-amber-300 font-medium mt-1">
              Automatización de Captura en Barra táctil en celular en 2 toques.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Meta de Reducción</span>
            <p className="text-xs text-emerald-400 font-bold font-mono mt-1">
              De 22 hrs a &lt; 5 hrs mensuales (&gt;75% de ahorro)
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Usuario Principal</span>
            <p className="text-xs text-slate-200 font-medium mt-1">
              Bartender / Barman (Turno de cierre de servicio)
            </p>
          </div>
        </div>
      </div>

      {/* View Mode Selector Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setViewMode('visual')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              viewMode === 'visual'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Vista Estructurada (10 Puntos)
          </button>
          <button
            onClick={() => setViewMode('markdown')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              viewMode === 'markdown'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Texto Markdown (Prompt-Ready)
          </button>
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline">
          {viewMode === 'visual' ? 'Haz clic en cada sección para expandir detalles' : 'Formato directo para copiar y pegar'}
        </span>
      </div>

      {/* View Mode Content */}
      {viewMode === 'visual' ? (
        <div className="space-y-3">
          {FICHA_FUNCIONAL_SECTIONS.map((sec) => {
            const isExpanded = expandedSection === sec.number || expandedSection === null;
            return (
              <div
                key={sec.number}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-200"
              >
                {/* Header row */}
                <button
                  type="button"
                  onClick={() => toggleSection(sec.number)}
                  className="w-full p-4 md:p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      0{sec.number}
                    </span>
                    <div>
                      <h3 className="text-sm md:text-base font-semibold text-white">
                        {sec.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {sec.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-xs hidden md:inline">
                      {isExpanded ? 'Ocultar' : 'Ver detalle'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-800/80 space-y-4">
                    {/* Summary Callout */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                      <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block mb-1">
                        Resumen Ejecutivo
                      </span>
                      <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                        {sec.summary}
                      </p>
                    </div>

                    {/* Bullet Points */}
                    <div>
                      <span className="text-xs font-semibold text-slate-300 block mb-2">
                        Especificación Detallada:
                      </span>
                      <ul className="space-y-2">
                        {sec.details.map((detail, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Key takeaway */}
                    <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3 flex items-center justify-between text-xs">
                      <span className="text-emerald-300 font-medium">
                        Conclusión Clave: <span className="text-slate-200 font-normal">{sec.keyTakeaway}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Decisiones Pendientes Section */}
          <div className="bg-slate-900 border border-amber-800/60 rounded-2xl p-5 mt-6">
            <div className="flex items-center gap-2 text-amber-400 mb-3">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-white">
                11. Decisiones Pendientes Identificadas
              </h3>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Para garantizar que no se inventa información operativa faltante, se dejan documentados los siguientes puntos a consensuar con la gerencia del restaurante:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DECISIONES_PENDIENTES.map((dec) => (
                <div
                  key={dec.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 mb-1">
                      {dec.topic}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {dec.question}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400 font-medium">
                    {dec.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Markdown Raw View */
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
          {buildFullMarkdown()}
        </div>
      )}
    </div>
  );
};
