import React, { useMemo } from 'react';
import { StudySession } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { CHART_COLORS } from '../constants';

interface StatChartProps {
  sessions: StudySession[];
}

const StatChart: React.FC<StatChartProps> = ({ sessions }) => {
  
  // PIE CHART: Subject breakdown with percentages
  const subjectData = useMemo(() => {
    const stats: Record<string, number> = {};
    let totalDuration = 0;

    sessions.forEach(s => {
      const subject = s.subject || 'Unspecified';
      stats[subject] = (stats[subject] || 0) + s.durationSeconds;
      totalDuration += s.durationSeconds;
    });

    return Object.entries(stats)
      .map(([name, value]) => {
          // Dynamic Display Unit
          let displayValue = '';
          if (value < 60) {
              displayValue = `${value}s`;
          } else if (value < 3600) {
              displayValue = `${(value / 60).toFixed(1)}m`;
          } else {
              displayValue = `${(value / 3600).toFixed(1)}h`;
          }

          return { 
              name, 
              value: value, // Use Raw Seconds for accurate pie slices
              displayValue,
              percent: totalDuration > 0 ? ((value / totalDuration) * 100).toFixed(1) : '0'
          };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [sessions]);

  // BAR CHART: Recent Activity with Dynamic Y-Axis (Sec/Min/Hr)
  const { recentActivity, timeUnit } = useMemo(() => {
    // 1. Gather data for last 7 days
    const days: Record<string, number> = {};
    const now = new Date();
    
    // Initialize last 7 days keys
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString(undefined, { weekday: 'short' });
      days[key] = 0; 
    }

    // Sum up seconds per day
    sessions.forEach(s => {
      const d = new Date(s.timestamp);
      // Check if within last ~7 days
      if (now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000) {
        const key = d.toLocaleDateString(undefined, { weekday: 'short' });
        if (days[key] !== undefined) {
           days[key] += s.durationSeconds;
        }
      }
    });

    // 2. Determine best unit (Seconds, Minutes, or Hours) based on max value
    const maxSeconds = Math.max(...Object.values(days));
    let divisor = 60; // Default minutes
    let unitLabel = 'Mins';

    if (maxSeconds < 60 && maxSeconds > 0) {
        divisor = 1;
        unitLabel = 'Secs';
    } else if (maxSeconds > 3600) {
        divisor = 3600;
        unitLabel = 'Hrs';
    }

    // 3. Format data
    const formattedData = Object.entries(days).map(([name, seconds]) => ({
      name,
      value: parseFloat((seconds / divisor).toFixed(1)) // Converted value
    }));

    return { recentActivity: formattedData, timeUnit: unitLabel };
  }, [sessions]);

  if (sessions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* Subject Distribution */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-6">Time by Subject</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={subjectData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {subjectData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                            <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 rounded shadow-xl text-xs z-50">
                                <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">{data.name}</p>
                                <div className="flex gap-4 text-zinc-600 dark:text-zinc-400">
                                    <span>{data.displayValue}</span>
                                    <span className="text-indigo-600 dark:text-indigo-400">{data.percent}%</span>
                                </div>
                            </div>
                        );
                    }
                    return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-2">
            {subjectData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                    <span className="font-medium">{entry.name}</span>
                    <span className="text-zinc-400 dark:text-zinc-500">({entry.percent}%)</span>
                </div>
            ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-6">Activity ({timeUnit})</h3>
        <div className="h-48 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recentActivity}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a' }} // zinc-500 (darker than previous #a1a1aa)
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#52525b' }} // zinc-600 (darker than previous #71717a)
                width={30}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(161, 161, 170, 0.1)' }}
                contentStyle={{ 
                  backgroundColor: 'var(--tooltip-bg, #ffffff)', 
                  borderColor: 'var(--tooltip-border, #e4e4e7)', 
                  color: 'var(--tooltip-text, #18181b)',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value} ${timeUnit}`, 'Duration']}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 rounded shadow-sm text-xs">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">{label}</p>
                        <p className="text-indigo-600 dark:text-indigo-400">
                          {payload[0].value} {timeUnit}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatChart;