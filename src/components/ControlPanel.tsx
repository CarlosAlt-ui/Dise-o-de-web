import React, { useState } from "react";
import { 
  Sliders, 
  TrendingUp, 
  Zap, 
  Clock, 
  Package, 
  RefreshCw,
  HelpCircle,
  Plus,
  Trash2,
  GitCommit,
  Layers,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { MultiProductConfig, Producto } from "../types";
import { PRESET_SCENARIOS } from "../utils/simulation";

interface ControlPanelProps {
  config: MultiProductConfig;
  onChange: (newConfig: MultiProductConfig) => void;
  onRegenerate: () => void;
  selectedProductoId: string;
  onSelectProductoId: (id: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  onChange,
  onRegenerate,
  selectedProductoId,
  onSelectProductoId,
}) => {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(config.productos[0]?.id || null);

  const handleGlobalChange = <K extends keyof MultiProductConfig>(key: K, val: MultiProductConfig[K]) => {
    onChange({
      ...config,
      [key]: val,
    });
  };

  const handleProductChange = (productId: string, key: keyof Producto, val: any) => {
    const nuevosProductos = config.productos.map((p) => {
      if (p.id === productId) {
        return { ...p, [key]: val };
      }
      return p;
    });
    onChange({
      ...config,
      productos: nuevosProductos,
    });
  };

  const applyPreset = (presetId: string) => {
    const preset = PRESET_SCENARIOS.find((p) => p.id === presetId);
    if (preset) {
      onChange({ 
        diasSimulacion: preset.config.diasSimulacion,
        correlacionCruzada: preset.config.correlacionCruzada,
        productos: preset.config.productos.map(p => ({ ...p }))
      });
      if (preset.config.productos.length > 0) {
        onSelectProductoId(preset.config.productos[0].id);
        setExpandedProduct(preset.config.productos[0].id);
      }
    }
  };

  const agregarProducto = () => {
    const idUnico = `prod-${Date.now()}`;
    const nuevoProducto: Producto = {
      id: idUnico,
      nombre: `Insumo ${String.fromCharCode(65 + (config.productos.length % 26))}`, // Insumo D, E, F etc.
      demandaBase: 150,
      volatilidad: 20,
      stockInicial: 800,
      puntoReorden: 180,
      loteReabastecimiento: 400,
    };

    const nuevosProductos = [...config.productos, nuevoProducto];
    onChange({
      ...config,
      productos: nuevosProductos,
    });
    onSelectProductoId(idUnico);
    setExpandedProduct(idUnico);
  };

  const eliminarProducto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar expandir
    if (config.productos.length <= 1) {
      alert("La simulación requiere al menos un producto activo.");
      return;
    }
    const nuevosProductos = config.productos.filter((p) => p.id !== id);
    onChange({
      ...config,
      productos: nuevosProductos,
    });
    
    // Si eliminamos el seleccionado
    if (selectedProductoId === id) {
      const nuevoSeleccionado = nuevosProductos[0]?.id || "";
      onSelectProductoId(nuevoSeleccionado);
      setExpandedProduct(nuevoSeleccionado);
    } else if (expandedProduct === id) {
      setExpandedProduct(nuevosProductos[0]?.id || null);
    }
  };

  return (
    <aside className="w-full bg-slate-900 text-slate-300 rounded-2xl lg:rounded-none border border-slate-800 lg:border-r lg:border-slate-800 shadow-2xl flex flex-col overflow-hidden h-full">
      {/* Encabezado del Motor */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
            MOTOR ESTOCÁSTICO V3.0
          </h2>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight font-display">
          Gemelo Digital Multiproducto
        </h1>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Simula demandas estocásticas correlacionadas usando descomposición de Cholesky y matrices de covarianza.
        </p>
      </div>

      {/* Controles de Simulación */}
      <div className="p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar max-h-[820px]">
        
        {/* ESCENARIOS PREESTABLECIDOS */}
        <div>
          <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-3 flex items-center gap-2">
            <span className="opacity-50">01</span> ESCENARIOS PREDISEÑADOS
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_SCENARIOS.map((preset) => {
              // Comparación simple de coincidencia de preset
              const isSelected = preset.id === "standard_multi" && config.productos.length === 3 && config.correlacionCruzada === 0.35 ||
                                 preset.id === "high_volatility_multi" && config.correlacionCruzada === 0.65 && config.productos.length === 2;

              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`text-left p-2.5 rounded-lg border transition-all text-xs flex flex-col justify-between h-20 cursor-pointer ${
                    isSelected
                      ? "bg-indigo-950/40 border-indigo-500 text-white ring-1 ring-indigo-500/30"
                      : "bg-slate-800/20 hover:bg-slate-800/50 border-slate-850 text-slate-400"
                  }`}
                >
                  <span className={`font-bold block tracking-tight line-clamp-1 text-[11px] ${isSelected ? "text-indigo-400" : ""}`}>
                    {preset.nombre}
                  </span>
                  <span className="text-[9px] text-slate-500 block leading-tight line-clamp-2 mt-1">
                    {preset.descripcion}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PARÁMETROS GLOBALES */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest flex items-center gap-2">
            <span className="opacity-50">02</span> FACTORES DE MERCADO GLOBAL
          </h3>

          {/* Días de Simulación */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Horizonte Temporal</span>
              <span className="font-mono text-slate-300 font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/60">
                {config.diasSimulacion} Días
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={config.diasSimulacion}
              onChange={(e) => handleGlobalChange("diasSimulacion", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Correlación Cruzada entre Productos */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Correlación Cruzada (ρ)</span>
                <div className="group relative">
                  <HelpCircle className="w-3 h-3 text-slate-600 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-slate-950 text-white text-[9px] rounded shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 leading-relaxed z-20 border border-slate-800">
                    Define si las demandas se mueven juntas (ρ &gt; 0, complementos) o en contra (ρ &lt; 0, sustitutos).
                  </div>
                </div>
              </div>
              <span className="font-mono text-indigo-400 font-bold bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-900/40">
                {config.correlacionCruzada > 0 ? `+${config.correlacionCruzada}` : config.correlacionCruzada}
              </span>
            </div>
            <input
              type="range"
              min="-0.4"
              max="0.8"
              step="0.05"
              value={config.correlacionCruzada}
              onChange={(e) => handleGlobalChange("correlacionCruzada", parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </section>

        {/* ADMINISTRACIÓN DE INSUMOS */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <span className="opacity-50">03</span> CONFIGURAR INSUMOS ({config.productos.length})
            </h3>
            <button
              onClick={agregarProducto}
              className="px-2 py-1 bg-indigo-600/25 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded text-[10px] font-bold flex items-center gap-1 border border-indigo-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Añadir
            </button>
          </div>

          <div className="space-y-2">
            {config.productos.map((prod) => {
              const esExpandido = expandedProduct === prod.id;
              const esSeleccionadoGrafico = selectedProductoId === prod.id;

              return (
                <div 
                  key={prod.id} 
                  className={`border rounded-lg transition-all ${
                    esSeleccionadoGrafico 
                      ? "border-indigo-500 bg-slate-850/30" 
                      : "border-slate-850 bg-slate-900/40 hover:bg-slate-850/15"
                  }`}
                >
                  {/* Encabezado del Insumo */}
                  <div 
                    onClick={() => {
                      setExpandedProduct(esExpandido ? null : prod.id);
                      onSelectProductoId(prod.id);
                    }}
                    className="p-3 flex items-center justify-between cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${esSeleccionadoGrafico ? "bg-indigo-500" : "bg-slate-600"}`}></div>
                      <span className={`font-bold tracking-tight ${esSeleccionadoGrafico ? "text-white" : "text-slate-300"}`}>
                        {prod.nombre}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => eliminarProducto(prod.id, e)}
                        className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {esExpandido ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                    </div>
                  </div>

                  {/* Controles del Insumo */}
                  {esExpandido && (
                    <div className="px-3 pb-4 pt-1 border-t border-slate-850/60 space-y-3.5 bg-slate-950/20 rounded-b-lg">
                      
                      {/* Nombre Editable */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Nombre del Insumo</label>
                        <input
                          type="text"
                          value={prod.nombre}
                          onChange={(e) => handleProductChange(prod.id, "nombre", e.target.value)}
                          className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      {/* Demanda Base */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">Demanda Base Diaria</span>
                          <span className="font-mono text-indigo-400 font-bold">{prod.demandaBase} u</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="400"
                          step="10"
                          value={prod.demandaBase}
                          onChange={(e) => handleProductChange(prod.id, "demandaBase", parseInt(e.target.value))}
                          className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>

                      {/* Volatilidad */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">Volatilidad (σ)</span>
                          <span className="font-mono text-indigo-400 font-bold">{prod.volatilidad}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="80"
                          step="5"
                          value={prod.volatilidad}
                          onChange={(e) => handleProductChange(prod.id, "volatilidad", parseInt(e.target.value))}
                          className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>

                      {/* Stock Inicial */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">Inventario Inicial</span>
                          <span className="font-mono text-white font-semibold">{prod.stockInicial} u</span>
                        </div>
                        <input
                          type="range"
                          min="200"
                          max="2000"
                          step="50"
                          value={prod.stockInicial}
                          onChange={(e) => handleProductChange(prod.id, "stockInicial", parseInt(e.target.value))}
                          className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>

                      {/* Punto de Reorden */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">Punto de Reorden (R)</span>
                          <span className="font-mono text-rose-400 font-bold">{prod.puntoReorden} u</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="500"
                          step="10"
                          value={prod.puntoReorden}
                          onChange={(e) => handleProductChange(prod.id, "puntoReorden", parseInt(e.target.value))}
                          className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-rose-500"
                        />
                      </div>

                      {/* Lote Reabastecimiento */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">Lote Reorden (Q)</span>
                          <span className="font-mono text-indigo-400 font-bold">{prod.loteReabastecimiento} u</span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="1200"
                          step="50"
                          value={prod.loteReabastecimiento}
                          onChange={(e) => handleProductChange(prod.id, "loteReabastecimiento", parseInt(e.target.value))}
                          className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* Acción de Re-correr Simulación */}
      <div className="p-6 border-t border-slate-800 bg-slate-950/40">
        <button
          onClick={onRegenerate}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-indigo-950/50 text-[11px] tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 animate-spin-slow" />
          EJECUTAR MONTE CARLO
        </button>
      </div>
    </aside>
  );
};
