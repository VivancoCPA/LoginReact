import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          background: 'rgba(18, 24, 36, 0.95)',
          color: '#f3f4f6',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '13px',
          fontWeight: 500,
        },
      }}
    />
  </StrictMode>,
)
