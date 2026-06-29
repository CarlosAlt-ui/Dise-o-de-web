import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { MultiProductResultDay, Producto } from "../types";

interface SimulationChartProps {
  data: MultiProductResultDay[];
  productos: Producto[];
  selectedProductoId: string;
  onSelectProductoId: (id: string) => void;
}

export const SimulationChart: React.FC<SimulationChartProps> = ({
  data,
  productos,
  selectedProductoId,
  onSelectProductoId,
}) => {
  const activo = productos.find((p) => p.id === selectedProductoId) || productos[0];

  if (!activo) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-center text-slate-500">
        No hay datos de productos disponibles para graficar.
      </div>
    );
  }

  // Mapear los datos de simulación multi-producto para el producto activo
  const chartData = data.map((d) => {
    const prodRes = d.productos[activo.id];
    return {
      dia: d.dia,
      stockLevel: prodRes ? prodRes.stockLevel : 0,
      demanda: prodRes ? prodRes.demanda : 0,
      quiebre: prodRes ? prodRes.quiebre : false,
      reordenado: prodRes ? prodRes.reordenado : false,
    };
  });

  // Personalización del Tooltip interactivo (totalmente en español)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const stock = payload[0]?.value;
      const demanda = payload[1]?.value;
      const dayData = payload[0]?.payload;

      return (
        <div className="bg-slate-950 border border-slate-800 text-slate-100 p-4 rounded-xl shadow-2xl text-xs max-w-xs font-sans leading-relaxed z-30">
          <p className="font-bold text-slate-400 border-b border-slate-800 pb-1.5 mb-2 font-mono">
            Día {label}
          </p>
          <div className="space-y-1.5 font-medium">
            <div className="flex justify-between gap-6">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full inline-block"></span>
                Nivel de Stock:
              </span>
              <span className="font-bold text-indigo-400 font-mono">{stock} unds</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-slate-400 rounded-full inline-block"></span>
                Demanda del Día:
              </span>
              <span className="font-bold text-slate-200 font-mono">{demanda} unds</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 border-t border-dashed border-rose-500 inline-block"></span>
                Punto de Reorden:
              </span>
              <span className="font-bold text-rose-400 font-mono">{activo.puntoReorden} unds</span>
            </div>
          </div>

          {(dayData?.quiebre || dayData?.reordenado) && (
            <div className="mt-3 pt-2 border-t border-slate-850 space-y-1 text-[10px]">
              {dayData.quiebre && (
                <div className="text-rose-400 bg-rose-950/40 px-2 py-1 rounded border border-rose-900/40 font-semibold flex items-center gap-1">
                  ⚠️ Quiebre de Stock (Desabastecimiento)
                </div>
              )}
              {dayData.reordenado && (
                <div className="text-indigo-400 bg-indigo-950/40 px-2 py-1 rounded border border-indigo-900/40 font-semibold flex items-center gap-1">
                  🔄 Reabastecimiento Automático
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-display">
            Fluctuación de Inventario vs. Demanda de Mercado
          </h2>
          <p className="text-xs text-slate-500">
            Resultados de la simulación estocástica multivariada en tiempo real
          </p>
        </div>

        {/* Selector de Producto Activo para el gráfico */}
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Producto:</span>
          <select
            value={selectedProductoId}
            onChange={(e) => onSelectProductoId(e.target.value)}
            className="flex-1 sm:flex-none text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 cursor-pointer focus:outline-hidden"
          >
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leyenda en español */}
      <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-500 rounded"></div>
          <span className="text-slate-600 font-medium">Nivel de Stock ({activo.nombre})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-slate-300 rounded"></div>
          <span className="text-slate-600 font-medium">Demanda Estocástica</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 border-t border-dashed border-rose-500"></div>
          <span className="text-slate-600 font-medium">Punto de Reorden ({activo.puntoReorden} u)</span>
        </div>
      </div>

      <div className="w-full h-[320px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            <XAxis
              dataKey="dia"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
              tickFormatter={(val) => `Día ${val}`}
            />

            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dx={-5}
              tickFormatter={(val) => `${val} u`}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#f1f5f9", strokeWidth: 1 }} />

            {/* Punto de Reorden horizontal */}
            <ReferenceLine
              y={activo.puntoReorden}
              stroke="#f43f5e"
              strokeDasharray="8 8"
              strokeWidth={1.5}
            />

            {/* Nivel de Stock (Indigo Sawtooth) */}
            <Area
              name="Stock"
              type="monotone"
              dataKey="stockLevel"
              stroke="#6366f1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorStock)"
              activeDot={{ r: 5, strokeWidth: 0, fill: "#6366f1" }}
            />

            {/* Demanda de Mercado (Gris Estocástico) */}
            <Line
              name="Demanda"
              type="monotone"
              dataKey="demanda"
              stroke="#cbd5e1"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 4"
              activeDot={{ r: 4, strokeWidth: 0, fill: "#94a3b8" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
