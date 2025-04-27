"use client";

import { Progress } from "@/components/ui/progress";
import { startOfDay, subDays, format, isToday, isYesterday } from "date-fns";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid 
} from "recharts";

interface HabitLog {
  date: Date;
  value: number;
  notes?: string;
}

interface Habit {
  id: string;
  name: string;
  description?: string;
  goal: number;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  logs: HabitLog[];
}

interface HabitProgressProps {
  habit: Habit;
}

export function HabitProgress({ habit }: HabitProgressProps) {
  // Get logs for today
  const today = startOfDay(new Date());
  const todayLogs = habit.logs.filter(log => 
    new Date(log.date).getTime() >= today.getTime()
  );
  
  const todayTotal = todayLogs.reduce((sum, log) => sum + log.value, 0);
  const progress = Math.min(Math.floor((todayTotal / habit.goal) * 100), 100);
  
  // Get data for the past 7 days for the chart
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    const startOfTheDay = startOfDay(date);
    
    // Find logs for this day
    const logsForDay = habit.logs.filter(log => 
      new Date(log.date).getTime() >= startOfTheDay.getTime() &&
      new Date(log.date).getTime() < new Date(startOfTheDay).setDate(startOfTheDay.getDate() + 1)
    );
    
    const total = logsForDay.reduce((sum, log) => sum + log.value, 0);
    
    let dateLabel = format(date, 'MM/dd');
    if (isToday(date)) dateLabel = 'Today';
    if (isYesterday(date)) dateLabel = 'Yesterday';
    
    return {
      date: dateLabel,
      value: total,
    };
  }).reverse();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Today's Progress</span>
          <span className="font-medium">
            {todayTotal} / {habit.goal} {habit.unit}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <div className="h-32 mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickMargin={5}
            />
            <YAxis hide={true} />
            <Tooltip 
              formatter={(value) => [`${value} ${habit.unit}`, 'Value']}
              contentStyle={{
                borderRadius: '8px',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)',
                color: 'var(--foreground)',
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={2} 
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}