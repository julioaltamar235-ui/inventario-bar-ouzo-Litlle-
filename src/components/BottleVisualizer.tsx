import React from 'react';

interface BottleVisualizerProps {
  level: number; // 0.0 to 0.9
  onChange: (newLevel: number) => void;
  productName: string;
}

export const BottleVisualizer: React.FC<BottleVisualizerProps> = ({
  level,
  onChange,
  productName,
}) => {
  // Common fractions used in high-volume cocktail bars
  const quickFractions = [
    { label: 'Vacía (0.0)', value: 0.0 },
    { label: '0.1', value: 0.1 },
    { label: '1/4 (0.25)', value: 0.25 },
    { label: '0.3', value: 0.3 },
    { label: '0.4', value: 0.4 },
    { label: '1/2 (0.5)', value: 0.5 },
    { label: '0.6', value: 0.6 },
    { label: '0.7', value: 0.7 },
    { label: '3/4 (0.75)', value: 0.75 },
    { label: '0.8', value: 0.8 },
    { label: '0.9 (Casi llena)', value: 0.9 },
  ];

  const fillPercentage = Math.round(level * 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-100">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
        <div>
          <span className="text-xs text-amber-400 font-medium tracking-wide uppercase">
            Botella Abierta en Barra
          </span>
          <h4 className="text-sm font-semibold text-white truncate max-w-[200px]">
            {productName}
          </h4>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold font-mono text-amber-400">
            {level.toFixed(2)}
          </span>
          <span className="text-xs text-slate-400 block">({fillPercentage}% restante)</span>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        {/* Interactive SVG Bottle */}
        <div className="relative w-16 h-36 flex flex-col items-center justify-end bg-slate-950/60 rounded-xl p-1 border border-slate-800 shrink-0">
          {/* Bottle neck */}
          <div className="w-5 h-6 bg-slate-800/60 rounded-t-sm border border-slate-700/50 mb-0.5" />
          {/* Bottle shoulder & body */}
          <div className="relative w-12 h-26 bg-slate-900/80 rounded-b-lg border border-slate-700/60 overflow-hidden flex flex-col justify-end">
            {/* Liquid Fill */}
            <div
              className="w-full bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400/90 transition-all duration-200"
              style={{ height: `${fillPercentage}%` }}
            >
              {/* Liquid meniscus surface line */}
              {fillPercentage > 0 && (
                <div className="w-full h-1 bg-amber-200/80 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              )}
            </div>

            {/* Level markings lines on the bottle */}
            <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none opacity-30 text-[8px] font-mono pl-1 text-slate-300">
              <span>0.9</span>
              <span>0.75</span>
              <span>0.5</span>
              <span>0.25</span>
              <span>0.1</span>
            </div>
          </div>
        </div>

        {/* Quick tap fraction buttons (optimized for 1-hand thumb use) */}
        <div className="flex-1">
          <p className="text-xs text-slate-400 mb-2">Toque rápido del nivel visual:</p>
          <div className="grid grid-cols-3 gap-1.5">
            {quickFractions.map((frac) => {
              const isSelected = Math.abs(level - frac.value) < 0.02;
              return (
                <button
                  key={frac.value}
                  type="button"
                  onClick={() => onChange(frac.value)}
                  className={`min-h-[42px] px-2 py-1 text-xs font-medium rounded-lg transition-colors flex items-center justify-center ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/30'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50'
                  }`}
                >
                  {frac.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
