import React, { useState, useEffect } from 'react';
import { Header, AppOuzoTab } from './components/Header';
import { CaptureModule } from './components/CaptureModule';
import { CuadreModule } from './components/CuadreModule';
import { VerificationModule } from './components/VerificationModule';
import { GoogleSheetsModule } from './components/GoogleSheetsModule';
import { ParametricDashboard } from './components/ParametricDashboard';
import { KpiSimulatorView } from './components/KpiSimulatorView';
import { FichaFuncionalView } from './components/FichaFuncionalView';
import { OUZO_PRODUCTS } from './data/initialProducts';
import { CaptureEntry, ProductConsolidated, StationLocation, InventoryFrequency } from './types/inventory';
import { Layers, TrendingUp } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppOuzoTab>('captura');
  const [products] = useState(OUZO_PRODUCTS);
  const [isMobileSimulation, setIsMobileSimulation] = useState(false);
  const [frequency, setFrequency] = useState<InventoryFrequency>('diario');

  // Operational states
  const [bartenderName] = useState('Carlos Ruiz (Bartender Líder Ouzo)');
  const [shift] = useState<'Cierre Noche' | 'Cambio Turno'>('Cierre Noche');
  const [station, setStation] = useState<StationLocation>('speed_rail');
  const [timerSeconds, setTimerSeconds] = useState(245); // 4m 05s
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Initial confirmed captures showing realistic initial state and the prompt's Whisky example (5 + 3 + 2 = 10!)
  const [confirmedCaptures, setConfirmedCaptures] = useState<CaptureEntry[]>([
    // Whisky Johnnie Walker: Capture 1 (Speed Rail = 5)
    {
      id: 'cap-01',
      productId: 'prod-05',
      productName: 'Whisky Johnnie Walker Black Label 750ml',
      productCode: 'OUZ-WHI-01',
      timestamp: '23:14:10',
      fullBottles: 5,
      openBottleLevel: 0,
      totalCaptured: 5.0,
      station: 'speed_rail',
      bartender: 'Carlos Ruiz',
      note: 'Speed Rail estación 1',
    },
    // Whisky Johnnie Walker: Capture 2 (Bodega = 3)
    {
      id: 'cap-02',
      productId: 'prod-05',
      productName: 'Whisky Johnnie Walker Black Label 750ml',
      productCode: 'OUZ-WHI-01',
      timestamp: '23:16:22',
      fullBottles: 3,
      openBottleLevel: 0,
      totalCaptured: 3.0,
      station: 'reserva_bodega',
      bartender: 'Carlos Ruiz',
      note: 'Reserva repisas inferiores',
    },
    // Whisky Johnnie Walker: Capture 3 (Botellero = 2) -> Total 10.0!
    {
      id: 'cap-03',
      productId: 'prod-05',
      productName: 'Whisky Johnnie Walker Black Label 750ml',
      productCode: 'OUZ-WHI-01',
      timestamp: '23:17:45',
      fullBottles: 2,
      openBottleLevel: 0,
      totalCaptured: 2.0,
      station: 'botellero_principal',
      bartender: 'Carlos Ruiz',
      note: 'Botellero exhibición',
    },
    // Ouzo Plomari (Signature)
    {
      id: 'cap-04',
      productId: 'prod-ouzo-01',
      productName: 'Ouzo Plomari Isidoros Arvanitis 700ml',
      productCode: 'OUZ-ESP-01',
      timestamp: '23:18:30',
      fullBottles: 4,
      openBottleLevel: 0.8,
      totalCaptured: 4.8,
      station: 'speed_rail',
      bartender: 'Carlos Ruiz',
      note: 'Barra principal',
    },
    // Tequila Don Julio
    {
      id: 'cap-05',
      productId: 'prod-01',
      productName: 'Tequila Don Julio Blanco 750ml',
      productCode: 'OUZ-TEQ-01',
      timestamp: '23:19:15',
      fullBottles: 4,
      openBottleLevel: 0.4,
      totalCaptured: 4.4,
      station: 'speed_rail',
      bartender: 'Carlos Ruiz',
    },
    // Gin Hendrick's
    {
      id: 'cap-06',
      productId: 'prod-02',
      productName: 'Gin Hendrick’s 700ml',
      productCode: 'OUZ-GIN-01',
      timestamp: '23:20:05',
      fullBottles: 2,
      openBottleLevel: 0.1,
      totalCaptured: 2.1,
      station: 'speed_rail',
      bartender: 'Carlos Ruiz',
    },
    // Vodka Grey Goose
    {
      id: 'cap-07',
      productId: 'prod-03',
      productName: 'Vodka Grey Goose 750ml',
      productCode: 'OUZ-VOD-01',
      timestamp: '23:20:50',
      fullBottles: 3,
      openBottleLevel: 0.6,
      totalCaptured: 3.6,
      station: 'speed_rail',
      bartender: 'Carlos Ruiz',
    },
  ]);

  // Verified items for Google Sheets transfer
  const [verifiedItems, setVerifiedItems] = useState<ProductConsolidated[]>([]);

  // Subtab for KPI view
  const [kpiSubtab, setKpiSubtab] = useState<'kpi' | 'ficha'>('kpi');

  // Compute live consolidated items
  const computeConsolidated = (): ProductConsolidated[] => {
    return products.map((product) => {
      const pCaptures = confirmedCaptures.filter((c) => c.productId === product.id);
      const totalPhysical = pCaptures.reduce((sum, c) => sum + c.totalCaptured, 0);
      const theoreticalStock = product.initialStock + product.receipts - product.posSales;
      const difference = totalPhysical - theoreticalStock;
      const costImpact = difference * product.unitCost;

      let status: 'ok' | 'warning' | 'critical' = 'ok';
      if (pCaptures.length === 0) {
        status = 'warning';
      } else if (Math.abs(difference) <= 0.15) {
        status = 'ok';
      } else if (Math.abs(difference) <= 0.35) {
        status = 'warning';
      } else {
        status = 'critical';
      }

      return {
        product,
        captures: pCaptures,
        totalPhysical,
        theoreticalStock,
        difference,
        costImpact,
        status,
        verified: pCaptures.length > 0,
      };
    });
  };

  // Keep verified items in sync initially or when updated
  useEffect(() => {
    if (verifiedItems.length === 0) {
      setVerifiedItems(computeConsolidated());
    }
  }, [confirmedCaptures]);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Handlers
  const handleConfirmCapture = (capture: Omit<CaptureEntry, 'id' | 'timestamp'>) => {
    const newEntry: CaptureEntry = {
      ...capture,
      id: `cap-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setConfirmedCaptures((prev) => [...prev, newEntry]);
  };

  const handleDeleteCapture = (captureId: string) => {
    setConfirmedCaptures((prev) => prev.filter((c) => c.id !== captureId));
  };

  const [justifications, setJustifications] = useState<Record<string, string>>({
    'prod-01': 'Sobre-vertido / margen de coctelería',
  });

  const handleUpdateJustification = (productId: string, justification: string) => {
    setJustifications((prev) => ({
      ...prev,
      [productId]: justification,
    }));
  };

  const handleFinalizeAndSend = (items: ProductConsolidated[]) => {
    setIsTimerRunning(false);
    setVerifiedItems(items);
    setActiveTab('sheets');
  };

  return (
    <div className="min-h-screen bg-[#07111e] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onQuickStartCount={() => {
          setIsTimerRunning(true);
          setActiveTab('captura');
        }}
        isMobileSimulation={isMobileSimulation}
        onToggleMobileSimulation={() => setIsMobileSimulation(!isMobileSimulation)}
        confirmedCapturesCount={confirmedCaptures.length}
      />

      {/* Main Viewport */}
      <main className="flex-1">
        {isMobileSimulation ? (
          /* Mobile Frame Simulation (390px Bartender Phone) */
          <div className="py-6 px-4 flex justify-center bg-[#050c16] min-h-[calc(100vh-56px)]">
            <div className="w-full max-w-[420px] bg-[#07111e] border-8 border-[#1a3356] rounded-[42px] shadow-2xl overflow-hidden flex flex-col relative">
              {/* Speaker Notch */}
              <div className="w-28 h-4 bg-[#1a3356] rounded-b-xl mx-auto mb-2 shrink-0" />

              <div className="flex-1 overflow-y-auto">
                {activeTab === 'captura' && (
                  <CaptureModule
                    products={products}
                    confirmedCaptures={confirmedCaptures}
                    onConfirmCapture={handleConfirmCapture}
                    onDeleteCapture={handleDeleteCapture}
                    onProceedToCuadre={() => setActiveTab('cuadre')}
                    timerSeconds={timerSeconds}
                    bartenderName={bartenderName}
                    station={station}
                    setStation={setStation}
                    frequency={frequency}
                    setFrequency={setFrequency}
                  />
                )}
                {activeTab === 'cuadre' && (
                  <CuadreModule
                    products={products}
                    confirmedCaptures={confirmedCaptures}
                    justifications={justifications}
                    onGoBackToCapture={() => setActiveTab('captura')}
                    onProceedToVerification={() => setActiveTab('verificacion')}
                    onUpdateJustification={handleUpdateJustification}
                  />
                )}
                {activeTab === 'verificacion' && (
                  <VerificationModule
                    products={products}
                    confirmedCaptures={confirmedCaptures}
                    onGoBackToCuadre={() => setActiveTab('cuadre')}
                    onFinalizeAndSend={handleFinalizeAndSend}
                    bartenderName={bartenderName}
                    shift={shift}
                  />
                )}
                {activeTab === 'sheets' && (
                  <GoogleSheetsModule
                    verifiedItems={verifiedItems.length > 0 ? verifiedItems : computeConsolidated()}
                    bartenderName={bartenderName}
                    shift={shift}
                    durationSeconds={timerSeconds}
                  />
                )}
                {activeTab === 'dashboard' && (
                  <ParametricDashboard
                    verifiedItems={verifiedItems.length > 0 ? verifiedItems : computeConsolidated()}
                    bartenderName={bartenderName}
                    shift={shift}
                    frequency={frequency}
                    onGoToSheets={() => setActiveTab('sheets')}
                    onGoToCapture={() => setActiveTab('captura')}
                  />
                )}
                {activeTab === 'kpi' && (
                  <div className="p-3">
                    <KpiSimulatorView />
                  </div>
                )}
              </div>

              {/* Bottom Home Line */}
              <div className="w-32 h-1 bg-[#1a3356] rounded-full mx-auto my-2 shrink-0" />
            </div>
          </div>
        ) : (
          /* Desktop & Tablet Full Experience */
          <div>
            {activeTab === 'captura' && (
              <CaptureModule
                products={products}
                confirmedCaptures={confirmedCaptures}
                onConfirmCapture={handleConfirmCapture}
                onDeleteCapture={handleDeleteCapture}
                onProceedToCuadre={() => setActiveTab('cuadre')}
                timerSeconds={timerSeconds}
                bartenderName={bartenderName}
                station={station}
                setStation={setStation}
                frequency={frequency}
                setFrequency={setFrequency}
              />
            )}

            {activeTab === 'cuadre' && (
              <CuadreModule
                products={products}
                confirmedCaptures={confirmedCaptures}
                justifications={justifications}
                onGoBackToCapture={() => setActiveTab('captura')}
                onProceedToVerification={() => setActiveTab('verificacion')}
                onUpdateJustification={handleUpdateJustification}
              />
            )}

            {activeTab === 'verificacion' && (
              <VerificationModule
                products={products}
                confirmedCaptures={confirmedCaptures}
                onGoBackToCuadre={() => setActiveTab('cuadre')}
                onFinalizeAndSend={handleFinalizeAndSend}
                bartenderName={bartenderName}
                shift={shift}
              />
            )}

            {activeTab === 'sheets' && (
              <GoogleSheetsModule
                verifiedItems={verifiedItems.length > 0 ? verifiedItems : computeConsolidated()}
                bartenderName={bartenderName}
                shift={shift}
                durationSeconds={timerSeconds}
              />
            )}

            {activeTab === 'dashboard' && (
              <ParametricDashboard
                verifiedItems={verifiedItems.length > 0 ? verifiedItems : computeConsolidated()}
                bartenderName={bartenderName}
                shift={shift}
                frequency={frequency}
                onGoToSheets={() => setActiveTab('sheets')}
                onGoToCapture={() => setActiveTab('captura')}
              />
            )}

            {activeTab === 'kpi' && (
              <div className="space-y-6">
                <div className="max-w-6xl mx-auto px-4 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1 p-1 bg-[#0b1b32] border border-[#1a3356] rounded-xl">
                    <button
                      type="button"
                      onClick={() => setKpiSubtab('kpi')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                        kpiSubtab === 'kpi'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Simulador de Horas (22h → &lt;5h)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setKpiSubtab('ficha')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                        kpiSubtab === 'ficha'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Ficha Funcional Completa (Prompt Maestro 2)</span>
                    </button>
                  </div>
                </div>

                {kpiSubtab === 'kpi' ? <KpiSimulatorView /> : <FichaFuncionalView />}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Domain Operational Footer */}
      <footer className="border-t border-[#1a3356] bg-[#050e1a] py-5 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 justify-center sm:justify-start">
            <span className="font-extrabold text-white tracking-widest uppercase">OUZO</span>
            <span>· Control Digital de Inventarios de Bar & Cava</span>
          </p>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Reducción de 22h a &lt; 5h</span>
            <span aria-hidden="true">·</span>
            <span>Google Sheets & Drive Integrado</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => {
                setActiveTab('kpi');
                setKpiSubtab('ficha');
              }}
              className="text-amber-400 hover:underline"
            >
              Ficha Técnica
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
