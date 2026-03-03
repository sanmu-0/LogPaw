import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useLogStore } from '../../hooks/useLogStore';
import type { LogEntry } from '../../hooks/useLogStore';
import {
  LOG_COLORS, LOG_BG, LOG_TEXT, LOG_TIMESTAMP, LOG_TAG, LOG_PID,
  SYS_LOG_BG, SYS_LOG_TEXT, SEARCH_HIT_BG, SEARCH_CURRENT_BG,
} from '../../styles/theme';

interface Props {
  jumpToIndex: number | null;
}

const ROW_HEIGHT = 24;

export default function LogPanel({ jumpToIndex }: Props) {
  const logs = useLogStore((s) => s.logs);
  const selectedLevels = useLogStore((s) => s.selectedLevels);
  const autoScroll = useLogStore((s) => s.autoScroll);
  const setAutoScroll = useLogStore((s) => s.setAutoScroll);
  const searchText = useLogStore((s) => s.searchText);
  const searchMatches = useLogStore((s) => s.searchMatches);
  const searchIndex = useLogStore((s) => s.searchIndex);
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    setContainerHeight(el.clientHeight);
    return () => observer.disconnect();
  }, []);

  const filteredLogs = useMemo(
    () => logs.filter((l) => l.level && selectedLevels.has(l.level)),
    [logs, selectedLevels]
  );

  useEffect(() => {
    if (autoScroll && listRef.current && filteredLogs.length > 0) {
      listRef.current.scrollToItem(filteredLogs.length - 1, 'end');
    }
  }, [filteredLogs.length, autoScroll]);

  useEffect(() => {
    if (jumpToIndex !== null && listRef.current && jumpToIndex < filteredLogs.length) {
      listRef.current.scrollToItem(jumpToIndex, 'center');
      setAutoScroll(false);
    }
  }, [jumpToIndex, filteredLogs.length, setAutoScroll]);

  const handleScroll = useCallback(
    ({ scrollOffset, scrollUpdateWasRequested }: { scrollOffset: number; scrollUpdateWasRequested: boolean }) => {
      if (scrollUpdateWasRequested) return;
      const totalHeight = filteredLogs.length * ROW_HEIGHT;
      const h = containerRef.current?.clientHeight ?? 600;
      const isAtBottom = scrollOffset + h >= totalHeight - ROW_HEIGHT * 2;
      setAutoScroll(isAtBottom);
    },
    [filteredLogs.length, setAutoScroll]
  );

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const log = filteredLogs[index];
      if (!log) return null;
      const isSystem = log.source === 'system';
      const isSearchHit = searchText && searchMatches.includes(index);
      const isCurrentHit = isSearchHit && searchMatches[searchIndex] === index;
      const levelColor = LOG_COLORS[log.level ?? ''] ?? LOG_TEXT;
      const isFatal = log.level === 'F';
      const isError = log.level === 'E' || isFatal;

      let rowBg = 'transparent';
      if (isCurrentHit) rowBg = SEARCH_CURRENT_BG;
      else if (isSearchHit) rowBg = SEARCH_HIT_BG;
      else if (isSystem) rowBg = SYS_LOG_BG;
      else if (index % 2 === 1) rowBg = 'rgba(255,255,255,0.02)';

      return (
        <div
          style={{
            ...style,
            display: 'flex',
            gap: 8,
            fontFamily: '"SF Mono", Menlo, Consolas, monospace',
            fontSize: 12,
            lineHeight: `${ROW_HEIGHT}px`,
            padding: '0 14px',
            backgroundColor: rowBg,
            borderLeft: isSystem
              ? '3px solid #FFB74D'
              : isError
              ? '3px solid rgba(239,83,80,0.4)'
              : '3px solid transparent',
          }}
        >
          <span style={{ color: LOG_TIMESTAMP, minWidth: 120, flexShrink: 0 }}>
            {log.timestamp}
          </span>
          <span style={{ color: LOG_PID, minWidth: 48, flexShrink: 0, textAlign: 'right' }}>
            {log.pid}
          </span>
          <span
            style={{
              minWidth: 16,
              flexShrink: 0,
              textAlign: 'center',
              fontWeight: 700,
              color: levelColor,
            }}
          >
            {log.level}
          </span>
          <span
            style={{
              minWidth: 150,
              maxWidth: 200,
              flexShrink: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: isSystem ? SYS_LOG_TEXT : LOG_TAG,
            }}
          >
            {isSystem ? `[SYS] ${log.tag}` : log.tag}
          </span>
          <span
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: isSystem ? SYS_LOG_TEXT : isError ? levelColor : LOG_TEXT,
              fontWeight: isFatal ? 700 : 400,
            }}
          >
            {renderMessage(log.message ?? '', searchText)}
          </span>
        </div>
      );
    },
    [filteredLogs, searchText, searchMatches, searchIndex]
  );

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        backgroundColor: LOG_BG,
        borderRadius: 8,
        overflow: 'hidden',
        margin: '0 12px 8px',
      }}
    >
      <List
        ref={listRef}
        height={containerHeight}
        itemCount={filteredLogs.length}
        itemSize={ROW_HEIGHT}
        width="100%"
        onScroll={handleScroll}
        overscanCount={20}
      >
        {Row}
      </List>
    </div>
  );
}

export function useFilteredLogs() {
  const logs = useLogStore((s) => s.logs);
  const selectedLevels = useLogStore((s) => s.selectedLevels);
  return useMemo(
    () => logs.filter((l) => l.level && selectedLevels.has(l.level)),
    [logs, selectedLevels]
  );
}

function renderMessage(message: string, searchText: string): React.ReactNode {
  if (!searchText) return message;
  const lower = message.toLowerCase();
  const sLower = searchText.toLowerCase();
  const idx = lower.indexOf(sLower);
  if (idx === -1) return message;
  return (
    <>
      {message.slice(0, idx)}
      <span style={{ backgroundColor: 'rgba(255,183,77,0.5)', borderRadius: 2, padding: '0 2px' }}>
        {message.slice(idx, idx + searchText.length)}
      </span>
      {message.slice(idx + searchText.length)}
    </>
  );
}
