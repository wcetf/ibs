import ReactDOM from 'react-dom/client';
import { RecoilRoot } from 'recoil';
import { ConfigProvider } from '@arco-design/web-react';
import enUS from '@arco-design/web-react/es/locale/en-US';
import "@arco-themes/react-ibs-extension/css/arco.css";
import 'react-virtualized/styles.css';
import './index.css';
import App from './App';
import { initTheme } from './theme';

initTheme();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <RecoilRoot>
    <ConfigProvider locale={enUS}>
      <App />
    </ConfigProvider>
  </RecoilRoot>
);
