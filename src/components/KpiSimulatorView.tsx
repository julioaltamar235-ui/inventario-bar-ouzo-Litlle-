import React, { useState } from 'react';
import { Clock, TrendingDown, DollarSign, Award, Users, CheckCircle2 } from 'lucide-react';

export const KpiSimulatorView: React.FC = () => {
  const [countsPerMonth, setCountsPerMonth] = useState(30);
  const [averageHourlyWage, setAverageHourlyWage] = useState(12); // $12 USD / hora o equivalente local

  // Baseline data provided by the user
  const baselineBarMinutes = 1320; // 22 hours
  const baselineCajaMinutes = 600; // 10 hours
  const baselineAdminMinutes = 1440; // 24 hours
  const baselineTotalMinutes = baselineBarMinutes + baselineCajaMinutes + baselineAdminMinutes; // 3360 min = 56h

  // Projected data with BarraExpress
  // Average 7.5 minutes per bar count (tap interface)
  const barMinutesPerCount = 7.5;
  const cajaMinutesPerCount = 3.5;
  const adminMinutesPerCount = 7.0;

  const projectedBarMinutes = Math.round(barMinutesPerCount * countsPerMonth);
  const projectedCajaMinutes = Math.round(cajaMinutesPerCount * countsPerMonth);
  const projectedAdminMinutes = Math.round(adminMinutesPerCount * countsPerMonth);
  const projectedTotalMinutes = projectedBarMinutes + projectedCajaMinutes + projectedAdminMinutes;

  const baselineBarHours = (baselineBarMinutes / 60).toFixed(1);
  const projectedBarHours = (projectedBarMinutes / 60).toFixed(1);
  const barHoursSaved = (parseFloat(baselineBarHours) - parseFloat(projectedBarHours)).toFixed(1);
  const barPercentageSaved = Math.round(((baselineBarMinutes - projectedBarMinutes) / baselineBarMinutes) * 100);

  const baselineTotalHours = (baselineTotalMinutes / 60).toFixed(1);
  const projectedTotalHours = (projectedTotalMinutes / 60).toFixed(1);
  const totalHoursSaved = (parseFloat(baselineTotalHours) - parseFloat(projectedTotalHours)).toFixed(1);

  // Financial calculations
  const monthlyLaborCostSaved = (parseFloat(totalHoursSaved) * averageHourlyWage).toFixed(0);
  const annualLaborCostSaved = (parseFloat(totalHoursSaved) * averageHourlyWage * 12).toLocaleString();

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Hero KPI Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">
              <span>Indicador Clave de Éxito</span>
              <span className="text-slate-500">·</span>
              <span>Barra Gastronómica</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              De 22 Horas a Menos de 5 Horas Mensuales
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Al automatizar la captura táctil de botellas y eliminar el papeleo, el bartender pasa de gastar 45 minutos por conteo a menos de 8 minutos, liberando tiempo para la atención, mixología y servicio.
            </p>
          </div>

          <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-2xl p-4 text-center shrink-0">
            <span className="text-xs text-emerald-300 font-medium block">Tiempo Bar Mensual Proyectado</span>
            <span className="text-4xl font-extrabold font-mono text-emerald-400 mt-0.5 block">
              {projectedBarHours} hrs
            </span>
            <span className="text-[11px] text-emerald-200/80 mt-1 block">
              Meta lograda: &lt; 5.0 hrs/mes (-{barPercentageSaved}%)
            </span>
          </div>
        </div>

        {/* Dynamic simulator adjustments */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
              <span className="font-medium">Conteos mensuales en barra:</span>
              <span className="font-mono font-bold text-amber-400">{countsPerMonth} conteos</span>
            </div>
            <input
              type="range"
              min="15"
              max="60"
              step="1"
              value={countsPerMonth}
              onChange={(e) => setCountsPerMonth(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>15 (Quincenal)</span>
              <span>30 (Diario cierre)</span>
              <span>60 (Doble turno)</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
              <span className="font-medium">Costo promedio hora de personal:</span>
              <span className="font-mono font-bold text-amber-400">${averageHourlyWage} USD / h</span>
            </div>
            <input
              type="range"
              min="5"
              max="35"
              step="1"
              value={averageHourlyWage}
              onChange={(e) => setAverageHourlyWage(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>$5/h</span>
              <span>$12/h (Estándar)</span>
              <span>$35/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role by Role Breakdown Comparison */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <span>Comparativa del Impacto por Rol en el Restaurante</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* BAR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                1. Rol: Bartender (Bar)
              </span>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                -{barPercentageSaved}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Contar botellas, estimar niveles y cotejar notas de turno.
            </p>

            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Antes (Papel y lápiz):</span>
                  <span className="font-mono font-bold text-rose-400">{baselineBarHours} hrs / mes</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Con BarraExpress:</span>
                  <span className="font-mono font-bold text-emerald-400">{projectedBarHours} hrs / mes</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${(projectedBarMinutes / baselineBarMinutes) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <span>Ahorro mensual:</span>
              <span className="font-bold text-white font-mono">{barHoursSaved} horas recuperadas</span>
            </div>
          </div>

          {/* CAJA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                2. Rol: Cajero
              </span>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                -80%
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Transcribir actas físicas y cotejar tickets de cobro.
            </p>

            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Antes (Cotejo manual):</span>
                  <span className="font-mono font-bold text-rose-400">10.0 hrs / mes</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Con BarraExpress:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {(projectedCajaMinutes / 60).toFixed(1)} hrs / mes
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${(projectedCajaMinutes / baselineCajaMinutes) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <span>Ahorro mensual:</span>
              <span className="font-bold text-white font-mono">
                {(10 - projectedCajaMinutes / 60).toFixed(1)} horas recuperadas
              </span>
            </div>
          </div>

          {/* ADMINISTRADOR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                3. Rol: Administrador
              </span>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                -83%
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Cuadres en Excel, auditoría de mermas y aclaraciones.
            </p>

            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Antes (Excel manual):</span>
                  <span className="font-mono font-bold text-rose-400">24.0 hrs / mes</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Con BarraExpress:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {(projectedAdminMinutes / 60).toFixed(1)} hrs / mes
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${(projectedAdminMinutes / baselineAdminMinutes) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <span>Ahorro mensual:</span>
              <span className="font-bold text-white font-mono">
                {(24 - projectedAdminMinutes / 60).toFixed(1)} horas recuperadas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Restaurant Return on Investment Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">
          Resumen Consolidado de Ahorro Operativo para el Restaurante
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Tiempo Total Restaurante</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {projectedTotalHours}h
              </span>
              <span className="text-xs text-slate-400 line-through">
                56.0h / mes
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Ahorro de <strong className="text-white">{totalHoursSaved} horas</strong> operativas al mes.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Ahorro Económico Mensual</span>
            <div className="text-2xl font-bold font-mono text-white">
              ${monthlyLaborCostSaved} USD
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              En horas hombre no productivas de transcripción.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Ahorro Económico Anual</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              ${annualLaborCostSaved} USD
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Retorno inmediato sin costos de hardware adicional.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs text-slate-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Impacto cualitativo clave:</strong> Al no tener que pasar 45 minutos al cierre transcribiendo datos a papel, el bartender se retira a tiempo, descansa mejor y mantiene un estándar de hospitalidad elevado durante las horas pico de propinas.
          </span>
        </div>
      </div>
    </div>
  );
};
