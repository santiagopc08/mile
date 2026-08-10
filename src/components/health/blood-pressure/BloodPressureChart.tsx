import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend
} from 'recharts';
import type { BloodPressureEntry } from './types';

interface Props {
    entries: BloodPressureEntry[];
}

export const BloodPressureChart = ({ entries }: Props) => {
    const chartData = useMemo(() => {
        const data = [];
        for (let i = entries.length - 1; i >= 0; i--) {
            const entry = entries[i];
            const date = new Date(entry.created_at);
            data.push({
                name: `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`,
                fullDate: date.toLocaleString(),
                systolic: entry.systolic,
                diastolic: entry.diastolic,
                heartRate: entry.heart_rate,
                position: entry.position,
                author: entry.author
            });
        }
        return data;
    }, [entries]);

    if (entries.length === 0) return null;

    return (
        <div className="border border-white/10 bg-black/60 p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[8.5px] font-mono uppercase font-bold tracking-wider text-stone-300 flex items-center gap-1.5">
                    <Activity size={11} /> TENDENCIA CRONOLÓGICA
                </span>
                <span className="text-[7px] font-mono text-stone-500 tabular-nums">
                    {entries.length} REGISTROS
                </span>
            </div>

            <div className="h-56 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 7, fill: '#888', letterSpacing: '0.05em' }}
                        />
                        <YAxis
                            width={22}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 7, fill: '#888' }}
                        />
                        <Tooltip
                            cursor={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1 }}
                            contentStyle={{
                                backgroundColor: '#0a0a0a',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '0px',
                                fontSize: '8.5px',
                                fontFamily: 'monospace',
                                textTransform: 'uppercase',
                                padding: '8px'
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: '7px', textTransform: 'uppercase', marginTop: '8px', letterSpacing: '0.1em' }} />
                        <Line
                            type="monotone"
                            dataKey="systolic"
                            stroke="#ff4b89"
                            strokeWidth={2}
                            dot={{ r: 2, fill: '#ff4b89' }}
                            activeDot={{ r: 4 }}
                            name="Sistólica (Máx)"
                        />
                        <Line
                            type="monotone"
                            dataKey="diastolic"
                            stroke="#c3f400"
                            strokeWidth={2}
                            dot={{ r: 2, fill: '#c3f400' }}
                            activeDot={{ r: 4 }}
                            name="Diastólica (Mín)"
                        />
                        <Line
                            type="monotone"
                            dataKey="heartRate"
                            stroke="#60a5fa"
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                            dot={{ r: 2, fill: '#60a5fa' }}
                            name="Pulso (BPM)"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
