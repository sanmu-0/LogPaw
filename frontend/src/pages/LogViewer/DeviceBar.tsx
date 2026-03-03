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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
        <Spin size="small" />
        <Text type="secondary" style={{ fontSize: 12 }}>检测设备...</Text>
      </div>
    );
  }

  if (!device) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
        <Text type="danger" style={{ fontSize: 12 }}>{error || '未检测到设备'}</Text>
        <ReloadOutlined onClick={detect} style={{ cursor: 'pointer', color: '#D4A574' }} />
      </div>
    );
  }

  return (
    <Space size={6} style={{ whiteSpace: 'nowrap' }}>
      <MobileOutlined style={{ fontSize: 14, color: '#C17C4E' }} />
      <Text strong style={{ fontSize: 13 }}>{device.brand} {device.model}</Text>
      <Tag color="green" style={{ margin: 0, fontSize: 11 }}>Android {device.android_version}</Tag>
      <Tag icon={<UsbOutlined />} color="blue" style={{ margin: 0, fontSize: 11 }}>{device.connection}</Tag>
      <Text type="secondary" style={{ fontSize: 11 }}>{device.serial}</Text>
    </Space>
  );
}
