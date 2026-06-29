import React from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    type: "positive" | "negative" | "neutral";
    text: string;
  };
  colorTheme?: "blue" | "green" | "red" | "amber" | "slate";
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  colorTheme = "blue",
}) => {
  const iconColors = {
    blue: "text-indigo-600 bg-indigo-50",
    green: "text-emerald-600 bg-emerald-50",
    red: "text-rose-600 bg-rose-50",
    amber: "text-amber-600 bg-amber-50",
    slate: "text-slate-600 bg-slate-50",
  }[colorTheme];

  const trendColors = trend
    ? {
        positive: "text-emerald-500 font-bold",
        negative: "text-rose-500 font-bold",
        neutral: "text-slate-400 font-medium",
      }[trend.type]
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors"
    >
      <div>
        <div className="flex justify-between items-start gap-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <div className={`p-1.5 rounded-lg ${iconColors}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">
            {value}
          </span>
          {trend && (
            <span className={`text-xs ${trendColors}`}>
              {trend.text}
            </span>
          )}
        </div>
      </div>
      
      {description && (
        <p className="text-[10px] text-slate-500 font-medium mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span>{description}</span>
        </p>
      )}
    </motion.div>
  );
};
