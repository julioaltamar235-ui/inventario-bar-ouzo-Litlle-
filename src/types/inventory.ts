export type ProductCategory =
  | 'destilados'
  | 'aperitivos'
  | 'licores_aperitivos'
  | 'vinos_cavas'
  | 'vinos_espumantes'
  | 'cervezas_mixers';

export type StationLocation =
  | 'speed_rail'
  | 'botellero_principal'
  | 'cava_vinos'
  | 'nevera_cervezas'
  | 'reserva_bodega'
  | 'nevera'
  | 'almacen_barra';

export type InventoryFrequency = 'diario' | 'semanal' | 'mensual';

export interface Product {
  id: string;
  code: string; // Código interno Ouzo (ej: OUZ-WHI-01)
  name: string;
  category: ProductCategory;
  brand: string;
  sizeMl: number;
  location: StationLocation;
  unitCost: number; // Costo unitario en USD
  initialStock: number; // Stock inicio de turno
  receipts: number; // Entradas de bodega
  posSales: number; // Ventas teóricas registradas en POS
  parLevel: number; // Nivel de stock de seguridad / reorden en barra
}

export interface BottleCountItem {
  productId: string;
  fullBottles: number;
  openBottleLevel: number;
  justification?: string;
  verified: boolean;
}

export interface InventoryCountSummary {
  id: string;
  date: string;
  bartenderName: string;
  shift: 'Apertura' | 'Intermedio' | 'Cierre' | string;
  durationSeconds: number;
  items: {
    product: Product;
    physicalStock: number;
    theoreticalStock: number;
    difference: number;
    costImpact: number;
    status: 'ok' | 'warning' | 'critical';
    justification?: string;
  }[];
  totalDiscrepancyBottles: number;
  totalCostImpact: number;
  criticalItemsCount: number;
}

export interface CaptureEntry {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  timestamp: string;
  fullBottles: number; // Botellas cerradas
  openBottleLevel: number; // Fracción de botella abierta (0.0 a 0.9)
  totalCaptured: number; // Suma de esta captura
  station: StationLocation;
  bartender: string;
  note?: string;
}

export interface ProductConsolidated {
  product: Product;
  captures: CaptureEntry[]; // Todas las capturas confirmadas para este producto
  totalPhysical: number; // Suma acumulativa automática de todas las capturas
  theoreticalStock: number; // initialStock + receipts - posSales
  difference: number; // totalPhysical - theoreticalStock
  costImpact: number; // difference * unitCost
  status: 'ok' | 'warning' | 'critical';
  justification?: string;
  verified: boolean;
  approvedAdjustment?: number;
}

export interface GoogleSheetsSyncState {
  sheetId: string;
  sheetName: string;
  driveFolder: string;
  lastSyncTimestamp: string | null;
  isSyncing: boolean;
  syncSuccess: boolean;
  rowsCount: number;
  sheetTabActive: string;
  sheetTabs: string[];
}

export interface DashboardParameters {
  toleranceBottles: number;
  demandMultiplier: number;
  targetPourCostPct: number;
  categoryFilter: string;
  stationFilter: string;
}

