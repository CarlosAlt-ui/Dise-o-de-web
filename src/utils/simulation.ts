import { MultiProductConfig, MultiProductSimulationSummary, MultiProductResultDay, ProductSummary, Producto, PresetScenario } from "../types";

/**
 * Genera un número pseudoaleatorio siguiendo una distribución normal estándar N(0, 1)
 * utilizando la transformada de Box-Muller.
 */
export function randomNormalStandard(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); // Convierte [0,1) a (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Realiza la descomposición de Cholesky de una matriz simétrica definida positiva A.
 * Retorna la matriz triangular inferior L tal que L * L^T = A.
 * Si la matriz no es definida positiva, retorna null.
 */
export function descomponerCholesky(A: number[][]): number[][] | null {
  const n = A.length;
  const L: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let suma = 0;
      for (let k = 0; k < j; k++) {
        suma += L[i][k] * L[j][k];
      }

      if (i === j) {
        const diff = A[i][i] - suma;
        if (diff <= 1e-9) {
          return null; // No es definida positiva debido a error de redondeo o correlación inviable
        }
        L[i][j] = Math.sqrt(diff);
      } else {
        if (Math.abs(L[j][j]) < 1e-9) {
          return null;
        }
        L[i][j] = (A[i][j] - suma) / L[j][j];
      }
    }
  }
  return L;
}

/**
 * Clase que representa el nodo de inventario (Almacén) de un producto individual.
 */
export class NodoInventarioProducto {
  id: string;
  nombre: string;
  stock_actual: number;
  punto_reorden: number;
  lote_optimo: number;
  quiebres_stock: number = 0;
  total_reabastecimientos: number = 0;

  constructor(id: string, nombre: string, stock_inicial: number, punto_reorden: number, lote_optimo: number) {
    this.id = id;
    this.nombre = nombre;
    this.stock_actual = stock_inicial;
    this.punto_reorden = punto_reorden;
    this.lote_optimo = lote_optimo;
  }

  /**
   * Procesa la demanda real del día para este producto.
   * Retorna si ocurrió quiebre (stockout) y si se ordenó un lote de reabastecimiento.
   */
  procesar_dia(demanda_real: number): { quiebre: boolean; reordenado: boolean; stockPrevio: number } {
    let quiebre = false;
    let reordenado = false;
    const stockPrevio = this.stock_actual;

    // Se resta la demanda del día
    this.stock_actual -= demanda_real;

    // Si nos quedamos sin stock
    if (this.stock_actual < 0) {
      this.quiebres_stock += 1;
      this.stock_actual = 0; // No hay stock físico negativo
      quiebre = true;
    }

    // Política de reorden automática autónoma
    if (this.stock_actual <= this.punto_reorden) {
      this.stock_actual += this.lote_optimo;
      this.total_reabastecimientos += 1;
      reordenado = true;
    }

    return { quiebre, reordenado, stockPrevio };
  }
}

/**
 * Ejecuta la simulación multi-producto Monte Carlo utilizando Cholesky y matrices de covarianza.
 */
export function runMultiProductSimulation(config: MultiProductConfig): MultiProductSimulationSummary {
  const { productos, diasSimulacion, correlacionCruzada } = config;
  const n = productos.length;

  // 1. Construir la Matriz de Correlación (R)
  // R_ii = 1.0, R_ij = correlacionCruzada (para i != j)
  let R: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) R[i][j] = 1.0;
      else R[i][j] = correlacionCruzada;
    }
  }

  // Intentar Cholesky en R. Si falla, bajamos la correlación hasta que sea definida positiva
  let L: number[][] | null = null;
  let corrAdaptada = correlacionCruzada;
  for (let intento = 0; intento < 10; intento++) {
    // Reconstruir con la correlación adaptada
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) R[i][j] = corrAdaptada;
      }
    }
    L = descomponerCholesky(R);
    if (L !== null) break;
    corrAdaptada *= 0.5; // Reducimos correlación a la mitad si falla
  }

  // Si aún falla, forzamos matriz identidad (independencia)
  if (L === null) {
    corrAdaptada = 0;
    R = Array(n).fill(0).map(() => Array(n).fill(0));
    L = Array(n).fill(0).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      R[i][i] = 1.0;
      L[i][i] = 1.0;
    }
  }

  // 2. Calcular la Matriz de Covarianza (Sigma)
  // Sigma_ij = R_ij * sigma_i * sigma_j
  const sigmas = productos.map(p => p.demandaBase * (p.volatilidad / 100));
  const Sigma: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      Sigma[i][j] = R[i][j] * sigmas[i] * sigmas[j];
    }
  }

  // 3. Inicializar Nodos de Inventario
  const nodos = productos.map(
    p => new NodoInventarioProducto(p.id, p.nombre, p.stockInicial, p.puntoReorden, p.loteReabastecimiento)
  );

  // Inicializar acumuladores para KPIs
  const sumaDemanda = Array(n).fill(0);
  const totalVentas = Array(n).fill(0);

  const history: MultiProductResultDay[] = [];

  // 4. Bucle principal de simulación por días
  for (let dia = 1; dia <= diasSimulacion; dia++) {
    // Generar demandas correlacionadas usando la matriz L (Cholesky)
    // Demanda = mu + L * Z * sigma (o directamente usando Cholesky de la covarianza)
    // Para simplificar y mantener rigor:
    // Generamos n normales estándar independientes Z
    const Z = Array(n).fill(0).map(() => randomNormalStandard());
    
    // Multiplicamos L * Z para obtener normales con correlación R
    const Y = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let suma = 0;
      for (let j = 0; j < n; j++) {
        suma += L![i][j] * Z[j];
      }
      Y[i] = suma;
    }

    // Convertimos a demandas finales escalando por desv. estándar y sumando la media
    const demandasDelDia = productos.map((p, idx) => {
      const de = p.demandaBase * (p.volatilidad / 100);
      let d = p.demandaBase + Y[idx] * de;
      return Math.max(0, d); // No puede haber demanda negativa
    });

    const diarioResultados: Record<string, { demanda: number; stockLevel: number; quiebre: boolean; reordenado: boolean }> = {};

    for (let idx = 0; idx < n; idx++) {
      const nodo = nodos[idx];
      const p = productos[idx];
      const demandaReal = demandasDelDia[idx];

      const { quiebre, reordenado, stockPrevio } = nodo.procesar_dia(demandaReal);
      const ventaReal = quiebre ? stockPrevio : demandaReal;

      sumaDemanda[idx] += demandaReal;
      totalVentas[idx] += ventaReal;

      diarioResultados[p.id] = {
        demanda: parseFloat(demandaReal.toFixed(2)),
        stockLevel: parseFloat(nodo.stock_actual.toFixed(2)),
        quiebre,
        reordenado,
      };
    }

    history.push({
      dia,
      productos: diarioResultados,
    });
  }

  // 5. Construir los resúmenes por producto
  const productosSummary: Record<string, ProductSummary> = {};
  for (let idx = 0; idx < n; idx++) {
    const p = productos[idx];
    const nodo = nodos[idx];
    const avgDemanda = sumaDemanda[idx] / diasSimulacion;
    const servicio = ((diasSimulacion - nodo.quiebres_stock) / diasSimulacion) * 100;

    productosSummary[p.id] = {
      productoId: p.id,
      nombre: p.nombre,
      stockFinal: parseFloat(nodo.stock_actual.toFixed(2)),
      quiebresStock: nodo.quiebres_stock,
      demandaPromedio: parseFloat(avgDemanda.toFixed(2)),
      nivelServicio: parseFloat(servicio.toFixed(2)),
      totalVentas: parseFloat(totalVentas[idx].toFixed(2)),
      totalReabastecimientos: nodo.total_reabastecimientos,
    };
  }

  const nombresProductos = productos.map(p => p.nombre);

  return {
    productosSummary,
    history,
    matrizCorrelacion: R.map(row => row.map(v => parseFloat(v.toFixed(3)))),
    matrizCovarianza: Sigma.map(row => row.map(v => parseFloat(v.toFixed(2)))),
    nombresProductos,
  };
}

/**
 * Escenarios preestablecidos multi-producto para análisis estocástico robusto.
 */
export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: "standard_multi",
    nombre: "Cadena Multiproducto Estándar",
    descripcion: "Tres productos (Alimentos, Bebidas y Embalajes) con correlación positiva moderada.",
    config: {
      diasSimulacion: 30,
      correlacionCruzada: 0.35,
      productos: [
        {
          id: "prod-alimentos",
          nombre: "Línea Alimentos Secos",
          demandaBase: 220,
          volatilidad: 15,
          stockInicial: 1200,
          puntoReorden: 250,
          loteReabastecimiento: 600,
        },
        {
          id: "prod-bebidas",
          nombre: "Línea Bebidas Frías",
          demandaBase: 180,
          volatilidad: 25,
          stockInicial: 900,
          puntoReorden: 200,
          loteReabastecimiento: 500,
        },
        {
          id: "prod-embalajes",
          nombre: "Cajas de Embalaje",
          demandaBase: 250,
          volatilidad: 10,
          stockInicial: 1500,
          puntoReorden: 300,
          loteReabastecimiento: 800,
        },
      ],
    },
  },
  {
    id: "high_volatility_multi",
    nombre: "Tormenta de Suministros (Alta Volatilidad)",
    descripcion: "Alta correlación cruzada y volatilidad extrema. Desafío para el stock de seguridad.",
    config: {
      diasSimulacion: 40,
      correlacionCruzada: 0.65,
      productos: [
        {
          id: "prod-alimentos",
          nombre: "Línea Alimentos Secos",
          demandaBase: 240,
          volatilidad: 45,
          stockInicial: 800,
          puntoReorden: 400,
          loteReabastecimiento: 900,
        },
        {
          id: "prod-bebidas",
          nombre: "Línea Bebidas Frías",
          demandaBase: 200,
          volatilidad: 55,
          stockInicial: 600,
          puntoReorden: 350,
          loteReabastecimiento: 700,
        },
      ],
    },
  },
  {
    id: "just_in_time_multi",
    nombre: "Estrés Just-In-Time (JIT Multi)",
    descripcion: "Inventarios mínimos y reabastecimiento rápido. Riesgo inminente de quiebre en cadena.",
    config: {
      diasSimulacion: 30,
      correlacionCruzada: 0.10,
      productos: [
        {
          id: "prod-alimentos",
          nombre: "Línea Alimentos Secos",
          demandaBase: 120,
          volatilidad: 8,
          stockInicial: 300,
          puntoReorden: 130,
          loteReabastecimiento: 180,
        },
        {
          id: "prod-bebidas",
          nombre: "Línea Bebidas Frías",
          demandaBase: 90,
          volatilidad: 12,
          stockInicial: 250,
          puntoReorden: 100,
          loteReabastecimiento: 140,
        },
      ],
    },
  },
];
