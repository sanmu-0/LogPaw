import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#D4A574',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#FFFAF3',
    colorText: '#2D2B28',
    colorTextSecondary: '#8C8680',
    borderRadius: 12,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  components: {
    Button: { borderRadius: 8 },
    Input: { borderRadius: 8 },
    Select: { borderRadius: 8 },
    Tag: { borderRadius: 4 },
  },
};

export const LOG_COLORS: Record<string, string> = {
  V: '#9E9E9E',
  D: '#64B5F6',
  I: '#81C784',
  W: '#FFB74D',
  E: '#EF5350',
  F: '#FF1744',
};

export const LOG_BG = '#1E1E1E';
export const LOG_TEXT = '#E0E0E0';
export const LOG_TIMESTAMP = '#757575';
export const LOG_TAG = '#B0BEC5';
export const LOG_PID = '#616161';
export const SYS_LOG_BG = '#2A1F1A';
export const SYS_LOG_TEXT = '#FFCC80';
export const SEARCH_HIT_BG = 'rgba(255,183,77,0.3)';
export const SEARCH_CURRENT_BG = 'rgba(255,183,77,0.6)';

export default theme;
