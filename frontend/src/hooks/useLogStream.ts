import { useEffect, useRef, useCallback } from 'react';
import { useLogStore } from './useLogStore';
import type { LogMessage } from '../api';

const WS_BASE = `ws://${window.location.host}`;

export function useLogStream(packageName: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const addLog = useLogStore((s) => s.addLog);

  const connect = useCallback(() => {
    if (!packageName) return;
    const ws = new WebSocket(`${WS_BASE}/ws/logs/${encodeURIComponent(packageName)}`);

    ws.onmessage = (event) => {
      try {
        const msg: LogMessage = JSON.parse(event.data);
        if (msg.type === 'log' || msg.type === 'system_log') {
          addLog(msg);
        } else if (msg.type === 'status') {
          addLog({ ...msg, level: 'I', tag: 'LogPaw', source: 'app' });
        } else if (msg.type === 'error') {
          addLog({ ...msg, level: 'E', tag: 'LogPaw', source: 'app' });
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    wsRef.current = ws;
  }, [packageName, addLog]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendAction = useCallback((action: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { sendAction, disconnect };
}
