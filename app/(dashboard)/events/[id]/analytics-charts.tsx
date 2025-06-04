'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventReset } from '@/lib/db';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsChartsProps {
  event: {
    id: number;
    name: string;
    date: string;
  };
  allResets: EventReset[];
  currentStreak: number;
  totalResets: number;
}

export function AnalyticsCharts({
  event,
  allResets,
  currentStreak,
  totalResets
}: AnalyticsChartsProps) {
  // Prepare chart data
  const prepareChartData = () => {
    const eventDate = new Date(event.date);
    const chartData = [];

    if (allResets.length === 0) {
      // If no resets, show current count
      chartData.push({
        date: eventDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC'
        }),
        fullDate: eventDate.toISOString(),
        daysCount: 0,
        resetCount: 0
      });
      chartData.push({
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC'
        }),
        fullDate: new Date().toISOString(),
        daysCount: currentStreak,
        resetCount: 0
      });
    } else {
      // Calculate periods between resets
      let currentDate = eventDate;
      let resetIndex = allResets.length - 1; // Start from oldest reset

      // Add initial point (event start)
      chartData.push({
        date: currentDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC'
        }),
        fullDate: currentDate.toISOString(),
        daysCount: 0,
        resetCount: 0
      });

      // Process each reset
      for (let i = resetIndex; i >= 0; i--) {
        const reset = allResets[i];
        const resetDate = new Date(reset.resetAt);
        const periodLength = Math.floor(
          (resetDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24)
        );

        // Add point just before reset (peak of period)
        chartData.push({
          date: resetDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC'
          }),
          fullDate: resetDate.toISOString(),
          daysCount: periodLength,
          resetCount: allResets.length - i
        });

        // Add reset point (back to 0)
        chartData.push({
          date: resetDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC'
          }),
          fullDate: resetDate.toISOString(),
          daysCount: 0,
          resetCount: allResets.length - i
        });

        currentDate = resetDate;
      }

      // Add current point (current count)
      const now = new Date();
      const currentDays = Math.floor(
        (now.getTime() - currentDate.getTime()) / (1000 * 3600 * 24)
      );
      chartData.push({
        date: now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC'
        }),
        fullDate: now.toISOString(),
        daysCount: currentDays,
        resetCount: totalResets
      });
    }

    return chartData;
  };

  // Prepare monthly reset frequency data
  const prepareMonthlyResetData = () => {
    if (allResets.length === 0) return [];

    const monthlyData: { [key: string]: number } = {};

    allResets.forEach((reset) => {
      const date = new Date(reset.resetAt);
      const monthKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        timeZone: 'UTC'
      });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      resets: count
    }));
  };

  const chartData = prepareChartData();
  const monthlyResetData = prepareMonthlyResetData();

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <Card>
        <CardHeader>
          <CardTitle>Current Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Days Since Reset</span>
              <span className="font-medium">{currentStreak} days</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min((currentStreak / Math.max(1, totalResets > 0 ? Math.max(...chartData.map((d) => d.daysCount)) : currentStreak)) * 100, 100)}%`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Start</span>
              <span>
                Best: {Math.max(...chartData.map((d) => d.daysCount))} days
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{
                      value: 'Days',
                      angle: -90,
                      position: 'insideLeft'
                    }}
                  />
                  <Tooltip
                    labelFormatter={(value, payload) => {
                      if (payload && payload[0]) {
                        const data = payload[0].payload;
                        return new Date(data.fullDate).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }
                        );
                      }
                      return value;
                    }}
                    formatter={(value) => [`${value} days`, 'Days Count']}
                  />
                  <Area
                    type="monotone"
                    dataKey="daysCount"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Reset Frequency */}
        {monthlyResetData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Reset Frequency by Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyResetData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      label={{
                        value: 'Resets',
                        angle: -90,
                        position: 'insideLeft'
                      }}
                    />
                    <Tooltip formatter={(value) => [`${value}`, 'Resets']} />
                    <Bar
                      dataKey="resets"
                      fill="#82ca9d"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
