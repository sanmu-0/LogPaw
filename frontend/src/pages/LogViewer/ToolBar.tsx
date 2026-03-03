import { Button, Space, Dropdown, message, Tooltip } from 'antd';
import {
  CopyOutlined,
  DownloadOutlined,
  ClearOutlined,
  CloudDownloadOutlined,
  VerticalAlignBottomOutlined,
} from '@ant-design/icons';
import { useLogStore, LogEntry } from '../../hooks/useLogStore';
import { api } from '../../api';

interface Props {
  onClear: () => void;
  onScrollToBottom: () => void;
  filteredLogs: LogEntry[];
}

export default function ToolBar({ onClear, onScrollToBottom, filteredLogs }: Props) {
  const addSystemLogs = useLogStore((s) => s.addSystemLogs);
  const autoScroll = useLogStore((s) => s.autoScroll);

  const copyFiltered = async () => {
    const text = filteredLogs.map((l) => l.raw ?? '').join('\n');
    await navigator.clipboard.writeText(text);
    message.success('已复制筛选日志');
  };

  const copyFull = async () => {
    try {
      const res = await fetch(api.getFullLogsUrl());
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      message.success('已复制全量日志');
    } catch {
      message.error('复制失败');
    }
  };

  const exportLogs = (type: 'filtered' | 'full') => {
    window.open(api.getExportUrl(type), '_blank');
  };

  const fetchSystemLogs = async () => {
    try {
      const result = await api.fetchSystemLogs();
      if (result.items.length > 0) {
        addSystemLogs(result.items);
        message.success(`已拉取 ${result.items.length} 条系统日志`);
      } else {
        message.info('未找到与应用相关的系统日志');
      }
    } catch {
      message.error('拉取系统日志失败');
    }
  };

  const exportItems = [
    { key: 'filtered', label: '导出筛选日志', onClick: () => exportLogs('filtered') },
    { key: 'full', label: '导出全量日志', onClick: () => exportLogs('full') },
  ];

  return (
    <div
      style={{
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #E8E0D8',
      }}
    >
      <Space size={8}>
        <Tooltip title="复制筛选后的应用日志">
          <Button size="small" icon={<CopyOutlined />} onClick={copyFiltered}>
            复制应用日志
          </Button>
        </Tooltip>
        <Tooltip title="复制全量设备日志">
          <Button size="small" icon={<CopyOutlined />} onClick={copyFull}>
            复制全量
          </Button>
        </Tooltip>
        <Dropdown menu={{ items: exportItems }} placement="top">
          <Button size="small" icon={<DownloadOutlined />}>
            导出
          </Button>
        </Dropdown>
        <Button size="small" icon={<ClearOutlined />} onClick={onClear}>
          清屏
        </Button>
        <Tooltip title="拉取与当前应用相关的系统日志">
          <Button
            size="small"
            icon={<CloudDownloadOutlined />}
            onClick={fetchSystemLogs}
            type="dashed"
          >
            拉取系统日志
          </Button>
        </Tooltip>
      </Space>
      <Space>
        {!autoScroll && (
          <Button
            size="small"
            type="primary"
            icon={<VerticalAlignBottomOutlined />}
            onClick={onScrollToBottom}
          >
            回到底部
          </Button>
        )}
      </Space>
    </div>
  );
}
