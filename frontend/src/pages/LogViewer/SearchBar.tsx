import { useCallback, useEffect, useRef } from 'react';
import { Input, Button, Space, Typography } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import { useLogStore } from '../../hooks/useLogStore';

const { Text } = Typography;

interface Props {
  filteredLogs: { id: number; message?: string; tag?: string; raw?: string }[];
  onJumpTo: (logId: number) => void;
}

export default function SearchBar({ filteredLogs, onJumpTo }: Props) {
  const searchText = useLogStore((s) => s.searchText);
  const searchIndex = useLogStore((s) => s.searchIndex);
  const searchMatches = useLogStore((s) => s.searchMatches);
  const setSearchText = useLogStore((s) => s.setSearchText);
  const setSearchIndex = useLogStore((s) => s.setSearchIndex);
  const setSearchMatches = useLogStore((s) => s.setSearchMatches);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const updateMatches = useCallback(
    (text: string) => {
      if (!text) {
        setSearchMatches([]);
        return;
      }
      const lower = text.toLowerCase();
      const matches: number[] = [];
      filteredLogs.forEach((log, idx) => {
        const content = `${log.tag ?? ''} ${log.message ?? ''} ${log.raw ?? ''}`.toLowerCase();
        if (content.includes(lower)) {
          matches.push(idx);
        }
      });
      setSearchMatches(matches);
      if (matches.length > 0) {
        setSearchIndex(0);
        onJumpTo(matches[0]);
      }
    },
    [filteredLogs, setSearchMatches, setSearchIndex, onJumpTo]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateMatches(searchText), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText, updateMatches]);

  const goNext = () => {
    if (searchMatches.length === 0) return;
    const next = (searchIndex + 1) % searchMatches.length;
    setSearchIndex(next);
    onJumpTo(searchMatches[next]);
  };

  const goPrev = () => {
    if (searchMatches.length === 0) return;
    const prev = (searchIndex - 1 + searchMatches.length) % searchMatches.length;
    setSearchIndex(prev);
    onJumpTo(searchMatches[prev]);
  };

  return (
    <Space size={4}>
      <Input
        size="small"
        placeholder="搜索日志..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ width: 180, fontSize: 12 }}
        allowClear
      />
      <Button size="small" icon={<UpOutlined />} onClick={goPrev} disabled={searchMatches.length === 0} />
      <Button size="small" icon={<DownOutlined />} onClick={goNext} disabled={searchMatches.length === 0} />
      {searchText && (
        <Text style={{ fontSize: 11, color: '#8C8680', minWidth: 50 }}>
          {searchMatches.length > 0
            ? `${searchIndex + 1}/${searchMatches.length}`
            : '无匹配'}
        </Text>
      )}
    </Space>
  );
}
