import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { categoryMeta, formatMoney, type Category } from "@/lib/finance";

const grid = "oklch(0.7 0.04 280 / 0.15)";
const axisColor = "oklch(0.55 0.03 280)";

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 16,
  backdropFilter: "blur(20px)",
  fontSize: 12,
  color: "var(--color-foreground)",
};

export function IncomeExpenseArea({ data, currency = "INR" }: { data: { month: string; income: number; expense: number }[]; currency?: string }) {
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
        <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v, currency)} />
        <Area type="monotone" dataKey="income" stroke="oklch(0.72 0.18 155)" strokeWidth={2.5} fill="url(#gIncome)" />
        <Area type="monotone" dataKey="expense" stroke="oklch(0.7 0.2 295)" strokeWidth={2.5} fill="url(#gExpense)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryPie({ data, currency = "INR" }: { data: { name: string; value: number }[]; currency?: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v, currency)} />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3} cornerRadius={8}>
          {data.map((d, i) => (
            <Cell key={i} fill={categoryMeta[d.name as Category]?.color || "oklch(0.7 0.1 280)"} />
          ))}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CategoryBars({ data, currency = "INR" }: { data: { name: string; value: number }[]; currency?: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <Tooltip cursor={{ fill: "oklch(0.7 0.1 280 / 0.08)" }} contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v, currency)} />
        <Bar dataKey="value" radius={[10, 10, 4, 4]}>
          {data.map((d, i) => (
            <Cell key={i} fill={categoryMeta[d.name as Category]?.color || "oklch(0.7 0.18 295)"} />
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

export function GrowthLine({ data, currency = "INR" }: { data: { month: string; value: number }[]; currency?: string }) {
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
        <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v, currency)} />
        <Line type="monotone" dataKey="value" stroke="url(#gLine)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function WeeklyBars({ data, currency = "INR" }: { data: { day: string; value: number }[]; currency?: string }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="day" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <Tooltip cursor={{ fill: "oklch(0.7 0.1 280 / 0.08)" }} contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v, currency)} />
        <Bar dataKey="value" radius={[12, 12, 4, 4]} fill="url(#gWeekly)" />
        <defs>
          <linearGradient id="gWeekly" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.16 295)" />
            <stop offset="100%" stopColor="oklch(0.7 0.18 340)" stopOpacity={0.4} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
