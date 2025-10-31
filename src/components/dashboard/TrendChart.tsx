/* eslint-disable @typescript-eslint/no-explicit-any */
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend as RLegend } from 'recharts';
import { Paper, Typography } from '@mui/material';

type Series = { dataKey: string; name?: string; color?: string };

type Props<T extends Record<string, any>> = {
	title?: string;
	data: T[];
	xKey: keyof T;
	lines: Series[];
	height?: number;
};

export default function TrendChart<T extends Record<string, any>>({ title, data, xKey, lines, height = 260 }: Props<T>) {
	return (
		<Paper sx={{ p: 2 }}>
			{title ? <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>{title}</Typography> : null}
			<ResponsiveContainer width="100%" height={height}>
				<LineChart data={data as any}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey={xKey as string} />
					<YAxis />
					<RTooltip />
					<RLegend />
					{lines.map((l) => (
						<Line key={l.dataKey} type="monotone" dataKey={l.dataKey} name={l.name} stroke={l.color || '#1e88e5'} dot={false} />
					))}
				</LineChart>
			</ResponsiveContainer>
		</Paper>
	);
}
