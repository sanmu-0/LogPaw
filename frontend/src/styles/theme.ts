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
    Button: {
      borderRadius: 8,
    },
    Input: {
      borderRadius: 8,
    },
    Select: {
      borderRadius: 8,
    },
    Tag: {
      borderRadius: 4,
    },
  },
};

export const LOG_COLORS: Record<string, string> = {
  V: '#8C8680',
  D: '#5B8FB9',
  I: '#3A7D44',
  W: '#D4A574',
  E: '#B54A34',
  F: '#B54A34',
};

export const LOG_BG = '#2D2B28';
export const LOG_TEXT = '#D6CBBC';
export const SYS_LOG_BG = '#3D312A';
export const SYS_LOG_TEXT = '#E8CCAE';

export default theme;
