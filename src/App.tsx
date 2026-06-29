import { useState, useMemo } from "react";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Sparkles,
  Info,
  Layers,
  CheckCircle,
  HelpCircle,
  Grid
} from "lucide-react";
import { MultiProductConfig, Producto, ProductSummary } from "./types";
import { runMultiProductSimulation, PRESET_SCENARIOS } from "./utils/simulation";
import { ControlPanel } from "./components/ControlPanel";
import { KpiCard } from "./components/KpiCard";
import { SimulationChart } from "./components/SimulationChart";
import { MatrixInspector } from "./components/MatrixInspector";
import { LogsTable } from "./components/LogsTable";
import { motion } from "motion/react";

export default function App() {
  // Inicialización de la configuración multi-producto con el escenario estándar preestablecido
  const initialPreset = PRESET_SCENARIOS[0]; // standard_multi
  
  const [config, setConfig] = useState<MultiProductConfig>({
    diasSimulacion: initialPreset.config.diasSimulacion,
    correlacionCruzada: initialPreset.config.correlacionCruzada,
    productos: initialPreset.config.productos.map(p => ({ ...p })),
  });

  // Estado del insumo/producto seleccionado actualmente para KPIs y Gráficas
  const [selectedProductoId, setSelectedProductoId] = useState<string>(
    initialPreset.config.productos[0]?.id || ""
  );

  // Semilla para re-ejecutar simulación estocástica Monte Carlo (generación de caos)
  const [seed, setSeed] = useState<number>(0);

  // Ejecuta el motor de simulación estocástica reactivamente con useMemo
  const results = useMemo(() => {
    return runMultiProductSimulation(config);
  }, [config, seed]);

  const handleRegenerate = () => {
    setSeed((prev) => prev + 1);
  };

  // Obtener el producto activo actual para mostrar métricas individuales
  const productoActivo = useMemo(() => {
    return config.productos.find((p) => p.id === selectedProductoId) || config.productos[0];
  }, [config.productos, selectedProductoId]);

  // Obtener el resumen operativo para el producto activo
  const resumenActivo = useMemo(() => {
    if (!productoActivo || !results.productosSummary[productoActivo.id]) {
      return {
        stockFinal: 0,
        quiebresStock: 0,
        demandaPromedio: 0,
        nivelServicio: 100,
        totalVentas: 0,
        totalReabastecimientos: 0,
      };
    }
    return results.productosSummary[productoActivo.id];
  }, [results, productoActivo]);

  // Determinar color y texto de alerta del stock final del producto activo
  const getStockStatus = () => {
    if (!productoActivo) return { text: "Sin Insumo", color: "slate" as const };
    if (resumenActivo.stockFinal === 0) {
      return { text: "Almacén Desabastecido", color: "red" as const };
    }
    if (resumenActivo.stockFinal <= productoActivo.puntoReorden) {
      return { text: "Bajo Punto de Reorden", color: "amber" as const };
    }
    return { text: "Stock Operativo", color: "green" as const };
  };

  const stockStatus = getStockStatus();

  // Calcular métricas agregadas globales de la cadena de suministro multiproducto
  const metricasGlobales = useMemo(() => {
    const summaries = Object.values(results.productosSummary) as ProductSummary[];
    const totalQuiebres = summaries.reduce((acc, p) => acc + p.quiebresStock, 0);
    const avgNivelServicio = summaries.reduce((acc, p) => acc + p.nivelServicio, 0) / config.productos.length;
    const totalReabastecimientos = summaries.reduce((acc, p) => acc + p.totalReabastecimientos, 0);

    return {
      totalQuiebres,
      avgNivelServicio: parseFloat(avgNivelServicio.toFixed(1)),
      totalReabastecimientos,
    };
  }, [results, config.productos.length]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-800 selection:bg-slate-900 selection:text-white">
      
      {/* 1. SIDEBAR DE CONTROLES MULTIPRODUCTO */}
      <div className="w-full lg:w-85 lg:h-screen lg:sticky lg:top-0 flex-shrink-0 z-20">
        <ControlPanel
          config={config}
          onChange={setConfig}
          onRegenerate={handleRegenerate}
          selectedProductoId={selectedProductoId}
          onSelectProductoId={setSelectedProductoId}
        />
      </div>

      {/* 2. ÁREA PRINCIPAL DEL DASHBOARD */}
      <main className="flex-1 flex flex-col p-4 sm:p-8 lg:h-screen lg:overflow-y-auto">
        
        {/* Encabezado Dinámico en Español */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                <Sparkles className="w-2.5 h-2.5" /> MODELO MULTIVARIABLE
              </span>
              <span className="text-xs text-slate-400 font-mono font-medium">Corrida Estocástica #{seed + 1}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
              Simulador Monte Carlo Multiproducto
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Evaluación estocástica de políticas autónomas e interdependencias en la cadena de suministros.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-2 border border-slate-200/60 rounded-xl shadow-xs self-start sm:self-auto">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
              {config.productos.length} Insumos Activos
            </span>
            <span className="text-slate-200">|</span>
            <span className="text-xs font-mono font-bold text-slate-500">
              Horizonte: {config.diasSimulacion} Días
            </span>
          </div>
        </header>

        {/* Sección Informativa: Selección Activa */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200/80 rounded-xl px-5 py-3 gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Info className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Viendo métricas de: <strong className="text-slate-900">{productoActivo?.nombre || "Ninguno"}</strong>. Haz clic en otro insumo en el panel izquierdo para cambiar.
            </p>
          </div>

          {/* Estado de Salud Global */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Nivel de Servicio Promedio:</span>
            <span className={`px-2 py-0.5 rounded font-mono text-[11px] ${
              metricasGlobales.avgNivelServicio >= 90 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              {metricasGlobales.avgNivelServicio}%
            </span>
          </div>
        </div>

        {/* Cuadrícula de KPIs para el Insumo Seleccionado */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KpiCard
            title="Inventario Final"
            value={productoActivo ? Math.round(resumenActivo.stockFinal) : 0}
            icon={Package}
            description={stockStatus.text}
            colorTheme={stockStatus.color}
            trend={productoActivo ? {
              type: resumenActivo.stockFinal >= productoActivo.stockInicial ? "positive" : "negative",
              text: `${resumenActivo.stockFinal >= productoActivo.stockInicial ? "+" : ""}${Math.round(((resumenActivo.stockFinal - productoActivo.stockInicial) / productoActivo.stockInicial) * 100)}%`,
            } : undefined}
          />
          <KpiCard
            title="Quiebres de Stock"
            value={resumenActivo.quiebresStock}
            icon={AlertTriangle}
            description={resumenActivo.quiebresStock === 0 ? "Sin quiebres registrados" : "Días con quiebre de stock"}
            colorTheme={resumenActivo.quiebresStock === 0 ? "green" : "red"}
            trend={{
              type: resumenActivo.quiebresStock === 0 ? "positive" : "negative",
              text: `${resumenActivo.quiebresStock} / ${config.diasSimulacion} d`,
            }}
          />
          <KpiCard
            title="Demanda Promedio"
            value={Math.round(resumenActivo.demandaPromedio)}
            icon={TrendingUp}
            description="Demanda diaria calculada"
            colorTheme="slate"
            trend={productoActivo ? {
              type: "neutral",
              text: `Volatilidad: ${productoActivo.volatilidad}%`,
            } : undefined}
          />
          <KpiCard
            title="Nivel de Servicio"
            value={`${resumenActivo.nivelServicio}%`}
            icon={Activity}
            description="Pedidos totalmente surtidos"
            colorTheme={resumenActivo.nivelServicio >= 95 ? "green" : resumenActivo.nivelServicio >= 80 ? "amber" : "red"}
            trend={{
              type: resumenActivo.nivelServicio >= 95 ? "positive" : "negative",
              text: resumenActivo.nivelServicio >= 95 ? "Óptimo" : "Revisar políticas",
            }}
          />
        </section>

        {/* Área del Gráfico Principal */}
        <section className="mb-8">
          <SimulationChart
            data={results.history}
            productos={config.productos}
            selectedProductoId={selectedProductoId}
            onSelectProductoId={setSelectedProductoId}
          />
        </section>

        {/* METODOLOGÍA Y MATRICES COMPLEJAS */}
        <section className="mb-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-slate-200 text-slate-800 text-[9px] font-bold uppercase rounded font-mono">Algebra Lineal</span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Visualizador de Matrices Complejas</h2>
          </div>
          <MatrixInspector
            nombres={results.nombresProductos}
            correlacion={results.matrizCorrelacion}
            covarianza={results.matrizCovarianza}
          />
        </section>

        {/* Logs de la base de datos simulada */}
        <section className="mb-8">
          <LogsTable 
            data={results.history} 
            productos={config.productos}
            selectedProductoId={selectedProductoId}
            onSelectProductoId={setSelectedProductoId}
          />
        </section>

        {/* Pie de Página */}
        <footer className="text-center py-4 mt-auto text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
          Gemelo Digital Estocástico de Cadena Multiproducto • Diseñado en base a Balances Geométricos
        </footer>
      </main>
    </div>
  );
}
