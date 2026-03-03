import { useState, useCallback } from 'react';
import { AutoComplete, Input, Tag, Space } from 'antd';
import { SearchOutlined, CloseCircleFilled } from '@ant-design/icons';
import { api } from '../../api';
import type { AppItem } from '../../api';

interface Props {
  disabled: boolean;
  selectedApp: string | null;
  onSelect: (pkg: string) => void;
  onClear: () => void;
}

export default function AppSearch({ disabled, selectedApp, onSelect, onClear }: Props) {
  const [options, setOptions] = useState<{ value: string; label: React.ReactNode }[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async (value: string) => {
    if (!value) {
      setOptions([]);
      return;
    }
    setSearching(true);
    try {
      const result = await api.searchApps(value);
      setOptions(
        result.items.map((item: AppItem) => ({
          value: item.package_name,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{highlightMatch(item.package_name, value)}</span>
              <span style={{ color: '#8C8680', fontSize: 11 }}>
                匹配度 {item.score}
              </span>
            </div>
          ),
        }))
      );
    } catch {
      setOptions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  if (selectedApp) {
    return (
      <div style={{ padding: '4px 16px' }}>
        <Space>
          <span style={{ color: '#8C8680', fontSize: 13 }}>当前应用</span>
          <Tag
            color="#C17C4E"
            closable
            onClose={onClear}
            closeIcon={<CloseCircleFilled />}
            style={{ fontSize: 13, padding: '2px 10px' }}
          >
            {selectedApp}
          </Tag>
        </Space>
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 16px' }}>
      <AutoComplete
        style={{ width: 460 }}
        options={options}
        onSearch={handleSearch}
        onSelect={(val: string) => onSelect(val)}
        disabled={disabled}
      >
        <Input
          prefix={<SearchOutlined style={{ color: '#8C8680' }} />}
          placeholder="输入应用名搜索（如 kb、vicoo、kiwibit）..."
          allowClear
          loading={searching}
          size="middle"
        />
      </AutoComplete>
    </div>
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  const idx = lower.indexOf(qLower);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: '#C17C4E', fontWeight: 600 }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}
