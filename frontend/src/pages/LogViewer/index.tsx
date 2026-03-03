import { useState, useCallback, useMemo } from 'react';
import { Typography } from 'antd';
import DeviceBar from './DeviceBar';
import AppSearch from './AppSearch';
import LevelFilter from './LevelFilter';
import SearchBar from './SearchBar';
import LogPanel from './LogPanel';
import ToolBar from './ToolBar';
import { useLogStream } from '../../hooks/useLogStream';
import { useLogStore } from '../../hooks/useLogStore';
import type { DeviceInfo } from '../../api';

const { Title } = Typography;

export default function LogViewer() {
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [jumpToIndex, setJumpToIndex] = useState<number | null>(null);

  const logs = useLogStore((s) => s.logs);
  const selectedLevels = useLogStore((s) => s.selectedLevels);
  const clearLogs = useLogStore((s) => s.clearLogs);
  const setAutoScroll = useLogStore((s) => s.setAutoScroll);

  const filteredLogs = useMemo(
    () => logs.filter((l) => l.level && selectedLevels.has(l.level)),
    [logs, selectedLevels]
  );

  const { sendAction, disconnect } = useLogStream(selectedApp);

  const handleSelectApp = useCallback((pkg: string) => {
    clearLogs();
    setSelectedApp(pkg);
  }, [clearLogs]);

  const handleClearApp = useCallback(() => {
    disconnect();
    clearLogs();
    setSelectedApp(null);
  }, [disconnect, clearLogs]);

  const handleClear = useCallback(() => {
    clearLogs();
    sendAction('clear');
  }, [clearLogs, sendAction]);

  const handleScrollToBottom = useCallback(() => {
    setAutoScroll(true);
    if (filteredLogs.length > 0) {
      setJumpToIndex(filteredLogs.length - 1);
      setTimeout(() => setJumpToIndex(null), 100);
    }
  }, [setAutoScroll, filteredLogs.length]);

  const handleJumpTo = useCallback((idx: number) => {
    setJumpToIndex(idx);
    setTimeout(() => setJumpToIndex(null), 100);
  }, []);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFAF3',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #E8E0D8',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <Title
          level={4}
          style={{
            margin: 0,
            color: '#2D2B28',
            fontWeight: 700,
            letterSpacing: '-0.5px',
          }}
        >
          <span style={{ color: '#C17C4E' }}>Log</span>Paw
        </Title>
        <DeviceBar onDeviceDetected={setDevice} />
      </div>

      {/* App Search */}
      <div style={{ borderBottom: '1px solid #E8E0D8', backgroundColor: '#FFFFFF' }}>
        <AppSearch
          disabled={!device}
          selectedApp={selectedApp}
          onSelect={handleSelectApp}
          onClear={handleClearApp}
        />
      </div>

      {/* Filter + Search */}
      {selectedApp && (
        <div
          style={{
            padding: '6px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #E8E0D8',
            backgroundColor: '#FFFFFF',
          }}
        >
          <LevelFilter />
          <SearchBar filteredLogs={filteredLogs} onJumpTo={handleJumpTo} />
        </div>
      )}

      {/* Log Panel */}
      {selectedApp ? (
        <LogPanel jumpToIndex={jumpToIndex} />
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 48, opacity: 0.15 }}>🐾</div>
          <div style={{ color: '#8C8680', fontSize: 14 }}>
            {device ? '选择一个应用开始查看日志' : '请连接 Android 设备'}
          </div>
        </div>
      )}

      {/* ToolBar */}
      {selectedApp && (
        <ToolBar
          onClear={handleClear}
          onScrollToBottom={handleScrollToBottom}
          filteredLogs={filteredLogs}
        />
      )}
    </div>
  );
}
