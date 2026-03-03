import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import theme from './styles/theme';
import LogViewer from './pages/LogViewer';

function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <LogViewer />
    </ConfigProvider>
  );
}

export default App;
