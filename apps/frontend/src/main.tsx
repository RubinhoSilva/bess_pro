import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { enableMapSet } from 'immer'
import './index.css'
import App from './App'
import { QueryProvider } from './components/providers/query-provider'
import { AuthProvider } from './components/providers/auth-provider'

// Habilitar suporte a Map e Set no Immer
enableMapSet()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
                fontSize: '14px',
                padding: '12px 16px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                maxWidth: '400px',
              },
              success: {
                style: {
                  background: '#10b981',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#ef4444',
                },
              },
            }}
          />
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  </StrictMode>,
)
