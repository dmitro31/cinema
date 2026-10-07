export const CHART = {
  series: '#3987e5',
  seriesHover: '#6da7ec',
  surface: '#121218',
  grid: '#232330',
  baseline: '#383845',
  cursor: '#4a4a58',
  inkPrimary: '#f4f4f5',
  inkSecondary: '#c3c2b7',
  inkMuted: '#898781',
} as const;

export const HEAT_STEPS = [
  { max: 0.1, color: '#0d366b', ink: '#ffffff' },
  { max: 0.25, color: '#184f95', ink: '#ffffff' },
  { max: 0.4, color: '#256abf', ink: '#ffffff' },
  { max: 0.6, color: '#3987e5', ink: '#0b0b0f' },
  { max: 0.8, color: '#6da7ec', ink: '#0b0b0f' },
  { max: Infinity, color: '#9ec5f4', ink: '#0b0b0f' },
] as const;

export const heatStep = (ratio: number) =>
  HEAT_STEPS.find((step) => ratio < step.max) ?? HEAT_STEPS[HEAT_STEPS.length - 1];

export const STATUS_COLORS = {
  success: '#0ca30c',
  warning: '#fab219',
  danger: '#d03b3b',
  neutral: '#898781',
} as const;
