const API_BASE = '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export interface DeviceInfo {
  serial: string;
  model: string;
  brand: string;
  android_version: string;
  sdk_version: string;
  connection: string;
}

export interface AppItem {
  package_name: string;
  score: number;
}

export interface LogMessage {
  type: 'log' | 'system_log' | 'status' | 'error';
  timestamp?: string;
  level?: string;
  tag?: string;
  pid?: string;
  tid?: string;
  message?: string;
  source?: 'app' | 'system';
  raw?: string;
  event?: string;
}

export const api = {
  getDevice: () => request<DeviceInfo>('/device'),

  searchApps: (q: string) =>
    request<{ items: AppItem[]; total: number }>(`/device/apps?q=${encodeURIComponent(q)}`),

  fetchSystemLogs: () =>
    request<{ items: LogMessage[]; total: number }>('/logs/system', { method: 'POST' }),

  getExportUrl: (type: 'filtered' | 'full') => `${API_BASE}/logs/export?type=${type}`,

  getFullLogsUrl: () => `${API_BASE}/logs/full`,
};
