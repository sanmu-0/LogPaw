import { Tag, Tooltip } from 'antd';
import { useLogStore } from '../../hooks/useLogStore';
import { LOG_COLORS } from '../../styles/theme';

const LEVELS = [
  { key: 'V', label: 'V', tip: '详细 (Verbose) - 最低级别，全量输出' },
  { key: 'D', label: 'D', tip: '调试 (Debug) - 开发调试信息' },
  { key: 'I', label: 'I', tip: '信息 (Info) - 常规运行信息' },
  { key: 'W', label: 'W', tip: '警告 (Warning) - 潜在问题' },
  { key: 'E', label: 'E', tip: '错误 (Error) - 运行错误' },
  { key: 'F', label: 'F', tip: '致命 (Fatal) - 导致崩溃的严重错误' },
];

export default function LevelFilter() {
  const selectedLevels = useLogStore((s) => s.selectedLevels);
  const toggleLevel = useLogStore((s) => s.toggleLevel);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: '#8C8680', fontSize: 12, marginRight: 4 }}>级别</span>
      {LEVELS.map(({ key, label, tip }) => {
        const active = selectedLevels.has(key);
        return (
          <Tooltip key={key} title={tip} placement="bottom">
            <Tag
              style={{
                cursor: 'pointer',
                userSelect: 'none',
                fontFamily: 'monospace',
                fontWeight: active ? 700 : 400,
                color: active ? '#fff' : LOG_COLORS[key],
                backgroundColor: active ? LOG_COLORS[key] : 'transparent',
                border: `1px solid ${LOG_COLORS[key]}`,
              }}
              onClick={() => toggleLevel(key)}
            >
              {label}
            </Tag>
          </Tooltip>
        );
      })}
    </div>
  );
}
