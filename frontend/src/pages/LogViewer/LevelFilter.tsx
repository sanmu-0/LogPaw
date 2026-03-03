import { Tag, Tooltip } from 'antd';
import { useLogStore } from '../../hooks/useLogStore';
import { LEVEL_COLORS } from '../../styles/theme';

const LEVELS = [
  { key: 'V', label: 'Verbose', tip: '详细 (Verbose) - 最低级别，全量输出' },
  { key: 'D', label: 'Debug', tip: '调试 (Debug) - 开发调试信息' },
  { key: 'I', label: 'Info', tip: '信息 (Info) - 常规运行信息' },
  { key: 'W', label: 'Warn', tip: '警告 (Warning) - 潜在问题' },
  { key: 'E', label: 'Error', tip: '错误 (Error) - 运行错误' },
  { key: 'F', label: 'Fatal', tip: '致命 (Fatal) - 导致崩溃的严重错误' },
];

export default function LevelFilter() {
  const selectedLevels = useLogStore((s) => s.selectedLevels);
  const toggleLevel = useLogStore((s) => s.toggleLevel);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: '#8C8680', fontSize: 12, marginRight: 2 }}>级别</span>
      {LEVELS.map(({ key, label, tip }) => {
        const active = selectedLevels.has(key);
        const c = LEVEL_COLORS[key];
        return (
          <Tooltip key={key} title={tip} placement="bottom">
            <Tag
              style={{
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: 12,
                fontWeight: 600,
                padding: '1px 8px',
                lineHeight: '22px',
                color: active ? c.text : c.border,
                backgroundColor: active ? c.bg : 'transparent',
                border: `2px solid ${active ? c.border : '#D9D9D9'}`,
                opacity: active ? 1 : 0.5,
                transition: 'all 0.15s',
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
