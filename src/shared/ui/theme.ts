/** Design tokens. Nenhum valor literal de cor/espaçamento fora daqui. */
export const theme = {
  color: {
    bg: '#0B0D10',
    surface: '#15181D',
    border: '#252A31',
    text: '#F2F4F7',
    textMuted: '#98A2B3',
    accent: '#3B82F6',
    danger: '#EF4444',
    success: '#22C55E',
  },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 6, md: 12, lg: 20 },
  font: { sm: 13, md: 15, lg: 18, xl: 24 },
} as const;
