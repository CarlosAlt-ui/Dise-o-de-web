import React, { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Database, 
  AlertTriangle, 
  RefreshCw,
  Download
} from "lucide-react";
import { MultiProductResultDay, Producto } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface LogsTableProps {
  data: MultiProductResultDay[];
  productos: Producto[];
  selectedProductoId: string;
  onSelectProductoId: (id: string) => void;
}

export const LogsTable: React.FC<LogsTableProps> = ({ 
  data, 
  productos, 
  selectedProductoId, 
  onSelectProductoId 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "quiebres" | "reordenes">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const activo = productos.find((p) => p.id === selectedProductoId) || productos[0];

  if (!activo) return null;

  // Filtrar los datos para el producto activo
  const filteredData = data.filter((row) => {
    const prodRes = row.productos[activo.id];
    if (!prodRes) return false;

    const matchesSearch = row.dia.toString().includes(searchTerm) || searchTerm === "";
    
    if (filterType === "quiebres") {
      return matchesSearch && prodRes.quiebre;
    }
    if (filterType === "reordenes") {
      return matchesSearch && prodRes.reordenado;
    }
    return matchesSearch;
  });

  const downloadCSV = () => {
    const headers = ["Día", "Producto", "Demanda (unds)", "Nivel de Stock (unds)", "Quiebre", "Reorden"];
    
    const csvRows: string[] = [headers.join(",")];
    
    data.forEach((row) => {
      productos.forEach((p) => {
        const res = row.productos[p.id];
        if (res) {
          csvRows.push([
            row.dia,
            `"${p.nombre}"`,
            res.demanda,
            res.stockLevel,
            res.quiebre ? "SÍ" : "NO",
            res.reordenado ? "SÍ" : "NO"
          ].join(","));
        }
      });
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `log_multiproducto_inventario_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Verificar si hay quiebres de stock en el producto seleccionado
  const tieneQuiebresActivo = data.some((r) => r.productos[activo.id]?.quiebre);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
      {/* Botón de Expansión del Panel */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between bg-slate-950/60 hover:bg-slate-950 transition-colors text-left cursor-pointer border-b border-slate-850"
      >
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-indigo-400" />
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-display font-bold text-white text-xs uppercase tracking-wider">
                Logs de Operación Estocástica
              </h3>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                tieneQuiebresActivo 
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                  : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
              }`}>
                {tieneQuiebresActivo ? "Estrés en Cadena" : "Sistema Estable"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Audita las transacciones y decisiones autónomas simuladas para cada producto en tiempo real.
            </p>
          </div>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Contenedor Expandible */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-4">
              
              {/* Filtros e Inputs */}
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                
                {/* Selector de Producto en los Logs */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Filtrar por Insumo:</span>
                  <select
                    value={selectedProductoId}
                    onChange={(e) => onSelectProductoId(e.target.value)}
                    className="text-[11px] font-bold text-slate-300 bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-hidden"
                  >
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtros de Eventos */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-bold self-start">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                      filterType === "all"
                        ? "bg-slate-800 text-white shadow-md"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFilterType("quiebres")}
                    className={`px-3 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer ${
                      filterType === "quiebres"
                        ? "bg-rose-950/40 text-rose-400 border border-rose-900/40"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Quiebres ({data.filter((r) => r.productos[activo.id]?.quiebre).length})
                  </button>
                  <button
                    onClick={() => setFilterType("reordenes")}
                    className={`px-3 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer ${
                      filterType === "reordenes"
                        ? "bg-indigo-950/40 text-indigo-400 border border-indigo-900/40"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Reordenes ({data.filter((r) => r.productos[activo.id]?.reordenado).length})
                  </button>
                </div>

                {/* Buscador de Días y Botón de Descarga */}
                <div className="flex items-center gap-3 justify-end">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar día..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-[11px] font-medium text-slate-100 focus:outline-hidden focus:border-slate-700 placeholder-slate-600"
                    />
                  </div>
                  <button
                    onClick={downloadCSV}
                    className="p-1.5 border border-slate-800 text-slate-300 bg-slate-950 hover:bg-slate-900 hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Exportar base de datos simulada"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV Completo</span>
                  </button>
                </div>
              </div>

              {/* Contenedor de la Tabla */}
              <div className="overflow-x-auto border border-slate-800/80 rounded-lg max-h-[360px] no-scrollbar">
                <table className="w-full border-collapse text-left font-mono text-[11px]">
                  <thead className="bg-slate-950 text-indigo-400 font-bold sticky top-0 border-b border-slate-800 z-10 uppercase tracking-widest text-[9px]">
                    <tr>
                      <th className="px-5 py-3">DÍA</th>
                      <th className="px-5 py-3">PRODUCTO_ID</th>
                      <th className="px-5 py-3 text-right">DEMANDA_CALC</th>
                      <th className="px-5 py-3 text-right">STOCK_RESID</th>
                      <th className="px-5 py-3 text-center">EVENTO_SISTEMA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-400">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-600 font-sans">
                          No se encontraron transacciones en esta vista.
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((row) => {
                        const res = row.productos[activo.id];
                        if (!res) return null;

                        let rowBg = "hover:bg-slate-850/30";
                        if (res.quiebre) rowBg = "bg-rose-950/15 hover:bg-rose-950/25";
                        else if (res.reordenado) rowBg = "bg-indigo-950/10 hover:bg-indigo-950/20";

                        return (
                          <tr key={`${row.dia}-${activo.id}`} className={`transition-colors ${rowBg}`}>
                            <td className="px-5 py-3 text-slate-500 font-bold">
                              [{row.dia.toString().padStart(2, "0")}]
                            </td>
                            <td className="px-5 py-3 text-slate-300 font-bold">
                              {activo.id.toUpperCase()}
                            </td>
                            <td className="px-5 py-3 text-right text-slate-300">
                              {res.demanda.toFixed(2)} u
                            </td>
                            <td className="px-5 py-3 text-right text-slate-100 font-bold">
                              {res.stockLevel.toFixed(2)} u
                            </td>
                            <td className="px-5 py-3 text-center font-sans">
                              <div className="flex items-center justify-center">
                                {res.quiebre && (
                                  <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase tracking-wider">
                                    Quiebre_Inmediato
                                  </span>
                                )}
                                {res.reordenado && (
                                  <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                                    Reorden_Disparado
                                  </span>
                                )}
                                {!res.quiebre && !res.reordenado && (
                                  <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold bg-slate-800 text-slate-500 border border-slate-800/80 uppercase tracking-wider">
                                    En_Espera
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Leyenda en español */}
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 font-semibold pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-sm bg-rose-500/20 border border-rose-500/30 inline-block"></span>
                  Quiebre de Stock (Desabastecimiento)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-sm bg-indigo-500/20 border border-indigo-500/30 inline-block"></span>
                  Pedido de Reabastecimiento Automático
                </span>
              </div>
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
