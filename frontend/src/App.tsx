import { Suspense, lazy, Component, ReactNode } from 'react';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import theme from './styles/theme';

const LogViewer = lazy(() => import('./pages/LogViewer'));

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', backgroundColor: '#FFFAF3', minHeight: '100vh' }}>
          <h2 style={{ color: '#B54A34' }}>渲染错误</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#2D2B28', fontSize: 13, lineHeight: 1.6 }}>
            {this.state.error.message}
          </pre>
          <details open>
            <summary style={{ cursor: 'pointer', color: '#8C8680' }}>错误堆栈</summary>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#8C8680', fontSize: 11 }}>
              {this.state.error.stack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider theme={theme} locale={zhCN}>
        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#FFFAF3' }}>
            <Spin size="large" tip="LogPaw 加载中..." />
          </div>
        }>
          <LogViewer />
        </Suspense>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
