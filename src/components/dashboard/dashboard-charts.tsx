"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Line, LineChart, PieChart, Pie, Cell, Area, AreaChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

export type TrendDataPoint = {
  month: string;
  electricity: number;
  water: number;
  phone: number;
  telecom: number;
  postal: number;
}

export type StatusDataPoint = {
  name: string;
  value: number;
  color: string;
}

const trendConfig = {
  electricity: { label: "ค่าไฟฟ้า", color: "var(--chart-1)" },
  water: { label: "ค่าน้ำประปา", color: "var(--chart-2)" },
  phone: { label: "ค่าโทรศัพท์", color: "var(--chart-3)" },
  telecom: { label: "ค่าสื่อสารฯ", color: "var(--chart-4)" },
  postal: { label: "ค่าไปรษณีย์", color: "var(--chart-5)" },
}


const statusConfig = {
  เบิกจ่ายแล้ว: { label: "เบิกจ่ายแล้ว", color: "var(--chart-2)" },
  ค้างชำระ: { label: "ค้างชำระ", color: "var(--chart-4)" },

}

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function TrendChart({ data }: { data: TrendDataPoint[] }) {
  const [months, setMonths] = useState("6");
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  
  const displayData = data.slice(-parseInt(months));

  const toggleSeries = (key: string) => {
    setHiddenSeries(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <Select value={months} onValueChange={(val) => { if (val) setMonths(val); }}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="เลือกช่วงเวลา">
              {months === "3" ? "3 เดือนล่าสุด" : months === "6" ? "6 เดือนล่าสุด" : "12 เดือนล่าสุด"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 เดือนล่าสุด</SelectItem>
            <SelectItem value="6">6 เดือนล่าสุด</SelectItem>
            <SelectItem value="12">12 เดือนล่าสุด</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ChartContainer config={trendConfig} className="h-[300px] w-full">
        <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickFormatter={(value) => `฿${(value / 1000)}k`} tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area type="monotone" hide={hiddenSeries.has("electricity")} dataKey="electricity" stackId="a" fill="var(--color-electricity)" stroke="var(--color-electricity)" fillOpacity={0.4} />
          <Area type="monotone" hide={hiddenSeries.has("water")} dataKey="water" stackId="a" fill="var(--color-water)" stroke="var(--color-water)" fillOpacity={0.4} />
          <Area type="monotone" hide={hiddenSeries.has("phone")} dataKey="phone" stackId="a" fill="var(--color-phone)" stroke="var(--color-phone)" fillOpacity={0.4} />
          <Area type="monotone" hide={hiddenSeries.has("telecom")} dataKey="telecom" stackId="a" fill="var(--color-telecom)" stroke="var(--color-telecom)" fillOpacity={0.4} />
          <Area type="monotone" hide={hiddenSeries.has("postal")} dataKey="postal" stackId="a" fill="var(--color-postal)" stroke="var(--color-postal)" fillOpacity={0.4} />
        </AreaChart>
      </ChartContainer>
      <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
        {Object.entries(trendConfig).map(([key, config]) => {
          const isHidden = hiddenSeries.has(key);
          return (
            <div
              key={key}
              onClick={() => toggleSeries(key)}
              className={`flex items-center gap-1.5 cursor-pointer select-none transition-opacity ${isHidden ? 'opacity-40' : 'opacity-100'}`}
            >
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: `var(--color-${key})` }} 
              />
              <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function StatusPieChart({ data }: { data: StatusDataPoint[] }) {
  return (
    <ChartContainer config={statusConfig} className="h-[250px] w-full">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <ChartLegend content={<ChartLegendContent />} className="flex-wrap" />
      </PieChart>
    </ChartContainer>
  )
}
