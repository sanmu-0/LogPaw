import { useEffect, useState } from 'react';
import { Tag, Space, Spin, Typography } from 'antd';
import { MobileOutlined, UsbOutlined, ReloadOutlined } from '@ant-design/icons';
import { api } from '../../api';
import type { DeviceInfo } from '../../api';

const { Text } = Typography;

interface Props {
  onDeviceDetected: (device: DeviceInfo | null) => void;
}

export default function DeviceBar({ onDeviceDetected }: Props) {
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const detect = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await api.getDevice();
      setDevice(d);
      onDeviceDetected(d);
    } catch (e: any) {
      setDevice(null);
      onDeviceDetected(null);
      setError(e.message || '检测失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detect();
    const timer = setInterval(detect, 10000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !device) {
    return (
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Spin size="small" />
        <Text type="secondary">正在检测设备...</Text>
      </div>
    );
  }

  if (!device) {
    return (
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Text type="danger">{error || '未检测到设备'}</Text>
        <ReloadOutlined onClick={detect} style={{ cursor: 'pointer', color: '#D4A574' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <Space>
        <MobileOutlined style={{ fontSize: 16, color: '#C17C4E' }} />
        <Text strong>{device.brand} {device.model}</Text>
        <Tag color="green">Android {device.android_version}</Tag>
        <Tag icon={<UsbOutlined />} color="blue">{device.connection}</Tag>
        <Text type="secondary" style={{ fontSize: 12 }}>{device.serial}</Text>
      </Space>
    </div>
  );
}
