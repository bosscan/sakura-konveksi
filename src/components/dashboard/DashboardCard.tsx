import { Paper, Stack, Typography } from '@mui/material';

type Props = {
	title: string;
	value: string;
	subtitle?: string;
	color?: string;
	onClick?: () => void;
};

export default function DashboardCard({ title, value, subtitle, color = '#1e88e5', onClick }: Props) {
	return (
		<Paper onClick={onClick} sx={{ p: 2, cursor: onClick ? 'pointer' : 'default', borderLeft: `6px solid ${color}` }}>
			<Stack spacing={0.5}>
				<Typography variant="caption" sx={{ color: '#666' }}>{title}</Typography>
				<Typography variant="h5" fontWeight={800}>{value}</Typography>
				{subtitle ? (
					<Typography variant="body2" sx={{ color: '#888' }}>{subtitle}</Typography>
				) : null}
			</Stack>
		</Paper>
	);
}
