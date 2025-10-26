import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ContractProvider } from './contexts/ContractContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ContractProvider>
      <App />
    </ContractProvider>
  </React.StrictMode>,
)


