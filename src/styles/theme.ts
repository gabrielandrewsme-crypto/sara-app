export const theme = {
  colors: {
    background: '#000000',
    surface: '#0A0A0A',
    surfaceAlt: '#141414',
    primary: '#0A84FF',
    primaryPressed: '#0066CC',
    text: '#FFFFFF',
    textMuted: '#9A9A9A',
    border: '#1F1F1F',
    danger: '#FF453A',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
  },
  typography: {
    title: { fontSize: 32, fontWeight: '700' as const },
    heading: { fontSize: 24, fontWeight: '700' as const },
    body: { fontSize: 17, fontWeight: '400' as const },
    label: { fontSize: 15, fontWeight: '500' as const },
    caption: { fontSize: 13, fontWeight: '400' as const },
  },
};

export type Theme = typeof theme;
