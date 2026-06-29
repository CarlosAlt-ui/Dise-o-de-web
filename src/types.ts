export interface Producto {
  id: string;
  nombre: string;
  demandaBase: number;
  volatilidad: number; // Porcentaje (e.g. 20)
  stockInicial: number;
  puntoReorden: number;
  loteReabastecimiento: number;
}

export interface MultiProductConfig {
  productos: Producto[];
  diasSimulacion: number;
  correlacionCruzada: number; // Factor de correlación entre -0.5 y 0.8
}

export interface ProductDayResult {
  demanda: number;
  stockLevel: number;
  quiebre: boolean;
  reordenado: boolean;
}

export interface MultiProductResultDay {
  dia: number;
  productos: Record<string, ProductDayResult>;
}

export interface ProductSummary {
  productoId: string;
  nombre: string;
  stockFinal: number;
  quiebresStock: number;
  demandaPromedio: number;
  nivelServicio: number;
  totalVentas: number;
  totalReabastecimientos: number;
}

export interface MultiProductSimulationSummary {
  productosSummary: Record<string, ProductSummary>;
  history: MultiProductResultDay[];
  matrizCorrelacion: number[][];
  matrizCovarianza: number[][];
  nombresProductos: string[];
}

export interface PresetScenario {
  id: string;
  nombre: string;
  descripcion: string;
  config: MultiProductConfig;
}
