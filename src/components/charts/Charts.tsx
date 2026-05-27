import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { categoryMeta, formatINR } from "@/lib/mock-data";

const grid = "oklch(0.7 0.04 280 / 0.15)";
const axisColor = "oklch(0.55 0.03 280)";

const tooltipStyle = {
  background: "oklch(1 0 0 / 0.85)",
  border: "1px solid oklch(0.9 0.02 280 / 0.6)",
  borderRadius: 16,
  backdropFilter: "blur(20px)",
  fontSize: 12,
  color: "oklch(0.22 0.04 270)",
};

export function IncomeExpenseArea({ data }: { data: { month: string; income: number; expense: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.18 155)" stopOpacity={0.6} />
            <stop offset="100%" stopColor="oklch(0.72 0.18 155)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.7 0.2 295)" stopOpacity={0.6} />
            <stop offset="100%" stopColor="oklch(0.7 0.2 295)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="month" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatINR(v)} />
        <Area type="monotone" dataKey="income" stroke="oklch(0.72 0.18 155)" strokeWidth={2.5} fill="url(#gIncome)" />
        <Area type="monotone" dataKey="expense" stroke="oklch(0.7 0.2 295)" strokeWidth={2.5} fill="url(#gExpense)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryPie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatINR(v)} />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3} cornerRadius={8}>
          {data.map((d, i) => (
            <Cell key={i} fill={categoryMeta[d.name as keyof typeof categoryMeta]?.color || "oklch(0.7 0.1 280)"} />
          ))}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CategoryBars({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
        <Tooltip cursor={{ fill: "oklch(0.7 0.1 280 / 0.08)" }} contentStyle={tooltipStyle} formatter={(v: number) => formatINR(v)} />
        <Bar dataKey="value" radius={[10, 10, 4, 4]}>
          {data.map((d, i) => (
            <Cell key={i} fill={categoryMeta[d.name as keyof typeof categoryMeta]?.color || "oklch(0.7 0.18 295)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SavingsRing({ percent }: { percent: number }) {
  const data = [{ name: "savings", value: percent, fill: "url(#gRing)" }];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
        <defs>
          <linearGradient id="gRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.16 295)" />
            <stop offset="100%" stopColor="oklch(0.78 0.16 340)" />
          </linearGradient>
        </defs>
        <RadialBar background={{ fill: "oklch(0.9 0.02 280 / 0.4)" }} dataKey="value" cornerRadius={20} />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

export function GrowthLine({ data }: { data: { month: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <defs>
          <linearGradient id="gLine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="oklch(0.75 0.18 200)" />
            <stop offset="100%" stopColor="oklch(0.78 0.18 295)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="month" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatINR(v)} />
        <Line type="monotone" dataKey="value" stroke="url(#gLine)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Heatmap({ data }: { data: { week: number; day: number; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value));
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div>
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <div className="flex flex-col gap-1 justify-around text-[10px] text-muted-foreground pr-1">
          {days.map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-flow-col gap-1" style={{ gridTemplateRows: "repeat(7, 1fr)" }}>
          {data.map((d, i) => {
            const intensity = d.value / max;
            return (
              <div
                key={i}
                title={formatINR(d.value)}
                className="aspect-square rounded-md transition hover:scale-125"
                style={{
                  background: `oklch(${0.95 - intensity * 0.4} ${0.05 + intensity * 0.2} 295)`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
