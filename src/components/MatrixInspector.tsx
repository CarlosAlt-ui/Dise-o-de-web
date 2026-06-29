import React from "react";
import { Table, Layers, Info, Grid } from "lucide-react";

interface MatrixInspectorProps {
  nombres: string[];
  correlacion: number[][];
  covarianza: number[][];
}

export const MatrixInspector: React.FC<MatrixInspectorProps> = ({
  nombres,
  correlacion,
  covarianza,
}) => {
  const n = nombres.length;

  const getCorrBg = (val: number) => {
    if (val === 1) return "bg-indigo-950/45 text-indigo-400 font-extrabold border border-indigo-800/40";
    if (val > 0) return "bg-emerald-950/20 text-emerald-400 border border-emerald-900/20";
    if (val < 0) return "bg-rose-950/20 text-rose-400 border border-rose-900/20";
    return "bg-slate-900/40 text-slate-400 border border-slate-800/20";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-950 border border-slate-850 p-6 rounded-xl shadow-xl">
      
      {/* 1. MATRIZ DE CORRELACIÓN (R) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Grid className="w-4 h-4 text-indigo-400" />
          <h3 className="font-display font-bold text-white text-xs uppercase tracking-wider">
            Matriz de Correlación Estocástica (R)
          </h3>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
          Mide el grado de co-movimiento entre las demandas de los insumos. Valores positivos simulan productos complementarios; negativos representan productos sustitutos.
        </p>

        <div className="overflow-x-auto rounded-lg border border-slate-850 bg-slate-900/20 p-2">
          <table className="w-full text-[11px] font-mono border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-slate-500 font-sans font-bold text-[9px] uppercase tracking-wider">Insumo</th>
                {nombres.map((nom, idx) => (
                  <th key={idx} className="p-2 text-center text-slate-400 font-semibold max-w-[80px] truncate" title={nom}>
                    {nom.split(" ")[1] || nom.slice(0, 5)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {correlacion.map((row, rIdx) => (
                <tr key={rIdx} className="border-t border-slate-850/50">
                  <td className="p-2 font-bold text-slate-300 max-w-[100px] truncate" title={nombres[rIdx]}>
                    {nombres[rIdx]}
                  </td>
                  {row.map((val, cIdx) => (
                    <td key={cIdx} className={`p-2.5 text-center font-bold rounded-sm ${getCorrBg(val)}`}>
                      {val.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. MATRIZ DE COVARIANZA (Sigma) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h3 className="font-display font-bold text-white text-xs uppercase tracking-wider">
            Matriz de Covarianza Simulada (Σ)
          </h3>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-medium">
          Expresa la variabilidad absoluta conjunta [Cov(i, j) = ρ(i, j) · σ_i · σ_j]. Es la matriz base descompuesta por el algoritmo de Cholesky para generar el ruido Gaussiano correlacionado.
        </p>

        <div className="overflow-x-auto rounded-lg border border-slate-850 bg-slate-900/20 p-2">
          <table className="w-full text-[11px] font-mono border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-slate-500 font-sans font-bold text-[9px] uppercase tracking-wider">Insumo</th>
                {nombres.map((nom, idx) => (
                  <th key={idx} className="p-2 text-center text-slate-400 font-semibold max-w-[80px] truncate" title={nom}>
                    {nom.split(" ")[1] || nom.slice(0, 5)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {covarianza.map((row, rIdx) => (
                <tr key={rIdx} className="border-t border-slate-850/50">
                  <td className="p-2 font-bold text-slate-300 max-w-[100px] truncate" title={nombres[rIdx]}>
                    {nombres[rIdx]}
                  </td>
                  {row.map((val, cIdx) => (
                    <td key={cIdx} className="p-2.5 text-center text-slate-200 bg-slate-950/50 border border-slate-850/50">
                      {Math.round(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ANOTACIÓN METODOLÓGICA */}
      <div className="col-span-1 lg:col-span-2 bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-lg flex gap-3 mt-2">
        <Info className="w-4.5 h-4.5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-[11px] text-indigo-300/95 leading-relaxed font-sans">
          <span className="font-bold uppercase text-[9px] text-indigo-400 block tracking-widest mb-1">
            EXPLICACIÓN ALGEBRAICA (MONTE CARLO MULTIVARIABLE)
          </span>
          Para simular demandas conjuntas realistas, el motor descompone la matriz de correlación R = L · L^T con el método de Cholesky. Luego, se genera un vector de choques aleatorios independientes Z ~ N(0, I) y se multiplica por la matriz triangular inferior L para inyectar correlación matemática. Finalmente, se escala por la volatilidad (sigmas) y se le suma la demanda base (medias) de cada insumo:
          <div className="font-mono text-center bg-slate-950/50 py-1.5 px-3 rounded border border-indigo-950/80 my-1 text-white font-semibold">
            Demanda_i = Media_i + (L * Z)_i * Volatilidad_i
          </div>
        </div>
      </div>

    </div>
  );
};
