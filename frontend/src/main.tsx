import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import App from './App'
import './index.css'
import 'antd/dist/reset.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#8C2F39',
            colorBgLayout: '#F8F2F1',
            fontFamily: "'Lora', Georgia, 'Times New Roman', serif",
            borderRadius: 6,
            colorBorder: '#E5D3D1',
          },
          components: {
            Layout: {
              siderBg: '#ffffff',
              headerBg: '#ffffff',
              bodyBg: '#F8F2F1',
            },
            Menu: {
              itemSelectedBg: '#F2E2E1',
              itemSelectedColor: '#8C2F39',
              itemHoverBg: '#F8EFEE',
            },
            Button: {
              primaryColor: '#ffffff',
            },
          },
        }}
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
